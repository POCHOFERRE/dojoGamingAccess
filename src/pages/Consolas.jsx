import { useEffect, useMemo, useState } from 'react'
import { useBookings } from '@/context/BookingsContext.jsx'
import { useAuth } from '@/context/AuthContext'
import TimeSlotPicker from '@/components/TimeSlotPicker.jsx'
import PaymentModal from '@/components/PaymentModal.jsx'
import { FaPlaystation, FaXbox, FaGamepad, FaCarSide } from 'react-icons/fa'

// Fallback local por si tu contexto aún no trae recursos
const DEFAULT_RESOURCES = [
  { id:'ps5-01', name:'PS5 #1', type:'ps5', price:6500, active:true, bufferMins:5 },
  { id:'ps5-02', name:'PS5 #2', type:'ps5', price:6500, active:true, bufferMins:5 },
  { id:'ps5-03', name:'PS5 #3', type:'ps5', price:6500, active:true, bufferMins:5 },
  { id:'ps5-04', name:'PS5 #4', type:'ps5', price:6500, active:true, bufferMins:5 },
  { id:'ps5-05', name:'PS5 #5', type:'ps5', price:6500, active:true, bufferMins:5 },
  { id:'xbox-01', name:'Xbox Series', type:'xbox', price:6500, active:true, bufferMins:5 },
  { id:'switch-01', name:'Nintendo Switch', type:'switch', price:6000, active:true, bufferMins:5 },
  { id:'ps4-01', name:'PS4 #1', type:'ps4', price:5500, active:true, bufferMins:5 },
  { id:'ps4-02', name:'PS4 #2', type:'ps4', price:5500, active:true, bufferMins:5 },
  { id:'ps4-03', name:'PS4 #3', type:'ps4', price:5500, active:true, bufferMins:5 },
  { id:'ps4-04', name:'PS4 #4', type:'ps4', price:5500, active:true, bufferMins:5 },
  { id:'sim-01', name:'Simulador #1', type:'simulador', price:6000, active:true, bufferMins:10 },
  { id:'sim-02', name:'Simulador #2', type:'simulador', price:6000, active:true, bufferMins:10 }, // 👈 agregado
]

const normType = (t='') => {
  const v = String(t).toLowerCase()
  if (v.includes('ps5')) return 'ps5'
  if (v.includes('ps4')) return 'ps4'
  if (v.includes('xbox')) return 'xbox'
  if (v.includes('switch')) return 'switch'
  if (v.includes('sim')) return 'simulador'
  return v
}
const Icon = ({ type }) => {
  const t = normType(type)
  if (t === 'ps4' || t === 'ps5') return <FaPlaystation />
  if (t === 'xbox') return <FaXbox />
  if (t === 'switch') return <FaGamepad />
  if (t === 'simulador') return <FaCarSide />
  return <FaGamepad />
}

export default function Consolas(){
  const { user } = useAuth()
  const { resources, bookings } = useBookings()

  const effectiveResources = useMemo(() => {
    const base = (resources?.length ? resources : DEFAULT_RESOURCES)
    return base.filter(r => r?.active !== false)
  }, [resources])

  const [resourceId, setResourceId] = useState(null)
  useEffect(() => { if (!resourceId && effectiveResources.length) setResourceId(effectiveResources[0].id) }, [effectiveResources, resourceId])
  const selected = useMemo(() => effectiveResources.find(r => r.id === resourceId) || null, [effectiveResources, resourceId])
  const selectedType = normType(selected?.type)

  // 👉 control Joysticks solo para PS4
  const [joysticks, setJoysticks] = useState(1)
  useEffect(() => { if (selectedType !== 'ps4') setJoysticks(1) }, [selectedType]) // resetea si cambias de tipo

  // Modal de pago
  const [showPay, setShowPay] = useState(false)
  const [reservation, setReservation] = useState(null)

  // precio por hora (PS4 con 2 joysticks suma $500/h)
  const pricePreview = (startIso, durationMins) => {
    if (!selected?.price) return undefined
    let base = selected.price
    if (selectedType === 'ps4' && joysticks === 2) base += 500
    return Math.round(base * (durationMins/60))
  }

  return (
    <div className="screen" style={{ padding: 12, maxWidth: 1140, margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Elegí tu consola/simulador</h2>
        <div className="list" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10, marginTop:10 }}>
          {effectiveResources.map(r => {
            const active = r.id === resourceId
            return (
              <button key={r.id} onClick={() => setResourceId(r.id)}
                className={`tile ${active ? 'active' : ''}`}
                style={{ textAlign:'left', display:'grid', gridTemplateColumns:'28px 1fr auto', gap:10, alignItems:'center',
                         padding:'10px 12px', borderRadius:10, border:`1px solid ${active?'#5fc':'#2a3b44'}`, background: active ? '#0f3340' : '#0b1e26', color:'#def' }}>
                <div style={{ fontSize:22 }}><Icon type={r.type} /></div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</div>
                  <div style={{ opacity:.85, fontSize:13 }}>{normType(r.type).toUpperCase()}</div>
                </div>
                <div style={{ fontWeight:900 }}>${r.price}/h</div>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{selected.name}: reservá tu turno</h3>

          {selectedType === 'ps4' && (
            <div style={{ marginBottom: 10, display:'flex', gap:10, alignItems:'center' }}>
              <label style={{ opacity:.9 }}>Joysticks (PS4):</label>
              <div style={{ display:'flex', gap:6 }}>
                <button
                  type="button"
                  onClick={() => setJoysticks(1)}
                  className={`seg ${joysticks===1 ? 'active' : ''}`}
                >1</button>
                <button
                  type="button"
                  onClick={() => setJoysticks(2)}
                  className={`seg ${joysticks===2 ? 'active' : ''}`}
                >2 (+$500/h)</button>
              </div>
              <style jsx>{`
                .seg{background:#123;border:1px solid #345;color:#cfe;padding:6px 10px;border-radius:8px}
                .seg.active{background:#0f3340;border-color:#5fc;box-shadow:0 0 0 2px #5fc inset}
              `}</style>
            </div>
          )}

          <TimeSlotPicker
            openHour={14}
            closeHour={23}
            resourceId={selected.id}
            bookings={bookings || []}
            user={user}
            pricePreview={pricePreview}
            pricePerHour={selected.price}
            bufferMins={Number(selected.bufferMins || 0)}
            alias="dojovcp"
            mpLink="https://mpago.la/tu-link"  // reemplazalo por tu link real o dinámico
            compact
            // 👇 guardamos joysticks en el booking (meta)
            meta={selectedType==='ps4' ? { joysticks } : null}
            onConfirmed={(res) => { setReservation(res); setShowPay(true) }}
          />
        </div>
      )}

      <PaymentModal
        show={showPay}
        onHide={() => setShowPay(false)}
        reservation={reservation}
        onSuccess={() => { setReservation(null) }}
      />

      <style jsx>{`
        .card{background:#0a1a22;border:1px solid #243844;border-radius:12px;padding:12px;color:#dff3ff;box-shadow:0 8px 24px rgba(0,0,0,.3)}
        .tile:hover{filter:brightness(1.06)}
      `}</style>
    </div>
  )
}
