
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { db } from '@/firebase/config.js'
import { doc, setDoc, onSnapshot, collection, updateDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from './AuthContext'

const Ctx = createContext(null)

export const SEED_RESOURCES = [
  // 5 PS5
  ...Array.from({length: 5}).map((_,i) => ({ 
    id: `ps5-${i+1}`, 
    type: 'ps5', 
    name: `PS5 #${i+1}`, 
    price: 6500, 
    bufferMins: 10, 
    active: true 
  })),
  
  // 1 Xbox
  { 
    id: 'xbox-1', 
    type: 'xbox', 
    name: 'Xbox Series X #1', 
    price: 6500, 
    bufferMins: 10, 
    active: true 
  },
  
  // 1 Switch
  { 
    id: 'switch-1', 
    type: 'switch', 
    name: 'Nintendo Switch #1', 
    price: 4500, 
    bufferMins: 10, 
    active: true 
  },
  
  // 4 PS4
  ...Array.from({length: 4}).map((_,i) => ({
    id: `ps4-${i+1}`,
    type: 'ps4',
    name: `PS4 #${i+1}`,
    price: 5500,
    bufferMins: 10,
    active: true
  })),
  
  // Simuladores
  { 
    id: 'sim-1', 
    type: 'simulador', 
    name: 'Simulador F1 #1', 
    price: 6000, 
    bufferMins: 15, 
    active: true 
  },
  { 
    id: 'sim-2', 
    type: 'simulador', 
    name: 'Simulador F1 #2', 
    price: 6000, 
    bufferMins: 15, 
    active: true 
  },
]

export function BookingsProvider({ children }){
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Subscribe to Firestore collections only when user is authenticated
  useEffect(() => {
    if (!user) {
      setResources([])
      setBookings([])
      setTickets([])
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const subscriptions = []
    
    try {
      // Subscribe to resources (public read)
      const resourcesUnsub = onSnapshot(collection(db, 'resources'), 
        (snapshot) => {
          setResources(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
          setLoading(false)
        },
        (err) => {
          console.error('Error loading resources:', err)
          setError('Error al cargar los recursos')
          setLoading(false)
        }
      )
      subscriptions.push(resourcesUnsub)

      // Subscribe to bookings (user's bookings only)
      const bookingsUnsub = onSnapshot(
        collection(db, 'bookings'),
        (snapshot) => {
          setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        },
        (err) => {
          console.error('Error loading bookings:', err)
          setError('Error al cargar las reservas')
        }
      )
      subscriptions.push(bookingsUnsub)

      // Subscribe to tickets (user's tickets only)
      const ticketsUnsub = onSnapshot(
        collection(db, 'tickets'),
        (snapshot) => {
          setTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        },
        (err) => {
          console.error('Error loading tickets:', err)
          setError('Error al cargar los tickets')
        }
      )
      subscriptions.push(ticketsUnsub)

      // Subscribe to events (public read)
      const eventsUnsub = onSnapshot(
        collection(db, 'events'),
        (snapshot) => {
          setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        },
        (err) => {
          console.error('Error loading events:', err)
          setError('Error al cargar los eventos')
        }
      )
      subscriptions.push(eventsUnsub)
    } catch (err) {
      console.error('Error setting up subscriptions:', err)
      setError('Error al configurar las suscripciones')
      setLoading(false)
    }

    // Cleanup function
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe())
    }
  }, [user])

  const seedResources = async () => {
    await Promise.all(SEED_RESOURCES.map(r => setDoc(doc(db,'resources',r.id), r)))
    if (events.length===0){
      const ev = { id:'evt-1', title:'Ciclo Anime - Noche 1', date:new Date().toISOString(), start:'20:00', end:'22:00', room:'sala-1', price:2500, capacity:30, active:true }
      await setDoc(doc(db,'events',ev.id), ev)
    }
  }

  const addBooking = async (bookingData) => {
    try {
      const {
        userId,
        resourceId,
        start,
        end,
        amount,
        status = 'pending_payment',
        meta = {},
        payment = null
      } = bookingData;

      // Validar datos requeridos
      if (!userId || !resourceId || !start || !end || amount === undefined) {
        throw new Error('Faltan campos requeridos para la reserva');
      }

      const id = uuidv4();
      const booking = {
        id,
        userId,
        resourceId,
        start,
        end,
        amount,
        status,
        qr: `BK:${id}`,
        meta: {
          ...meta,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        payment
      };

      await setDoc(doc(db, 'bookings', id), booking);
      return id;
    } catch (error) {
      console.error('Error al crear la reserva:', error);
      throw error;
    }
  }
  const confirmBookingPaid = async (id, paymentData = {}) => {
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, { 
        status: 'confirmed',
        'meta.updatedAt': new Date().toISOString(),
        payment: {
          ...paymentData,
          confirmedAt: new Date().toISOString()
        }
      });
      return true;
    } catch (error) {
      console.error('Error al confirmar el pago:', error);
      throw error;
    }
  }
  const cancelBooking = async (id) => updateDoc(doc(db,'bookings',id), { status:'cancelled' })
  const useTicket = async (id) => updateDoc(doc(db,'tickets',id), { status:'used' })

  const value = useMemo(() => ({
    resources,
    bookings: user ? bookings.filter(b => b.userId === user.uid) : [],
    tickets: user ? tickets.filter(t => t.userId === user.uid) : [],
    events,
    loading,
    error,
    seedResources,
    addBooking,
    confirmBookingPaid,
    cancelBooking,
    useTicket
  }), [resources, bookings, tickets, events, loading, error, user])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useBookings = () => useContext(Ctx)
