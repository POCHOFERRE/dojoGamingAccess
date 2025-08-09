// src/firebase/bookings.js
import { db } from '@/firebase/config'
import {
  collection, query, where, getDocs, runTransaction, doc,
  serverTimestamp, Timestamp, orderBy
} from 'firebase/firestore'

/**
 * Reserva un evento si hay capacidad (transacción).
 * @returns {string} bookingId
 */
export async function createEventBookingIfAvailable({
  code, userId, eventId, price = 0, alias = 'dojovcp', mpLink = ''
}) {
  const eventsRef = collection(db, 'events')
  const bookingsRef = collection(db, 'bookings')

  const eventSnap = await getDocs(query(eventsRef, where('id','==', eventId)))
  if (eventSnap.empty) throw new Error('EVENT_NOT_FOUND')
  const evtDoc = eventSnap.docs[0]; const evt = evtDoc.data()

  if (evt.active === false) throw new Error('EVENT_INACTIVE')

  const bookingId = await runTransaction(db, async (tx) => {
    // Contar reservas vigentes del evento
    const bq = query(
      bookingsRef,
      where('eventId','==', eventId),
      where('status','in', ['pending','paid','checked_in'])
    )
    const bSnap = await tx.get(bq)
    const taken = bSnap.size
    const capacity = typeof evt.capacity === 'number' ? evt.capacity : 0

    if (taken >= capacity) {
      throw new Error('EVENT_FULL')
    }

    const ref = doc(bookingsRef)
    tx.set(ref, {
      code,
      userId,
      eventId,
      status: 'pending',
      price,
      alias,
      mpLink,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // opcional: duplicar info útil del evento para el admin/reportes
      eventTitle: evt.title,
      eventDate: evt.date,  // string ISO de tu doc evt-1
      room: evt.room,
    })
    return ref.id
  })

  return bookingId
}

/**
 * Crea una reserva si no hay solapamiento (TRANSACCIÓN).
 * @returns {string} ID de la reserva creada
 */
export async function createBookingIfFree({
  code, userId, resourceId, startIso, endIso,
  alias = 'dojovcp', mpLink = '', price = 0, bufferMins = 0, qrPayload = {}
}) {
  const start = new Date(startIso)
  const end = new Date(endIso)

  const bookingsRef = collection(db, 'bookings')
  const windowStart = Timestamp.fromMillis(start.getTime() - bufferMins * 60 * 1000)
  const windowEnd = Timestamp.fromMillis(end.getTime() + bufferMins * 60 * 1000)

  const q = query(
    bookingsRef,
    where('resourceId', '==', resourceId),
    where('start', '>=', windowStart),
    where('start', '<=', windowEnd),
    orderBy('start', 'asc')
  )

  const bookingId = await runTransaction(db, async (tx) => {
    const snap = await tx.get(q)
    const sMs = start.getTime(), eMs = end.getTime()

    for (const d of snap.docs) {
      const b = d.data()
      if (!['pending', 'paid', 'checked_in'].includes(b.status)) continue
      const bs = b.start.toMillis(), be = b.end.toMillis()
      if (isOverlap(sMs, eMs, bs, be, bufferMins)) throw new Error('OVERLAP')
    }

    const ref = doc(bookingsRef)
    tx.set(ref, {
      code, userId, resourceId,
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
      status: 'pending', price, alias, mpLink,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      qrPayload
    })
    return ref.id
  })

  return bookingId
}

// Helper para verificar solapamiento
function isOverlap(start1, end1, start2, end2, bufferMins = 0) {
  const bufferMs = bufferMins * 60 * 1000
  return !(end1 <= start2 - bufferMs || start1 >= end2 + bufferMs)
}
