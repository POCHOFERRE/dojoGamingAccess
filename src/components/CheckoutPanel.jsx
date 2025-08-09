
import { useState, useMemo, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@/context/AuthContext.jsx'
import { useBookings } from '@/context/BookingsContext.jsx'
import { computeTotal, formatPrice } from '@/utils/pricing.js'
import { TRANSFER_ALIAS } from '@/utils/config.js'

export default function CheckoutPanel({ resource, slots = [], options }) {
  const { user, googleLogin } = useAuth()
  const { addBooking, confirmBookingPaid } = useBookings()
  const [created, setCreated] = useState(null)
  const qrRef = useRef(null)

  const total = useMemo(() => {
    if (!resource || !slots.length) return 0
    return computeTotal(resource, slots, options)
  }, [resource, slots, options])

  const create = async () => {
    if (!user) { await googleLogin(); return }
    
    // Crear una reserva por cada slot de tiempo
    const bookingPromises = slots.map(slot => {
      return addBooking({
        userId: user.uid,
        resourceId: resource.id,
        start: slot.startIso,
        end: slot.endIso,
        amount: computeTotal(resource, [slot], options), // Precio individual por slot
        meta: { 
          durationHours: (new Date(slot.endIso) - new Date(slot.startIso)) / (60 * 60 * 1000),
          options,
          isPartOfGroup: slots.length > 1
        }
      });
    });

    try {
      const bookingIds = await Promise.all(bookingPromises)
      if (bookingIds.length > 0) {
        setCreated({ 
          id: bookingIds[0], // Usamos el primer ID para el QR
          qr: `BK:${bookingIds[0]}`,
          count: bookingIds.length
        })
      }
    } catch (error) {
      console.error('Error creating bookings:', error)
      // Manejar el error según sea necesario
    }
  }

  const simulatePaid = async () => {
    if (created) await confirmBookingPaid(created.id)
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `reserva-${created.id}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const mpLink = import.meta.env.VITE_MP_LINK // p.ej. https://mpago.la/xxxx
  
  const formatTime = (dateString) => {
    return format(parseISO(dateString), 'HH:mm')
  }

  return (
    <div className="card" style={{ background: 'rgba(30, 30, 50, 0.8)', border: '2px solid var(--gba-light)', borderRadius: '8px', padding: '1rem' }}>
      <h3 style={{ color: 'var(--gba-highlight)', marginTop: 0, marginBottom: '1rem' }}>Resumen de Reserva</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: '0.5rem 0' }}><strong>Recurso:</strong> {resource?.name}</p>
        {resource?.type === 'ps4' && (
          <p style={{ margin: '0.5rem 0' }}><strong>Joysticks:</strong> {options?.joysticks || 1}</p>
        )}
        
        <div style={{ margin: '1rem 0' }}>
          <strong>Horarios seleccionados:</strong>
          <div style={{ 
            marginTop: '0.5rem', 
            maxHeight: '200px', 
            overflowY: 'auto', 
            border: '1px solid var(--gba-border)', 
            padding: '0.5rem', 
            borderRadius: '4px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            {slots.length > 0 ? (
              slots.map((slot, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '0.5rem', 
                    margin: '0.25rem 0',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {format(parseISO(slot.startIso), 'dd/MM/yyyy')} - {formatTime(slot.startIso)} a {formatTime(slot.endIso)}
                </div>
              ))
            ) : (
              <div style={{ 
                color: 'var(--gba-text)', 
                opacity: 0.7, 
                textAlign: 'center',
                padding: '0.5rem'
              }}>
                No hay horarios seleccionados
              </div>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '1rem', 
          paddingTop: '1rem', 
          borderTop: '2px solid var(--gba-light)'
        }}>
          <strong>Total:</strong>
          <span style={{ 
            fontSize: '1.4em', 
            color: 'var(--gba-highlight)', 
            fontWeight: 'bold',
            textShadow: '0 0 5px rgba(255, 205, 117, 0.5)'
          }}>
            ${formatPrice(total)}
          </span>
        </div>
      </div>

      {!created ? (
        <button 
          onClick={create} 
          className="btn-primary" 
          style={{ 
            width: '100%',
            background: 'var(--gba-accent)',
            border: '2px solid var(--gba-highlight)',
            padding: '0.8rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginTop: '1rem',
            fontSize: '1.1em',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: slots.length ? 1 : 0.6,
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            },
            ':active': {
              transform: 'translateY(0)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }
          }}
          disabled={!slots.length}
        >
          {user ? (
            slots.length > 1 ? 
              `Confirmar ${slots.length} Reservas` : 
              'Confirmar Reserva'
          ) : 'Iniciar sesión para reservar'}
        </button>
      ) : (
        <div>
          <div ref={qrRef} style={{ 
            textAlign: 'center', 
            padding: '1.5rem', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '8px', 
            marginTop: '1rem',
            border: '2px solid var(--gba-border)'
          }}>
            <h4 style={{ 
              color: 'var(--gba-highlight)',
              marginTop: 0,
              fontSize: '1.4em',
              textShadow: '0 0 8px rgba(255, 205, 117, 0.5)'
            }}>
              ¡Reserva{created.count > 1 ? 's' : ''} confirmada{created.count > 1 ? 's' : ''}!
            </h4>
            
            <p style={{ 
              background: 'rgba(0,0,0,0.3)', 
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.9em',
              margin: '0.5rem 0 1rem'
            }}>
              ID: {created.id}{created.count > 1 ? ` (+${created.count - 1} más)` : ''}
            </p>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              margin: '1.5rem 0',
              padding: '1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              border: '1px solid var(--gba-border)'
            }}>
              <QRCodeCanvas 
                value={created.qr} 
                size={180} 
                bgColor="#1a1c2c"
                fgColor="#ffcd75"
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p style={{ 
              margin: '1rem 0 1.5rem',
              fontSize: '1.1em',
              color: 'var(--gba-text-light)'
            }}>
              Muestra este código al llegar
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              marginTop: '1.5rem'
            }}>
              <button 
                onClick={downloadQR} 
                className="btn-secondary" 
                style={{ 
                  background: 'var(--gba-darker)',
                  border: '2px solid var(--gba-border)',
                  color: 'var(--gba-text-light)',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Descargar QR</span>
              </button>
              
              {mpLink && (
                <a 
                  href={mpLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary" 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--gba-accent)',
                    color: '#1a1c2c',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.95em',
                    border: '2px solid var(--gba-highlight)',
                    transition: 'all 0.2s',
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(255, 205, 117, 0.3)'
                    }
                  }}
                >
                  <span>Pagar Ahora</span>
                </a>
              )}
            </div>
          </div>
          
          <div style={{ 
            marginTop: '1.5rem', 
            background: 'rgba(30, 30, 50, 0.8)', 
            padding: '1.25rem', 
            borderRadius: '8px',
            border: '2px solid var(--gba-border)'
          }}>
            <h4 style={{ 
              color: 'var(--gba-highlight)', 
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '1.2em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>Transferencia bancaria</span>
            </h4>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Alias:</span>
                <strong style={{ 
                  background: 'rgba(0,0,0,0.3)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px'
                }}>
                  {TRANSFER_ALIAS}
                </strong>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--gba-border)'
              }}>
                <span>Monto a transferir:</span>
                <strong style={{ 
                  fontSize: '1.3em',
                  color: 'var(--gba-highlight)',
                  textShadow: '0 0 5px rgba(255, 205, 117, 0.5)'
                }}>
                  ${formatPrice(total)}
                </strong>
              </div>
            </div>
            
            <p style={{
              fontSize: '0.85em',
              opacity: 0.8,
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px dashed var(--gba-border)',
              fontStyle: 'italic'
            }}>
              Por favor, incluye el ID de reserva en el concepto de la transferencia
            </p>
          </div>
          
          <p style={{
            color: 'var(--gba-text-light)',
            opacity: 0.8,
            fontSize: '0.9em',
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            border: '1px dashed var(--gba-border)'
          }}>
            Tu QR queda guardado en <strong style={{ color: 'var(--gba-highlight)' }}>Mis reservas</strong>. 
            En el local lo escaneamos y listo.
          </p>
        </div>
      )}
    </div>
  )
}
