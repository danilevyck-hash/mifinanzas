# MiFinanzas — Finanzas Personales

App de finanzas personales para mi hermano. Registro de gastos con categorías, métodos de pago, resumen anual/mensual, y exportación.

## Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS
- **Excel:** exceljs
- **PDF:** jsPDF + jspdf-autotable
- **PWA:** Service worker registrado

## Módulos
| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Gastos | `/` | Lista por mes, cards en mobile, tabla en desktop, navegación ← mes → |
| Resumen | `/resumen` | Resumen anual, desglose por categoría y método de pago |
| Cuenta | `/cuenta` | Cambiar nombre, usuario, contraseña |
| Login | `/login` | Login con usuario y contraseña |

## Auth
- Login con usuario/contraseña contra tabla `users` en Supabase
- Passwords hasheados con bcrypt (auto-migración de plaintext al login)
- Tokens de sesión HMAC-SHA256 firmados con AUTH_SECRET
- Todas las API routes verifican token via header Authorization: Bearer
- Ownership enforcement: usuario solo accede a sus propios datos
- Server client: `src/lib/supabase-server.ts` (usa SUPABASE_SERVICE_ROLE_KEY)
- Session helper: `src/lib/session.ts` (createToken, getAuthUserId)

## Base de datos
- Tablas: users, personal_expenses, categories
- RLS: debe estar habilitado (sin policies = solo service_role accede)

## Design System
- Colores: primary (#0F172A), accent (#059669 emerald), surface (#F8FAFC)
- Bottom nav en mobile (Gastos, Resumen, Cuenta) con iconos
- Top nav en desktop
- Cards para gastos en mobile, tabla en desktop
- Modales tipo bottom sheet en mobile
- Touch targets 44px+ en todos los botones
- Toasts para confirmaciones y errores
- Loading spinners animados
- Safe area padding para PWA

## Deploy
```bash
git push origin main   # Auto-deploy via Vercel
```

## Env vars en Vercel
- `AUTH_SECRET` — firma los tokens de sesión (HMAC-SHA256)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key
