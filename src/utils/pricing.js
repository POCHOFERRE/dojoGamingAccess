
/**
 * Reglas de precios:
 * - PS4: 1 joystick $5500, 2 joysticks $6000
 * - Simulador: $6000
 * - PS5: $6500
 * - Xbox: $6500
 * - Lunes(1), Miércoles(3), Viernes(5): 50% en la segunda hora
 * - Descuento del 15% para reservas de 3+ horas
 * - Soporte para incrementos de 15 minutos
 */

// Precios base por tipo de recurso (por hora)
const PRICES = {
  ps4: { base: 5500, secondJoystick: 500 },
  ps5: { base: 6500 },
  xbox: { base: 6500 },
  switch: { base: 6000 },
  simulador: { base: 6000 }
}

// Días con promoción (0=Dom, 1=Lun, ..., 6=Sáb)
const PROMO_DAYS = [1, 3, 5] // Lunes, Miércoles, Viernes

/**
 * Calcula el precio base por hora según el tipo de recurso
 */
export function computeBasePrice(resource, options) {
  const config = PRICES[resource.type] || { base: 6000 }
  let price = config.base
  
  // Ajuste por joysticks adicionales (solo para PS4)
  if (resource.type === 'ps4' && options?.joysticks === 2) {
    price += config.secondJoystick || 0
  }
  
  return price
}

/**
 * Calcula el precio de un rango de tiempo específico
 */
function calculateTimeSlotPrice(resource, startDate, endDate, options) {
  const durationMs = endDate - startDate
  const durationMinutes = Math.ceil(durationMs / (60 * 1000))
  const durationHours = durationMinutes / 60
  const basePrice = computeBasePrice(resource, options)
  const pricePerMinute = basePrice / 60
  const weekday = startDate.getDay()
  let total = 0
  
  // Calcular precio exacto por minuto
  total = durationMinutes * pricePerMinute
  
  // Aplicar descuento de la segunda hora en días promocionales
  if (PROMO_DAYS.includes(weekday) && durationHours >= 1) {
    // Calcular minutos de descuento (máximo 60 minutos de descuento)
    const discountMinutes = Math.min(60, Math.max(0, durationMinutes - 60))
    const discountAmount = (discountMinutes * pricePerMinute) * 0.5 // 50% de descuento
    total -= discountAmount
  }
  
  // Redondear al múltiplo de 100 más cercano
  total = Math.round(total / 100) * 100
  
  return total
}

/**
 * Calcula el total considerando múltiples slots de tiempo
 */
export function computeTotal(resource, slots = [], options) {
  if (!slots.length) return 0
  
  let total = 0
  let totalHours = 0
  
  // Calcular el total para cada slot de tiempo
  for (const slot of slots) {
    const startDate = new Date(slot.startIso)
    const endDate = new Date(slot.endIso)
    const slotTotal = calculateTimeSlotPrice(resource, startDate, endDate, options)
    total += slotTotal
    totalHours += (endDate - startDate) / (60 * 60 * 1000)
  }
  
  // Aplicar descuento por duración (15% para 3+ horas)
  if (totalHours >= 3) {
    total = Math.round(total * 0.85)
  }
  
  return total
}

/**
 * Formatea el precio para mostrarlo al usuario
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('ARS', '').trim()
}
