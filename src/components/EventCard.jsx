// src/components/EventCard.jsx
import { useState } from 'react'
import EventBookingModal from '@/components/EventBookingModal'

export default function EventCard({ event, user }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="card">
        <h3>{event.title}</h3>
        <p>{new Date(event.date).toLocaleString()} • {event.room}</p>
        <button type="button" className="gba-btn" onClick={()=>setOpen(true)}>
          Reservar
        </button>
      </div>

      <EventBookingModal
        open={open}
        onClose={()=>setOpen(false)}
        event={event}
        user={user}
        mpLink="https://mpago.la/tu-link"
      />
    </>
  )
}
