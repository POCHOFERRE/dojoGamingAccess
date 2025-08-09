
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useBookings } from '@/context/BookingsContext.jsx';
import { QRCodeCanvas } from 'qrcode.react';
import { FaTicketAlt, FaQrcode, FaTrash, FaSignInAlt, FaDownload, FaCalendarAlt, FaClock, FaTag, FaInfoCircle } from 'react-icons/fa';
import '@/styles/gba-theme.css';

export default function MisReservas(){
  const { user, googleLogin } = useAuth()
  const { bookings, cancelBooking } = useBookings()

  const [cancelingId, setCancelingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) {
    return (
      <div className="gba-screen">
        <div className="gba-card text-center p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gba-light/20 rounded-full flex items-center justify-center mb-4">
              <FaSignInAlt className="text-2xl text-gba-hi" />
            </div>
            <h2 className="text-xl font-bold text-gba-hi mb-2">Acceso Requerido</h2>
            <p className="text-gba-lighter mb-6">Iniciá sesión para ver tus reservas.</p>
            <button 
              onClick={googleLogin}
              className="gba-button flex items-center justify-center gap-2"
            >
              <FaSignInAlt /> Continuar con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myBookings = bookings.filter(b => b.userId === user.uid)

  const download = (id) => {
    const canvas = document.getElementById(`qr-${id}`)?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `reserva-${id}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const handleCancelClick = (id) => {
    setCancelingId(id);
    setShowConfirm(true);
  };

  const confirmCancel = async () => {
    if (cancelingId) {
      await cancelBooking(cancelingId);
      setShowConfirm(false);
      setCancelingId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="gba-screen">
      <h1 className="gba-title">
        <FaTicketAlt className="inline mr-2" /> Mis Reservas
      </h1>

      {myBookings.length === 0 ? (
        <div className="gba-card text-center p-8">
          <div className="flex flex-col items-center">
            <FaInfoCircle className="text-4xl text-gba-lighter mb-4" />
            <h2 className="text-xl font-bold text-gba-hi mb-2">No tenés reservas</h2>
            <p className="text-gba-lighter">Todavía no realizaste ninguna reserva.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.map(booking => (
            <div key={booking.id} className="gba-card p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 bg-gba-dark p-3 rounded-lg border border-gba-border self-start">
                  <div id={`qr-${booking.id}`}>
                    <QRCodeCanvas 
                      value={booking.qr} 
                      size={120}
                      level="H"
                      includeMargin={true}
                      fgColor="#e0f8d0"
                      bgColor="#0f2830"
                    />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    <h3 className="text-lg font-bold text-gba-hi">
                      {booking.resourceId || 'Reserva'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'paid' ? 'bg-green-900/30 text-green-400' : 
                      booking.status === 'cancelled' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {booking.status === 'paid' ? 'Confirmada' : 
                       booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gba-lighter">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2 text-gba-hi/80" />
                      <span>{formatDate(booking.start)}</span>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="mr-2 text-gba-hi/80" />
                      <span>Hasta: {new Date(booking.end).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center">
                      <FaTag className="mr-2 text-gba-hi/80" />
                      <span>Total: <span className="font-bold text-gba-hi">${booking.amount || '0.00'}</span></span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.status === 'paid' && (
                      <button 
                        onClick={() => handleCancelClick(booking.id)}
                        className="gba-button bg-red-900/30 hover:bg-red-900/50 text-red-300 flex items-center gap-2"
                      >
                        <FaTrash /> Cancelar
                      </button>
                    )}
                    <button 
                      onClick={() => download(booking.id)}
                      className="gba-button bg-gba-dark hover:bg-gba-darker flex items-center gap-2"
                    >
                      <FaDownload /> Guardar QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmación de cancelación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="gba-card p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gba-hi mb-4">¿Cancelar reserva?</h3>
            <p className="text-gba-lighter mb-6">¿Estás seguro de que querés cancelar esta reserva? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="gba-button bg-gba-dark hover:bg-gba-darker"
              >
                Volver
              </button>
              <button 
                onClick={confirmCancel}
                className="gba-button bg-red-900/30 hover:bg-red-900/50 text-red-300"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
