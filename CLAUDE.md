# MiFinanzas — Control de Gastos Personales

PWA de finanzas personales para toda Latinoamérica. Diseño estilo Apple iOS. Registro de gastos, presupuestos por categoría, gastos recurrentes, metas de ahorro, y reportes.

## Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Analytics:** Vercel Analytics
- **Excel:** exceljs
- **PDF:** jsPDF + jspdf-autotable
- **PWA:** Service worker con cache-first + offline support

## Módulos
| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Home (Gastos) | `/` | KPIs (gastado/disponible), categorías colapsables, gastos agrupados por día, FAB flotante, action sheet |
| Resumen | `/resumen` | Total anual, bar chart mensual, meses expandibles con categorías |
| Config | `/cuenta` | Perfil, seguridad, categorías, presupuestos, recurrentes, metas, apariencia, moneda, fecha |
| Login | `/login` | Login con usuario y contraseña |
| Registro | `/registro` | Multi-step: paso 1 (nombre+email+términos), paso 2 (usuario+contraseña) |
| Privacidad | `/privacidad` | Política de privacidad |

## Auth
- Login con usuario/contraseña contra tabla `users` en Supabase
- Passwords hasheados con bcrypt (auto-migración de plaintext al login)
- Tokens de sesión HMAC-SHA256 firmados con AUTH_SECRET (7 días)
- Rate limiting: 5 intentos / 15 min por IP
- Registro público con categorías default (8 categorías + emojis)
- Check de username disponible en tiempo real
- Sesión expirada redirige a /login con toast
- refreshUser() en AuthContext para actualizar perfil en tiempo real
- authFetch() soporta FormData (para upload de recibos)

## Base de datos
Tablas:
- `users` — id (int), username, display_name, email, password (bcrypt)
- `personal_expenses` — id, user_id, date, amount, category, notes, payment_method, receipt_url, subcategory, split_count
- `categories` — id, user_id, name, color, icon (emoji), custom_icon
- `category_budgets` — id (uuid), user_id, category, budget_amount, month ("YYYY-MM")
- `recurring_expenses` — id (uuid), user_id, amount, category, notes, payment_method, day_of_month, is_active
- `income` — id (uuid), user_id, date, amount, source, notes, is_recurring
- `savings_goals` — id (uuid), user_id, name, target_amount, current_amount, deadline, is_active
- `achievements` — id (uuid), user_id, type, name, earned_at
- `user_preferences` — id (uuid), user_id (unique), last_category, last_payment_method, collapsed_sections, alerts_dismissed_date
- `subcategories` — id (uuid), user_id, category_name, name

Storage:
- Bucket `receipts` (público) — fotos de recibos

RLS habilitado en todas las tablas. Queries via supabaseAdmin (service_role).

## API Routes
| Ruta | Métodos | Descripción |
|------|---------|-------------|
| `/api/auth/login` | POST | Login + rate limiting |
| `/api/auth/register` | POST | Registro + categorías default |
| `/api/auth/update` | PUT, DELETE | Perfil, contraseña, eliminar cuenta |
| `/api/auth/check-username` | GET | Disponibilidad de username |
| `/api/personal-expenses` | GET, POST, PUT, DELETE | CRUD gastos |
| `/api/categories` | GET, POST, PUT, DELETE | CRUD categorías (PUT = rename + migración) |
| `/api/category-budgets` | GET, POST | Presupuestos (upsert) |
| `/api/recurring-expenses` | GET, POST, PUT, DELETE | Gastos recurrentes |
| `/api/recurring-expenses/apply` | POST | Aplicar recurrentes al mes |
| `/api/income` | GET, POST, PUT, DELETE | CRUD ingresos |
| `/api/savings-goals` | GET, POST, PUT, DELETE | Metas de ahorro |
| `/api/achievements` | GET, POST | Logros/gamificación |
| `/api/user-preferences` | GET, POST | Preferencias (última categoría, método) |
| `/api/notes-suggestions` | GET | Autocomplete de notas por categoría |
| `/api/upload-receipt` | POST | Upload foto recibo a Supabase Storage |

## Design System (Apple iOS Style)
- **Colores:** Azul Apple #007AFF, gris #8E8E93, fondo #F2F2F7, cards dark #1C1C1E, separadores #C6C6C8
- **Navbar:** primary header (#0F172A), bottom tab bar 49px con backdrop-blur-xl
- **Tabs:** Gastos, Resumen, Config (ícono engranaje)
- **Cards:** bg-white dark:bg-[#1C1C1E] rounded-2xl, sin shadows
- **Modals:** Header blanco con "Cancelar" izq + "Guardar" der (no header navy)
- **Botones:** Texto azul #007AFF, no pills con background
- **Toggles:** Verde Apple #34C759
- **Inputs:** text-[16px] mínimo (previene zoom iOS), focus:ring-blue-500
- **Animaciones:** slide-up con cubic-bezier iOS (0.32, 0.72, 0, 1), fade-in 0.15s
- **Touch:** Sin selección de texto, sin highlight, sin double-tap zoom, active states grises
- **FAB:** Azul #007AFF, se oculta al scroll down, active:scale-95
- **Toasts:** Arriba (top-16), backdrop-blur-xl, rounded-2xl, auto-dismiss 3s/5s
- **Dark mode:** Clase 'dark' en html, toggle en Config, transiciones suaves

## Componentes
| Componente | Descripción |
|-----------|-------------|
| ExpenseModal | Agregar/editar gasto. Monto+Categoría siempre visible, "Más detalles" expande fecha/notas/método/recibo |
| ExportModal | Exportar a Excel/PDF con filtros de fecha |
| BudgetModal | Presupuesto por categoría individual |
| BulkBudgetModal | Todos los presupuestos de una vez |
| CategoryEditorModal | Agregar, renombrar (migra gastos), cambiar color/emoji, eliminar |
| RecurringExpensesModal | CRUD gastos recurrentes + aplicar al mes |
| IncomeModal | Agregar/editar ingresos con fuentes predefinidas |
| ImportModal | Importar CSV con preview y progreso |
| SavingsGoalsModal | Metas con termómetro de progreso |
| ConfirmModal | Confirmación Apple action sheet style |
| ReceiptCapture | Foto de recibo adjunta al gasto |
| Confetti | Celebración CSS, tap para cerrar |
| SkeletonLoader | Pulse loaders para KPIs y categorías |
| OfflineBanner | Banner "Sin conexión" |
| Toast | Success/error/warning/danger con iconos |

## Preferencias (localStorage)
- `mifinanzas_user` — datos del usuario
- `mifinanzas_token` — JWT de sesión
- `mifinanzas_theme` — "dark" | "light"
- `mifinanzas_prefs` — { currency, dateFormat, budgetAlerts }
- `mifinanzas_alerts_date` — fecha última alerta (1x/día)

## Deploy
```bash
git push origin main   # Auto-deploy via Vercel
```

## Env vars en Vercel
- `AUTH_SECRET` — firma tokens HMAC-SHA256
- `SUPABASE_SERVICE_ROLE_KEY` — service role key
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key

## Changes — April 2026 Session

### Synced Audit Fixes from Maaser
- Error handling: try/catch on all async operations
- Touch targets enlarged to 44px minimum
- Scroll lock on modals (body overflow hidden)
- Confirm delete dialogs added

### API & Cache
- All API routes have `export const dynamic = 'force-dynamic'`

## Sincronización MiFinanzas <-> Maaser/Finanzas

**REGLA IMPORTANTE:** Cada cambio en el módulo de finanzas (features, bug fixes, UI changes) DEBE hacerse simultáneamente en:
1. `~/Desktop/APPS/mifinanzas` (app independiente, multi-usuario)
2. `~/Desktop/APPS/maaser/src/app/finanzas` + `~/Desktop/APPS/maaser/src/components/finanzas` (módulo dentro de maaser, single-user PIN)

### Diferencias entre ambas versiones:
| Aspecto | MiFinanzas | Maaser/Finanzas |
|---------|-----------|-----------------|
| Auth | username/password (authFetch) | PIN cookie (fetch directo) |
| User ID | user_id en todas las tablas/queries | Sin user_id (single user) |
| Dark mode | Sí | No |
| Tablas | personal_expenses, categories, category_budgets, recurring_expenses | finance_expenses, finance_categories, finance_budgets, finance_recurring |
| APIs | /api/personal-expenses, /api/categories, /api/category-budgets, /api/recurring-expenses | /api/finanzas/expenses, /api/finanzas/categories, /api/finanzas/budgets, /api/finanzas/recurring |
| Estilo | Apple iOS con dark mode | Apple iOS sin dark mode |
| Categorías | default-categories.ts | finance-categories.ts (mismo contenido) |

### Al hacer cambios:
1. Implementar en mifinanzas primero
2. Copiar/adaptar en maaser removiendo user_id, authFetch, y dark mode
3. Verificar build en ambos proyectos


## Regla de Calidad
- Todo código debe funcionar a la primera. No pushear sin verificar el flujo completo end-to-end.
- Verificar: datos fluyen escritura → DB → lectura → UI
- Auth en serverless: usar tokens HMAC firmados, NO Maps en memoria
- No hacer fire-and-forget (.then().catch()) para operaciones críticas — siempre await
- useState en useEffect como dependencia puede causar re-renders destructivos — usar useRef para estado interno
- Verificar compatibilidad de formatos antes de integrar (PNG/JPEG en jsPDF, DER/P1363 en WebAuthn)
- Si no puedo probar en browser, simular el flujo con script
