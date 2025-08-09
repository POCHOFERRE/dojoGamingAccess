
# Dojo Reservas v4 — Retro UI + MP link + Transfer + QR persistente

## Qué incluye
- UI retro/pixel con grilla responsive.
- Firestore en tiempo real.
- Consolas: muestra **11 consolas + 2 simuladores** (botón “Cargar recursos Dojo” si está vacío).
- Reglas de precio: PS4 (1 joy $5500, 2 joy $6000), Sim $6000, PS5 $6500.
- Promo: **2ª hora al 50%** los **Lunes/Miércoles/Viernes**.
- Checkout con **link directo de MercadoPago** (si seteás `VITE_MP_LINK`) o **Transferencia (alias dojogamingvcp)**.
- Reserva persiste en Firestore con **QR**, descargable desde “Mis reservas”.
- Check‑in admin que valida el **BK:** en Firestore.

## Pasos
1. `npm i`
2. `cp .env.example .env` y poné tus credenciales Firebase. (Opcional: `VITE_MP_LINK`)
3. `npm run dev`
4. Ir a **/consolas** → si no ves recursos, tocá **“Cargar recursos Dojo”**.
5. Elegí recurso, duración (1/2 hs), (PS4: joysticks), horario → Guardar reserva.
6. Pagá por MP (link) o transferencia; podés “Confirmar pago (simulado)” para test.
7. En **/mis-reservas** descargás el **QR**.
8. En **/admin/checkin** validás el QR.

## Desplegar reglas de Firestore

1. Instala Firebase CLI si no lo tenés:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicia sesión en Firebase:
   ```bash
   firebase login
   ```

3. Despliega las reglas de seguridad:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. Si necesitás modificar las reglas, editá el archivo `firestore.rules` y volvé a desplegar.

## Estructura de seguridad

- **resources**: Lectura pública, escritura solo para usuarios autenticados
- **bookings**: Los usuarios solo pueden leer/escribir sus propias reservas
- **events**: Lectura pública, escritura solo para administradores
- **tickets**: Los usuarios pueden leer sus propios tickets, los administradores pueden leer/escribir todos

> Próximo: conectar Functions + Webhook de MercadoPago para aprobar pagos reales.
# dojoGamingAccess
