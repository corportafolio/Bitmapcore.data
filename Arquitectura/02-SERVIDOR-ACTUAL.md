# BitmapCore — Servidor Actual: BitmapCorpServer

## Información del Servidor

| Campo | Valor |
|-------|-------|
| Nombre | BitmapCorpServer |
| Repositorio | `corportafolio/Bitmapcore.server` (GitHub, main branch) |
| Ubicación local | `/home/candela/BitmapCorpServer/` |
| Ubicación VPS | `/home/bitmapcorp/BitmapCorpServer/` |
| Puerto | 3000 |
| Process Manager | PM2 (process name: `bitmapcorp-server`) |
| Dominio | `bitmapcore.net` |
| IP | `80.190.76.108` |
| SSL | Let's Encrypt via Cloudflare |

## Stack Tecnológico

| Componente | Paquete | Versión | Propósito |
|------------|---------|---------|-----------|
| Runtime | node | 20.20.2 | Ejecución JavaScript |
| Framework | express | 4.18.2 | HTTP server |
| TypeScript | typescript | 5.3.3 | Tipado fuerte |
| DB | better-sqlite3 | 11.10.0 | Base de datos SQLite síncrona |
| Bitcoin | bitcoinjs-lib | 7.0.1 | Construcción de PSBT |
| Keys | ecpair | 3.0.1 | Pares de claves Bitcoin |
| Secp | tiny-secp256k1 | 2.2.4 | Curva elíptica |
| HTTP Client | axios | 1.6.2 | Llamadas a APIs externas |
| CORS | cors | 2.8.5 | Cross-Origin Resource Sharing |
| Security | helmet | 7.2.0 | Security headers |
| Rate Limit | express-rate-limit | 7.1.5 | Limitación de requests |
| Validation | zod | 3.22.4 | Validación de request bodies |
| Logging | winston | 3.11.0 | Logging estructurado |
| UUID | uuid | 9.0.1 | Generación de IDs únicos |
| Env | dotenv | 16.3.1 | Variables de entorno |

## Estructura de Archivos del Servidor

```
BitmapCorpServer/
├── src/
│   ├── index.ts                          # Entry point, Express app setup
│   ├── config/
│   │   ├── environment.ts                # Configuración (env vars)
│   │   └── cors.ts                       # Configuración CORS
│   ├── middleware/
│   │   ├── securityHeaders.ts            # Helmet config
│   │   ├── rateLimiter.ts                # Rate limiting
│   │   ├── validation.ts                 # Zod schemas
│   │   └── errorHandler.ts              # Error handling middleware
│   ├── routes/
│   │   ├── apiRoutes.ts                  # Router principal /api/v1
│   │   ├── bitmapsRoutes.ts              # /api/v1/bitmaps/*
│   │   ├── transactionRoutes.ts          # /api/v1/transaction/*
│   │   ├── walletRoutes.ts               # /api/v1/wallet/*
│   │   └── marketplaceProxyRoutes.ts     # /api/v1/proxy/* (NUEVO)
│   ├── services/
│   │   ├── BitmapService.ts              # CRUD listings + PSBT creation
│   │   ├── TransactionService.ts         # PSBT completion + broadcast
│   │   ├── PSBTService.ts                # Construcción de PSBT
│   │   ├── OrdinalsService.ts            # Verificación via ordinals.com
│   │   ├── MempoolService.ts             # UTXOs via mempool.space
│   │   └── ProxyOrdinalswalletService.ts # (NUEVO) Proxy Ordinalswallet
│   ├── repositories/
│   │   ├── ListingRepository.ts          # CRUD SQLite listings
│   │   └── IdempotencyRepository.ts      # Keys de idempotencia
│   ├── database/
│   │   ├── db.ts                         # Conexión SQLite + init
│   │   └── migrate.ts                    # Migraciones
│   ├── types/
│   │   └── bitmap.ts                     # Interfaces TypeScript
│   ├── errors/
│   │   └── AppError.ts                   # Custom errors
│   └── utils/
│       ├── responseFormatter.ts          # sendSuccess/sendError
│       ├── bitcoinValidator.ts           # Validación direcciones BTC
│       └── logger.ts                     # Winston logger
├── data/
│   ├── bitmapcorp.db                     # SQLite DB listings
│   └── btc_bloques.db                    # SQLite DB bloques
├── web/                                  # (NUEVO) Frontend React
│   ├── dist/                             # Build de React
│   ├── src/                              # Código fuente React
│   └── package.json
├── package.json
├── tsconfig.json
├── .env.production
└── .env
```

## Endpoints Existentes — Detalle Completo

### Health Check

```
GET /api/v1/health
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1721234567890,
    "version": "v1",
    "api": "BitmapCorp API v1"
  }
}
```

### Bitmaps — Listings

```
GET /api/v1/bitmaps?page=1&limit=20
```
Listaings paginados. Retorna `{ items: BitmapListing[], total: number }`.

```
GET /api/v1/bitmaps/active
```
Todos los listings activos (isActive = true, soldAt = null).

```
GET /api/v1/bitmaps/sold?since=1720000000000
```
Listings vendidos desde un timestamp.

```
GET /api/v1/bitmaps/owner/:address
```
Inscripciones de un propietario (via ordinals.com).

```
GET /api/v1/bitmaps/:id
```
Detalle de un listing específico.

```
POST /api/v1/bitmaps
```
Crear un listing. Retorna listing + PSBT para firmar.

**Request Body:**
```json
{
  "inscriptionId": "abc123...",
  "price": 50000,
  "sellerAddress": "bc1p...",
  "name": "Bitmap #12345",
  "description": "My bitmap",
  "imageUrl": "https://...",
  "bitmapNumber": 12345,
  "inscriptionNumber": 126647869,
  "sellerOrdinalPublicKey": "02abc...",
  "sellerPaymentAddress": "bc1p..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listing": { ... },
    "psbtToSign": "cHNidP8B..."
  }
}
```

```
POST /api/v1/bitmaps/:id/sign
```
Firmar un listing con PSBT firmado.

**Request Body:**
```json
{
  "signedPsbt": "cHNidP8B...",
  "sellerOrdinalPublicKey": "02abc..."
}
```

```
PUT /api/v1/bitmaps/:id
```
Actualizar precio. Requiere header `Wallet-Address`.

```
DELETE /api/v1/bitmaps/:id
```
Eliminar listing. Requiere header `Wallet-Address`.

### Transactions

```
POST /api/v1/transaction/buy-bitmap
```
Iniciar compra de bitmap. Retorna PSBT parcialmente firmado.

**Request Body:**
```json
{
  "bitmapId": "uuid-del-listing",
  "buyerAddress": "bc1p...",
  "idempotencyKey": "unique-key-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "psbt": "cHNidP8B...",
    "transactionId": "uuid-transaccion",
    "expiresAt": 1721234867890
  }
}
```

```
POST /api/v1/transaction/broadcast
```
Transmitir PSBT firmado.

**Request Body:**
```json
{
  "signedPsbt": "cHNidP8B...",
  "transactionId": "uuid-transaccion"
}
```

```
GET /api/v1/transaction/:txid/status
```
Estado de una transacción.

### Wallet

```
GET /api/v1/wallet/:address/balance
```
Balance de una dirección Bitcoin.

```
GET /api/v1/wallet/:address/utxos
```
UTXOs disponibles para una dirección.

### Verification

```
GET /api/v1/verify-bitmap/:id
```
Verificar si una inscripción es un bitmap válido.

**Response:**
```json
{
  "success": true,
  "data": {
    "isBitmap": true,
    "blockNumber": 12345,
    "inscriptionId": "abc123..."
  }
}
```

## Base de Datos SQLite del Servidor

### Tabla: `listings`

```sql
CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  inscriptionId TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  sellerAddress TEXT NOT NULL,
  buyerAddress TEXT,
  listedAt INTEGER NOT NULL,
  soldAt INTEGER,
  imageUrl TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  bitmapNumber INTEGER,
  inscriptionNumber INTEGER,
  bitmapHash TEXT,
  ownerAddress TEXT,
  sellerOrdinalPublicKey TEXT,
  sellerPaymentAddress TEXT,
  unsignedPsbt TEXT,
  signedPsbt TEXT,
  psbtStatus TEXT DEFAULT 'created'
);
```

### Tabla: `idempotency_keys`

```sql
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  transactionId TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
```

## Configuración de CORS

### Producción (VPS)
```typescript
allowedOrigins = [
  'https://bitmapcorp.app',
  'https://www.bitmapcorp.app',
  'https://bitmapcore.net'          // NUEVO para web
]
```

### Desarrollo (local)
```typescript
allowedOrigins = [
  'http://localhost:5173',           // Vite dev server
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080'
]
```

## Configuración de Nginx (VPS actual)

```nginx
server {
    listen 443 ssl http2;
    server_name bitmapcore.net;

    ssl_certificate /etc/letsencrypt/live/bitmapcore.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bitmapcore.net/privkey.pem;

    # API - Proxy a Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000;
    }

    # Web - Archivos estáticos (NUEVO)
    location / {
        root /home/bitmapcorp/BitmapCorpServer/web/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Variables de Entorno (.env.production)

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SERVER_URL=https://bitmapcore.net
ORDINALS_API_URL=https://ordinals.com/r
MEMPOOL_API_URL=https://mempool.space/api
MARKETPLACE_FEE_PERCENT=1.0
MARKETPLACE_FEE_ADDRESS=bc1p...
DB_PATH=./data/bitmapcorp.db
BLOCKS_DB_PATH=./data/btc_bloques.db
```

## PM2 Configuration

```bash
# Iniciar servidor
pm2 start dist/index.js --name bitmapcorp-server

# Ver estado
pm2 status

# Ver logs
pm2 logs bitmapcorp-server

# Reiniciar después de cambios
pm2 restart bitmapcorp-server
```

## Qué falta para que la web funcione

| # | Cambio | Archivo | Descripción |
|---|--------|---------|-------------|
| 1 | Proxy routes | `src/routes/marketplaceProxyRoutes.ts` | Proxy a Ordinalswallet/Unisat APIs |
| 2 | CORS update | `src/config/cors.ts` | Agregar `bitmapcore.net` y `localhost:5173` |
| 3 | Static files | `src/index.ts` | Servir `web/dist/` como archivos estáticos |
| 4 | Tags endpoint | `src/routes/tagsRoutes.ts` | Endpoints para etiquetas |
| 5 | Blocks endpoint | `src/routes/blockRoutes.ts` | Activar bloque de rutas (comentado) |
| 6 | Build web | `web/` | Crear proyecto React y build |
