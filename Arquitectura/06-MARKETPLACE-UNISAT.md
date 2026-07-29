# BitmapCore — Marketplace Unisat: Documentación Completa

## Resumen

| Campo | Valor |
|-------|-------|
| Nombre | Unisat Marketplace |
| API Base URL | `https://open-api.unisat.io` |
| API Key requerida | Opcional (usuario puede poner la suya) |
| Estado | ACTIVO |
| Método de obtención | Event-sourcing (Listed, Sold, Cancel) |
| Collection ID | "bitmap" |

## API

### UnisatApi

**Archivo:** `data/network/UnisatApi.kt`

#### Endpoints Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `POST /v3/market/collection/auction/actions` | POST | Acciones del marketplace (Listed, Sold, Cancel) |
| `POST /v3/market/domain/auction/list` | POST | Listados de dominios |
| `POST /v3/market/domain/auction/actions` | POST | Acciones de dominios |
| `POST /v3/market/domain/auction/domain_types` | POST | Tipos de dominios |
| `POST /v3/market/domain/auction/domain_statistic` | POST | Estadísticas de dominios |
| `GET /v1/indexer/address/{address}/inscription-data` | GET | Inscripciones de una dirección |

#### Request: Acciones del Marketplace

```json
{
  "collection": "bitmap",
  "events": ["Listed", "Sold", "Cancel"],
  "cursor": 0,
  "size": 100
}
```

#### Response: Acciones

```json
{
  "cursor": 0,
  "total": 5000,
  "items": [
    {
      "type": "Listed",
      "inscriptionId": "abc123...",
      "inscriptionNumber": 126647869,
      "contentURI": "https://ordinals.com/content/abc123...",
      "contentType": "image/png",
      "owner": "bc1p...",
      "amount": 50000,
      "tick": "bitmap",
      "price": 50000,
      "txid": "...",
      "blockHeight": 820000,
      "timestamp": 1705312200
    }
  ]
}
```

## Método Event-Sourcing

A diferencia de Ordinalswallet (que retorna listings activos directamente), Unisat usa un enfoque de **event sourcing**:

```
1. Obtener todos los eventos Listed
2. Obtener todos los eventos Sold
3. Obtener todos los eventos Cancel
4. Calcular: Active = Listed - Sold - Cancel
```

### Flujo de Sincronización

```
UnisatRepository.sync()
│
├── 1. Obtener eventos Listed
│      POST /v3/market/collection/auction/actions
│      events: ["Listed"]
│      Guardar en UnisatCacheEntity
│
├── 2. Obtener eventos Sold
│      POST /v3/market/collection/auction/actions
│      events: ["Sold"]
│      Comparar con cache → detectar ventas
│
├── 3. Obtener eventos Cancel
│      POST /v3/market/collection/auction/actions
│      events: ["Cancel"]
│      Comparar con cache → detectar cancelaciones
│
├── 4. Calcular listings activos
│      Active = Listed - Sold - Cancel
│
└── 5. Actualizar cache
       ├── Insertar nuevos Listed
       ├── Eliminar Sold del cache
       └── Eliminar Cancel del cache
```

## Repository

### UnisatRepository

**Archivo:** `data/marketplace_data_unisat/UnisatRepository.kt`

#### Métodos Principales

| Método | Descripción |
|--------|-------------|
| `sync()` | Sync completo (primera vez) |
| `syncIncremental()` | Solo eventos nuevos |
| `getFloorPrice()` | Floor price actual |
| `getTotalListings()` | Total listings activos |
| `getStats()` | Estadísticas |
| `fetchListedEvents(cursor, size)` | Obtener eventos Listed |
| `fetchSoldEvents(cursor, size)` | Obtener eventos Sold |
| `fetchCancelEvents(cursor, size)` | Obtener eventos Cancel |

#### Gestión de API Key

```kotlin
// El usuario puede configurar su propia API key
val apiKey = userPreferences.getUnisatApiKey()
if (apiKey != null) {
    headers["Authorization"] = "Bearer $apiKey"
} else {
    headers["Authorization"] = "Bearer ${DEFAULT_API_KEY}"
}
```

#### Rate Limiting

Unisat tiene rate limiting. El repository maneja:
- `FetchResult.Success<T>` — Operación exitosa
- `FetchResult.RateLimited(message)` — Rate limited, esperar
- `FetchResult.Error(message)` — Error

## CacheManager

### UnisatCacheManager

**Archivo:** `data/marketplace_data_unisat/UnisatCacheManager.kt`

Es el **más complejo** de los 3 cache managers.

#### Métodos

| Método | Descripción |
|--------|-------------|
| `saveListings(listings)` | Guarda listings |
| `getListings()` | Obtiene todos |
| `clearCache()` | Limpia cache |
| `upsert(entity)` | Inserta o actualiza |
| `deleteByIds(ids)` | Elimina por IDs |
| `deleteByNumbers(numbers)` | Elimina por números |
| `saveActiveListings(listings)` | Guarda solo activos |
| `calculateStatsFromCache()` | Calcula stats del cache |
| `getOrderedByDate(limit)` | Ordenados por fecha |

#### Detección de Ventas vs Cancelaciones

```kotlin
// Cuando se detecta un evento Sold:
logger.info("Bitmap sold: $bitmapNumber at $timestamp")

// Cuando se detecta un evento Cancel:
logger.info("Bitmap cancelled: $bitmapNumber at $timestamp")
```

## Entidad de Cache

### UnisatCacheEntity

**Tabla:** `unisat_cache`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cacheKey` | `String` | PK, compuesto de inscriptionId |
| `bitmapNumber` | `Int?` | Número del bitmap |
| `bitmapId` | `String?` | UUID del listing |
| `listedPrice` | `Long?` | Precio en satoshis |
| `listedAt` | `Long?` | Timestamp de listado |
| `ownerAddress` | `String?` | Dirección del propietario |
| `extraData` | `String?` | Datos adicionales |
| `extraData2` | `String?` | Datos adicionales 2 |
| `timestamp` | `Long` | Timestamp del cache |
| `insertionOrder` | `Int` | Orden de inserción |

**Índices:** `cacheKey`, `bitmapNumber`, `bitmapId`

## Flujo Completo en la App

```
MarketplaceViewModel (Cerebro 2)
    │
    ├── Cada 300 segundos → executeAutoRefresh()
    │       │
    │       └── PollingPrimerPlano.execute()
    │              │
    │              ├── UnisatRepository.syncIncremental()
    │              │      │
    │              │      ├── POST open-api.unisat.io/v3/market/collection/auction/actions
    │              │      │   events: ["Listed"]
    │              │      │
    │              │      ├── POST open-api.unisat.io/v3/market/collection/auction/actions
    │              │      │   events: ["Sold"]
    │              │      │
    │              │      ├── POST open-api.unisat.io/v3/market/collection/auction/actions
    │              │      │   events: ["Cancel"]
    │              │      │
    │              │      ├── Calcular: Active = Listed - Sold - Cancel
    │              │      ├── Guardar en UnisatCacheManager
    │              │      └── Retornar nuevos listings
    │              │
    │              └── Retornar resultado del sync
    │
    ├── UnifiedMarketplaceProcessor.combine()
    │       │
    │       └── Recibe listings de Unisat + Ordinalswallet + Local
    │              ├── TaggeSource: "unisat"
    │              ├── Deduplicar por blockHeight + timestamp
    │              └── Guardar en Tabla 6 (unified_listings)
    │
    └── Actualizar companion object StateFlows
            ├── unisatFloorPrice
            ├── unisatTotalListings
            └── lowestFloorPrice (si Unisat es el más bajo)
```

## Proxy para Web

### Endpoint NUEVO en el servidor

```
POST /api/v1/proxy/unisat/actions
```

**Request Body:**
```json
{
  "events": ["Listed", "Sold", "Cancel"],
  "cursor": 0,
  "size": 100
}
```

**Response:** Misma estructura que la API de Unisat.

### Implementación

```typescript
// src/services/ProxyUnisatService.ts
import axios from 'axios';

export class ProxyUnisatService {
  private baseUrl = 'https://open-api.unisat.io';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getActions(events: string[], cursor: number = 0, size: number = 100) {
    const response = await axios.post(
      `${this.baseUrl}/v3/market/collection/auction/actions`,
      { collection: 'bitmap', events, cursor, size },
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );
    return response.data;
  }
}
```

## Estadísticas Clave

| Métrica | Valor típico |
|---------|--------------|
| Total listings activos | ~1,500-2,500 |
| Floor price | ~30,000-50,000 satoshis |
| Tamaño de respuesta | ~150KB por evento |
| Frecuencia de sync | Cada 5 minutos |
| Tiempo de respuesta API | ~300ms-1.5s |
| Rate limit | Depende de API key |
