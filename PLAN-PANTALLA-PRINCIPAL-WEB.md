# Plan de Implementación - Pantalla Principal BitmapCore Web

## 1. Estructura de 17 Archivos (Inscripción Bitcoin)

Cada archivo es una inscripción separada. Total estimado: ~500KB.
**Sin comentarios ni documentación en el código inscrito.** Solo código indispensable.

| # | Archivo | Responsabilidad | Contenido | Size est. |
|---|---------|----------------|-----------|:---------:|
| 1 | `index.html` | Shell + CSS | HTML5, Tailwind embebido, meta SEO, loading | 60 KB |
| 2 | `core.js` | Framework | React 18, ReactDOM, React Router 6, setup | 50 KB |
| 3 | `components.js` | UI atoms | Header, LoadingSpinner, NotificationBell, Modal, Toast, ErrorBoundary | 35 KB |
| 4 | `marketplace-components.js` | UI molecules | MarketplaceBubble, MarketPreview, FloorPrice, SaleCard, TagGroup, DiscountBadge | 30 KB |
| 5 | `image-components.js` | UI imágenes | MondrianCanvas, BlockThumbnail, ImageGallery, ImageLoader | 25 KB |
| 6 | `pages-home.js` | Home | HomePage, MarketplaceSelectorPage | 35 KB |
| 7 | `pages-marketplaces.js` | Marketplaces externos | OrdinalswalletPage, UnisatPage | 45 KB |
| 8 | `pages-local.js` | Local + Descuentos | LocalPage, DescuentosPage | 25 KB |
| 9 | `pages-unified.js` | Unified + Tags + Ventas | UnifiedPage, TagTablesPage, TagGroupsPage, VentasPage | 30 KB |
| 10 | `pages-wallet.js` | Wallet | WalletConnectPage, WalletDashboardPage, MisActivosPage, TransactionPage, PSBTPage | 35 KB |
| 11 | `pages-block.js` | Bloques | BlockDetailPage, MondrianPreviewPage, BlockSearchPage, TagTablePage | 30 KB |
| 12 | `stores-marketplaces.js` | Estado mercados | marketplaceStore, unifiedStore, tagsStore, salesStore | 30 KB |
| 13 | `stores-app.js` | Estado aplicación | walletStore, blockStore, authStore, notificationStore, pollingStore | 35 KB |
| 14 | `api.js` | Comunicación | Axios client, proxy routes, wallet API, blockchain API, PSBT builder | 30 KB |
| 15 | `i18n.js` | Traducciones | ES/EN (371 keys), i18next config | 20 KB |
| 16 | `utils.js` | Utilidades core | Bitcoin helpers, config constants, formatters, validators | 20 KB |
| 17 | `utils-advanced.js` | Utilidades avanzadas | Mondrian Canvas generator, tag classifier, image processor, polling logic | 25 KB |
| | **TOTAL** | | | **~500 KB** |

> **Archivos eliminados (ahorro ~55KB):**
> - `pages-admin.js` — AdminDashboardPage, SettingsPage, WhitepaperPage (no indispensables)
> - `pages-unisat.js` — Fusionado con pages-ordinalswallet.js → pages-marketplaces.js

### Costo de Inscripción Bitcoin

| Escenario | Fee rate | Costo total |
|-----------|----------|:-----------:|
| Low (sin prisa) | 10 sat/vB | ~$15 |
| Normal | 20 sat/vB | ~$31 |
| High (congestionado) | 50 sat/vB | ~$78 |

---

## Arquitectura de Puertos del VPS

| Puerto | Servicio | Tablas |
|--------|----------|--------|
| **3000** | Local Marketplace **(EXISTENTE)** | Tabla 5 (BitMapCoreDatabase) — listings, transacciones, wallets. **NO SE TOCA** |
| **5500** | Bases de Datos + APIs Externas | Tablas 1,2,3,6,7,8,11,14,15 + proxy a Ordinalswallet/Unisat + pantallas de marketplaces externos |

### Flujo de datos:
```
Web → Puerto 5500 → Ordinalswallet API / Unisat API / ordinals.com (proxy)
Web → Puerto 3000 → Local Marketplace (ya existente)
```

### Bases de datos en Puerto 5500:

| Tabla | Base de datos | Descripción | Propósito |
|-------|---------------|-------------|-----------|
| 1 | `bitmapcorp_database.db` | Principal — 955K bloques | Store de bloques bitmap |
| 2 | `OrdinalswalletDatabase` | Listados Ordinalswallet | Cache de listados Ordinalswallet vía proxy |
| 3 | `UnisatDatabase` | Listados Unisat | Cache de listados Unisat vía API key |
| 6 | `UnifiedListingsDatabase` | Listados unificados | Unificación de listados de todos los mercados |
| 7 | `SoldListingsDatabase` | Ventas históricas | Historial de ventas de todos los mercados |
| 8 | `EtiquetasPorPrecioDatabase` | Etiquetas agrupadas | Agrupación de bloques por etiqueta y precio |
| 11 | `DescuentosDatabase` | Descuentos | Mejores descuentos de todos los mercados |
| 14 | `SelectorScreenDatabase` | Selector de marketplaces | Datos para el selector de 7 burbujas |
| 15 | `MisActivosDatabase` | Mis Activos | Cache de inscripciones del usuario de su wallet conectada |

> **Tabla 5 NO va aquí** — Tabla 5 está en puerto 3000 (Local Marketplace existente).

---

## 1.1 Fase 0: Proxy Routes en el Servidor (ANTES del frontend)

La web **NO puede** acceder directamente a APIs externas (Ordinalswallet, Unisat) por restricciones CORS del navegador. El VPS debe hacer de intermediario.

**El proxy es PARA las pantallas OrdinalswalletPage y UnisatPage, NO para el LocalPage.**

### Flujo de datos:
```
Web (browser) → Nuestro servidor (bitmapcore.net:5500) → Ordinalswallet API / Unisat API
                                        ← datos de vuelta ←
```

> **IMPORTANTE:** El proxy routes va en el **puerto 5500**, NO en el 3000. El puerto 3000 es solo para el Local Marketplace existente.

### Proxy Routes a crear en el servidor:

| Método | Endpoint | Descripción | API Externa |
|--------|----------|-------------|-------------|
| GET | `/api/v1/proxy/ordinalswallet/listings` | Listados Ordinalswallet | `turbo.ordinalswallet.com/collection/bitmap/escrows` |
| GET | `/api/v1/proxy/ordinalswallet/sold` | Vendidos Ordinalswallet | `turbo.ordinalswallet.com/collection/bitmap/sold-escrows` |
| GET | `/api/v1/proxy/ordinalswallet/stats` | Estadísticas Ordinalswallet | `turbo.ordinalswallet.com/collection/bitmap/stats` |
| POST | `/api/v1/proxy/unisat/actions` | Listados Unisat | `open-api.unisat.io/v3/market/collection/auction/actions` |
| GET | `/api/v1/proxy/unisat/listings` | Listados Unisat | `open-api.unisat.io/v3/market/collection/auction/listings` |

### Código del servidor (`marketplaceProxyRoutes.ts`):

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { sendSuccess, sendError } from '../utils/responseFormatter';

const router = Router();

// ── PROXY ORDINALSWALLET ──
router.get('/ordinalswallet/listings', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://turbo.ordinalswallet.com/collection/bitmap/escrows',
      { params: { limit: 10000 }, timeout: 15000 }
    );
    sendSuccess(res, response.data);
  } catch (error) {
    sendError(res, 'Failed to fetch Ordinalswallet listings');
  }
});

router.get('/ordinalswallet/sold', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://turbo.ordinalswallet.com/collection/bitmap/sold-escrows',
      { params: { limit: 10000 }, timeout: 15000 }
    );
    sendSuccess(res, response.data);
  } catch (error) {
    sendError(res, 'Failed to fetch Ordinalswallet sold');
  }
});

router.get('/ordinalswallet/stats', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://turbo.ordinalswallet.com/collection/bitmap/stats',
      { timeout: 10000 }
    );
    sendSuccess(res, response.data);
  } catch (error) {
    sendError(res, 'Failed to fetch Ordinalswallet stats');
  }
});

// ── PROXY UNISAT ──
router.post('/unisat/actions', async (req: Request, res: Response) => {
  try {
    const { events, cursor, size } = req.body;
    const response = await axios.post(
      'https://open-api.unisat.io/v3/market/collection/auction/actions',
      { collection: 'bitmap', events, cursor: cursor || 0, size: size || 100 },
      { 
        headers: { 'Authorization': `Bearer ${process.env.UNISAT_API_KEY}` },
        timeout: 15000 
      }
    );
    sendSuccess(res, response.data);
  } catch (error) {
    sendError(res, 'Failed to fetch Unisat actions');
  }
});

router.get('/unisat/listings', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://open-api.unisat.io/v3/market/collection/auction/listings',
      { 
        params: { collection: 'bitmap', cursor: 0, size: 100 },
        headers: { 'Authorization': `Bearer ${process.env.UNISAT_API_KEY}` },
        timeout: 15000 
      }
    );
    sendSuccess(res, response.data);
  } catch (error) {
    sendError(res, 'Failed to fetch Unisat listings');
  }
});

export default router;
```

### Registrar proxy routes (`apiRoutes.ts`):

```typescript
import marketplaceProxyRouter from './marketplaceProxyRouter';

// Agregar:
router.use('/proxy', marketplaceProxyRouter);
```

### Checklist Fase 0:
- [ ] Crear `src/routes/marketplaceProxyRoutes.ts` en puerto 5500
- [ ] Registrar en `src/routes/apiRoutes.ts`
- [ ] Configurar variable de entorno `UNISAT_API_KEY`
- [ ] Configurar CORS para permitir `https://bitmapcore.net`
- [ ] Probar proxy endpoints en puerto 5500:
  - [ ] `https://bitmapcore.net:5500/api/v1/proxy/ordinalswallet/listings`
  - [ ] `https://bitmapcore.net:5500/api/v1/proxy/ordinalswallet/sold`
  - [ ] `https://bitmapcore.net:5500/api/v1/proxy/ordinalswallet/stats`
  - [ ] `https://bitmapcore.net:5500/api/v1/proxy/unisat/actions`
  - [ ] `https://bitmapcore.net:5500/api/v1/proxy/unisat/listings`
- [ ] Verificar que Puerto 3000 no se ve afectado (Local Marketplace intacto)

---

## 2. Estructura de Directorios del Proyecto React

```
bitmapcore-web/
├── index.html                    ← Archivo #1
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── public/
│   ├── favicon.ico
│   └── logos/
│       ├── bitmapcore-logo.svg
│       ├── ordinalswallet-logo.png
│       └── unisat-logo.png
└── src/
    ├── main.tsx                  ← Se compila a core.js (#2)
    ├── App.tsx
    ├── routes.tsx
    ├── components/
    │   ├── Header.tsx            ┐
    │   ├── Sidebar.tsx           │ → Se compila a components.js (#3)
    │   ├── LoadingSpinner.tsx    │
    │   ├── NotificationBell.tsx  │
    │   ├── Modal.tsx             │
    │   ├── Toast.tsx             │
    │   └── ErrorBoundary.tsx     ┘
    ├── components/marketplace/
    │   ├── MarketplaceBubble.tsx      ┐
    │   ├── MarketPreview.tsx          │ → Se compila a marketplace-components.js (#4)
    │   ├── FloorPrice.tsx             │
    │   ├── SaleCard.tsx               │
    │   ├── TagGroup.tsx               │
    │   └── DiscountBadge.tsx          ┘
    ├── components/images/
    │   ├── MondrianCanvas.tsx     ┐
    │   ├── BlockThumbnail.tsx     │ → Se compila a image-components.js (#5)
    │   ├── ImageGallery.tsx       │
    │   └── ImageLoader.tsx        ┘
    ├── pages/
    │   ├── HomePage.tsx               ┐
    │   ├── MarketplaceSelectorPage.tsx │ → Se compila a pages-home.js (#6)
    │   ├── OrdinalswalletPage.tsx      ┐
    │   ├── UnisatPage.tsx              │ → Se compila a pages-marketplaces.js (#7)
    │   ├── LocalPage.tsx               ┐
    │   ├── DescuentosPage.tsx          │ → Se compila a pages-local.js (#8)
    │   ├── UnifiedPage.tsx             ┐
    │   ├── TagTablesPage.tsx           │
    │   ├── TagGroupsPage.tsx           │ → Se compila a pages-unified.js (#9)
    │   ├── VentasPage.tsx              ┘
    │   ├── WalletConnectPage.tsx       ┐
    │   ├── WalletDashboardPage.tsx     │
    │   ├── MisActivosPage.tsx          │ → Se compila a pages-wallet.js (#10)
    │   ├── TransactionPage.tsx         │
    │   ├── PSBTPage.tsx                ┘
    │   ├── BlockDetailPage.tsx         ┐
    │   ├── BlockSearchPage.tsx         │
    │   ├── MondrianPreviewPage.tsx     │ → Se compila a pages-block.js (#11)
    │   └── TagTablePage.tsx            ┘
    ├── stores/
    │   ├── marketplaceStore.ts     ┐
    │   ├── unifiedStore.ts         │
    │   ├── tagsStore.ts            │ → Se compila a stores-marketplaces.js (#12)
    │   ├── salesStore.ts           ┘
    │   ├── walletStore.ts          ┐
    │   ├── blockStore.ts           │
    │   ├── authStore.ts            │ → Se compila a stores-app.js (#13)
    │   ├── notificationStore.ts    │
    │   └── pollingStore.ts         ┘
    ├── api/
    │   ├── axiosClient.ts          ┐
    │   ├── proxyRoutes.ts          │
    │   ├── walletApi.ts            │ → Se compila a api.js (#14)
    │   ├── blockchainApi.ts        │
    │   └── psbtBuilder.ts          ┘
    ├── i18n/
    │   ├── es.ts                   ┐
    │   ├── en.ts                   │ → Se compila a i18n.js (#15)
    │   ├── i18n.ts                 │
    │   └── useTranslation.ts       ┘
    ├── utils/
    │   ├── bitcoin.ts              ┐
    │   ├── constants.ts            │ → Se compila a utils.js (#16)
    │   ├── formatters.ts           │
    │   └── validators.ts           ┘
    ├── utils/
    │   ├── mondrianGenerator.ts    ┐
    │   ├── tagClassifier.ts        │ → Se compila a utils-advanced.js (#17)
    │   ├── imageProcessor.ts       │
    │   └── pollingLogic.ts         ┘
    ├── types/
    │   ├── wallet.ts
    │   ├── marketplace.ts
    │   ├── bitmap.ts
    │   └── image.ts
    └── hooks/
        ├── usePolling.ts
        ├── useWallet.ts
        ├── useBitmapImage.ts
        ├── useMarketplaceData.ts
        └── useTranslation.ts
```

---

## 3. Fases de Implementación

### Fase 1: Setup del Proyecto (core.js + index.html)

**Objetivo:** Proyecto React funcional con Vite + Tailwind.

**Archivos a crear:**
- `vite.config.ts` — Configuración Vite con React plugin
- `tailwind.config.js` — Colores personalizados BitmapCore
- `tsconfig.json` — TypeScript config
- `postcss.config.js` — PostCSS con Tailwind
- `package.json` — Dependencias
- `src/main.tsx` — Entry point React
- `src/App.tsx` — Router setup
- `src/routes.tsx` — Definición de rutas

**Configuración Tailwind (colores BitmapCore):**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bitmap-black': '#080008',
        'bitmap-surface': '#191217',
        'bitmap-orange': '#FF6B35',
        'bitmap-orange-light': '#FFA500',
        'bitmap-green': '#00AA00',
        'bitmap-red': '#FF3333',
        'bitmap-border': '#2A2A2A',
        'bitmap-text': '#B0B0B0',
        'bitmap-muted': '#666666',
      },
      fontFamily: {
        'howdybun': ['HowdybunFont', 'sans-serif'],
        'alfaslab': ['AlfaslabFont', 'sans-serif'],
        'holtwood': ['HoltwoodFont', 'serif'],
        'acme': ['AcmeFont', 'sans-serif'],
      },
    },
  },
}
```

**Puntos de verificación:**
- [ ] `npm run dev` funciona en `localhost:5173`
- [ ] Tailwind aplica colores correctamente
- [ ] React Router navega entre rutas vacías

**Rutas de Navegación (React Router v6):**
```typescript
// src/routes.tsx
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/marketplace', element: <MarketplaceSelectorPage /> },
  { path: '/ordinalswallet', element: <OrdinalswalletPage /> },
  { path: '/unisat', element: <UnisatPage /> },
  { path: '/local', element: <LocalPage /> },
  { path: '/discounts', element: <DescuentosPage /> },
  { path: '/unified', element: <UnifiedPage /> },
  { path: '/tag-tables', element: <TagTablesPage /> },
  { path: '/tag-tables/:tagName', element: <TagGroupsPage /> },
  { path: '/sales', element: <VentasPage /> },
  { path: '/blocks/:id', element: <BlockDetailPage /> },
  { path: '/tags/:tagName', element: <TagTablePage /> },
  { path: '/wallet', element: <WalletConnectPage /> },
  { path: '/wallet/dashboard', element: <WalletDashboardPage /> },
  { path: '/mis-activos', element: <MisActivosPage /> },
  { path: '/wallet/transaction/:id', element: <TransactionPage /> },
];
```

---

### Fase 2: Layout Principal (components.js + pages-home.js)

**Objetivo:** Header + Sidebar + Content layout funcional.

**Componentes a crear:**

#### 2.1 Header (`components.js`)
```typescript
// src/components/Header.tsx
interface HeaderProps {
  onMenuToggle: () => void;
  btcPrice: number;
  usdtPrice: number;
  notificationCount: number;
}
```

**Funcionalidades:**
- Logo "Bitmapcore" con HowdybunFont y color `#FF6B35`
- Precio BTC/USDT: placeholder "BTC/USDT $XX,XXX.XX", actualización cada 30s
- Botón notificaciones con badge
- Hamburger [≡] para mobile
- NO tiene botón de wallet en el header

#### 2.2 Sidebar (`components.js`)
```typescript
// src/components/Sidebar.tsx
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMarketplace: string;
  marketplaces: Marketplace[];
  onMarketplaceSelect: (id: string) => void;
}
```

**Funcionalidades:**
- Lista de 7 marketplaces (Ordinalswallet, Unisat, BitmapCore, Descuentos, Unified, Tags, Ventas)
- SIEMPRE visible en desktop (permanente)
- En mobile: se oculta con hamburger [≡]
- Active state con borde naranja izquierdo
- NO tiene búsqueda, configuración, ayuda ni otros elementos
- SOLO lista de marketplaces

#### 2.3 HomePage (`pages-home.js`)
```typescript
// src/pages/HomePage.tsx
interface HomePageProps {}
```

**Layout:**
```
[Header] ← Logo "Bitmapcore" + BTC/USDT $XX,XXX.XX + 🔔 + [≡]
[Sidebar | Content]
  Sidebar: SOLO lista de 7 marketplaces (permanente)
  Content:
    [Burbuja 1: Casilla de búsqueda central]
    [4 burbujas de resultados en CUADRÍCULA HORIZONTAL - SOLO cuando hay búsqueda]
    [MarketplaceSelectorButton] → accede a marketplace-selectorscreen.kt
    [PantallaDeTablasButton] → accede a pantalladetablas.kt
```

**Puntos de verificación:**
- [ ] Header muestra precio BTC/USDT actualizado
- [ ] Sidebar lista los 7 marketplaces
- [ ] Sidebar colapsa en mobile
- [ ] Navegación entre marketplaces funciona
- [ ] Transiciones son smooth (200ms)

---

### Fase 3: MarketplaceSelectorPage + 7 Pantallas Independientes

**Objetivo:** Las 7 burbujas de mercado con datos reales + cada burbuja tiene su propia pantalla COMPLETA e INDEPENDIENTE.

**Navegación general:**
```
[MarketplaceSelectorPage] (7 burbujas)
    ↓ Click en burbuja "Ordinalswallet"
[OrdinalswalletPage full screen] ← Botón "← Volver"
    ↓ Click "← Volver"
[MarketplaceSelectorPage] (regresa)
```

### Las 7 pantallas independientes:

| # | Burbuja | Pantalla Android | Ruta Web | Componente | Fuente de datos |
|---|---------|------------------|----------|------------|-----------------|
| 1 | Ordinalswallet | `OrdinalswalletMarketplaceScreen.kt` | `/ordinalswallet` | `OrdinalswalletPage` | Puerto 5500 (proxy) |
| 2 | Unisat | `UnisatMarketplaceScreen.kt` | `/unisat` | `UnisatPage` | Puerto 5500 (proxy) |
| 3 | BitmapCore | `LocalBitmapCoreMarketplaceScreen.kt` | `/local` | `LocalPage` | Puerto 3000 (local) |
| 4 | Descuentos | `PantallaDescuentosScreen.kt` | `/discounts` | `DescuentosPage` | Puerto 5500 (tabla 11) |
| 5 | Unified | `UnifiedMarketplaceScreen.kt` | `/unified` | `UnifiedPage` | Puerto 5500 (tabla 6) |
| 6 | Etiquetas | `TablasDeEtiquetasPorPrecioMasBajoScreen.kt` | `/tag-tables` | `TagTablesPage` | Puerto 5500 (tabla 8) |
| 7 | Ventas | `VentasTodosLosMarketplacesScreen.kt` | `/sales` | `VentasPage` | Puerto 5500 (tabla 7) |

> **Cada pantalla muestra SOLO sus propios listados.** OrdinalswalletPage solo muestra listados Ordinalswallet. UnisatPage solo muestra listados Unisat. LocalPage solo muestra listados del marketplace local propio.

### Tabla 8 - Excepción: 2 pantallas

La Tabla 8 es la **ÚNICA** tabla que tiene 2 pantallas:

| Pantalla | Descripción | Ruta Web |
|----------|-------------|----------|
| `TablasDeEtiquetasPorPrecioMasBajoScreen.kt` | Lista de etiquetas agrupadas por precio más bajo | `/tag-tables` |
| `SepararEtiquetasEnGruposPorPreciosScreen.kt` | Detalle de una etiqueta específica con sus grupos de precios | `/tag-tables/:tagName` |

**Navegación de Tabla 8:**
```
[MarketplaceSelectorPage]
    ↓ Click en burbuja "Etiquetas"
[TablasDeEtiquetasPorPrecioMasBajoScreen] ← Lista de etiquetas agrupadas
    ↓ Click en una etiqueta (ej: "punk")
[SepararEtiquetasEnGruposPorPreciosScreen] ← Detalle de la etiqueta
    ↓ Click "← Volver"
[TablasDeEtiquetasPorPrecioMasBajoScreen]
    ↓ Click "← Volver"
[MarketplaceSelectorPage]
```

### Componentes a crear:

#### 3.1 MarketplaceSelectorPage (`pages-home.js`)
```typescript
// src/pages/MarketplaceSelectorPage.tsx
interface MarketplaceSelectorPageProps {
  onOrdinalswalletClick: () => void;
  onUnisatClick: () => void;
  onBitmapCoreClick: () => void;
  onDescuentosClick: () => void;
  onUnifiedClick: () => void;
  onEtiquetasClick: () => void;
  onVentasClick: () => void;
}
```

**Layout:**
```
[Header: ← Marketplace BitmapCore + WalletStatus]
[7 Burbujas en columna vertical con scroll]
  → OrdinalswalletBubble (Listados, Piso, imágenes)
  → UnisatBubble (Listados, Piso, imágenes)
  → BitmapCoreBubble (Listados, Piso, imágenes)
  → DescuentosBubble (Descuentos, imágenes con % off)
  → UnifiedBubble (Todos los mercados combinados)
  → EtiquetasBubble (Etiquetas agrupadas por precio)
  → VentasBubble (Total vendidos, fecha)
```

#### 3.2 OrdinalswalletPage (`pages-marketplaces.js`)
```typescript
// src/pages/OrdinalswalletPage.tsx
// Pantalla completa e independiente
// Muestra: listados Ordinalswallet con escrows
// API: GET https://bitmapcore.net:5500/api/v1/proxy/ordinalswallet/listings
// Incluye: barra de búsqueda, ordenamiento, imágenes de bloques
// Fuente de datos: Puerto 5500 (proxy a Ordinalswallet API)
```

#### 3.3 UnisatPage (`pages-marketplaces.js`)
```typescript
// src/pages/UnisatPage.tsx
// Pantalla completa e independiente
// Muestra: listados Unisat con subastas
// API: POST https://bitmapcore.net:5500/api/v1/proxy/unisat/actions
// Incluye: barra de búsqueda, ordenamiento, imágenes de bloques
// Fuente de datos: Puerto 5500 (proxy a Unisat API)
```

#### 3.4 LocalPage (`pages-local.js`)
```typescript
// src/pages/LocalPage.tsx
// Pantalla completa e independiente
// Muestra: listados del marketplace local propio (BitmapCore Backend)
// API: GET https://bitmapcore.net:3000/api/v1/bitmaps
// Fuente de datos: Puerto 3000 (Local Marketplace existente)
```

#### 3.5 DescuentosPage (`pages-local.js`)
```typescript
// src/pages/DescuentosPage.tsx
// Pantalla completa e independiente
// Muestra: mejores descuentos de todos los mercados
// Incluye: badge verde con % de descuento
// Fuente de datos: Puerto 5500 (tabla 11 - DescuentosDatabase)
```

#### 3.6 UnifiedPage (`pages-unified.js`)
```typescript
// src/pages/UnifiedPage.tsx
// Pantalla completa e independiente
// Muestra: todos los listados unificados de Ordinalswallet + Unisat + Local
// Fuente de datos: Puerto 5500 (tabla 6 - UnifiedListingsDatabase)
```

#### 3.7 TagTablesPage (`pages-unified.js`)
```typescript
// src/pages/TagTablesPage.tsx
// Pantalla completa e independiente
// Muestra: etiquetas agrupadas por precio más bajo
// API: datos de tabla 8 (puerto 5500)
// Click en etiqueta → navega a /tag-tables/:tagName
// Fuente de datos: Puerto 5500 (tabla 8 - EtiquetasPorPrecioDatabase)
```

#### 3.8 TagGroupsPage (`pages-unified.js`)
```typescript
// src/pages/TagGroupsPage.tsx
// Pantalla completa e independiente (Detalle de etiqueta)
// Muestra: grupos de precios de una etiqueta específica
// API: datos de tabla 8 filtrados por tagName (puerto 5500)
// Botón "← Volver" regresa a TagTablesPage
// Fuente de datos: Puerto 5500 (tabla 8 - EtiquetasPorPrecioDatabase)
```

#### 3.9 VentasPage (`pages-unified.js`)
```typescript
// src/pages/VentasPage.tsx
// Pantalla completa e independiente
// Muestra: ventas de todos los mercados
// API: GET https://bitmapcore.net:5500/api/v1/proxy/ordinalswallet/sold
// Fuente de datos: Puerto 5500 (tabla 7 - SoldListingsDatabase + proxy Ordinalswallet)
```

### Navegación completa:

```
[HomePage]
    ↓ Click marketplace en sidebar o MarketplaceSelectorButton
[MarketplaceSelectorPage] ← 7 burbujas
    ↓ Click "Ordinalswallet"
[OrdinalswalletPage] ← Botón "← Volver"
    ↓ Click "← Volver"
[MarketplaceSelectorPage]

[MarketplaceSelectorPage]
    ↓ Click "Etiquetas"
[TagTablesPage] ← Lista de etiquetas
    ↓ Click "punk"
[TagGroupsPage] ← Detalle de punk
    ↓ Click "← Volver"
[TagTablesPage]
    ↓ Click "← Volver"
[MarketplaceSelectorPage]
```

### Puntos de verificación:
- [ ] 7 burbujas se renderizan correctamente en MarketplaceSelectorPage
- [ ] Cada burbuja navega a su pantalla independiente
- [ ] Todas las pantallas tienen botón "← Volver"
- [ ] Sidebar se oculta en pantallas independientes
- [ ] Tabla 8 tiene 2 pantallas (lista → detalle)
- [ ] Navegación de Tabla 8 funciona: lista → detalle → lista → selector
- [ ] Stats muestran datos del servidor vía proxy routes
- [ ] Gallery carga imágenes desde proxy routes
- [ ] Descuentos muestran badge verde
- [ ] Ventas muestran historial con fecha

---

### Fase 4: Búsqueda y Resultados (components.js + pages-block.js)

**Objetivo:** Search bar funcional con 4 vistas de resultados en cuadrícula horizontal y comportamiento en tiempo real.

**Comportamiento de búsqueda (CRÍTICO):**

```
[Sin búsqueda] → Solo se ve burbuja 1 (casilla vacía)
    ↓ Usuario escribe "950"
[Buscando...] → burbuja 1 muestra texto + loading
    ↓ Resultados encontrados en DB
[Resultados] → burbuja 1 + 4 burbujas en CUADRÍCULA HORIZONTAL abajo
    ↓ Usuario hace clic en un resultado
[Pantalla cambia] → Se oculta sidebar, aparece pantalla completa:
    - Si es bloque → pantalladebloqueespecificoscreen.kt
    - Si es etiqueta → tagtablescreen.kt
    ↓ Usuario hace clic en "← Volver"
[Regresa] → Sidebar reaparece, vuelve a HomePage
```

**Las 4 burbujas de resultados son en CUADRÍCULA HORIZONTAL (NO vertical):**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Resultado 1 │ │  Resultado 2 │ │  Resultado 3 │ │  Resultado 4 │
│  (bloque o   │ │  (bloque o   │ │  (bloque o   │ │  (bloque o   │
│   etiqueta)  │ │   etiqueta)  │ │   etiqueta)  │ │   etiqueta)  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Reglas:**
1. Usuario escribe → búsqueda se ejecuta en tiempo real contra la base de datos
2. Mientras escribe → resultados se van mostrando progresivamente
3. Si el usuario NO busca nada → NO aparecen las burbujas de resultados
4. Las 4 burbujas de resultados SOLO aparecen → cuando hay algo que mostrar
5. Las burbujas se van poniendo → a medida que se busca algo
6. Las 4 burbujas están en CUADRÍCULA HORIZONTAL → una al lado de la otra
7. Cada burbuja puede navegar a 2 pantallas diferentes:
   - **Número de bloque** → `pantalladebloqueespecificoscreen.kt`
   - **Etiqueta** → `tagtablescreen.kt`
8. Las tablas de etiquetas se buscan en `pantallasdetablas.kt`
9. Al hacer clic en un resultado → sidebar se oculta, pantalla completa
10. Al limpiar la búsqueda → las burbujas de resultados desaparecen

**Pantallas que se muestran al hacer clic:**

| Tipo de búsqueda | Pantalla Android | Ruta web |
|-----------------|------------------|----------|
| Número de bloque | `pantalladebloqueespecificoscreen.kt` | `/blocks/:id` |
| Etiqueta | `tagtablescreen.kt` | `/tags/:tagName` |

**Componentes a crear:**

#### 4.1 SearchBar (`components.js`)
```typescript
// src/components/SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  isLoading: boolean;
}
```

**Funcionalidades:**
- Input con placeholder dinámico
- Búsqueda por número de bloque o etiqueta
- Resultados se muestran en CUADRÍCULA HORIZONTAL (4 máximo)
- Al hacer clic en un resultado → navega a pantalla completa
- Loading state durante búsqueda

```typescript
// src/types/search.ts
interface SearchResult {
  type: 'block' | 'tag';
  id: number | string;
  label: string;
  mondrianImage?: string;
  price?: number;
  marketplace?: string;
}
```

#### 4.2 ResultCard (`image-components.js`)
```typescript
// src/components/images/ResultCard.tsx
interface ResultCardProps {
  type: 'block' | 'tag';
  id: number | string;
  label: string;
  mondrianImage?: string;
  price?: number;
  marketplace?: string;
  onClick: () => void;
}
```

#### 4.3 MondrianCanvas (`image-components.js`)
```typescript
// src/components/images/MondrianCanvas.tsx
interface MondrianCanvasProps {
  blockNumber: number;
  transactions: Transaction[];
  size?: number;
  onClick?: () => void;
}
```

**Algoritmo Mondrian (Canvas API):**
```
1. Crear canvas 320x320px
2. Fondo negro #000000
3. Para cada transacción:
   a. Calcular posición (bin-packing)
   b. Dibujar rectángulo naranja #FFA500
   c. Agregar bordes negros #000000
4. Para bloques Perfect/Punk:
   a. Usar grid uniforme en vez de bin-packing
5. Para bloques 1tx/2tx:
   a. Dibujar solo 1-2 rectángulos grandes
```

**Puntos de verificación:**
- [ ] Search bar filtra bloques/etiquetas en tiempo real
- [ ] 4 burbujas de resultados en CUADRÍCULA HORIZONTAL
- [ ] Mondrian genera imagen correctamente
- [ ] Click en bloque → sidebar se oculta → BlockDetailPage full width
- [ ] Click en etiqueta → sidebar se oculta → TagTablePage full width
- [ ] Botón "← Volver" regresa a HomePage con sidebar visible
- [ ] Si no hay búsqueda, NO aparecen burbujas de resultados

---

### Fase 5: API + Polling + Wallet (api.js + stores-app.js + pages-wallet.js)

**Objetivo:** Conexión con servidor, datos en tiempo real, wallet.

#### 5.1 API Client (`api.js`)
```typescript
// src/api/axiosClient.ts
const apiClient = axios.create({
  baseURL: 'https://bitmapcore.net:3000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Client separado para proxy routes y APIs externas (puerto 5500)
const proxyClient = axios.create({
  baseURL: 'https://bitmapcore.net:5500',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});
```

**Endpoints:**

Puerto 3000 (Local Marketplace existente):
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/blocks` | Listar bloques |
| GET | `/api/v1/blocks/:id` | Detalle bloque |
| POST | `/api/v1/wallet/connect` | Conectar wallet |
| POST | `/api/v1/transaction/psbt` | Crear PSBT |

Puerto 5500 (Bases de datos + Proxy externo):
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/proxy/ordinalswallet/listings` | Proxy Ordinalswallet |
| GET | `/api/v1/proxy/ordinalswallet/sold` | Proxy Ordinalswallet vendidos |
| GET | `/api/v1/proxy/ordinalswallet/stats` | Proxy Ordinalswallet stats |
| POST | `/api/v1/proxy/unisat/actions` | Proxy Unisat |
| GET | `/api/v1/proxy/unisat/listings` | Proxy Unisat listados |

#### 5.2 Zustand Stores (`stores-marketplaces.js` + `stores-app.js`)

**marketplaceStore:**
```typescript
interface MarketplaceState {
  listings: Listing[];
  floorPrice: number;
  soldCount: number;
  images: string[];
  isLoading: boolean;
  error: string | null;
  fetchListings: () => Promise<void>;
}
```

**walletStore:**
```typescript
interface WalletState {
  address: string | null;
  balance: number;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

**pollingStore:**
```typescript
interface PollingState {
  interval: number; // 300000ms = 5min
  isActive: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}
```

#### 5.3 Polling System (`utils-advanced.js`)
```typescript
// 300 segundos = 5 minutos
const POLLING_INTERVAL = 300000;

// Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pausar polling cuando la pestaña está oculta
    stopPolling();
  } else {
    // Reanudar polling cuando la pestaña vuelve a estar visible
    startPolling();
  }
});

// IndexedDB para persistencia
const db = await openDB('bitmapcore-polling', 1);
await db.put('cache', { key: 'lastBlock', value: blockData });
```

#### 5.4 Wallet Connection (`pages-wallet.js`)
```typescript
// Conectar wallet via sats-connect
import { AddressPurpose, BitcoinNetworkType, getProvider } from 'sats-connect';

const connectWallet = async () => {
  const provider = getProvider('unisat');
  const accounts = await provider.requestAccounts();
  return accounts[0];
};
```

#### 5.5 MisActivosPage (`pages-wallet.js`)
```typescript
// src/pages/MisActivosPage.tsx
// Pantalla completa e independiente
// Muestra: inscripciones del usuario de su wallet conectada
// API: GET https://bitmapcore.net:5500/api/v1/bitmasowner/{address}
// Fuente de datos: Puerto 5500 (tabla 15 - MisActivosDatabase)
// Cerebro #4 (ConnectionWalletsViewModel) controla la lógica
//
// Entidades:
// - UserInscriptionCacheEntity: Cache de inscripciones del usuario
// - UserInscriptionImageEntity: Imágenes de las inscripciones
//
// DB File: mis_activos.db
// Fetcha datos de API externa (ordinals.com), similar a Tables 2 y 3
```

**Puntos de verificación:**
- [ ] API conecta con servidor bitmapcore.net:3000 (local marketplace)
- [ ] Proxy client conecta con bitmapcore.net:5500 (bases de datos + proxy externo)
- [ ] Proxy routes funcionan (Ordinalswallet, Unisat) vía puerto 5500
- [ ] Stores Zustand actualizan estado
- [ ] Polling actualiza datos cada 5 minutos
- [ ] Page Visibility pausa/reanuda polling
- [ ] IndexedDB persiste cache
- [ ] Wallet connect/disconnect funciona
- [ ] PSBT se crea correctamente

### Navegación Principal - Sidebar ↔ Pantallas

```
[HomePage con Sidebar visible]
    ↓ Click en resultado de bloque
[Sidebar se oculta] → [BlockDetailPage full width]
    ↓ Click "← Volver"
[Sidebar reaparece] → [HomePage]

[HomePage con Sidebar visible]
    ↓ Click en resultado de etiqueta
[Sidebar se oculta] → [TagTablePage full width]
    ↓ Click "← Volver"
[Sidebar reaparece] → [HomePage]

[HomePage con Sidebar visible]
    ↓ Click en marketplace del sidebar
[Sidebar se oculta] → [MarketplacePage full width]
    ↓ Click "← Volver"
[Sidebar reaparece] → [HomePage]
```

---

## 4. Stores Zustand - Detalle

### 14.1 stores-marketplaces.js

```typescript
// marketplaceStore.ts
import { create } from 'zustand';

interface MarketplaceState {
  listings: Listing[];
  floorPrice: number;
  soldCount: number;
  images: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchListings: () => Promise<void>;
  getFloorPrice: () => number;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: [],
  floorPrice: 0,
  soldCount: 0,
  images: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  fetchListings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await marketplaceApi.getListings();
      set({
        listings: data.listings,
        floorPrice: data.floorPrice,
        soldCount: data.soldCount,
        images: data.images,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  getFloorPrice: () => get().floorPrice,
}));
```

```typescript
// unifiedStore.ts
interface UnifiedState {
  allListings: Listing[];
  totalCount: number;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
}
```

```typescript
// tagsStore.ts
interface TagsState {
  tags: TagGroup[];
  isLoading: boolean;
  fetchTags: () => Promise<void>;
}
```

```typescript
// salesStore.ts
interface SalesState {
  sales: Sale[];
  totalSold: number;
  isLoading: boolean;
  fetchSales: () => Promise<void>;
}
```

### 14.2 stores-app.js

```typescript
// walletStore.ts
interface WalletState {
  address: string | null;
  publicKey: string | null;
  balance: number;
  isConnected: boolean;
  network: BitcoinNetworkType;
  connect: () => Promise<void>;
  disconnect: () => void;
  getBalance: () => Promise<void>;
}
```

```typescript
// blockStore.ts
interface BlockState {
  currentBlock: Block | null;
  recentBlocks: Block[];
  searchResults: Block[];
  isLoading: boolean;
  search: (query: string) => Promise<void>;
  getBlock: (id: number) => Promise<void>;
}
```

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}
```

```typescript
// notificationStore.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}
```

```typescript
// pollingStore.ts
interface PollingState {
  interval: number;
  isActive: boolean;
  lastPoll: Date | null;
  startPolling: () => void;
  stopPolling: () => void;
  poll: () => Promise<void>;
}
```

---

## 5. API Endpoints - Detalle

### 16.1 api.js

```typescript
// axiosClient.ts
import axios from 'axios';

// Puerto 3000 - Local Marketplace (existente)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bitmapcore.net:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Puerto 5500 - Bases de datos + Proxy externo
export const proxyClient = axios.create({
  baseURL: import.meta.env.VITE_PROXY_URL || 'https://bitmapcore.net:5500',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

proxyClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Proxy Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

```typescript
// proxyRoutes.ts
import { proxyClient } from './axiosClient';

export const proxyRoutes = {
  ordinalswallet: {
    getListings: () => proxyClient.get('/api/v1/proxy/ordinalswallet/listings'),
    getSold: () => proxyClient.get('/api/v1/proxy/ordinalswallet/sold'),
    getStats: () => proxyClient.get('/api/v1/proxy/ordinalswallet/stats'),
  },
  unisat: {
    getActions: (data: any) => proxyClient.post('/api/v1/proxy/unisat/actions', data),
    getListings: () => proxyClient.get('/api/v1/proxy/unisat/listings'),
  },
};
```

```typescript
// walletApi.ts
import { apiClient } from './axiosClient';

export const walletApi = {
  connect: (address: string) => apiClient.post('/api/v1/wallet/connect', { address }),
  getBalance: (address: string) => apiClient.get(`/api/v1/wallet/${address}/balance`),
  getUTXOs: (address: string) => apiClient.get(`/api/v1/wallet/${address}/utxos`),
};
```

```typescript
// blockchainApi.ts
export const blockchainApi = {
  getBlocks: (page: number, limit: number) =>
    apiClient.get(`/api/v1/blocks?page=${page}&limit=${limit}`),
  getBlock: (id: number) => apiClient.get(`/api/v1/blocks/${id}`),
  searchBlock: (query: string) => apiClient.get(`/api/v1/blocks/search?q=${query}`),
  getBlockTransactions: (id: number) => apiClient.get(`/api/v1/blocks/${id}/transactions`),
};
```

```typescript
// psbtBuilder.ts
export const psbtBuilder = {
  createPSBT: (data: PSBTData) => apiClient.post('/api/v1/transaction/psbt', data),
  signPSBT: (psbt: string) => apiClient.post('/api/v1/transaction/psbt/sign', { psbt }),
  broadcastPSBT: (signedPsbt: string) =>
    apiClient.post('/api/v1/transaction/psbt/broadcast', { psbt: signedPsbt }),
};
```

---

## 6. Sistema de Seguridad

### 6.1 PSBT Trustless (`api.js` + `pages-wallet.js`)

```
[Usuario selecciona bloque]
    ↓
[Frontend crea PSBT (partially signed)]
    ↓
[Envía a usuario para firmar con wallet extension]
    ↓
[Unisat/Xverse firma PSBT]
    ↓
[PSBT firmado se envía al servidor]
    ↓
[Servidor broadcast a Bitcoin network]
    ↓
[Transacción confirmada]
```

**Seguridad:**
- Nunca se almacena la private key del usuario
- PSBT se firma localmente en el browser
- Servidor solo recibe PSBT firmado
- Transacción es verificable en blockchain

### 6.2 Browser Extensions (`pages-wallet.js`)

```typescript
// Detectar extensiones disponibles
const detectExtensions = () => {
  const extensions = [];
  if (window.unisat) extensions.push('unisat');
  if (window.satsConnect) extensions.push('xverse');
  return extensions;
};

// Conectar wallet
const connectWallet = async (extension: string) => {
  switch (extension) {
    case 'unisat':
      return await window.unisat.requestAccounts();
    case 'xverse':
      return await satsConnect.getAddress({
        purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
        network: { type: BitcoinNetworkType.Mainnet },
      });
  }
};
```

---

## 7. Sistema de Polling

### 27.1 Polling Architecture (`utils-advanced.js`)

```typescript
// pollingLogic.ts

const POLLING_INTERVAL = 300000; // 5 minutos

class PollingManager {
  private intervalId: number | null = null;
  private isActive = false;

  start(stores: Store[]) {
    if (this.isActive) return;

    this.isActive = true;
    this.intervalId = window.setInterval(async () => {
      for (const store of stores) {
        await store.refresh();
      }
    }, POLLING_INTERVAL);

    // Page Visibility API
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  private handleVisibility = () => {
    if (document.hidden) {
      this.stop();
    } else {
      this.start(currentStores);
    }
  };
}

// IndexedDB para persistencia
const persistCache = async (data: any) => {
  const db = await openDB('bitmapcore-cache', 1, {
    upgrade(db) {
      db.createObjectStore('data');
    },
  });
  await db.put('data', data, 'lastPoll');
};

const loadCache = async () => {
  const db = await openDB('bitmapcore-cache', 1);
  return await db.get('data', 'lastPoll');
};
```

---

## 8. I18N - Traducciones

### 17.1 i18n.js

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es';
import en from './en';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'es', // Default language
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### 8.1 Módulos de Traducción

| Módulo | Keys | Contenido |
|--------|:----:|-----------|
| Core | 45 | Header, Sidebar, Navigation, Common |
| Auth | 30 | Login, Register, Wallet, Profile |
| Database | 25 | Blocks, Search, Filters, Sorting |
| Search | 35 | Search bar, Results, Views, Filters |
| Marketplace | 65 | 7 marketplaces, Listings, Sales, Tags |
| Admin | 40 | Dashboard, Settings, Users, Reports |
| Whitepaper | 30 | Documentation, Help, About |
| **Total** | **270** | |

### 8.2 Ejemplo de Traducción

```typescript
// es.ts
export default {
  header: {
    logo: 'BitmapCore',
    search: 'Buscar bloques...',
    notifications: 'Notificaciones',
    wallet: 'Conectar Wallet',
    walletConnected: 'Wallet Conectada',
  },
  sidebar: {
    marketplaces: 'Mercados',
    ordinalswallet: 'Ordinalswallet',
    unisat: 'Unisat',
    bitmapcore: 'BitmapCore',
    descuentos: 'Descuentos',
    unified: 'Todos los Mercados',
    tags: 'Etiquetas',
    ventas: 'Ventas',
  },
  home: {
    title: 'Panel Principal',
    searchPlaceholder: 'Buscar por número de bloque, hash, o etiqueta...',
    viewGrid: 'Cuadrícula',
    viewList: 'Lista',
    viewGallery: 'Galería',
    viewCompact: 'Compacto',
    recentBlocks: 'Últimos Bloques',
    mondrianPreview: 'Vista Previa Mondrian',
  },
  marketplace: {
    listings: 'Listados',
    floorPrice: 'Piso',
    sold: 'Vendidos',
    viewMore: 'Ver más',
    noListings: 'No hay listados disponibles',
    discount: 'Descuento',
  },
  // ... más keys
};
```

---

## 9. Dependencias del Proyecto

### package.json

```json
{
  "name": "bitmapcore-web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4",
    "axios": "^1.7.4",
    "i18next": "^23.12.2",
    "react-i18next": "^15.0.1",
    "sats-connect": "^1.2.0",
    "idb": "^8.0.0",
    "lucide-react": "^0.424.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.0"
  }
}
```

---

## 10. Restricciones de Inscripción Bitcoin

### 10.1 Límites por Archivo

| Archivo | Límite | Tamaño actual | Estado |
|---------|--------|---------------|--------|
| index.html | 400 KB | ~60 KB | ✅ |
| core.js | 400 KB | ~50 KB | ✅ |
| components.js | 400 KB | ~35 KB | ✅ |
| marketplace-components.js | 400 KB | ~30 KB | ✅ |
| image-components.js | 400 KB | ~25 KB | ✅ |
| pages-home.js | 400 KB | ~35 KB | ✅ |
| pages-marketplaces.js | 400 KB | ~45 KB | ✅ |
| pages-local.js | 400 KB | ~25 KB | ✅ |
| pages-unified.js | 400 KB | ~30 KB | ✅ |
| pages-wallet.js | 400 KB | ~35 KB | ✅ |
| pages-block.js | 400 KB | ~30 KB | ✅ |
| stores-marketplaces.js | 400 KB | ~30 KB | ✅ |
| stores-app.js | 400 KB | ~35 KB | ✅ |
| api.js | 400 KB | ~30 KB | ✅ |
| i18n.js | 400 KB | ~20 KB | ✅ |
| utils.js | 400 KB | ~20 KB | ✅ |
| utils-advanced.js | 400 KB | ~25 KB | ✅ |

### 10.2 Optimizaciones de Build

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'core': ['react', 'react-dom', 'react-router-dom'],
          'stores': ['zustand'],
          'api': ['axios'],
        },
      },
    },
  },
});
```

### 10.3 Proceso de Build → Inscripción

```
DESARROLLO (src/ — 78 archivos TypeScript)
    ↓ npm run build
BUILD OPTIMIZADO (dist/ — 19 archivos JS/HTML)
    ↓ Brotli compression (nativo en Ordinals)
INSCRIPCIÓN BITCOON (19 inscripciones separadas)
    ↓
RENDERIZADO EN WALLET (Unisat/Xverse)
```

---

## 11. Checklist de Seguridad

- [ ] Nunca se almacena private key en localStorage
- [ ] PSBT se firma localmente (nunca en servidor)
- [ ] CORS configurado: solo `https://bitmapcore.net` y `http://localhost:5173`
- [ ] API calls usan HTTPS
- [ ] Input validation en todos los endpoints
- [ ] Rate limiting en servidor
- [ ] No se exponen secrets en frontend
- [ ] Wallet address se valida antes de enviar
- [ ] Error messages no revelan información sensible
- [ ] Cache en IndexedDB no contiene datos sensibles
