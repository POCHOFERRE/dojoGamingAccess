import { useState, useEffect, useMemo, useRef } from 'react';
import { useBookings } from '@/context/BookingsContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { QRCodeCanvas } from 'qrcode.react';
import { FaFilm, FaCalendarAlt, FaClock, FaTicketAlt, FaMinus, FaPlus, FaDownload } from 'react-icons/fa';
import '@/styles/gba-theme.css';

export default function Cine() {
  const { events, addBooking } = useBookings();
  const { user, googleLogin } = useAuth();

  const [eventId, setEventId] = useState(null);
  const [tickets, setTickets] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (!eventId && events?.length) setEventId(events[0].id);
  }, [events, eventId]);

  const selectedEvent = useMemo(
    () => events?.find(ev => ev.id === eventId) || null,
    [events, eventId]
  );

  const total = useMemo(() => {
    const price = Number(selectedEvent?.price || 0);
    return price * tickets;
  }, [selectedEvent, tickets]);

  const qrBoxRef = useRef(null);
  const downloadQR = () => {
    const canvas = qrBoxRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `entrada-${created?.id || 'qr'}.png`;
    a.click();
  };

  const reservar = async () => {
    try {
      if (!user) {
        await googleLogin();
        return;
      }
      if (!selectedEvent) return;

      setIsLoading(true);

      const bookingId = await addBooking({
        userId: user.uid,
        type: 'cine',
        eventId: selectedEvent.id,
        ticketCount: tickets,
        total,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });

      const qrPayload = JSON.stringify({
        id: bookingId,
        type: 'cine',
        event: selectedEvent.title,
        date: selectedEvent.date,
        time: selectedEvent.start,
        tickets,
        total,
      });

      setCreated({
        id: bookingId,
        qr: qrPayload,
        event: selectedEvent,
        tickets,
      });
    } catch (e) {
      console.error('Error al reservar:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const money = (n) => Number(n || 0).toLocaleString('es-AR');

  return (
    <div className="gba-shell">
      {/* Top shell */}
      <div className="gba-topbar">
        <div className="gba-led" aria-hidden />
        <span className="gba-brand">Cine en el DOJO</span>
        <div className="gba-speaker" aria-hidden />
      </div>

      {/* Screen */}
      <div className="gba-screen">
        <div className="gba-scanlines" aria-hidden />

        {!created ? (
          <div className="gba-card">
            <h1 className="gba-title mb-2">
              <FaFilm className="inline -mt-1 mr-2" /> Elegí tu función
            </h1>
            <p className="text-gba-lighter mb-4">Seleccioná una película y la cantidad de entradas.</p>

            {/* Selector de evento */}
            <div className="mb-8">
              <label className="gba-label">Película / función</label>
              <div className="relative">
                <div className="gba-input-icon">
                  <FaFilm />
                </div>
                <select
                  value={eventId || ''}
                  onChange={(e) => setEventId(e.target.value)}
                  className="gba-select pl-10"
                >
                  <option value="">Selecciona una película…</option>
                  {events?.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {formatDate(ev.date)} {ev.start}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumen */}
            {selectedEvent && (
              <div className="gba-card mt-8 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-gba-hi text-lg">{selectedEvent.title}</div>
                    <div className="text-gba-lighter flex items-center gap-2 text-sm">
                      <FaCalendarAlt /> {formatDate(selectedEvent.date)}
                    </div>
                    <div className="text-gba-lighter flex items-center gap-2 text-sm">
                      <FaClock /> {selectedEvent.start} — {selectedEvent.end}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gba-lighter">Precio por entrada</div>
                    <div className="text-gba-hi font-extrabold text-xl">${money(selectedEvent.price)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Selector horizontal de tickets (centrado) */}
            <div className="gb-ticket-row mt-8">
              <button
                className="gb-step"
                onClick={() => setTickets((n) => Math.max(1, n - 1))}
                disabled={tickets <= 1}
                aria-label="Restar entrada"
                title="Restar"
              >
                <FaMinus />
              </button>

              <div className="gb-counter-wrap">
                <div className="gb-counter">{tickets}</div>
                <div className="gb-counter-label">Entradas</div>
              </div>

              <button
                className="gb-step"
                onClick={() => setTickets((n) => Math.min(10, n + 1))}
                aria-label="Sumar entrada"
                title="Sumar"
              >
                <FaPlus />
              </button>
            </div>

            {/* Total */}
            <div className="text-center mt-8 mb-6">
              <div className="text-xs text-gba-lighter">Total</div>
              <div className="text-gba-hi font-extrabold text-2xl">${money(total)}</div>
            </div>

            {/* CTA centrado con look GameBoy */}
            <div className="text-center">
              <button
                onClick={reservar}
                disabled={isLoading || !selectedEvent}
                className="gb-gbbutton"
              >
                {isLoading ? 'Procesando…' : (
                  <>
                    <FaTicketAlt className="mr-2" /> Reservar entradas
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Confirmación
          <div className="gba-card text-center">
            <div className="w-20 h-20 bg-gba-light/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-10 h-10 text-gba-hi" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gba-hi mb-2">¡Reserva confirmada!</h2>
            <p className="text-gba-lighter mb-4">Mostrá este QR al ingresar.</p>

            <div ref={qrBoxRef} className="bg-gba-dark p-4 rounded-lg border border-gba-border inline-block mb-4">
              <QRCodeCanvas value={created.qr} size={180} level="H" includeMargin={true} />
            </div>

            <div className="gba-card text-left max-w-md mx-auto mb-4">
              <div className="font-bold text-gba-hi border-b border-gba-border pb-2 mb-3">Detalles</div>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-gba-lighter">Película</span><span>{created.event.title}</span></div>
                <div className="flex justify-between"><span className="text-gba-lighter">Fecha</span><span>{formatDate(created.event.date)}</span></div>
                <div className="flex justify-between"><span className="text-gba-lighter">Horario</span><span>{created.event.start} — {created.event.end}</span></div>
                <div className="flex justify-between"><span className="text-gba-lighter">Entradas</span><span>{created.tickets}</span></div>
                <div className="flex justify-between font-extrabold pt-2 border-t border-gba-border">
                  <span className="text-gba-lighter">Total</span>
                  <span>${money(Number(created.event.price) * created.tickets)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button className="gba-button secondary" onClick={() => setCreated(null)}>
                Hacer otra reserva
              </button>
              <button className="gba-button" onClick={downloadQR}>
                <FaDownload className="mr-2" /> Descargar QR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos específicos de este componente */}
      <style>{`
        .gb-ticket-row{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:18px;
          margin: 0 auto 8px;
        }
        .gb-step{
          width:56px; height:56px;
          display:flex; align-items:center; justify-content:center;
          border-radius:50%;
          border:1px solid var(--gba-border);
          background: radial-gradient(circle at 30% 30%, #c94a6a, #a22d49 70%);
          box-shadow: inset 0 3px 6px rgba(255,255,255,.15), inset 0 -6px 10px rgba(0,0,0,.35), 0 6px 0 rgba(0,0,0,.2);
          color:#fff;
          font-size:18px;
          transition: transform .06s ease, filter .1s ease;
        }
        .gb-step:disabled{ filter: grayscale(.4) opacity(.7); }
        .gb-step:active{ transform: translateY(2px); box-shadow: inset 0 3px 6px rgba(0,0,0,.35), 0 4px 0 rgba(0,0,0,.15); }

        .gb-counter-wrap{
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          min-width:180px;
        }
        .gb-counter{
          min-width: 140px;
          height: 72px;
          display:flex; align-items:center; justify-content:center;
          font-weight:900; font-size:42px; letter-spacing:1px;
          color: var(--gba-hi);
          background: linear-gradient(#0d232a, #0b1d22);
          border: 2px solid var(--gba-border);
          border-radius: 12px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,.5);
        }
        .gb-counter-label{
          margin-top:6px; font-size:12px; color: var(--gba-lighter);
          text-transform: uppercase; letter-spacing:.08em;
        }

        .gb-gbbutton{
          display:inline-flex; align-items:center; justify-content:center;
          padding: 14px 22px;
          font-weight:800;
          border-radius: 26px;
          border:1px solid var(--gba-border);
          color:#fff;
          background: radial-gradient(circle at 30% 30%, #5cae6a, #2f7d45 70%);
          box-shadow: inset 0 5px 10px rgba(255,255,255,.12), inset 0 -10px 12px rgba(0,0,0,.35), 0 10px 0 rgba(0,0,0,.22);
          transition: transform .06s ease, filter .1s ease;
        }
        .gb-gbbutton:disabled{ filter: grayscale(.3) opacity(.8); }
        .gb-gbbutton:active{ transform: translateY(2px); box-shadow: inset 0 5px 10px rgba(0,0,0,.35), 0 6px 0 rgba(0,0,0,.18); }
      `}</style>
    </div>
  );
}
