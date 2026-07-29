# BitmapCore — Marketplace Ordinalswallet: Documentación Completa

## Resumen

| Campo | Valor |
|-------|-------|
| Nombre | Ordinalswallet Marketplace |
| API Base URL | `https://turbo.ordinalswallet.com` |
| API Key requerida | No |
| Estado | ACTIVO |
| Archivos Android | 5 (API, Repository, CacheManager, CacheDao, CacheEntity, Database) |
| Polling interval | Cada 300 segundos (5 minutos) |
| Método de obtención | HTTP GET con límite de 10,000 items |

## APIs

### OrdinalswalletApi

**Archivo:** `data/network/OrdinalswalletApi.kt`

#### Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /collection/bitmap/escrows?limit=10000` | GET | Listings activos (escrows) |
| `GET /collection/bitmap/sold-escrows?limit=10000` | GET | Listings vendidos |
| `GET /collection/bitmap/stats` | GET | Estadísticas de la colección |

#### Response: Escrows (Listings Activos)

```json
[
  {
    "id": "uuid",
    "inscriptionId": "abc123...",
    "contentURI": "https://ordinals.com/content/abc123...",
    "contentType": "image/png",
    "owner": "bc1p...",
    "listedPrice": 50000,
    "listedAt": "2024-01-15T10:30:00Z",
    "genesisTransactionBlockHeight": 820000
  }
]
```

#### Response: Stats

```json
{
  "floorPrice": 35000,
  "totalListed": 2500,
  "totalVolume": 15000000
}
```

## Repository

### OrdinalswalletRepository

**Archivo:** `data/marketplace_data_ordinalswallet/OrdinalswalletRepository.kt`

#### Flujo de Sincronización

```
pollListings()
│
├── 1. Primera vez (cache vacío)
│      ├── GET /collection/bitmap/escrows?limit=10000
│      ├── Mapear a OrdinalswalletCacheEntity
│      ├── Guardar en OrdinalswalletCacheDao
│      └── Guardar stats en cache
│
├── 2. Incremental (cache tiene datos)
│      ├── GET /collection/bitmap/escrows?limit=10000
│      ├── Comparar con timestamps guardados
│      ├── Solo guardar items nuevos (listedAt > lastSync)
│      └── Eliminar items que ya no están activos
│
└── 3. Detección de ventas
       ├── GET /collection/bitmap/sold-escrows?limit=10000
       ├── Comparar con cache de activos
       ├── Los que aparecen en sold y no en active → vendidos
       └── Actualizar Tabla 7 (sold_listings)
```

#### Métodos Principales

| Método | Descripción |
|--------|-------------|
| `pollListings()` | Sync completo o incremental |
| `syncIncremental()` | Solo items nuevos desde última sync |
| `getFloorPrice()` | Obtiene floor price actual |
| `getTotalListings()` | Total de listings activos |
| `getStats()` | Estadísticas de la colección |

## CacheManager

### OrdinalswalletCacheManager

**Archivo:** `data/marketplace_data_ordinalswallet/OrdinalswalletCacheManager.kt`

#### Métodos

| Método | Descripción |
|--------|-------------|
| `saveListings(listings)` | Guarda listings en cache |
| `getListings()` | Obtiene listings del cache |
| `clearCache()` | Limpia todo el cache |
| `saveStats(stats)` | Guarda estadísticas |
| `getStats()` | Obtiene estadísticas |
| `getBitmapCount()` | Cantidad de bitmaps en cache |
| `getLastUpdateTime()` | Última actualización |
| `updateBitmapPrice(bitmapNumber, price)` | Actualiza precio individual |
| `deleteByNumber(bitmapNumber)` | Elimina por número |

## Entidad de Cache

### OrdinalswalletCacheEntity

**Tabla:** `ordinalswallet_cache`

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

## Flujo Completo en la App

```
MarketplaceViewModel (Cerebro 2)
    │
    ├── Cada 300 segundos → executeAutoRefresh()
    │       │
    │       └── PollingPrimerPlano.execute()
    │              │
    │              ├── OrdinalswalletRepository.syncIncremental()
    │              │      │
    │              │      ├── GET turbo.ordinalswallet.com/collection/bitmap/escrows
    │              │      ├── Mapear respuesta a CacheEntity
    │              │      ├── Guardar en OrdinalswalletCacheManager
    │              │      └── Retornar nuevos listings
    │              │
    │              └── Retornar resultado del sync
    │
    ├── UnifiedMarketplaceProcessor.combine()
    │       │
    │       └── Recibe listings de Ordinalswallet + Unisat + Local
    │              ├── TaggeSource: "ordinalswallet"
    │              ├── Deduplicar por blockHeight + timestamp
    │              └── Guardar en Tabla 6 (unified_listings)
    │
    └── Actualizar companion object StateFlows
            ├── ordinalsFloorPrice
            ├── ordinalsTotalListings
            └── lowestFloorPrice (si Ordinalswallet es el más bajo)
```

## Proxy para Web

### Endpoint NUEVO en el servidor

```
GET /api/v1/proxy/ordinalswallet/listings
GET /api/v1/proxy/ordinalswallet/sold
GET /api/v1/proxy/ordinalswallet/stats
```

**Por qué se necesita proxy:** El navegador no puede llamar directamente a `turbo.ordinalswallet.com` por restricciones CORS. El servidor actúa de intermediario.

### Implementación

```typescript
// src/routes/marketplaceProxyRoutes.ts
router.get('/ordinalswallet/listings', async (req, res) => {
  const response = await axios.get(
    'https://turbo.ordinalswallet.com/collection/bitmap/escrows',
    { params: { limit: 10000 } }
  );
  sendSuccess(res, response.data);
});
```

### Consumo desde Web

```typescript
// marketplaceProxyApi.ts
export const getOrdinalswalletListings = async (): Promise<Listing[]> => {
  const response = await axios.get('/api/v1/proxy/ordinalswallet/listings');
  return response.data.data;
};
```

## Estadísticas Clave

| Métrica | Valor típico |
|---------|--------------|
| Total listings activos | ~2,500-3,500 |
| Floor price | ~30,000-50,000 satoshis |
| Tamaño de respuesta | ~200KB (10,000 items max) |
| Frecuencia de sync | Cada 5 minutos |
| Tiempo de respuesta API | ~500ms-2s |
