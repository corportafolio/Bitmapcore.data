# 26 - Proxy Routes Server (Rutas a Crear)

## 1. Propósito

Documenta las rutas de proxy que **DEBEN SER CREADAS** en BitmapCorpServer para la versión web. En Android, la app llama directamente a APIs externas (Ordinalswallet, Unisat). En web, CORS bloquea estas llamadas directas. El server actúa como proxy.

---

## 2. Problema: CORS en Web

```
Web App (bitmapcore.net) → ordinalswallet.com → ❌ BLOQUEADO por CORS
Web App (bitmapcore.net) → open-api.unisat.io → ❌ BLOQUEADO por CORS
```

**Solución:**
```
Web App (bitmapcore.net) → bitmapcore.net/api/v1/proxy/* → ✅ PROXY SERVER → API externa
```

---

## 3. Rutas a Crear

### 3.1 Proxy Ordinalswallet

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/v1/proxy/ordinalswallet/listings` | GET | Listings de Ordinalswallet |
| `/api/v1/proxy/ordinalswallet/floor` | GET | Floor price de Ordinalswallet |
| `/api/v1/proxy/ordinalswallet/sold` | GET | Ventas de Ordinalswallet |

#### `GET /api/v1/proxy/ordinalswallet/listings`

Proxy a la API de Ordinalswallet para obtener listings de Bitmaps.

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `limit` | number | Cantidad de resultados (default: 100) |
| `offset` | number | Offset para paginación |
| `sortBy` | string | Campo de ordenamiento |
| `sortOrder` | string | `asc` o `desc` |

**Implementation:**
```typescript
// routes/proxyRoutes.ts
router.get('/ordinalswallet/listings', async (req: Request, res: Response) => {
  const { limit = 100, offset = 0, sortBy = 'created', sortOrder = 'desc' } = req.query;
  
  const url = new URL('https://ordinalswallet.com/api/marketplace/listings');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('sortBy', String(sortBy));
  url.searchParams.set('sortOrder', String(sortOrder));
  url.searchParams.set('collection', 'bitmaps');
  
  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    throw new ExternalApiError(`Ordinalswallet API error: ${response.status}`);
  }
  
  const data = await response.json();
  sendSuccess(res, data);
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "...",
        "name": "942029.bitmap",
        "price": 12000,
        "seller": "bc1q...",
        "created": "2026-05-08T05:02:56Z",
        "image": "..."
      }
    ],
    "total": 11162
  }
}
```

---

### 3.2 Proxy Unisat

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/v1/proxy/unisat/listings` | GET | Listings de Unisat |
| `/api/v1/proxy/unisat/floor` | GET | Floor price de Unisat |
| `/api/v1/proxy/unisat/sold` | GET | Ventas de Unisat |
| `/api/v1/proxy/unisat/collection` | GET | Info de colección |

#### `GET /api/v1/proxy/unisat/listings`

Proxy a la API de Unisat para obtener listings de Bitmaps.

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `collection` | string | Nombre de colección (default: 'bitmap') |
| `limit` | number | Cantidad de resultados (default: 100) |
| `cursor` | string | Cursor para paginación |

**Implementation:**
```typescript
router.get('/unisat/listings', async (req: Request, res: Response) => {
  const { collection = 'bitmap', limit = 100, cursor } = req.query;
  
  const apiKey = config.apis.unisat.apiKey;
  const url = new URL('https://open-api.unisat.io/market/v4/collection/listings');
  url.searchParams.set('collection', String(collection));
  url.searchParams.set('limit', String(limit));
  if (cursor) url.searchParams.set('cursor', String(cursor));
  
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    throw new ExternalApiError(`Unisat API error: ${response.status}`);
  }
  
  const data = await response.json();
  sendSuccess(res, data);
});
```

---

### 3.3 Proxy Tags (Etiquetas)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/v1/tags/:blockNumber` | GET | Etiquetas de un bloque |
| `/api/v1/tags/batch` | POST | Etiquetas de múltiples bloques |
| `/api/v1/tags/stats` | GET | Estadísticas de etiquetas |

#### `GET /api/v1/tags/:blockNumber`

Obtener etiquetas de un bloque específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "blockNumber": 800000,
    "tags": ["mined-by-Satoshi", "genesis-block"],
    "transactionCount": 1,
    "totalBTC": 50
  }
}
```

#### `POST /api/v1/tags/batch`

Obtener etiquetas de múltiples bloques de una vez.

**Request Body:**
```json
{
  "blockNumbers": [800000, 800001, 800002]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "800000": { "tags": ["mined-by-Satoshi"], "transactionCount": 1 },
    "800001": { "tags": ["first-taproot"], "transactionCount": 3 },
    "800002": { "tags": [], "transactionCount": 2500 }
  }
}
```

---

## 4. Archivos a Crear en el Server

### 4.1 `src/routes/proxyRoutes.ts` (NUEVO)

```typescript
import { Router, Request, Response } from 'express';
import { ExternalApiError } from '../errors/AppError';
import { sendSuccess } from '../utils/responseFormatter';
import { config } from '../config/environment';

const router: Router = Router();

// Proxy Ordinalswallet
router.get('/ordinalswallet/listings', async (req: Request, res: Response) => {
  // ... implementación
});

router.get('/ordinalswallet/floor', async (req: Request, res: Response) => {
  // ... implementación
});

router.get('/ordinalswallet/sold', async (req: Request, res: Response) => {
  // ... implementación
});

// Proxy Unisat
router.get('/unisat/listings', async (req: Request, res: Response) => {
  // ... implementación
});

router.get('/unisat/floor', async (req: Request, res: Response) => {
  // ... implementación
});

router.get('/unisat/sold', async (req: Request, res: Response) => {
  // ... implementación
});

router.get('/unisat/collection', async (req: Request, res: Response) => {
  // ... implementación
});

export default router;
```

### 4.2 `src/routes/tagsRoutes.ts` (NUEVO)

```typescript
import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/responseFormatter';

const router: Router = Router();

router.get('/:blockNumber', async (req: Request, res: Response) => {
  // ... implementación
});

router.post('/batch', async (req: Request, res: Response) => {
  // ... implementación
});

router.get('/stats', async (req: Request, res: Response) => {
  // ... implementación
});

export default router;
```

### 4.3 Actualizar `src/routes/apiRoutes.ts`

```typescript
import proxyRoutes from './proxyRoutes';
import tagsRoutes from './tagsRoutes';

// Agregar después de las rutas existentes:
router.use('/proxy', proxyRoutes);
router.use('/tags', tagsRoutes);
```

---

## 5. Configuración CORS

### 5.1 Actualizar `src/config/cors.ts`

```typescript
const allowedOrigins = [
  'http://localhost:5173',           // Dev
  'http://localhost:3000',           // Dev server
  'https://bitmapcore.net',          // Producción web
  'https://www.bitmapcore.net',      // Producción web (www)
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Wallet-Address'],
};
```

---

## 6. Rate Limiting para Proxies

```typescript
// Los proxies deben tener rate limiting separado
// para evitar abuso de APIs externas

import rateLimit from 'express-rate-limit';

export const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,              // 30 req/min por IP
  message: { error: 'Too many proxy requests' },
  skip: (req) => req.path === '/health',
});

// Aplicar en index.ts:
app.use('/api/v1/proxy', proxyLimiter);
```

---

## 7. Cache de Proxies

```typescript
// Cache en memoria para reducir llamadas a APIs externas
const proxyCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 segundos

function getCached(key: string): any | null {
  const cached = proxyCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  proxyCache.set(key, { data, timestamp: Date.now() });
}

// Ejemplo de uso:
router.get('/ordinalswallet/listings', async (req: Request, res: Response) => {
  const cacheKey = `ow-listings-${JSON.stringify(req.query)}`;
  const cached = getCached(cacheKey);
  
  if (cached) {
    return sendSuccess(res, cached);
  }
  
  // Fetch de API externa
  const data = await fetchOrdinalswalletListings(req.query);
  setCache(cacheKey, data);
  
  sendSuccess(res, data);
});
```

---

## 8. Logging de Proxies

```typescript
// Log de cada proxy request para debugging
router.get('/ordinalswallet/listings', async (req: Request, res: Response) => {
  const start = Date.now();
  
  logger.info('Proxy request', {
    target: 'ordinalswallet',
    endpoint: '/listings',
    query: req.query,
  });
  
  try {
    const data = await fetchOrdinalswalletListings(req.query);
    
    logger.info('Proxy response', {
      target: 'ordinalswallet',
      endpoint: '/listings',
      status: 'success',
      duration: Date.now() - start,
      itemCount: data.listings?.length || 0,
    });
    
    sendSuccess(res, data);
  } catch (error) {
    logger.error('Proxy error', {
      target: 'ordinalswallet',
      endpoint: '/listings',
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    throw error;
  }
});
```

---

## 9. Endpoints Planeados (NO Implementados)

| Endpoint | Propósito | Estado |
|----------|-----------|--------|
| `GET /api/v1/tags/:blockNumber` | Etiquetas de un bloque | ❌ No existe |
| `POST /api/v1/tags/batch` | Etiquetas de múltiples bloques | ❌ No existe |
| `GET /api/v1/tags/stats` | Estadísticas de etiquetas | ❌ No existe |
| `GET /api/v1/tags/grouped` | Etiquetas agrupadas por precio | ❌ No existe |
| `GET /api/v1/proxy/ordinalswallet/*` | Proxy Ordinalswallet | ❌ No existe |
| `GET /api/v1/proxy/unisat/*` | Proxy Unisat | ❌ No existe |

---

## 10. Checklist de Implementación

- [ ] Crear `src/routes/proxyRoutes.ts`
- [ ] Crear `src/routes/tagsRoutes.ts`
- [ ] Actualizar `src/routes/apiRoutes.ts` para montar nuevas rutas
- [ ] Actualizar `src/config/cors.ts` con `bitmapcore.net`
- [ ] Agregar rate limiting para proxies
- [ ] Agregar cache de proxies (30s TTL)
- [ ] Agregar logging de proxies
- [ ] Configurar API key de Unisat en environment
- [ ] Testear con web app en desarrollo
- [ ] Deploy a producción
