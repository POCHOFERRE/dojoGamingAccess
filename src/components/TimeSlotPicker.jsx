import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { addMinutes, format, setHours, setMinutes } from 'date-fns'
import { FaClock, FaCheck, FaTimes, FaCopy, FaSpinner } from 'react-icons/fa'
import QRCode from 'qrcode'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'

// 🔥 Firebase
import { db } from '@/firebase/config'
import {
  collection, query, where, orderBy, runTransaction, doc,
  serverTimestamp, Timestamp, getDocs
} from 'firebase/firestore'

// —— overlap con buffer
const overlapsRange = (startA, endA, startB, endB, bufferMins = 0) => {
  const bufferMs = bufferMins * 60 * 1000
  return !((endA <= startB - bufferMs) || (startA >= endB + bufferMs))
}
const HRS = (h) => h.toString().padStart(2, '0') + ':00'
const DURATIONS = [30, 45, 60, 90, 120] // min

// 🔧 transacción: anti-solape
async function createBookingIfFree({
  code, userId, resourceId, startIso, endIso,
  alias = 'dojovcp', mpLink = '', price = 0, bufferMins = 0, qrPayload = {}, meta = null
}) {
  const start = new Date(startIso)
  const end   = new Date(endIso)

  const bookingsRef = collection(db, 'bookings')
  const windowStart = Timestamp.fromMillis(start.getTime() - bufferMins*60*1000)
  const windowEnd   = Timestamp.fromMillis(end.getTime()   + bufferMins*60*1000)

  // query previa
  const qy = query(
    bookingsRef,
    where('resourceId','==', resourceId),
    where('start','>=', windowStart),
    where('start','<=', windowEnd),
    orderBy('start','asc')
  )
  const preSnap = await getDocs(qy)

  const bookingId = await runTransaction(db, async (tx) => {
    const sMs = start.getTime(), eMs = end.getTime()
    for (const d of preSnap.docs) {
      const ref = doc(db, 'bookings', d.id)
      const fresh = await tx.get(ref)
      if (!fresh.exists()) continue
      const b = fresh.data()
      if (!['pending','paid','checked_in'].includes(b.status)) continue
      const bs = b.start.toMillis(), be = b.end.toMillis()
      if (overlapsRange(sMs, eMs, bs, be, bufferMins)) throw new Error('OVERLAP')
    }
    const newRef = doc(bookingsRef)
    tx.set(newRef, {
      code, userId, resourceId,
      start: Timestamp.fromDate(start),
      end:   Timestamp.fromDate(end),
      status: 'pending', price, alias, mpLink,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      qrPayload, meta: meta || null
    })
    return newRef.id
  })
  return bookingId
}

// normaliza start/end a ms
const normalizeBooking = (b) => {
  const toMs = (v) => (typeof v?.toMillis==='function' ? v.toMillis() : (v instanceof Date ? v.getTime() : new Date(v).getTime()))
  return { ...b, startMs: toMs(b.start), endMs: toMs(b.end) }
}

export default function TimeSlotPicker({
  date = new Date(),
  openHour = 14,
  closeHour = 23,
  durationMins = 60,
  intervalMins = 15,
  pricePerHour = 8000,
  respectNow = false,      // 👈 por defecto NO bloquea por hora actual
  pricePreview,            // (startIso, durationMins) => number | undefined
  onSelect,
  onConfirmed,
  bookings = [],
  resourceId,
  user,
  sound = false,
  compact = true,
  mpLink = '',
  bufferMins = 0,
  alias = 'dojovcp',
  meta = null
}) {
  const [duration, setDuration] = useState(durationMins)
  useEffect(() => setDuration(durationMins), [durationMins])

  const [selectedIso, setSelectedIso] = useState(null)
  const [selectedEndIso, setSelectedEndIso] = useState(null)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [reserveCode, setReserveCode] = useState('')
  const [confirmedId, setConfirmedId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hourChosen, setHourChosen] = useState(null) // "HH:00"

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!respectNow) return
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [respectNow])

  // beep
  const beepCtxRef = useRef(null)
  const beep = () => {
    if (!sound) return
    try {
      const ctx = beepCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
      beepCtxRef.current = ctx
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'square'; o.frequency.value = 640; g.gain.value = 0.02
      o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>o.stop(), 90)
    } catch {}
  }

  // ✅ Genera TODOS los slots del rango (no filtra por now)
  const slots = useMemo(() => {
    const startDay = setMinutes(setHours(date, openHour), 0)
    const endDay   = setMinutes(setHours(date, closeHour), 0)
    const arr = []
    for (let t = startDay; t < endDay; t = addMinutes(t, intervalMins)) {
      const slotEnd = addMinutes(t, duration)
      if (slotEnd <= endDay) {
        const start = new Date(t); const end = slotEnd
        arr.push({ start, end,
          startIso: start.toISOString(),
          endIso: end.toISOString(),
          startMs: start.getTime(),
          endMs: end.getTime()
        })
      }
    }
    return arr
  }, [date, duration, intervalMins, openHour, closeHour])

  // reservas del día SOLO del recurso actual
  const todays = useMemo(() => {
    if (!resourceId || !Array.isArray(bookings)) return []
    const dayStr = date.toDateString()
    return bookings
      .filter(b => b.resourceId === resourceId && ['pending','paid','checked_in'].includes(b.status))
      .map(normalizeBooking)
      .filter(b => new Date(b.startMs).toDateString() === dayStr)
  }, [bookings, resourceId, date])

  // disponibilidad por slot: libre si no solapa; opcionalmente bloquea pasados
  const availability = useMemo(() => {
    const map = new Map()
    for (const s of slots) {
      const isPast = respectNow ? s.startMs < now : false
      let free = !isPast
      if (free) {
        for (const b of todays) {
          if (overlapsRange(s.startMs, s.endMs, b.startMs, b.endMs, bufferMins)) { free = false; break }
        }
      }
      map.set(s.startIso, free)
    }
    return map
  }, [slots, todays, bufferMins, now, respectNow])

  // buckets por hora + conteo libres
  const hourBuckets = useMemo(() => {
    const g = new Map()
    for (const s of slots) {
      const key = HRS(s.start.getHours())
      if (!g.has(key)) g.set(key, [])
      g.get(key).push(s)
    }
    const hours = []
    for (let h=openHour; h<closeHour; h++) hours.push(HRS(h))
    return hours.map(hour => {
      const arrSlots = g.get(hour) || []
      const available = arrSlots.filter(s => availability.get(s.startIso))
      return { hour, slots: arrSlots, available }
    })
  }, [slots, availability, openHour, closeHour])

  // auto-elegir primera hora con disponibilidad (UX)
  useEffect(() => {
    if (hourBuckets.length && !hourChosen) {
      const first = hourBuckets.find(h => h.available.length > 0)
      if (first) setHourChosen(first.hour)
    }
  }, [hourBuckets, hourChosen])

  const onPickDuration = (d) => {
    if (d === duration) return
    setDuration(d)
    setSelectedIso(null); setSelectedEndIso(null); setSelectedLabel(''); setConfirmedId(null)
    beep()
  }

  const pick = useCallback((slot) => {
    if (!availability.get(slot.startIso)) return
    const newSelectedIso = selectedIso === slot.startIso ? null : slot.startIso
    setSelectedIso(newSelectedIso)
    setSelectedEndIso(newSelectedIso ? slot.endIso : null)
    setSelectedLabel(newSelectedIso ? `${format(slot.start,'HH:mm')}–${format(slot.end,'HH:mm')}` : '')
    setConfirmedId(null)
    if (newSelectedIso) {
      beep()
      onSelect?.({ startIso: slot.startIso, endIso: slot.endIso, label: `${format(slot.start,'HH:mm')}–${format(slot.end,'HH:mm')}`, duration })
    } else {
      onSelect?.(null)
    }
  }, [availability, selectedIso, onSelect, duration])

  const resetReservation = useCallback(() => {
    setQrDataUrl(null); setReserveCode(''); setSelectedIso(null); setSelectedEndIso(null); setSelectedLabel(''); setConfirmedId(null)
  }, [])

  // precio
  const selectedPrice = useMemo(() => {
    if (!selectedIso) return null
    let v = typeof pricePreview === 'function' ? pricePreview(selectedIso, duration) : undefined
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0) return Math.round((Number(pricePerHour)||0) * (duration/60))
    return n
  }, [selectedIso, pricePreview, pricePerHour, duration])

  // confirmar (crea en Firestore + abre modal mediante onConfirmed)
  const confirmReservation = async () => {
    if (!selectedIso || !selectedEndIso) { toast.error('Elegí un turno'); return }
    if (!user?.uid) { toast.error('Iniciá sesión'); return }
    if (isProcessing) return

    setIsProcessing(true)
    const code = nanoid(10).toUpperCase()
    setReserveCode(code)
    const payload = { v:1, code, resourceId, slotStart: selectedIso, createdAt: new Date().toISOString(), alias, meta }

    try {
      const url = await QRCode.toDataURL(JSON.stringify(payload), { errorCorrectionLevel:'M', margin:1, scale:6 })
      setQrDataUrl(url)

      const bookingId = await createBookingIfFree({
        code,
        userId: user.uid,
        resourceId,
        startIso: selectedIso,
        endIso: selectedEndIso,
        alias,
        mpLink,
        price: selectedPrice ?? 0,
        bufferMins,
        qrPayload: payload,
        meta
      })

      setConfirmedId(bookingId)
      toast.success('¡Reserva creada!')
      onConfirmed?.({
        bookingId,
        code,
        userId: user.uid,
        resourceId,
        start: selectedIso,
        end: selectedEndIso,
        amount: selectedPrice ?? 0,
        alias,
        mpLink,
        status: 'pending',
        meta: meta || null
      })
    } catch (e) {
      console.error(e)
      toast.error(e?.message === 'OVERLAP' ? 'Ese horario se reservó recién. Elegí otro.' : 'No pudimos confirmar la reserva.')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (text, message = '¡Copiado!') => {
    try { await navigator.clipboard.writeText(text); toast.success(message) }
    catch { toast.error('No se pudo copiar') }
  }

  return (
    <div className={`time-slot-picker gba-card crt ${compact ? 'compact' : ''}`}>
      <header className="header">
        <div className="title pixel"><FaClock /> <span>Reservá tu turno</span></div>
        <div className="sub pixel">{format(date, 'EEEE d/MM')} • {openHour}:00–{closeHour}:00</div>
      </header>

      {/* Duración - rueda */}
      <div className="section pixel">
        <div className="label">Duración</div>
        <div className="dial" role="listbox" aria-label="Duración">
          <div className="dial-center"><div className="dial-value">{duration}<small>min</small></div></div>
          {(() => {
            const size = 160, cx = size/2, cy = size/2, r = 56, n = DURATIONS.length, startDeg = -90
            return DURATIONS.map((d, i) => {
              const ang = (startDeg + (360/n)*i) * Math.PI/180
              const x = cx + r * Math.cos(ang) - 20
              const y = cy + r * Math.sin(ang) - 20
              const active = d === duration
              return (
                <button key={d} className={`dial-item ${active ? 'active' : ''}`}
                  style={{ left:`${x}px`, top:`${y}px` }} onClick={() => onPickDuration(d)}
                  role="option" aria-selected={active} title={`${d} minutos`}>{d}</button>
              )
            })
          })()}
        </div>
      </div>

      {/* Paso 1 */}
      <div className="step pixel">1) Elegí la <strong>HORA</strong></div>
      <div className="hours-container">
        <div className="hours-row">
          {hourBuckets.map(({ hour, available }) => {
            const active = hour === hourChosen
            const disabled = available.length === 0
            return (
              <button
                key={hour}
                className={`hour-chip ${active ? 'active' : ''}`}
                disabled={disabled}
                onClick={() => { const next = active ? null : hour; setHourChosen(next); setSelectedIso(null); setSelectedEndIso(null); setSelectedLabel(''); setConfirmedId(null); beep() }}
                title={`${hour} · ${available.length} libres`}
              >
                {hour}<span className="badge">{available.length}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Paso 2 */}
      <div className="step pixel" style={{marginTop:8}}>2) Elegí el <strong>TURNO</strong></div>
      {hourChosen && (
        <div className="slots-container">
          <div className="slots-row">
            {hourBuckets.find(h => h.hour === hourChosen)?.slots.map((s) => {
              const free = availability.get(s.startIso)
              const sel = selectedIso === s.startIso
              return (
                <button key={s.startIso} className={`slot-btn ${free ? 'free' : 'busy'} ${sel ? 'selected' : ''}`} disabled={!free} onClick={() => pick(s)} title={`${format(s.start,'HH:mm')}–${format(s.end,'HH:mm')}`}>
                  {format(s.start,'HH:mm')}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Confirmación */}
      <div className="confirm-panel">
        <div className="summary">
          {selectedIso ? (
            <>
              <div className="line pixel">
                Turno: <strong>{selectedLabel}</strong> · Duración <strong>{duration}′</strong> {typeof selectedPrice==='number' && <>· <strong>${selectedPrice}</strong></>}
              </div>
              <div className="actions">
                <button className="btn-primary" disabled={isProcessing} onClick={confirmReservation}>
                  {isProcessing ? <><FaSpinner className="spin" /> Procesando...</> : <><FaCheck /> Confirmar</>}
                </button>
                <button className="btn-ghost" onClick={resetReservation}><FaTimes /> Cancelar</button>
              </div>
            </>
          ) : (
            <div className="line pixel muted">Elegí una hora y luego un turno disponible.</div>
          )}
        </div>

        {(qrDataUrl && reserveCode) && (
          <div className="qr-wrap">
            <img src={qrDataUrl} alt="QR reserva" className="qr-img" />
            <div className="code pixel">Código: <strong>{reserveCode}</strong>
              <button className="copy" onClick={() => copyToClipboard(reserveCode)}><FaCopy /></button>
            </div>
          </div>
        )}

        {confirmedId && <div className="confirm-ok pixel">¡Reserva creada! ID: <strong>{confirmedId}</strong></div>}
      </div>

      <style jsx>{`
        .gba-card{background:#0a1a22;color:#dff3ff;border:2px solid #234;border-radius:12px;padding:20px;box-shadow:0 0 0 2px #112 inset,0 8px 24px rgba(0,0,0,.4);font-family:'Press Start 2P',monospace;max-width:100%;box-sizing:border-box;}
        .header{text-align:center;margin-bottom:16px;}
        .header .title{display:inline-flex;gap:8px;align-items:center;font-size:14px;justify-content:center;}
        .header .sub{opacity:.8;font-size:12px;margin-top:8px;text-transform:capitalize;}
        .pixel{letter-spacing:.5px}
        .section{margin:16px auto;max-width:100%;width:fit-content;}
        .label{font-size:11px;opacity:.9;margin-bottom:8px;text-align:center;}
        .dial{position:relative;width:160px;height:160px;background:radial-gradient(ellipse at center,#0f2830 40%,#0a1a22 60%);border:1px solid #234;border-radius:50%;box-shadow:inset 0 0 8px rgba(0,0,0,.5);margin:0 auto 16px;}
        .dial-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:84px;height:84px;border-radius:50%;background:#081820;border:1px solid #345;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 10px rgba(0,0,0,.6)}
        .dial-value{font-size:16px;display:flex;align-items:flex-end;gap:4px}.dial-value small{font-size:10px;opacity:.8}
        .dial-item{position:absolute;width:40px;height:40px;border-radius:50%;background:#123;border:1px solid #345;color:#cfe;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .15s ease,background .15s ease,box-shadow .15s ease;cursor:pointer;}
        .dial-item:hover{transform:scale(1.06)}.dial-item.active{background:#0f3340;border-color:#5fc;box-shadow:0 0 0 2px #5fc inset}
        .step{font-size:11px;opacity:.95;margin:16px 0 8px;text-align:center;}

        /* centrado + sin scrollbars visibles */
        .hours-container,.slots-container{width:100%;overflow-x:auto;padding:4px 0;scrollbar-width:none;}
        .hours-container::-webkit-scrollbar,.slots-container::-webkit-scrollbar{display:none}
        .hours-row,.slots-row{display:flex;gap:10px;justify-content:center;flex-wrap:nowrap;padding:4px 0;min-width:min-content;}

        .hour-chip{background:#123;border:1px solid #285;color:#cfe;padding:10px 14px;border-radius:12px;font-size:12px;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;flex-shrink:0;}
        .hour-chip .badge{background:#285;color:#021;padding:2px 6px;border-radius:6px;font-weight:700;font-size:11px}
        .hour-chip.active{outline:2px solid #5fc;background:#0f3340;}
        .hour-chip:disabled{opacity:.38;filter:grayscale(1);cursor:not-allowed;}

        .slot-btn{min-width:80px;padding:10px 12px;border-radius:10px;font-size:12px;border:1px solid #234;flex-shrink:0;}
        .slot-btn.free{background:#0d2a33;color:#def;border-color:#285;cursor:pointer;}
        .slot-btn.busy{background:#1a1f24;color:#789;cursor:not-allowed;text-decoration:line-through;}
        .slot-btn.selected{outline:2px solid #5fc;}

        .confirm-panel{margin-top:20px;display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;}
        .summary{width:100%;max-width:540px;text-align:center;}
        .summary .line{font-size:12px;margin-bottom:12px;}
        .summary .actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px;}
        .btn-primary{background:#2a6;color:#021;border:1px solid #5fc;padding:10px 16px;border-radius:10px;cursor:pointer;transition:opacity 0.2s;}
        .btn-primary:hover{opacity:0.9;}
        .btn-ghost{background:transparent;color:#cfe;border:1px dashed #345;padding:10px 16px;border-radius:10px;cursor:pointer;transition:background 0.2s;}
        .btn-ghost:hover{background:rgba(255,255,255,0.05);}

        .qr-wrap{display:flex;align-items:center;gap:16px;padding:12px;background:#081820;border:1px solid #234;border-radius:10px;margin-top:12px;}
        .qr-img{width:112px;height:112px;image-rendering:pixelated;flex-shrink:0;}
        .code{display:flex;align-items:center;gap:8px;font-size:12px;}
        .copy{background:#123;border:1px solid #345;color:#cfe;padding:4px 8px;border-radius:6px;cursor:pointer;transition:background 0.2s;}
        .copy:hover{background:#1a2f3a;}
        .muted{opacity:.7;}
        .spin{animation:spin 1s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .confirm-ok{margin-top:10px;font-size:11px;color:#9ff59f;text-align:center;}
      `}</style>
    </div>
  )
}
