# BitmapCore — Plan de Implementación: Versión Web

## Resumen

| Fase | Descripción | Tiempo estimado |
|------|-------------|-----------------|
| Fase 1 | Preparar servidor (proxy, CORS, static) | 2-3 días |
| Fase 2 | Frontend base (React + Vite + Tailwind + routing) | 2-3 días |
| Fase 3 | Marketplace externo (Ordinalswallet + Unisat) | 3-4 días |
| Fase 4 | Marketplace local (BitMapCore buy/sell + PSBT) | 3-4 días |
| Fase 5 | Funcionalidad core (Home, Unified, Tags, Discounts) | 3-4 días |
| Fase 6 | Wallet + Assets + Perfil | 2-3 días |
| Fase 7 | Pulido (responsive, polling, testing) | 2-3 días |
| **Total** | | **17-24 días** |

---

## Fase 1: Preparar el Servidor (2-3 días)

### Objetivo
El servidor BitmapCorpServer debe poder servir la app web estática Y las API routes proxy.

### Cambios necesarios

#### 1.1 Actualizar CORS
**Archivo:** `src/config/cors.ts`

```typescript
// Agregar bitmapcore.net y localhost:5173
const allowedOrigins = isProduction
  ? ['https://bitmapcorp.app', 'https://www.bitmapcorp.app', 'https://bitmapcore.net']
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'];
```

#### 1.2 Agregar static files
**Archivo:** `src/index.ts`

```typescript
import path from 'path';

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../web/dist')));

// SPA fallback - todas las rutas no-API sirven index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../web/dist/index.html'));
  }
});
```

#### 1.3 Crear proxy routes
**Archivo:** `src/routes/marketplaceProxyRoutes.ts` (NUEVO)

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { sendSuccess, sendError } from '../utils/responseFormatter';

const router = Router();

// Proxy Ordinalswallet
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

// Proxy Unisat
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

export default router;
```

#### 1.4 Registrar proxy routes
**Archivo:** `src/routes/apiRoutes.ts`

```typescript
import marketplaceProxyRouter from './marketplaceProxyRoutes';

// Agregar:
router.use('/proxy', marketplaceProxyRouter);
```

#### 1.5 Activar block routes
**Archivo:** `src/routes/apiRoutes.ts`

```typescript
import blockRouter from './blockRoutes';

// Descomentar:
router.use('/block', blockRouter);
```

### Checklist Fase 1
- [ ] CORS actualizado con `bitmapcore.net`
- [ ] Static files configurados
- [ ] Proxy routes creados
- [ ] Block routes activados
- [ ] Deploy en VPS y probar

---

## Fase 2: Frontend Base (2-3 días)

### Objetivo
Crear la estructura base de React + routing + tema.

### Tareas

#### 2.1 Inicializar proyecto
```bash
cd BitmapCorpServer/web
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom zustand axios i18next react-i18next
```

#### 2.2 Configurar routing
```typescript
// src/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WalletPage from './pages/WalletPage';
// ... etc

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/wallet', element: <WalletPage /> },
  // ... todas las rutas
]);
```

#### 2.3 Configurar tema
```typescript
// src/theme/colors.ts
export const colors = {
  bitmap: {
    primary: '#FF6B35',
    secondary: '#004E89',
    accent: '#F7C948',
    dark: '#1A1A2E',
    light: '#F8F9FA',
  },
};
```

#### 2.4 Crear axios client
```typescript
// src/api/axiosClient.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
```

### Checklist Fase 2
- [ ] Proyecto inicializado
- [ ] Tailwind configurado
- [ ] Routing funcionando
- [ ] Tema configurado
- [ ] Axios client listo
- [ ] Estructura de directorios creada

---

## Fase 3: Marketplace Externo (3-4 días)

### Objetivo
Mostrar listings de Ordinalswallet y Unisat.

### Tareas

#### 3.1 OrdinalswalletPage
```typescript
// src/pages/OrdinalswalletPage.tsx
export default function OrdinalswalletPage() {
  const { listings, isLoading } = useOrdinalswalletListings();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map(listing => (
        <MarketplaceBubble key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

#### 3.2 UnisatPage
```typescript
// src/pages/UnisatPage.tsx
export default function UnisatPage() {
  const { listings, isLoading } = useUnisatListings();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map(listing => (
        <MarketplaceBubble key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

#### 3.3 MarketplaceBubble (reutilizable)
```typescript
// src/components/MarketplaceBubble.tsx
export default function MarketplaceBubble({ listing }: Props) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <BlockImageBubble blockNumber={listing.bitmapNumber} />
      <h3 className="font-bold mt-2">{listing.name}</h3>
      <p className="text-green-600">{listing.listedPrice} sats</p>
      <p className="text-sm text-gray-500">{listing.source}</p>
    </div>
  );
}
```

### Checklist Fase 3
- [ ] OrdinalswalletPage funcionando
- [ ] UnisatPage funcionando
- [ ] MarketplaceBubble reutilizable
- [ ] Polling cada 5 minutos
- [ ] Loading states
- [ ] Error handling

---

## Fase 4: Marketplace Local (3-4 días)

### Objetivo
Comprar y vender bitmaps en el marketplace propio.

### Tareas

#### 4.1 LocalMarketplacePage
```typescript
// src/pages/LocalMarketplacePage.tsx
export default function LocalMarketplacePage() {
  const { listings, isLoading } = useLocalListings();
  
  return (
    <div>
      <h1>BitMapCore Marketplace</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map(listing => (
          <MarketplaceBubble 
            key={listing.id} 
            listing={listing}
            onClick={() => navigate(`/local/${listing.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 4.2 BuyBitmapPage
```typescript
// src/pages/BuyBitmapPage.tsx
export default function BuyBitmapPage() {
  const { id } = useParams();
  const { buyBitmap, isLoading } = useBuyBitmap();
  
  const handleBuy = async () => {
    await buyBitmap(id, connectedAddress);
  };
  
  return (
    <div>
      <h1>Comprar Bitmap #{id}</h1>
      <button onClick={handleBuy} disabled={isLoading}>
        {isLoading ? 'Procesando...' : 'Comprar'}
      </button>
    </div>
  );
}
```

#### 4.3 walletStore (Cerebro 4)
```typescript
// src/stores/walletStore.ts
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      walletType: null,
      
      connectWallet: async (type) => {
        if (type === 'unisat') {
          const accounts = await window.unisat.requestAccounts();
          const publicKey = await window.unisat.getPublicKey();
          set({ address: accounts[0], publicKey, walletType: 'unisat', isConnected: true });
        }
      },
      
      signPsbt: async (psbt, options) => {
        const { walletType } = get();
        if (walletType === 'unisat') {
          return await window.unisat.signPsbt(psbt, options);
        }
        throw new Error('Wallet not connected');
      },
      
      disconnectWallet: () => {
        set({ isConnected: false, address: null, walletType: null });
      },
    }),
    { name: 'bitmapcore-wallet' }
  )
);
```

### Checklist Fase 4
- [ ] LocalMarketplacePage funcionando
- [ ] BitmapDetailPage funcionando
- [ ] BuyBitmapPage con PSBT
- [ ] Crear listing flow
- [ ] Wallet connection (Unisat)
- [ ] Transaction history

---

## Fase 5: Funcionalidad Core (3-4 días)

### Objetivo
Home, Unified listings, Tags, Discounts.

### Tareas

#### 5.1 HomePage con burbujas
```typescript
// src/pages/HomePage.tsx
export default function HomePage() {
  return (
    <div>
      <h1>BitmapCore</h1>
      <div className="grid grid-cols-2 gap-4">
        <MarketplaceBubble 
          name="Ordinalswallet" 
          totalListings={ordinalsTotal}
          floorPrice={ordinalsFloor}
          onClick={() => navigate('/ordinalswallet')}
        />
        <MarketplaceBubble 
          name="Unisat" 
          totalListings={unisatTotal}
          floorPrice={unisatFloor}
          onClick={() => navigate('/unisat')}
        />
        <MarketplaceBubble 
          name="BitMapCore" 
          totalListings={localTotal}
          floorPrice={localFloor}
          onClick={() => navigate('/local')}
        />
      </div>
    </div>
  );
}
```

#### 5.2 Tags y Discounts
```typescript
// src/pages/TagTablesPage.tsx
export default function TagTablesPage() {
  const { tagGroups, isLoading } = useTagGroups();
  
  return (
    <div>
      <h1>Tablas de Etiquetas</h1>
      {tagGroups.map(group => (
        <div key={group.tagName}>
          <h2>{group.tagName}</h2>
          <p>{group.count} bloques</p>
          <p>Floor: {group.floorPrice} sats</p>
        </div>
      ))}
    </div>
  );
}
```

### Checklist Fase 5
- [ ] HomePage con burbujas
- [ ] UnifiedStore funcionando
- [ ] TagTablesPage
- [ ] TagGroupsPage
- [ ] DiscountsPage
- [ ] SalesPage

---

## Fase 6: Wallet + Assets + Perfil (2-3 días)

### Objetivo
Mis Activos, balance, historial, configuración.

### Tareas

#### 6.1 MyAssetsPage
```typescript
// src/pages/MyAssetsPage.tsx
export default function MyAssetsPage() {
  const { inscriptions, isLoading } = useUserInscriptions();
  
  return (
    <div>
      <h1>Mis Activos</h1>
      <div className="grid grid-cols-3 gap-4">
        {inscriptions.map(ins => (
          <InscriptionImage key={ins.id} inscription={ins} />
        ))}
      </div>
    </div>
  );
}
```

#### 6.2 WalletPage
```typescript
// src/pages/WalletPage.tsx
export default function WalletPage() {
  const { address, balance, isConnected } = useWalletStore();
  
  return (
    <div>
      <h1>Mi Wallet</h1>
      {isConnected ? (
        <div>
          <p>Dirección: {address}</p>
          <p>Balance: {balance} sats</p>
          <button onClick={disconnectWallet}>Desconectar</button>
        </div>
      ) : (
        <div>
          <button onClick={() => connectWallet('unisat')}>Conectar Unisat</button>
          <button onClick={() => connectWallet('xverse')}>Conectar Xverse</button>
        </div>
      )}
    </div>
  );
}
```

### Checklist Fase 6
- [ ] MyAssetsPage funcionando
- [ ] WalletPage con balance
- [ ] TransactionHistoryPage
- [ ] WalletHistoryPage
- [ ] ProfilePage con configuración

---

## Fase 7: Pulido (2-3 días)

### Objetivo
Responsive, performance, testing.

### Tareas

#### 7.1 Responsive
- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interactions

#### 7.2 Performance
- Lazy loading de páginas
- Image optimization
- Cache de API responses

#### 7.3 Testing
- Unit tests de stores
- Integration tests de pages
- E2E tests de flows críticos

### Checklist Fase 7
- [ ] Responsive en todos los breakpoints
- [ ] Lazy loading funcionando
- [ ] Cache implementado
- [ ] Tests escritos
- [ ] Deploy final en VPS

---

## Fase 8: Deploy (1 día)

### Deploy en VPS

```bash
# 1. Build del frontend
cd BitmapCorpServer/web
npm run build

# 2. Copiar a VPS
scp -r dist/ bitmapcorp@80.190.76.108:/home/bitmapcorp/BitmapCorpServer/web/

# 3. En VPS: restart servidor
ssh bitmapcorp@80.190.76.108
cd /home/bitmapcorp/BitmapCorpServer
pm2 restart bitmapcorp-server

# 4. Verificar
curl https://bitmapcore.net/health
curl https://bitmapcore.net/
```

### Checklist Deploy
- [ ] Frontend buildeado
- [ ] Archivos copiados a VPS
- [ ] Servidor reiniciado
- [ ] Nginx sirviendo archivos estáticos
- [ ] API routes funcionando
- [ ] SSL funcionando
- [ ] CORS funcionando

---

## Orden de Implementación Recomendado

```
Fase 1 (Servidor)
    │
    ├── 1.1 CORS actualizado
    ├── 1.2 Static files
    ├── 1.3 Proxy routes
    └── 1.4 Block routes
    │
Fase 2 (Frontend Base)
    │
    ├── 2.1 Vite + React + TS
    ├── 2.2 Tailwind
    ├── 2.3 Routing
    └── 2.4 Axios client
    │
Fase 3 (Marketplace Externo)
    │
    ├── 3.1 OrdinalswalletPage
    ├── 3.2 UnisatPage
    └── 3.3 MarketplaceBubble
    │
Fase 4 (Marketplace Local)
    │
    ├── 4.1 LocalMarketplacePage
    ├── 4.2 BuyBitmapPage
    └── 4.3 walletStore
    │
Fase 5 (Core)
    │
    ├── 5.1 HomePage
    ├── 5.2 Tags
    └── 5.3 Discounts
    │
Fase 6 (Wallet + Assets)
    │
    ├── 6.1 MyAssetsPage
    ├── 6.2 WalletPage
    └── 6.3 ProfilePage
    │
Fase 7 (Pulido)
    │
    ├── 7.1 Responsive
    ├── 7.2 Performance
    └── 7.3 Testing
    │
Fase 8 (Deploy)
    │
    └── Deploy final
```
