# 23 - API Reference Completa - BitmapCorpServer

## 1. Propósito

Documento completo de TODOS los endpoints del BitmapCorpServer (`bitmapcore.net:3000`). Incluye métodos, paths, request bodies, response bodies, middlewares y validaciones.

---

## 2. Información General

| Propiedad | Valor |
|-----------|-------|
| Base URL | `https://bitmapcore.net` (producción) |
| Base URL Dev | `http://localhost:3000` |
| Prefijo | `/api/v1` |
| Puerto | 3000 |
| Formato | JSON (`application/json`) |
| Rate Limit General | 10 req/min por IP |
| Rate Limit Compras | 5 req/min por wallet |
| CORS Producción | `https://bitmapcore.net` |
| CORS Desarrollo | `http://localhost:5173` |

---

## 3. Estandar de Respuesta

Todas las respuestas siguen el formato:

```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

## 4. Endpoints

### 4.1 Health & Version

#### `GET /health`
Health check global (bypass rate limit).

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1753000000000
  }
}
```

#### `GET /api/v1/health`
Health check con version info.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1753000000000,
    "version": "v1",
    "api": "BitmapCorp API v1"
  }
}
```

#### `GET /api/v1/version`
Información de versión y documentación.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "v1",
    "endpoints": "/api/v1",
    "documentation": "https://docs.bitmapcorp.app/v1"
  }
}
```

---

### 4.2 Bitmaps - Listings

#### `GET /api/v1/bitmaps/`
Listings paginados activos.

**Query Params:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | 1 | Número de página |
| `limit` | number | 20 | Resultados por página |

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "inscriptionId": "ef7563eb...bi0",
        "name": "942029.bitmap",
        "description": "",
        "price": 12000,
        "sellerAddress": "bc1q...",
        "buyerAddress": null,
        "listedAt": 1753000000000,
        "soldAt": null,
        "imageUrl": "https://...",
        "isActive": true,
        "bitmapNumber": 942029,
        "inscriptionNumber": 126875838,
        "psbtStatus": "signed",
        "sellerOrdinalPublicKey": "02...",
        "sellerPaymentAddress": "bc1q..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10913
    }
  }
}
```

---

#### `GET /api/v1/bitmaps/active`
Todos los listings activos (sin paginación).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "inscriptionId": "ef7563eb...bi0",
      "name": "942029.bitmap",
      "price": 12000,
      "sellerAddress": "bc1q...",
      "isActive": true,
      "psbtStatus": "signed",
      "signedPsbt": "cHNidP8B..."
    }
  ]
}
```

---

#### `GET /api/v1/bitmaps/sold`
Listings vendidos desde un timestamp.

**Query Params:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `since` | number | 0 | Timestamp en milisegundos |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "inscriptionId": "ef7563eb...bi0",
      "price": 12000,
      "buyerAddress": "bc1q...",
      "soldAt": 1753000100000,
      "isActive": false
    }
  ]
}
```

---

#### `GET /api/v1/bitmaps/owner/:address`
Inscripciones de un propietario.

**Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `address` | string | Dirección Bitcoin (26-62 chars) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "inscriptionId": "ef7563eb...bi0",
      "name": "942029.bitmap",
      "price": 12000,
      "sellerAddress": "bc1q..."
    }
  ]
}
```

---

#### `GET /api/v1/bitmaps/:id`
Listing por UUID.

**Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | ID del listing |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "inscriptionId": "ef7563eb...bi0",
    "name": "942029.bitmap",
    "price": 12000,
    "sellerAddress": "bc1q...",
    "isActive": true,
    "psbtStatus": "signed",
    "signedPsbt": "cHNidP8B..."
  }
}
```

---

#### `POST /api/v1/bitmaps/`
Crear nuevo listing + PSBT template.

**Middleware:** `validateBody(createListingSchema)`

**Request Body:**
```json
{
  "inscriptionId": "ef7563ebd206be7271685774b39eec7c188ff57f763e08b31e84732848c8101bi0",
  "price": 12000,
  "sellerAddress": "bc1qar9sqrffuejxke7rz84a37tqystuzulkywptfrg",
  "sellerOrdinalPublicKey": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
  "sellerPaymentAddress": "bc1qar9sqrffuejxke7rz84a37tqystuzulkywptfrg",
  "name": "942029.bitmap",
  "description": "Optional description",
  "imageUrl": "https://bitmapcore.net/images/942029.png"
}
```

**Validaciones (Zod):**
| Campo | Tipo | Validación |
|-------|------|------------|
| `inscriptionId` | string | min 10 chars |
| `price` | number | > 0 |
| `sellerAddress` | string | 26-62 chars |
| `sellerOrdinalPublicKey` | string | 66-130 chars |
| `sellerPaymentAddress` | string | 26-62 chars |
| `name` | string | 1-255 chars |
| `description` | string | optional |
| `imageUrl` | string | URL válida |

**Flujo del servidor:**
1. Valida dirección Bitcoin
2. Verifica que no esté ya listado activo
3. `verifyBitmap(inscriptionId)` → confirma que es bitmap real
4. `verifyOwnership(inscriptionId, sellerAddress)` → confirma propiedad
5. Obtiene UTXO de la inscripción desde ordinals.com
6. Construye PSBT template (input: inscription UTXO, output: sellerPaymentAddress + price)
7. Guarda listing en DB con `psbtStatus: 'created'`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "inscriptionId": "ef7563eb...bi0",
    "name": "942029.bitmap",
    "price": 12000,
    "sellerAddress": "bc1q...",
    "isActive": true,
    "psbtStatus": "created",
    "unsignedPsbt": "cHNidP8B..."
  }
}
```

---

#### `POST /api/v1/bitmaps/:id/sign`
Firmar listing PSBT (vendedor firma).

**Middleware:** `validateUUID('id')`, `validateBody(signListingSchema)`

**Request Body:**
```json
{
  "signedPsbt": "cHNidP8BA...",
  "sellerOrdinalPublicKey": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
}
```

**Validaciones:**
| Campo | Tipo | Validación |
|-------|------|------------|
| `signedPsbt` | string | min 20 chars |
| `sellerOrdinalPublicKey` | string | 66-130 chars |

**Flujo del servidor:**
1. Valida que el PSBT firmado sea válido (deserializa correctamente)
2. Verifica que tenga 1 input y 1 output
3. Verifica que el output value coincida con el precio
4. Verifica que la dirección del output coincida con `sellerPaymentAddress`
5. Valida la firma del vendedor
6. Guarda `signedPsbt` en DB, actualiza `psbtStatus: 'signed'`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "psbtStatus": "signed",
    "isActive": true
  }
}
```

---

#### `PUT /api/v1/bitmaps/:id`
Actualizar precio de listing.

**Middleware:** `validateUUID('id')`, `validateBody(updateListingSchema)`
**Header requerido:** `Wallet-Address: bc1q...`

**Request Body:**
```json
{
  "price": 15000
}
```

**Validaciones:**
| Campo | Tipo | Validación |
|-------|------|------------|
| `price` | number | > 0, optional |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "price": 15000
  }
}
```

---

#### `DELETE /api/v1/bitmaps/:id`
Eliminar listing.

**Middleware:** `validateUUID('id')`
**Header requerido:** `Wallet-Address: bc1q...`

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

### 4.3 Transacciones (Compras)

#### `POST /api/v1/transaction/buy-bitmap`
Crear PSBT de compra (comprador).

**Middleware:** `validateBody(buyBitmapSchema)`, `purchaseLimiter`

**Request Body:**
```json
{
  "bitmapId": "uuid-del-listing",
  "buyerAddress": "bc1qar9sqrffuejxke7rz84a37tqystuzulkywptfrg",
  "idempotencyKey": "uuid-unico-para-esta-operacion"
}
```

**Validaciones:**
| Campo | Tipo | Validación |
|-------|------|------------|
| `bitmapId` | uuid | UUID válido |
| `buyerAddress` | string | 26-62 chars |
| `idempotencyKey` | uuid | UUID único por operación |

**Flujo del servidor:**
1. Valida dirección Bitcoin del comprador
2. Verifica idempotency (si ya existe, retorna cache)
3. Busca listing por `bitmapId`, verifica que esté activo y `psbtStatus: 'signed'`
4. Obtiene UTXOs del comprador desde mempool.space
5. Selecciona UTXOs confirmados para cubrir: `price + marketplaceFee(1%) + dustLimit(546)`
6. Completa PSBT: agrega inputs del comprador, outputs (seller payment, marketplace fee, buyer change)
7. Guarda transacción en DB
8. Retorna PSBT completo para que el comprador firme

**Response:**
```json
{
  "success": true,
  "data": {
    "psbt": "cHNidP8BA...",
    "transactionId": "tx_m5x2k8a3...",
    "expiresAt": 1753003600000
  }
}
```

---

#### `POST /api/v1/transaction/broadcast`
Broadcast de PSBT firmado.

**Middleware:** `validateBody(broadcastSchema)`, `purchaseLimiter`

**Request Body:**
```json
{
  "signedPsbt": "cHNidP8BA...",
  "transactionId": "tx_m5x2k8a3..."
}
```

**Validaciones:**
| Campo | Tipo | Validación |
|-------|------|------------|
| `signedPsbt` | string | min 20 chars |
| `transactionId` | uuid | UUID válido |

**Flujo del servidor:**
1. Busca transacción por ID
2. Verifica que no haya expirado
3. Finaliza PSBT (valida todas las firmas)
4. Extrae transacción raw
5. Broadcast a mempool.space/api/tx
6. Si éxito: marca listing como vendido
7. Si falla: reintenta hasta 3 veces

**Response:**
```json
{
  "success": true,
  "data": {
    "txid": "abc123...",
    "status": "broadcasted"
  }
}
```

---

#### `GET /api/v1/transaction/:txid/status`
Estado de una transacción.

**Middleware:** `validateUUID('txid')`

**Response:**
```json
{
  "success": true,
  "data": {
    "txid": "abc123...",
    "status": "confirmed",
    "confirmations": 3,
    "blockHeight": 850000
  }
}
```

---

#### `GET /api/v1/transaction/wallet/:address/balance`
Balance de wallet.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 0.00123456,
    "satoshis": 123456,
    "utxos": 5
  }
}
```

---

#### `GET /api/v1/transaction/wallet/:address/utxos`
UTXOs de wallet.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "txid": "abc123...",
      "vout": 0,
      "value": 50000,
      "status": {
        "confirmed": true
      }
    }
  ]
}
```

---

### 4.4 Wallet

#### `GET /api/v1/wallet/:address/balance`
Balance de wallet con validación de dirección.

**Middleware:** `isValidBitcoinAddress`

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 0.00123456,
    "satoshis": 123456,
    "utxos": 5
  }
}
```

---

### 4.5 Verificación

#### `GET /api/v1/verify-bitmap/:id`
Verificar si una inscripción es un bitmap válido.

**Response:**
```json
{
  "success": true,
  "data": {
    "isBitmap": true,
    "blockNumber": 942029,
    "inscriptionId": "ef7563eb...bi0"
  }
}
```

---

## 5. Errores Comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | `Invalid seller Bitcoin address` | Dirección malformada |
| 400 | `Bitmap is already listed for sale` | Inscripción ya tiene listing activo |
| 400 | `This inscription is not a valid Bitmap` | La inscripción no es un bitmap |
| 400 | `You are not the owner of this Bitmap` | sellerAddress no coincide con owner |
| 400 | `Price exceeds inscription value` | Precio mayor al valor UTXO |
| 400 | `Listing is not ready for purchase` | PSBT no está firmado |
| 400 | `PSBT has expired` | PSBT pasó el tiempo límite |
| 400 | `Insufficient funds` | Comprador no tiene suficientes UTXOs |
| 404 | `Bitmap listing not found` | Listing no existe |
| 429 | `Too many requests` | Rate limit excedido |

---

## 6. Seguridad

| Feature | Implementación |
|---------|---------------|
| Rate Limiting | `express-rate-limit` con windowMs configurável |
| Security Headers | Helmet (CSP, HSTS, X-Frame-Options) |
| CORS | Orígenes permitidos en config |
| Input Validation | Zod schemas para todos los POST/PUT |
| UUID Validation | Regex pattern para params |
| PII Logging | Direcciones enmascaradas, PSBTs redactados |
| Idempotency | Keys con TTL 24h, limpieza cada hora |

---

## 7. Tablas de la DB

| Tabla | Propósito |
|-------|-----------|
| `listings` | Bitmaps en venta con campos PSBT |
| `transactions` | Transacciones de compra |
| `idempotency_keys` | Prevención de duplicados |

**Índices:** 8 índices para optimizar consultas por inscriptionId, sellerAddress, isActive, psbtStatus, etc.

---

## 8. Proxy Routes (NO EXISTEN - Pendientes de Crear)

Las siguientes rutas están planeadas pero **NO existen** en el servidor actual:

| Ruta | Propósito | Estado |
|------|-----------|--------|
| `GET /api/v1/proxy/ordinalswallet/*` | Proxy a ordinalswallet.com API | ❌ No existe |
| `GET /api/v1/proxy/unisat/*` | Proxy a open-api.unisat.io | ❌ No existe |
| `GET /api/v1/tags/*` | Gestión de etiquetas de bloques | ❌ No existe |

**Nota:** Estas rutas serán necesarias para la versión web (CORS) y deben ser implementadas antes del deploy.

---

## 9. Endpoints Planeados (NO Implementados)

| Endpoint | Propósito | Estado |
|----------|-----------|--------|
| `GET /api/v1/tags/:blockNumber` | Obtener etiquetas de un bloque | ❌ No existe |
| `POST /api/v1/tags/batch` | Obtener etiquetas de múltiples bloques | ❌ No existe |
| `GET /api/v1/tags/stats` | Estadísticas de etiquetas | ❌ No existe |
| `GET /api/v1/tags/grouped` | Etiquetas agrupadas por precio | ❌ No existe |
| `POST /api/v1/admin/update-tags` | Actualizar etiquetas (admin) | ❌ No existe |
| `GET /api/v1/marketplace/stats` | Estadísticas del marketplace | ❌ No existe |
| `GET /api/v1/marketplace/floor` | Floor price por marketplace | ❌ No existe |
| `POST /api/v1/marketplace/search` | Búsqueda avanzada de listings | ❌ No existe |
