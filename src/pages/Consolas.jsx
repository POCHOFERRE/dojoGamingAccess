// src/pages/Consolas.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBookings } from '@/context/BookingsContext.jsx'
import { useAuth } from '@/context/AuthContext'
import TimeSlotPicker from '@/components/TimeSlotPicker.jsx'
import PaymentModal from '@/components/PaymentModal.jsx'
import { FaPlaystation, FaXbox, FaGamepad, FaCarSide, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

/* ---------- Datos (fallback si tu contexto aún no trae recursos) ---------- */
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
  { id:'sim-02', name:'Simulador #2', type:'simulador', price:6000, active:true, bufferMins:10 },
]

/* ---------- Helpers ---------- */
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

/* ---------- Carousel GBA Color ---------- */
function GbaCarousel({ items, selectedId, onSelect }) {
  const trackRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const scrollToItem = (id, smooth = true) => {
    const wrap = trackRef.current
    const el = wrap?.querySelector(`[data-id="${id}"]`)
    if (!wrap || !el) return
    const wrapRect = wrap.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const delta =
      elRect.left +
      elRect.width / 2 -
      (wrapRect.left + wrapRect.width / 2)
    wrap.scrollBy({ left: delta, behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    if (selectedId) scrollToItem(selectedId)
  }, [selectedId])

  const onPointerDown = (e) => {
    const wrap = trackRef.current
    if (!wrap) return
    wrap.dataset.dragging = "true"
    wrap.dataset.startX = e.clientX ?? e.touches?.[0]?.clientX
    wrap.dataset.scrollLeft = wrap.scrollLeft
  }

  const onPointerMove = (e) => {
    const wrap = trackRef.current
    if (!wrap || wrap.dataset.dragging !== "true") return
    const x = e.clientX ?? e.touches?.[0]?.clientX
    const dx = wrap.dataset.startX - x
    wrap.scrollLeft = parseInt(wrap.dataset.scrollLeft) + dx
  }

  const onPointerUp = () => {
    const wrap = trackRef.current
    if (wrap) wrap.dataset.dragging = "false"
  }

  return (
    <div className="gba-carousel">
      {!isMobile && (
        <button className="nav left" onClick={() => scrollToItem(items[0]?.id)}>
          ◀
        </button>
      )}

      <div
        className="track"
        ref={trackRef}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {items.map((r) => (
          <button
            key={r.id}
            data-id={r.id}
            onClick={() => onSelect(r.id)}
            className={`gba-card-tile ${selectedId === r.id ? 'active' : ''}`}
          >
            <div className="icon"><Icon type={r.type} /></div>
            <div className="info">
              <div className="name">{r.name}</div>
              <div className="meta">{normType(r.type).toUpperCase()}</div>
            </div>
            <div className="price">${r.price}/h</div>
          </button>
        ))}
      </div>

      {!isMobile && (
        <button className="nav right" onClick={() => scrollToItem(items[items.length - 1]?.id)}>
          ▶
        </button>
      )}

      <style jsx>{`
        .gba-carousel {
          position: relative;
          padding: 8px;
        }
        .track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .track::-webkit-scrollbar {
          display: none;
        }
        .gba-card-tile {
          scroll-snap-align: center;
          min-width: 300px;
          max-width: 320px;
          min-height: 140px;
          display: grid;
          grid-template-columns: 50px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 14px;
          border-radius: 14px;
          border: 2px solid #4a2fb6;
          background: linear-gradient(180deg, rgba(19,8,47,.85), rgba(10,7,28,.9));
          color: #e8e6ff;
          box-shadow: 0 8px 18px rgba(0,0,0,.45);
          word-break: break-word;
        }
        .gba-card-tile .icon {
          font-size: 26px;
        }
        .gba-card-tile .name {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gba-card-tile .meta {
          font-size: 13px;
          opacity: 0.85;
        }
        .price {
          font-weight: bold;
          font-size: 14px;
          color: #ffe48a;
        }
        .nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #8f78ff;
          color: white;
        }
        .nav.left {
          left: 0;
        }
        .nav.right {
          right: 0;
        }
        @media (max-width: 768px) {
          .nav {
            display: none;
          }
          .gba-card-tile {
            min-width: 85%;
            max-width: 85%;
            min-height: 160px;
          }
        }
      `}</style>
    </div>
  )
}

/* ---------- Página ---------- */
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

  // PS4: joysticks (1 ó 2) con recargo
  const [joysticks, setJoysticks] = useState(1)
  useEffect(() => { if (selectedType !== 'ps4') setJoysticks(1) }, [selectedType])

  // Pago
  const [showPay, setShowPay] = useState(false)
  const [reservation, setReservation] = useState(null)

  const pricePreview = (_iso, durationMins) => {
    if (!selected?.price) return undefined
    let base = selected.price
    if (selectedType === 'ps4' && joysticks === 2) base += 500
    return Math.round(base * (durationMins/60))
  }

  return (
    <div className="screen" style={{ padding: 12, maxWidth: 1140, margin: '0 auto' }}>
      <div className="card-outer">
        <h2 className="title">Elegí tu consola/simulador</h2>
        <GbaCarousel
          items={effectiveResources}
          selectedId={resourceId}
          onSelect={(id) => setResourceId(id)}
        />
      </div>

      {selected && (
        <div className="card-outer">
          <h3 className="title" style={{ marginTop: 0 }}>{selected.name}: reservá tu turno</h3>

          {selectedType === 'ps4' && (
            <div className="joy-wrap">
              <span>Joysticks (PS4):</span>
              <div className="joy-seg">
                <button type="button" onClick={()=>setJoysticks(1)} className={joysticks===1?'active':''}>1</button>
                <button type="button" onClick={()=>setJoysticks(2)} className={joysticks===2?'active':''}>2 (+$500/h)</button>
              </div>
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
            mpLink="https://mpago.la/tu-link"  // cambialo por el real
            compact
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

      {/* skin GBA Color (contenedores) */}
      <style jsx>{`
        .card-outer{
          background:
            radial-gradient(120% 120% at 100% 0%, rgba(255,255,255,.05), transparent 40%),
            linear-gradient(135deg,#2b165c 0%, #1e1045 60%, #140b33 100%);
          border:2px solid #4b2dc5;
          border-radius:16px;
          padding:12px;
          color:#eae6ff;
          box-shadow: 0 10px 26px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.04);
          margin-bottom: 12px;
        }
        .title{ margin:0 0 8px 0; letter-spacing:.3px; color:#efe9ff; text-shadow:0 1px 0 rgba(0,0,0,.4) }
        .joy-wrap{ display:flex; align-items:center; gap:10px; margin-bottom:10px; color:#d8ccff }
        .joy-seg{ display:flex; gap:6px }
        .joy-seg button{
          background:#1b1140; color:#e9e3ff; border:1px solid #5642b8; border-radius:10px; padding:6px 10px
        }
        .joy-seg button.active{
          background:#2d1f6e; border-color:#b79cff; box-shadow:0 0 0 2px rgba(183,156,255,.2) inset
        }
      `}</style>
    </div>
  )
}
