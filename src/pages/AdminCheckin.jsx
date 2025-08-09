import { useMemo, useState } from 'react'
import { db } from '@/firebase/config'
import {
  collection, query, where, limit, getDocs, doc, updateDoc,
  serverTimestamp, onSnapshot, count
} from 'firebase/firestore'

export default function AdminCheckIn() {
  const [code, setCode] = useState('')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [eventCount, setEventCount] = useState(null) // { taken, capacity }

  const search = async () => {
    setLoading(true); setMsg(''); setBooking(null); setEventCount(null)
    const q = query(collection(db,'bookings'), where('code','==', code.trim().toUpperCase()), limit(1))
    const snap = await getDocs(q)
    setLoading(false)
    if (snap.empty) { setMsg('No se encontró esa reserva'); return }
    const b = { id: snap.docs[0].id, ...snap.docs[0].data() }
    setBooking(b)

    // si es evento, mostrar ocupación
    if (b.eventId) {
      const eq = query(
        collection(db,'bookings'),
        where('eventId','==', b.eventId),
        where('status','in',['pending','paid','checked_in'])
      )
      const unsub = onSnapshot(eq, (ss) => {
        const taken = ss.size
        // traer capacity leyendo /events por id
        ;(async ()=>{
          const evSnap = await getDocs(query(collection(db,'events'), where('id','==', b.eventId), limit(1)))
          const cap = evSnap.empty ? 0 : (evSnap.docs[0].data().capacity || 0)
          setEventCount({ taken, capacity: cap })
        })()
      })
      // opcional: guardá unsub si necesitás desmontar
    }
  }

  const checkIn = async () => {
    if (!booking) return
    await updateDoc(doc(db,'bookings',booking.id), {
      status: 'checked_in',
      updatedAt: serverTimestamp()
    })
    setMsg('Check‑in realizado ✔️')
    setBooking({ ...booking, status: 'checked_in' })
  }

  const whenText = useMemo(() => {
    if (!booking) return ''
    if (booking.start?.seconds) {
      const s = new Date(booking.start.seconds*1000)
      const e = new Date(booking.end.seconds*1000)
      return `${s.toLocaleString()} — ${e.toLocaleString()}`
    }
    if (booking.eventDate) return new Date(booking.eventDate).toLocaleString()
    return ''
  }, [booking])

  return (
    <div className="admin-wrap">
      <div className="card">
        <h3>Check‑in por código</h3>
        <div className="row">
          <input
            value={code}
            onChange={e=>setCode(e.target.value)}
            placeholder="Código (ej: ABCD1234XY)"
            onKeyDown={(e)=>{ if(e.key==='Enter') search() }}
          />
          <button onClick={search} disabled={!code || loading}>{loading ? 'Buscando…' : 'Buscar'}</button>
        </div>

        {booking && (
          <div className="result">
            <p><b>Código:</b> {booking.code}</p>
            <p><b>Usuario:</b> {booking.userId}</p>
            {booking.resourceId && <p><b>Recurso:</b> {booking.resourceId}</p>}
            {booking.eventId && <p><b>Evento:</b> {booking.eventTitle || booking.eventId}</p>}
            <p><b>Cuándo:</b> {whenText}</p>
            <p><b>Estado:</b> {booking.status}</p>

            {eventCount && (
              <p><b>Cupo:</b> {eventCount.taken}/{eventCount.capacity}</p>
            )}

            <div className="actions">
              <button onClick={checkIn} disabled={booking.status === 'checked_in'}>
                {booking.status === 'checked_in' ? 'Ya check‑in' : 'Hacer check‑in'}
              </button>
            </div>
          </div>
        )}

        {msg && <p className="msg">{msg}</p>}
      </div>

      <style jsx>{`
        .admin-wrap{padding:16px;display:grid;place-items:start}
        .card{background:#0b1720;border:1px solid #223c4a;border-radius:14px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.35);color:#e7fff6}
        h3{margin-top:0}
        .row{display:flex;gap:8px}
        input{flex:1;background:#0c1a22;border:1px solid #223c4a;border-radius:10px;padding:10px 12px;color:#e7fff6}
        button{border:1px solid #1aa37a;background:#1aa37a;color:#00110c;border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:700}
        .result{margin-top:12px;border-top:1px dashed #223c4a;padding-top:12px}
        .msg{margin-top:10px;color:#9bd3c0}
      `}</style>
    </div>
  )
}
