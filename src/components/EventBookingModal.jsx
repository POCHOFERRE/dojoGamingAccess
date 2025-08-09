// src/components/EventBookingModal.jsx
import { createPortal } from 'react-dom'
import { useState } from 'react'
import { FaCopy, FaExternalLinkAlt, FaQrcode } from 'react-icons/fa'
import QRCode from 'qrcode'
import { nanoid } from 'nanoid'
import { db } from '@/firebase/config'
import {
  collection, query, where, getDocs, runTransaction, doc,
  serverTimestamp
} from 'firebase/firestore'

async function createEventBookingIfAvailable({ code, userId, eventId, price = 0, alias = 'dojovcp', mpLink = '' }) {
  const eventsRef = collection(db, 'events')
  const bookingsRef = collection(db, 'bookings')
  const eventSnap = await getDocs(query(eventsRef, where('id','==', eventId)))
  if (eventSnap.empty) throw new Error('EVENT_NOT_FOUND')
  const evtDoc = eventSnap.docs[0]; const evt = evtDoc.data()
  if (evt.active === false) throw new Error('EVENT_INACTIVE')

  const bookingId = await runTransaction(db, async (tx) => {
    const bq = query(
      bookingsRef,
      where('eventId','==', eventId),
      where('status','in', ['pending','paid','checked_in'])
    )
    const bSnap = await tx.get(bq)
    const taken = bSnap.size
    const capacity = typeof evt.capacity === 'number' ? evt.capacity : 0
    if (taken >= capacity) throw new Error('EVENT_FULL')

    const ref = doc(bookingsRef)
    tx.set(ref, {
      code, userId, eventId,
      status: 'pending', price, alias, mpLink,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      eventTitle: evt.title, eventDate: evt.date, room: evt.room
    })
    return ref.id
  })
  return { bookingId }
}

export default function EventBookingModal({ open, onClose, event, user, mpLink }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const confirm = async () => {
    if (!user?.uid) return
    setLoading(true)
    const c = nanoid(10).toUpperCase()
    setCode(c)
    try {
      await createEventBookingIfAvailable({
        code: c, userId: user.uid, eventId: event.id,
        price: event.price || 0, alias: 'dojovcp', mpLink: mpLink || ''
      })
      const payload = { v:1, code:c, eventId:event.id, alias:'dojovcp', createdAt:new Date().toISOString() }
      const url = await QRCode.toDataURL(JSON.stringify(payload), { errorCorrectionLevel:'M', margin:1, scale:6 })
      setQrUrl(url)
    } catch (e) {
      alert(e.message === 'EVENT_FULL' ? 'El evento está completo' : 'No se pudo reservar')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card gba-card" onClick={(e)=>e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header pixel">
          <h4>Reservar: {event.title}</h4>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <div className="summary pixel">
            <div><strong>Fecha:</strong> {new Date(event.date).toLocaleString()}</div>
            {event.room && <div><strong>Sala:</strong> {event.room}</div>}
            {event.price > 0 && <div><strong>Precio:</strong> ${event.price}</div>}
          </div>

          <div className="pay-block">
            <h5 className="pixel">Transferencia (alias)</h5>
            <div className="alias-box">
              <code>dojovcp</code>
              <button className="mini-btn" onClick={() => navigator.clipboard.writeText('dojovcp')} title="Copiar alias">
                <FaCopy />
              </button>
            </div>
          </div>

          <div className="pay-block">
            <h5 className="pixel">MercadoPago</h5>
            <a className="mp-link gba-btn" href={mpLink || '#'} target="_blank" rel="noreferrer">
              Ir a pagar <FaExternalLinkAlt />
            </a>
          </div>

          <div className="confirm-block">
            <button className="gba-btn confirm" onClick={confirm} disabled={loading || !user?.uid}>
              {loading ? 'Generando…' : <>Confirmar y generar QR <FaQrcode /></>}
            </button>

            {code && (
              <div className="qr-wrap">
                <div className="qr-left">
                  <img src={qrUrl || ''} alt="QR de reserva" />
                  <button
                    className="mini-btn"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = qrUrl
                      a.download = `evento-${code}.png`
                      a.click()
                    }}
                  >Descargar QR</button>
                </div>
                <div className="qr-right pixel">
                  <div><strong>Código de reserva:</strong></div>
                  <div className="code">{code}</div>
                  <small>Mostralo en el dojo o envialo al admin.</small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="gba-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:99999;padding:16px}
        .modal-card{width:100%;max-width:720px;background:#0b1720;box-shadow:0 0 0 3px #223c4a inset,0 12px 36px rgba(0,0,0,.6);border-radius:16px;overflow:hidden}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #223c4a;color:#e7fff6}
        .close-btn{background:transparent;border:0;color:#9bd3c0;cursor:pointer;font-size:1.1rem}
        .modal-body{padding:14px;display:grid;gap:14px}
        .summary{display:grid;gap:6px;color:#9bd3c0}
        .pay-block h5{margin:0 0 6px;color:#e7fff6}
        .alias-box{display:inline-flex;align-items:center;gap:8px;background:#0c1a22;border:1px solid #223c4a;padding:8px 10px;border-radius:10px}
        .mini-btn{border:1px solid #223c4a;background:#0f2430;color:#e7fff6;padding:6px 8px;border-radius:8px;cursor:pointer}
        .mp-link{display:inline-flex;align-items:center;gap:8px}
        .confirm{background:#1aa37a;border:1px solid #0e8b64;color:#00110c;font-weight:800}
        .qr-wrap{display:grid;grid-template-columns:160px 1fr;gap:12px;align-items:start}
        .qr-left img{width:160px;height:160px;border-radius:12px;border:1px solid #223c4a;background:#fff}
        .qr-right .code{font-size:1.2rem;color:#e7fff6;margin:6px 0;letter-spacing:.08em}
        .modal-footer{padding:12px 14px;border-top:1px solid #223c4a;display:flex;justify-content:flex-end;gap:8px}
        @media (max-width:520px){.qr-wrap{grid-template-columns:1fr}}
      `}</style>
    </div>,
    document.body
  )
}
