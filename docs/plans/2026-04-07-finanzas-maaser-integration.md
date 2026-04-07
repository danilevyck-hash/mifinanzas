# Finanzas + Maaser: Limpieza, Auto-categorización, Rediseño Apple & Integración

> **Para agentes:** Implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para tracking.

**Goal:** Limpiar MiFinanzas, agregar categorías pre-programadas con auto-detección, rediseñar todo Maaser a estilo Apple iOS con bottom tabs, e integrar Finanzas como 4to módulo en Maaser.

**Architecture:** MiFinanzas es la fuente de verdad del módulo de finanzas — cada cambio se replica en ambas apps. Maaser pasa de diseño navy/gold/cream a Apple iOS (fondo #F2F2F7, cards blancos, azul #007AFF). Todos los módulos de Maaser usan bottom tab navigation. El módulo Finanzas en Maaser usa PIN auth (sin multi-usuario).

**Tech Stack:** Next.js 14 (App Router), Supabase PostgreSQL, Tailwind CSS, TypeScript

**Regla clave:** Todo cambio en finanzas se hace SIMULTÁNEAMENTE en mifinanzas y en maaser/finanzas.

---

## Fase 1: Limpieza de MiFinanzas

### Task 1.1: Eliminar campos muertos del tipo PersonalExpense

**Files:**
- Modify: `~/Desktop/APPS/mifinanzas/src/lib/supabase.ts`

- [ ] **Step 1: Quitar latitude, longitude, split_count del tipo**

```typescript
// ANTES
export type PersonalExpense = {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  receipt_url?: string;
  latitude?: number;
  longitude?: number;
  subcategory?: string;
  split_count?: number;
  created_at?: string;
};

// DESPUÉS
export type PersonalExpense = {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  receipt_url?: string;
  subcategory?: string;
  created_at?: string;
};
```

- [ ] **Step 2: Eliminar tipos muertos si existen (Income, SavingsGoal, Achievement)**

Buscar en `supabase.ts` y eliminar cualquier tipo `Income`, `SavingsGoal`, o `Achievement`.

- [ ] **Step 3: Verificar que la app compila**

```bash
cd ~/Desktop/APPS/mifinanzas && npm run build
```

---

### Task 1.2: Limpiar API routes que referencien campos eliminados

**Files:**
- Modify: `~/Desktop/APPS/mifinanzas/src/app/api/personal-expenses/route.ts`

- [ ] **Step 1: Remover latitude, longitude, split_count de los INSERT/UPDATE**

En el POST handler, asegurar que NO se incluyan `latitude`, `longitude`, `split_count` en el insert.
En el PUT handler, asegurar que NO se incluyan en el update.

- [ ] **Step 2: Buscar y limpiar cualquier referencia a income, savings_goals, achievements**

```bash
cd ~/Desktop/APPS/mifinanzas && grep -r "income\|savings_goal\|achievement\|latitude\|longitude\|split_count" src/ --include="*.ts" --include="*.tsx" -l
```

Modificar cada archivo encontrado para eliminar las referencias.

- [ ] **Step 3: Verificar build**

```bash
cd ~/Desktop/APPS/mifinanzas && npm run build
```

---

### Task 1.3: Eliminar Import CSV (no se usa)

**Files:**
- Modify: `~/Desktop/APPS/mifinanzas/src/app/page.tsx` (quitar botón/lógica de import)
- Delete: Cualquier componente de ImportCSV si existe como archivo separado

- [ ] **Step 1: Buscar componente de import**

```bash
cd ~/Desktop/APPS/mifinanzas && grep -r "import\|Import\|csv\|CSV" src/ --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Eliminar el botón "Importar" del menú "Más" en page.tsx**

- [ ] **Step 3: Eliminar el componente/lógica de importación**

- [ ] **Step 4: Verificar build**

---

## Fase 2: Categorías Pre-programadas con Auto-detección

### Task 2.1: Definir categorías pre-programadas con keywords

**Files:**
- Create: `~/Desktop/APPS/mifinanzas/src/lib/default-categories.ts`

- [ ] **Step 1: Crear archivo con categorías predefinidas y palabras clave**

```typescript
export type DefaultCategory = {
  name: string;
  icon: string;
  color: string;
  keywords: string[]; // para auto-detección desde notas
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: "Comida",
    icon: "🍔",
    color: "#EF4444",
    keywords: ["restaurante", "almuerzo", "cena", "desayuno", "comida", "café", "pizza", "sushi", "pollo", "carne", "mcdonalds", "kfc", "subway", "uber eats", "pedidos ya", "rappi"],
  },
  {
    name: "Supermercado",
    icon: "🛒",
    color: "#10B981",
    keywords: ["super", "supermercado", "super 99", "rey", "riba smith", "pricesmart", "costco", "mercado", "compras"],
  },
  {
    name: "Transporte",
    icon: "🚗",
    color: "#3B82F6",
    keywords: ["gasolina", "gas", "uber", "indriver", "taxi", "estacionamiento", "parking", "peaje", "lavado", "taller", "mecánico", "llanta"],
  },
  {
    name: "Hogar",
    icon: "🏠",
    color: "#8B5CF6",
    keywords: ["alquiler", "rent", "luz", "agua", "internet", "cable", "gas natural", "mantenimiento", "reparación", "muebles", "decoración"],
  },
  {
    name: "Salud",
    icon: "💊",
    color: "#EC4899",
    keywords: ["doctor", "médico", "farmacia", "medicina", "hospital", "clínica", "dentista", "óptica", "lentes", "consulta", "laboratorio"],
  },
  {
    name: "Entretenimiento",
    icon: "🎮",
    color: "#F59E0B",
    keywords: ["netflix", "spotify", "cine", "película", "juego", "streaming", "disney", "hbo", "youtube", "suscripción"],
  },
  {
    name: "Ropa",
    icon: "👕",
    color: "#06B6D4",
    keywords: ["ropa", "zapatos", "camisa", "pantalón", "vestido", "zara", "h&m", "tienda", "shopping", "mall"],
  },
  {
    name: "Educación",
    icon: "📚",
    color: "#6366F1",
    keywords: ["curso", "libro", "escuela", "universidad", "clase", "matrícula", "seminario", "capacitación", "udemy"],
  },
  {
    name: "Servicios",
    icon: "⚡",
    color: "#F97316",
    keywords: ["teléfono", "celular", "plan", "seguro", "banco", "comisión", "impuesto", "multa", "trámite"],
  },
  {
    name: "Personal",
    icon: "💆",
    color: "#14B8A6",
    keywords: ["peluquería", "barbería", "spa", "gym", "gimnasio", "deporte", "yoga", "corte", "manicure"],
  },
  {
    name: "Mascotas",
    icon: "🐾",
    color: "#A855F7",
    keywords: ["veterinario", "mascota", "perro", "gato", "comida mascota", "pet"],
  },
  {
    name: "Viajes",
    icon: "✈️",
    color: "#0EA5E9",
    keywords: ["vuelo", "hotel", "airbnb", "viaje", "maleta", "aeropuerto", "boleto", "pasaje", "excursión"],
  },
  {
    name: "Regalos",
    icon: "🎁",
    color: "#E11D48",
    keywords: ["regalo", "cumpleaños", "navidad", "aniversario", "presente", "donación"],
  },
  {
    name: "Otros",
    icon: "📌",
    color: "#6B7280",
    keywords: [],
  },
];

/**
 * Auto-detecta categoría basándose en las notas del gasto.
 * Retorna el nombre de la categoría o null si no hay match.
 */
export function detectCategory(notes: string, enabledCategories: string[]): string | null {
  if (!notes || notes.trim().length < 2) return null;
  const lower = notes.toLowerCase().trim();

  for (const cat of DEFAULT_CATEGORIES) {
    if (!enabledCategories.includes(cat.name)) continue;
    for (const keyword of cat.keywords) {
      if (lower.includes(keyword)) {
        return cat.name;
      }
    }
  }
  return null;
}

/**
 * Obtiene la info de una categoría por nombre
 */
export function getCategoryInfo(name: string): DefaultCategory | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.name === name);
}
```

---

### Task 2.2: Cambiar sistema de categorías de "crear custom" a "habilitar/deshabilitar"

**Files:**
- Modify: `~/Desktop/APPS/mifinanzas/src/app/cuenta/page.tsx`
- Modify: `~/Desktop/APPS/mifinanzas/src/app/api/categories/route.ts`

- [ ] **Step 1: Modificar la sección de categorías en Settings**

Reemplazar el modal de "crear categoría" por una lista de todas las `DEFAULT_CATEGORIES` con un toggle (switch) para habilitar/deshabilitar cada una. Las categorías habilitadas se guardan en la tabla `categories` de Supabase (como antes, pero ahora solo son las pre-definidas).

La UI debe mostrar:
- Lista de las 14 categorías con icono + nombre + toggle
- Toggle verde cuando está habilitada
- Al deshabilitar, NO se borran los gastos — solo deja de aparecer como opción

- [ ] **Step 2: Modificar API de categorías**

El GET sigue igual (retorna las categorías del usuario).
El POST ya no necesita validar nombre único ni asignar color/icono aleatorio — viene de `DEFAULT_CATEGORIES`.
Agregar endpoint para toggle: recibe `{ name, enabled }`. Si `enabled=true`, hace INSERT de la categoría. Si `enabled=false`, hace DELETE.

- [ ] **Step 3: Crear un script/API que inicialice las categorías por defecto**

Cuando un usuario no tiene categorías (primer uso), se auto-crean las 14 categorías de `DEFAULT_CATEGORIES` en su tabla. Esto se puede hacer en el GET de categorías: si retorna vacío, insertar las defaults y retornar.

- [ ] **Step 4: Verificar build**

---

### Task 2.3: Auto-detección de categoría en ExpenseModal

**Files:**
- Modify: `~/Desktop/APPS/mifinanzas/src/components/ExpenseModal.tsx`

- [ ] **Step 1: Importar detectCategory y usarlo**

Cuando el usuario escribe en el campo de "Notas", ejecutar `detectCategory(notes, enabledCategories)` con debounce de 300ms. Si retorna una categoría, auto-seleccionarla en el dropdown con un indicador visual (ej: badge "Auto" al lado).

- [ ] **Step 2: Permitir que el usuario cambie la categoría manualmente**

La auto-detección es una sugerencia. Si el usuario ya seleccionó manualmente una categoría, no sobreescribirla. Solo auto-detectar si la categoría es la default (última usada) o si el usuario no ha tocado el dropdown.

- [ ] **Step 3: Agregar indicador visual de auto-detección**

Cuando la categoría fue auto-detectada, mostrar un pequeño badge azul "Auto ✨" al lado del dropdown. Si el usuario cambia manualmente, el badge desaparece.

- [ ] **Step 4: Verificar build y probar flujo**

---

## Fase 3: Rediseño de Maaser a Estilo Apple iOS

### Task 3.1: Actualizar sistema de diseño global de Maaser

**Files:**
- Modify: `~/Desktop/APPS/maaser/tailwind.config.ts`
- Modify: `~/Desktop/APPS/maaser/src/app/globals.css`
- Modify: `~/Desktop/APPS/maaser/src/app/layout.tsx`

- [ ] **Step 1: Cambiar colores de Tailwind de navy/gold/cream a Apple iOS**

```typescript
// tailwind.config.ts
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Apple iOS colors
        "ios-blue": "#007AFF",
        "ios-green": "#34C759",
        "ios-red": "#FF3B30",
        "ios-orange": "#FF9500",
        "ios-yellow": "#FFCC00",
        "ios-gray": "#8E8E93",
        "ios-bg": "#F2F2F7",
        "ios-card": "#FFFFFF",
        "ios-separator": "#C6C6C8",
        // Keep old names as aliases during migration
        navy: "#1A3A5C",
        gold: "#C9A84C",
        cream: "#F5F0E8",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Actualizar layout.tsx de Maaser**

Cambiar fondo de `bg-cream` a `bg-[#F2F2F7]`. Eliminar el `<Navbar />` del layout (ya no se usa — cada módulo tiene su propio bottom tab nav). Agregar meta viewport para iOS.

```typescript
// Nuevo layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#F2F2F7] min-h-screen">
        <ToastProvider>
          {children}
          <ServiceWorkerRegistrar />
        </ToastProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Agregar animaciones iOS a globals.css**

```css
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
```

---

### Task 3.2: Rediseñar Home de Maaser como app iOS

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/app/page.tsx`

- [ ] **Step 1: Rediseñar home con estilo iOS**

Layout full-screen con:
- Top bar: "Mis Registros" centrado, botón "Salir" a la derecha
- 4 cards grandes (Maaser, InDriver, Propiedades, Finanzas) estilo iOS
- Cards blancos con rounded-2xl, sin sombras pesadas
- Cada card: icono grande + nombre + descripción + chevron derecho
- Fondo #F2F2F7

```typescript
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const modules = [
  { href: "/maaser", icon: "✡", name: "Maaser", desc: "Registro de donaciones" },
  { href: "/indriver", icon: "🚗", name: "InDriver", desc: "Gastos mensuales" },
  { href: "/propiedades", icon: "🏠", name: "Propiedades", desc: "Gestión de alquileres" },
  { href: "/finanzas", icon: "💰", name: "Finanzas", desc: "Presupuesto y gastos" },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F2F2F7]">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#C6C6C8] px-5 pt-14 pb-3 shrink-0">
        <div className="flex items-center justify-between max-w-[430px] mx-auto">
          <h1 className="text-xl font-bold text-[#1C1C1E]">Mis Registros</h1>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
            className="text-[#007AFF] text-sm font-medium bg-transparent border-0 cursor-pointer"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Module cards */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="max-w-[430px] mx-auto px-4 py-6 space-y-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 active:bg-gray-50 transition-colors no-underline"
            >
              <span className="text-4xl">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-semibold text-[#1C1C1E]">{m.name}</p>
                <p className="text-[15px] text-[#8E8E93]">{m.desc}</p>
              </div>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-[#C6C6C8] shrink-0">
                <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 3.3: Rediseñar Login de Maaser a estilo Apple

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/app/login/page.tsx`

- [ ] **Step 1: Aplicar estilo iOS al login**

Cambiar colores de navy/gold/cream a:
- Fondo: `bg-[#F2F2F7]`
- Card: `bg-white rounded-2xl`
- PIN dots: `bg-[#007AFF]` cuando lleno
- Botones numpad: estilo iOS flat
- Título: negro en vez de navy

---

### Task 3.4: Crear layout compartido para módulos con bottom tabs

**Files:**
- Create: `~/Desktop/APPS/maaser/src/components/ModuleLayout.tsx`

- [ ] **Step 1: Crear componente reutilizable de layout con bottom tab**

Este componente envuelve cualquier módulo con:
- Top bar con título del módulo + "← Inicio" + "Salir"
- Área de contenido scrollable
- Bottom tab nav con tabs configurables

```typescript
"use client";

import { useRouter } from "next/navigation";

export type TabItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type Props = {
  title: string;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
};

export default function ModuleLayout({ title, tabs, activeTab, onTabChange, children }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F2F2F7]">
      {/* Top bar - iOS style */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#C6C6C8] px-5 pt-14 pb-3 shrink-0">
        <div className="flex items-center justify-between max-w-[430px] mx-auto">
          <a href="/" className="text-[#007AFF] text-sm font-medium no-underline">
            ← Inicio
          </a>
          <h1 className="text-[17px] font-semibold text-[#1C1C1E]">{title}</h1>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
            className="text-[#007AFF] text-sm font-medium bg-transparent border-0 cursor-pointer"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="max-w-[430px] mx-auto pb-24">
          {children}
        </div>
      </div>

      {/* Bottom tab bar - iOS style */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8] flex pb-8 pt-2 z-[100]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors border-0 bg-transparent cursor-pointer ${
              activeTab === tab.id ? "text-[#007AFF]" : "text-[#8E8E93]"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {tab.icon}
            </div>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 3.5: Migrar módulo Maaser (donaciones) a estilo Apple con bottom tabs

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/app/maaser/page.tsx`

- [ ] **Step 1: Envolver en ModuleLayout con 3 tabs: Dashboard, Beneficiarios, Resumen**

Actualmente usa rutas separadas (`/maaser`, `/maaser/beneficiarios`, `/maaser/resumen`). Convertir a tabs dentro de una sola página (como propiedades).

- [ ] **Step 2: Aplicar estilo iOS a KPI cards**

Cambiar de `border-l-4 border-gold shadow-md` a `bg-white rounded-2xl` sin sombras pesadas, con texto iOS.

- [ ] **Step 3: Aplicar estilo iOS a donation cards, botones, search, modals**

- [ ] **Step 4: Eliminar sub-páginas /maaser/beneficiarios y /maaser/resumen** (ahora son tabs)

---

### Task 3.6: Migrar módulo InDriver a estilo Apple con bottom tabs

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/app/indriver/page.tsx`

- [ ] **Step 1: Envolver en ModuleLayout con 2 tabs: Gastos, Resumen**

Misma lógica que maaser — convertir las rutas en tabs.

- [ ] **Step 2: Aplicar estilo iOS a todos los componentes**

- [ ] **Step 3: Eliminar sub-página /indriver/resumen** (ahora es tab)

---

### Task 3.7: Migrar módulo Propiedades a usar ModuleLayout

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/app/propiedades/page.tsx`

- [ ] **Step 1: Reemplazar layout custom por ModuleLayout**

Propiedades ya tiene bottom tabs pero con estilo propio. Migrar a usar `ModuleLayout` para consistencia. Mantener los 4 tabs: Dashboard, Propiedades, Cobros, Contratos.

- [ ] **Step 2: Aplicar colores iOS (reemplazar blue-700 por #007AFF, etc.)**

---

### Task 3.8: Eliminar Navbar.tsx viejo

**Files:**
- Delete: `~/Desktop/APPS/maaser/src/components/Navbar.tsx`
- Modify: `~/Desktop/APPS/maaser/src/app/layout.tsx` (remover import de Navbar)

- [ ] **Step 1: Eliminar Navbar y su import**

Ya no se necesita — cada módulo tiene su propio ModuleLayout con bottom tabs.

---

## Fase 4: Integrar Finanzas como Módulo en Maaser

### Task 4.1: Crear tablas de finanzas en Supabase de Maaser

**Files:**
- SQL en Supabase Dashboard (o migration file)

- [ ] **Step 1: Crear tablas en la misma base de datos de Maaser**

```sql
-- Categorías de finanzas (pre-programadas, usuario habilita/deshabilita)
CREATE TABLE finance_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Gastos personales
CREATE TABLE finance_expenses (
  id bigserial PRIMARY KEY,
  date date NOT NULL,
  amount numeric(12,2) NOT NULL,
  category text NOT NULL,
  notes text,
  payment_method text DEFAULT 'Yappy',
  receipt_url text,
  subcategory text,
  created_at timestamptz DEFAULT now()
);

-- Presupuestos por categoría por mes
CREATE TABLE finance_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  budget_amount numeric(12,2) NOT NULL,
  month text NOT NULL, -- YYYY-MM
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, month)
);

-- Gastos recurrentes
CREATE TABLE finance_recurring (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  amount numeric(12,2) NOT NULL,
  category text NOT NULL,
  notes text,
  payment_method text DEFAULT 'Yappy',
  day_of_month int NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_recurring ENABLE ROW LEVEL SECURITY;

-- Policies (solo service_role)
CREATE POLICY "service_role_all" ON finance_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON finance_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON finance_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON finance_recurring FOR ALL USING (true) WITH CHECK (true);
```

Nota: No hay `user_id` porque Maaser es single-user (PIN auth).

---

### Task 4.2: Copiar lib de categorías default a Maaser

**Files:**
- Create: `~/Desktop/APPS/maaser/src/lib/finance-categories.ts`

- [ ] **Step 1: Copiar default-categories.ts de mifinanzas**

Mismo contenido exacto que `~/Desktop/APPS/mifinanzas/src/lib/default-categories.ts` (creado en Task 2.1).

---

### Task 4.3: Crear API routes de finanzas en Maaser

**Files:**
- Create: `~/Desktop/APPS/maaser/src/app/api/finanzas/expenses/route.ts`
- Create: `~/Desktop/APPS/maaser/src/app/api/finanzas/categories/route.ts`
- Create: `~/Desktop/APPS/maaser/src/app/api/finanzas/budgets/route.ts`
- Create: `~/Desktop/APPS/maaser/src/app/api/finanzas/recurring/route.ts`

- [ ] **Step 1: Crear API de expenses**

Copiar lógica de `mifinanzas/src/app/api/personal-expenses/route.ts` pero:
- Tabla: `finance_expenses` (no `personal_expenses`)
- Sin `user_id` en queries
- Sin `latitude`, `longitude`, `split_count`

- [ ] **Step 2: Crear API de categories**

Copiar lógica pero adaptada a `finance_categories` y sin `user_id`.
Incluir auto-inicialización: si tabla vacía, insertar DEFAULT_CATEGORIES.

- [ ] **Step 3: Crear API de budgets**

Copiar lógica de `category-budgets/route.ts` adaptada a `finance_budgets` sin `user_id`.

- [ ] **Step 4: Crear API de recurring**

Copiar lógica de `recurring-expenses/route.ts` adaptada a `finance_recurring` sin `user_id`.

---

### Task 4.4: Crear páginas del módulo Finanzas en Maaser

**Files:**
- Create: `~/Desktop/APPS/maaser/src/app/finanzas/page.tsx`
- Create: `~/Desktop/APPS/maaser/src/components/finanzas/FinanzasDashboard.tsx`
- Create: `~/Desktop/APPS/maaser/src/components/finanzas/FinanzasResumen.tsx`
- Create: `~/Desktop/APPS/maaser/src/components/finanzas/FinanzasConfig.tsx`
- Create: `~/Desktop/APPS/maaser/src/components/finanzas/ExpenseModal.tsx`

- [ ] **Step 1: Crear page.tsx con ModuleLayout y 3 tabs**

```typescript
"use client";

import { useState } from "react";
import ModuleLayout from "@/components/ModuleLayout";
import FinanzasDashboard from "@/components/finanzas/FinanzasDashboard";
import FinanzasResumen from "@/components/finanzas/FinanzasResumen";
import FinanzasConfig from "@/components/finanzas/FinanzasConfig";

// Tab icons (SVGs)...

export default function FinanzasPage() {
  const [tab, setTab] = useState("gastos");

  const tabs = [
    { id: "gastos", label: "Gastos", icon: /* wallet SVG */ },
    { id: "resumen", label: "Resumen", icon: /* chart SVG */ },
    { id: "config", label: "Config", icon: /* gear SVG */ },
  ];

  return (
    <ModuleLayout title="Finanzas" tabs={tabs} activeTab={tab} onTabChange={setTab}>
      {tab === "gastos" && <FinanzasDashboard />}
      {tab === "resumen" && <FinanzasResumen />}
      {tab === "config" && <FinanzasConfig />}
    </ModuleLayout>
  );
}
```

- [ ] **Step 2: Crear FinanzasDashboard (copiado de mifinanzas page.tsx)**

Adaptar el dashboard principal:
- Mismos KPIs: total gastado, vs mes anterior, proyección
- Misma navegación de mes
- Mismos breakdowns por categoría y método de pago
- FAB para nuevo gasto
- Estilo Apple iOS (sin dark mode — maaser no tiene)
- Sin `authFetch` — usa `fetch` directo (auth es por cookie de PIN)
- APIs apuntan a `/api/finanzas/expenses`, etc.

- [ ] **Step 3: Crear FinanzasResumen (copiado de mifinanzas resumen/page.tsx)**

Adaptar resumen anual con estilo iOS.

- [ ] **Step 4: Crear FinanzasConfig**

Settings simplificado:
- Toggle de categorías (habilitar/deshabilitar de la lista predefinida)
- Gestión de presupuestos por categoría
- Gestión de gastos recurrentes
- NO incluir: perfil, password, multi-moneda, dark mode, formato de fecha

- [ ] **Step 5: Crear ExpenseModal para Maaser**

Copiar de mifinanzas pero:
- Estilo Apple iOS
- Auto-detección de categoría con `detectCategory()`
- Sin `authFetch`
- APIs a `/api/finanzas/...`

---

### Task 4.5: Agregar tipos de finanzas a Supabase types de Maaser

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/lib/supabase.ts`

- [ ] **Step 1: Agregar tipos**

```typescript
export type FinanceExpense = {
  id: number;
  date: string;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  receipt_url?: string;
  subcategory?: string;
  created_at?: string;
};

export type FinanceCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_enabled: boolean;
};

export type FinanceBudget = {
  id: string;
  category: string;
  budget_amount: number;
  month: string;
};

export type FinanceRecurring = {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  day_of_month: number;
  is_active: boolean;
};
```

---

### Task 4.6: Actualizar middleware de Maaser para permitir /finanzas

**Files:**
- Modify: `~/Desktop/APPS/maaser/src/middleware.ts`

- [ ] **Step 1: Verificar que /finanzas está protegido (debería estar por defecto)**

El middleware ya protege todo excepto `/login`, `/api/auth`, `/api/cron`. `/finanzas` será protegido automáticamente.

- [ ] **Step 2: Agregar `/api/finanzas` a las rutas protegidas (si es necesario)**

No debería hacer falta — el middleware protege todo por defecto.

---

## Fase 5: Sincronización continua

### Task 5.1: Documentar regla de sincronización

**Files:**
- Create: `~/Desktop/APPS/mifinanzas/CLAUDE.md`
- Modify: `~/Desktop/APPS/maaser/CLAUDE.md` (si existe, si no, crear)

- [ ] **Step 1: Agregar instrucción de sincronización**

En ambos CLAUDE.md:

```markdown
## Sincronización MiFinanzas ↔ Maaser/Finanzas

Cada cambio en el módulo de finanzas (features, bug fixes, UI changes) DEBE hacerse simultáneamente en:
1. ~/Desktop/APPS/mifinanzas (app independiente, multi-usuario)
2. ~/Desktop/APPS/maaser/src/app/finanzas + ~/Desktop/APPS/maaser/src/components/finanzas (módulo dentro de maaser, single-user PIN)

Diferencias clave entre ambas versiones:
- mifinanzas usa auth con username/password (authFetch). maaser usa PIN cookie (fetch directo)
- mifinanzas tiene user_id en todas las tablas. maaser no tiene user_id
- mifinanzas tiene dark mode. maaser no
- mifinanzas tablas: personal_expenses, categories, category_budgets, recurring_expenses
- maaser tablas: finance_expenses, finance_categories, finance_budgets, finance_recurring
- mifinanzas APIs: /api/personal-expenses, /api/categories, /api/category-budgets, /api/recurring-expenses
- maaser APIs: /api/finanzas/expenses, /api/finanzas/categories, /api/finanzas/budgets, /api/finanzas/recurring
```

---

## Orden de ejecución recomendado

1. **Fase 1** (Tasks 1.1-1.3): Limpieza de mifinanzas — 30 min
2. **Fase 2** (Tasks 2.1-2.3): Categorías auto-detectadas — 1-2 horas
3. **Fase 3** (Tasks 3.1-3.8): Rediseño Apple de maaser — 3-4 horas
4. **Fase 4** (Tasks 4.1-4.6): Integración de finanzas en maaser — 3-4 horas
5. **Fase 5** (Task 5.1): Documentación de sincronización — 10 min

Total estimado: ~10 horas de trabajo de implementación.

---

## Notas importantes

- **No romper Propiedades**: El módulo de propiedades tiene su propio DM Sans font y viewport config en su layout.tsx. Al migrar a ModuleLayout, asegurar que el font se mantiene o se unifica.
- **Receipts/OCR**: El feature de OCR con Claude Vision se mantiene en mifinanzas y se copia a maaser. Requiere la misma API key de Anthropic en ambos proyectos.
- **Storage bucket**: En maaser habrá que crear un bucket `finance-receipts` en Supabase Storage (si se usa OCR de recibos en el módulo de finanzas).
- **Payment methods**: Se mantienen los mismos (Yappy, ACH, Tarjeta de Crédito) en ambas apps.
- **Export**: Excel/PDF export se copia a maaser pero sin el import CSV.
