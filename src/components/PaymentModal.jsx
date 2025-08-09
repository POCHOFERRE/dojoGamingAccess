import { FaCopy, FaExternalLinkAlt, FaMoneyBillWave, FaTimes } from 'react-icons/fa'
import { db } from '@/firebase/config'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

export default function PaymentModal({ show, onHide, reservation, onSuccess }) {
  if (!show || !reservation) return null
  const { bookingId, amount, alias, mpLink, code, meta } = reservation

  const copy = async (txt, msg='¡Copiado!') => {
    try { await navigator.clipboard.writeText(txt); toast.success(msg) }
    catch { toast.error('No se pudo copiar') }
  }

  const markPaid = async (method='transfer') => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'paid',
        updatedAt: serverTimestamp(),
        payment: { method, status:'approved', at: serverTimestamp() }
      })
      toast.success('Pago confirmado')
      onSuccess?.({ paymentMethod: method, status: 'approved', paymentId: code || bookingId })
      onHide?.()
    } catch (e) {
      console.error(e); toast.error('No se pudo marcar como pagado')
    }
  }

  return (
    <div className="pm-overlay" onClick={onHide}>
      <div className="pm-card" onClick={(e)=>e.stopPropagation()}>
        <button className="pm-close" onClick={onHide}><FaTimes /></button>
        <h3>Pago de reserva</h3>
        <div className="pm-amount">Total: <strong>${amount}</strong></div>

        {meta?.joysticks && (
          <div style={{marginBottom:8, opacity:.9}}>Detalle: PS4 con <strong>{meta.joysticks}</strong> joystick(s)</div>
        )}

        <div className="pm-section">
          <h4>Transferencia</h4>
          <div className="pm-line">Alias: <code>{alias}</code> <button onClick={()=>copy(alias,'Alias copiado')}><FaCopy/></button></div>
          <button className="pm-btn" onClick={()=>markPaid('transfer')}><FaMoneyBillWave/> Marcar como pagado</button>
        </div>

        <div className="pm-section">
          <h4>MercadoPago</h4>
          <a className="pm-link" href={mpLink} target="_blank" rel="noreferrer">
            Abrir link de pago <FaExternalLinkAlt/>
          </a>
          <button className="pm-btn outline" onClick={()=>markPaid('mercadopago')}>Ya pagué por MP</button>
        </div>
      </div>

      <style jsx>{`
        .pm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999}
        .pm-card{background:#0a1a22;border:1px solid #243844;border-radius:12px;padding:16px;min-width:320px;color:#dff3ff;position:relative}
        .pm-close{position:absolute;right:8px;top:8px;background:transparent;border:0;color:#cfe}
        h3{margin:0 0 8px 0}.pm-amount{margin-bottom:10px}
        .pm-section{margin-top:10px;padding-top:10px;border-top:1px solid #223}
        .pm-line{display:flex;align-items:center;gap:8px;margin:6px 0}
        code{background:#081820;border:1px solid #234;padding:2px 6px;border-radius:6px}
        .pm-btn{margin-top:6px;background:#2a6;color:#021;border:1px solid #5fc;padding:8px 10px;border-radius:8px}
        .pm-btn.outline{background:transparent;color:#cfe;border:1px dashed #345}
        .pm-link{display:inline-flex;align-items:center;gap:6px;margin-top:6px;color:#9fe}
      `}</style>
    </div>
  )
}
