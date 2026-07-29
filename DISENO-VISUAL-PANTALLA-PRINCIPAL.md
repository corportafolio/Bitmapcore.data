# Diseño Visual - Pantalla Principal BitmapCore Web

## 1. Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Background principal | `#080008` | Fondo general de toda la app |
| Surface / Tarjetas | `#191217` | Tarjetas, sidebar, burbujas |
| Orange Primary | `#FF6B35` | Botones principales, acentos, logo |
| Orange Light | `#FFA500` | Hover states, bordes activos |
| Street Black | `#000000` | Calles del Mondrian, líneas divisorias |
| Green Discount | `#00AA00` | Descuentos, badge de ahorro |
| Text Primary | `#FFFFFF` | Títulos, texto principal |
| Text Secondary | `#B0B0B0` | Descripciones, labels secundarios |
| Text Muted | `#666666` | Placeholder, texto deshabilitado |
| Border | `#2A2A2A` | Bordes de tarjetas, separadores |
| Purple Dark | `#1A0A2E` | Header bar alternativo |
| Red Alert | `#FF3333` | Errores, alertas, eliminar |

### Gradientes
- Header: `linear-gradient(135deg, #FF6B35, #FF8C5A)`
- Sidebar active: `linear-gradient(90deg, #FF6B35 0%, #FF6B35 3px, transparent 3px)`
- Card hover: `linear-gradient(135deg, #191217, #1E1520)`

---

## 2. Tipografía (Fuentes Android)

| Elemento | Font | Size | Weight | Color |
|----------|------|------|--------|-------|
| Logo "BitmapCore" | HowdybunFont | 24px | 800 | `#FF6B35` |
| H1 Page Title | AlfaslabFont | 28px | 700 | `#FFFFFF` |
| H2 Section | AlfaslabFont | 22px | 600 | `#FFFFFF` |
| H3 Card Title | AlfaslabFont | 18px | 600 | `#FFFFFF` |
| Body | AcmeFont | 14px | 400 | `#B0B0B0` |
| Caption | AcmeFont | 12px | 400 | `#666666` |
| Button (grande) | HoltwoodFont | 16px | 600 | `#FFFFFF` |
| Button (pequeño) | AlfaslabFont | 14px | 600 | `#FFFFFF` |
| Badge | AlfaslabFont | 11px | 700 | `#FFFFFF` |
| Price BTC | AcmeFont | 16px | 600 | `#FFA500` |
| Price USDT | AcmeFont | 13px | 400 | `#B0B0B0` |
| Labels estadísticas | AlfaslabFont | 13px | 400 | `#B0B0B0` |
| Menús | AlfaslabFont | 14px | 500 | `#FFFFFF` |

---

## 3. Layout Principal - ASCII Diagram

```
│  Logo  •  Bitmapcore            •  BTC/USDT $XX,XXX.XX  🔔    HEADER: [≡]   │
├──────────────┬──────────────────────────────────────────────────────────────┤
│  SIDEBAR     │≡ 👈️ aqui mi menu flotante      SIDERBAR DERECHO
│  IZQUIERDO   │OW┌─────────────────────┬─────────────────────────────┐      │
│              │UN│      1 casilla central.                           │      │
│              │BC│  burbuja de busqueda burbuja 1, al buscar un bitmap│     │
│              │💰│  o una etiqueta    se abre abajo una vista previa de│    │
│              │📑│  los resultados, pueden haber 4 vistas de resultados│    │
│              │🏷└─────────────────────┴─────────────────────────────┘      │
│  (permanente)│🛒┌──────────────────────────────────────────────────────┐   │
│              │  │  4 burbujas de resultados que son los resultados     │   │
│pantalla todos│  │  de la burbuja 1 de arriba                           │   │
│los marketplace│ │                                                      │   │
│ tabla 6      │  │                                                      │   │
│  → lis #1    │  └──────────────────────────────────────────────────────┘   │
│  → lis #2    │                                                             │
│  → lis #3    │  ┌─────────────────────┬─────────────────────────────┐      │
│  → ...       │  │                                                   │      │
│  → lis N     │  │  archivo pantalladetablas.kt burbuja 4            │      │
│              │  │                                                   │      │
│              │  │                                                   │      │
│              │  └─────────────────────┴─────────────────────────────┘      │
```

### Especificación del Layout

| Zona | Posición | Comportamiento |
|------|----------|----------------|
| HEADER | Arriba, ancho completo | Fijo, siempre visible |
| SIDEBAR IZQUIERDO | Izquierda, permanente | Nunca se oculta en desktop |
| CONTENIDO PRINCIPAL | Derecha, fluido | Scroll vertical |
| burbuja 1 (búsqueda) | Centro del contenido | Casilla de búsqueda central |
| 4 burbujas de resultados | Debajo de burbuja 1 | Solo aparecen cuando hay resultados |
| pantalladetablas.kt | Debajo de resultados | Botón/burbuja de acceso a tablas |

---

## 4. MarketplaceSelectorPage - ASCII Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Marketplace BitmapCore                            🔍  👤 Wallet │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ORDINALSWALLET                              [🟧 logo OW]   │   │
│  │ Listados: 245  |  Piso: 0.00085 BTC  |  Vendidos: 1,234   │   │
│  │ [img1] [img2] [img3] [img4] [img5]           [→]          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ UNISAT                                    [🟧 logo UNI]    │   │
│  │ Listados: 189  |  Piso: 0.00065 BTC  |  Vendidos: 876     │   │
│  │ [img1] [img2] [img3] [img4] [img5]           [→]          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ BITMAPCORE BACKEND                        [🟧 logo BC]    │   │
│  │ Listados: 56   |  Piso: 0.00045 BTC  |  Vendidos: 345     │   │
│  │ [img1] [img2] [img3] [img4] [img5]           [→]          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MEJORES DESCUENTOS              [🟧 OW] [🟧 UNI] [🟧 BC] │   │
│  │ [15%💰] [img] [#452310]  [20%💰] [img] [#321098]          │   │
│  │ [25%💰] [img] [#567890]  [30%💰] [img] [#123456]          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TODOS LOS MERCADOS UNIFICADOS     [🟧 OW] [🟧 UNI] [🟧 BC]│   │
│  │ [img] [img] [img] [img] [img] [img] [img] [img] [img]     │   │
│  │ [img] [img] [img] [img] [img] [img] [img] [img] [img]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ LISTADOS AGRUPADOS POR ETIQUETAS  [🟧 OW] [🟧 UNI] [🟧 BC]│   │
│  │                                                             │   │
│  │ punk    - 150 bloques  - Piso: 0.00050 BTC                 │   │
│  │ sub10k  -  80 bloques  - Piso: 0.00030 BTC                 │   │
│  │ sub100k - 200 bloques  - Piso: 0.00020 BTC                 │   │
│  │ first1  -  12 bloques  - Piso: 0.00500 BTC                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ VENTAS DE TODOS LOS MERCADOS    [🟧 OW] [🟧 UNI] [🟧 BC]  │   │
│  │ 1,250 vendidos hasta 26 julio 2026                         │   │
│  │ [img] [#block] [precio] [fecha] [mercado]                 │   │
│  │ [img] [#block] [precio] [fecha] [mercado]                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Componentes Visuales Detallados

### 5.1 Header

```
│  Logo  •  Bitmapcore            •  BTC/USDT $XX,XXX.XX  🔔    HEADER: [≡]   │

- Background: #080008 (negro puro)
- Logo "Bitmapcore": HowdybunFont, #FF6B35 naranja, 24px bold
- Precio: AcmeFont, placeholder "BTC/USDT $XX,XXX.XX", actualización cada 30s
- Notification bell: badge rojo con número (si >0)
- Hamburger [≡]: abre/cierra sidebar en mobile
- Border bottom: 1px solid #2A2A2A
- Altura: 60px fijo
```

### 5.2 Sidebar Izquierdo (Permanente)

```
┌──────────────────────┐
│                      │
│  pantalla todos      │
│  los marketplace     │
│  tabla 6             │
│                      │
│  → lis #1            │  ← OrdinalsWallet
│  → lis #2            │  ← Unisat
│  → lis #3            │  ← BitmapCore
│  → ...               │
│  → lis N             │  ← Ventas
│                      │
└──────────────────────┘

- Background: #191217
- SIEMPRE visible en desktop (permanente)
- En mobile: se oculta con hamburger [≡]
- Item height: 48px
- Active item: left border 3px #FF6B35, background #1E1520
- Hover: background #1E1520
- Text: AlfaslabFont 14px, #B0B0B0
- Active text: #FF6B35
- Border right: 1px solid #2A2A2A
- NO tiene búsqueda, configuración, ayuda ni otros elementos
- SOLO lista de marketplaces
```

### 5.3 Marketplace Bubble (Card)

```
┌─────────────────────────────────────────────────────────────┐
│  ORDINALSWALLET                              [🟧 logo]     │
│  ─────────────────────────────────────────────────────────  │
│  Listados: 245     Piso: 0.00085 BTC     Vendidos: 1,234  │
│  ─────────────────────────────────────────────────────────  │
│  [img1] [img2] [img3] [img4] [img5]           [→ Ver más] │
└─────────────────────────────────────────────────────────────┘

- Background: #191217
- Border: 1px solid #2A2A2A
- Border-radius: 12px
- Padding: 16px
- Title: AlfaslabFont 18px, weight 600, color #FFFFFF
- Stats: AlfaslabFont 13px, color #B0B0B0
- BTC Price: AcmeFont 14px, color #FFA500
- Images: 80x80px, border-radius 8px, object-fit cover
- Arrow button: #FF6B35 background, white arrow, rounded-full
- Hover: border-color #FF6B35, transform translateY(-2px)
- Transition: all 0.2s ease
```

### 5.4 Search Bar

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 [Buscar por número de bloque, hash, o etiqueta...]     │
└─────────────────────────────────────────────────────────────┘

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Grid │ │ List │ │ Gal. │ │Comp. │  ← 4 view options
└──────┘ └──────┘ └──────┘ └──────┘

- Search input: #191217 background, #2A2A2A border
- Border-radius: 8px
- Height: 44px
- Placeholder: #666666
- Focus border: #FF6B35
- View buttons: toggle group, active = #FF6B35, inactive = #191217
```

### 5.5 Discount Badge

```
┌─────────┐
│  25%OFF │  ← Badge de descuento
└─────────┘

- Background: #00AA00
- Color: #FFFFFF
- Font: AlfaslabFont 11px, weight 700
- Padding: 4px 8px
- Border-radius: 4px
- Position: absolute, top-right of card
```

### 5.6 Mondrian Preview

```
┌──────────────────────────────────────────────────┐
│  BITCOIN MONDRIAN                                │
│  ┌────────────────────┐  Bloque: #950,000        │
│  │  ██████  ░░░░░░░░  │  Transacciones: 2,500   │
│  │  ██████  ░░░░░░░░  │  Tamaño: 1.2 MB         │
│  │  ░░░░░░  ██████░░  │  Fee: 0.00025 BTC       │
│  │  ░░░░░░  ██████░░  │  Fecha: 26 jul 2026     │
│  │  ██████  ░░░░░░░░  │                          │
│  │  ██████  ░░░░░░░░  │  [→ Ver detalle]        │
│  └────────────────────┘                          │
└──────────────────────────────────────────────────┘

- Canvas: 320x320px (responsive: 100% width, aspect-ratio 1:1)
- Background: #000000 (calles)
- Blocks: #FFA500 (naranja bitmap)
- Border-radius: 8px
- Shadow: 0 4px 6px rgba(0,0,0,0.3)
```

### 5.7 Block Card (Grid View)

```
┌─────────────┐
│  ██████████  │  ← Mondrian thumbnail
│  ██████████  │
│  ░░░░████░░  │
│  ░░░░████░░  │
│  ██████████  │
│─────────────│
│ Bloque 950K │
│ 2,500 tx    │
│ 0.00025 BTC │
└─────────────┘

- Width: 200px (grid), 100% (list)
- Background: #191217
- Border: 1px solid #2A2A2A
- Border-radius: 8px
- Image: 100% width, aspect-ratio 1:1
- Text: AcmeFont 12px, #B0B0B0
- Price: AcmeFont 13px, #FFA500
```

---

## 6. Estados de UI

### 6.1 Loading State
```
┌─────────────────────────────────────┐
│  ╭─────────────────────────────╮    │
│  │  ⏳ Cargando bloques...     │    │
│  │  ████████████░░░░░░ 60%     │    │
│  ╰─────────────────────────────╯    │
└─────────────────────────────────────┘
- Spinner: #FF6B35, border 3px, size 40px
- Progress bar: #FF6B35 fill, #191217 background
- Text: AcmeFont 14px, #B0B0B0
```

### 6.2 Error State
```
┌─────────────────────────────────────┐
│  ╭─────────────────────────────╮    │
│  │  ❌ Error de conexión       │    │
│  │  No se pudo conectar al    │    │
│  │  servidor. Intentar de     │    │
│  │  nuevo.                    │    │
│  │  [🔄 Reintentar]           │    │
│  ╰─────────────────────────────╯    │
└─────────────────────────────────────┘
- Icon: 48px, #FF3333
- Title: AlfaslabFont 18px, #FFFFFF
- Message: AcmeFont 14px, #B0B0B0
- Button: #FF3333 background, white text
```

### 6.3 Empty State
```
┌─────────────────────────────────────┐
│  ╭─────────────────────────────╮    │
│  │  📭 No hay bloques listados │    │
│  │  Sé el primero en listar   │    │
│  │  un bloque.                │    │
│  │  [📝 Listar bloque]        │    │
│  ╰─────────────────────────────╯    │
└─────────────────────────────────────┘
- Icon: 64px, #666666
- Title: AlfaslabFont 18px, #FFFFFF
- Message: AcmeFont 14px, #B0B0B0
- Button: #FF6B35 background, white text
```

---

## 7. Comportamiento de Navegación

### 7.1 Flujo Principal
```
[App Load]
    ↓
[HomePage] ← Ruta: /
    ├── [SearchBar] → [SearchResults]
    ├── [MondrianPreview] → [BlockDetailPage]
    ├── [MarketplaceSelectorButton] → [MarketplaceSelectorPage]
    │       ├── [OrdinalswalletBubble] → [OrdinalswalletPage]
    │       ├── [UnisatBubble] → [UnisatPage]
    │       ├── [BitmapCoreBubble] → [LocalPage]
    │       ├── [DescuentosBubble] → [DescuentosPage]
    │       ├── [UnifiedBubble] → [UnifiedPage]
    │       ├── [TagsBubble] → [TagsPage]
    │       └── [VentasBubble] → [VentasPage]
    ├── [PantallaDeTablasButton] → [BlockSearchPage]
    └── [RecentBlocks] → [BlockDetailPage]
```

### 7.2 Sidebar ↔ MarketplaceSelector Transitions
```
[HomePage con Sidebar visible]
    ↓ Click "Marketplace Selector"
[Sidebar se oculta] → [MarketplaceSelectorPage full width]
    ↓ Click "← Volver"
[Sidebar reaparece] → [HomePage]
```

### 7.3 Transiciones de Página
- **Duration**: 200ms
- **Easing**: `ease-in-out`
- **Animation**: Fade + slide-right (entrance), fade + slide-left (exit)
- **Loading**: Skeleton screen durante carga de datos

### 7.4 Comportamiento de la Casilla de Búsqueda (Burbuja 1)

La casilla de búsqueda es el elemento central del contenido principal. Funciona así:

```
┌─────────────────────────────────────────────────┐
│  🔍 [Buscar bloque o etiqueta...]               │  ← Burbuja 1
└─────────────────────────────────────────────────┘

        ↓ Usuario escribe "950"

┌─────────────────────────────────────────────────┐
│  🔍 [950_]                                      │  ← Búsqueda en tiempo real
└─────────────────────────────────────────────────┘

        ↓ Resultados aparecen en CUADRÍCULA HORIZONTAL

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Resultado 1 │ │  Resultado 2 │ │  Resultado 3 │ │  Resultado 4 │
│  (bloque o   │ │  (bloque o   │ │  (bloque o   │ │  (bloque o   │
│   etiqueta)  │ │   etiqueta)  │ │   etiqueta)  │ │   etiqueta)  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Reglas de comportamiento:**

1. **Usuario escribe** → búsqueda se ejecuta en tiempo real contra la base de datos
2. **Mientras escribe** → resultados se van mostrando progresivamente
3. **Si el usuario NO busca nada** → NO aparecen las burbujas de resultados
4. **Las 4 burbujas de resultados SOLO aparecen** → cuando hay algo que mostrar
5. **Las burbujas se van poniendo** → a medida que se busca algo
6. **Las 4 burbujas están en CUADRÍCULA HORIZONTAL** → una al lado de la otra
7. **Al limpiar la búsqueda** → las burbujas de resultados desaparecen

### 7.5 Comportamiento al Hacer Clic en un Resultado

Cuando el usuario hace clic en una de las 4 burbujas de resultados:

| Tipo de búsqueda | Pantalla que se muestra | Ruta web |
|-----------------|------------------------|----------|
| Número de bloque | `pantalladebloqueespecificoscreen.kt` | `/blocks/:id` |
| Etiqueta | `tagtablescreen.kt` | `/tags/:tagName` |

**Flujo de navegación:**
```
[HomePage con Sidebar visible]
    ↓ Usuario hace clic en un resultado
[Sidebar se oculta] → [Pantalla completa sin sidebar]
    ├── Si es bloque → pantalladebloqueespecificoscreen.kt
    └── Si es etiqueta → tagtablescreen.kt
    ↓ Usuario hace clic en "← Volver"
[Regresa] → Sidebar reaparece, vuelve a HomePage
```

**Comportamiento al cambiar de pantalla:**
- El sidebar IZQUIERDO se **OCULTA** completamente
- La pantalla de resultado ocupa **TODO EL ANCHO**
- Aparece un botón "← Volver" en el header
- Al hacer clic en "← Volver", se regresa al HomePage con sidebar visible

**Flujo visual completo:**
```
[Sin búsqueda] → Solo se ve burbuja 1 (casilla vacía)
    ↓ Usuario escribe
[Buscando...] → burbuja 1 muestra texto + loading
    ↓ Resultados encontrados
[Resultados] → burbuja 1 + 4 burbujas en CUADRÍCULA HORIZONTAL abajo
    ↓ Usuario hace clic en un resultado
[Pantalla cambia] → Se oculta sidebar, aparece pantalla completa:
    - Si es bloque → pantalladebloqueespecificoscreen.kt
    - Si es etiqueta → tagtablescreen.kt
    ↓ Usuario hace clic en "← Volver"
[Regresa] → Sidebar reaparece, vuelve a HomePage
```

---

## 8. Responsive Design

### Desktop (>1024px)
- Sidebar: 280px fijo
- Content: fluid
- Grid: 3-4 columnas

### Tablet (768px - 1024px)
- Sidebar: colapsable (hamburger toggle)
- Content: full width
- Grid: 2 columnas

### Mobile (<768px)
- Sidebar: oculto (drawer overlay)
- Header: simplified (solo logo + wallet)
- Content: full width
- Grid: 1 columna
- Marketplace bubbles: full width cards

---

## 9. Iconos e Imágenes

| Elemento | Fuente | Tamaño | Color |
|----------|--------|--------|-------|
| Logo BitmapCore | SVG custom | 120x40px | `#FF6B35` |
| Hamburger ☰ | Lucide Icons | 24x24px | `#FFFFFF` |
| Search 🔍 | Lucide Icons | 20x20px | `#666666` |
| Bell 🔔 | Lucide Icons | 24x24px | `#FFFFFF` |
| Arrow → | Lucide Icons | 20x20px | `#FF6B35` |
| Close ✕ | Lucide Icons | 20x20px | `#FFFFFF` |
| Loading ⏳ | CSS Spinner | 40x40px | `#FF6B35` |
| Error ❌ | Lucide Icons | 48x48px | `#FF3333` |
| Empty 📭 | Lucide Icons | 64x64px | `#666666` |
| OrdinalsWallet logo | PNG/SVG | 48x48px | Original |
| Unisat logo | PNG/SVG | 48x48px | Original |
| BitmapCore logo | PNG/SVG | 48x48px | `#FF6B35` |

---

## 10. Animaciones

| Elemento | Animación | Duración | Easing |
|----------|-----------|----------|--------|
| Card hover | translateY(-2px) + shadow | 200ms | ease-out |
| Sidebar item | background fade | 150ms | ease-in-out |
| Page transition | fade + slide | 200ms | ease-in-out |
| Button press | scale(0.98) | 100ms | ease-in |
| Loading spinner | rotate 360deg | 1s | linear |
| Notification badge | bounce | 300ms | ease-out |
| Modal backdrop | opacity 0→1 | 200ms | ease-out |
| Modal content | scale(0.95→1) + opacity | 200ms | ease-out |
