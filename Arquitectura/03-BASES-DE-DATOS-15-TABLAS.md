# BitmapCore — Bases de Datos: Las 15 Tablas Room (Completo)

## Resumen de las 15 Bases de Datos

| # | Database Class | Archivo DB | Versión | Entidades | DAOs | Propósito |
|---|---------------|-----------|---------|-----------|------|-----------|
| 1 | `BlockDatabase` | `bitmapcorp_database.db` | 12 | 3 | 4 | Bloques Bitcoin + etiquetas |
| 2 | `BitMapCoreDatabase` | `bitmapcorp_wallet.db` | 7 | 3 | 3 | Wallets, transacciones, cache |
| 3 | `OkxDatabase` | `okx_cache.db` | 1 | 2 | 1 | Cache OKX (desactivado) |
| 4 | `EtiquetasPorPrecioDatabase` | `etiquetas_por_precio.db` | 3 | 1 | 1 | Tags por precio |
| 5 | `BlockImageCacheDatabase` | `block_image_cache.db` | 1 | 1 | 1 | Imágenes permanentes (Tabla 12) |
| 6 | `Tabla13Database` | `temp_table_13.db` | 1 | 1 | 1 | Buffer temporal imágenes |
| 7 | `BlockSpecificDatabase` | `block_specific_temp.db` | 1 | 2 | 1 | Detalle transacciones bloque |
| 8 | `BlockPermanentDatabase` | `block_permanent_images.db` | 1 | 1 | 1 | Pesos permanentes |
| 9 | `DescuentosDatabase` | `descuentos.db` | 1 | 1 | 1 | Descuentos (Tabla 11) |
| 10 | `UnifiedListingsDatabase` | `unified_listings.db` | 1 | 1 | 1 | Listings unificados (Tabla 6) |
| 11 | `MisActivosDatabase` | `mis_activos.db` | 2 | 2 | 2 | Inscripciones usuario (Tabla 15) |
| 12 | `SelectorScreenDatabase` | `selector_screen_cache.db` | 1 | 3 | 1 | Cache pantalla selector (Tabla 14) |
| 13 | `UnisatDatabase` | `unisat_cache.db` | 1 | 1 | 1 | Cache Unisat |
| 14 | `OrdinalswalletDatabase` | `ordinalswallet_cache.db` | 2 | 1 | 1 | Cache Ordinalswallet |
| 15 | `SoldListingsDatabase` | `sold_listings.db` | 1 | 1 | 1 | Listings vendidos (Tabla 7) |

---

## TABLA 1: BlockDatabase

**Archivo:** `data/BlockDatabase.kt`
**DB File:** `bitmapcorp_database.db`
**Versión:** 12 (ha tenido 12 migraciones)
**Tamaño aprox:** ~350MB

### Entidades

#### BlockEntity
**Tabla:** `blocks`
**Propósito:** Almacena todos los bloques de Bitcoin con sus datos.

| Columna | Tipo Kotlin | Tipo SQLite | Descripción |
|---------|-------------|-------------|-------------|
| `bloque` | `Int` | `INTEGER` | **PRIMARY KEY** — Número de bloque |
| `totalBtc` | `String` | `TEXT` | Total BTC en el bloque |
| `totalTransacciones` | `String` | `TEXT` | Número total de transacciones |
| `etiquetas` | `String` | `TEXT` | Etiquetas separadas por `\|` |
| `mempool` | `String` | `TEXT` | Datos de mempool |
| `hash` | `String` | `TEXT` | Hash del bloque |

**Ejemplo de `etiquetas`:**
```
|2 tx perfect|punk|sub10k|prime number|
```

#### TagTableEntity
**Tabla:** `tag_tables`
**Propósito:** Metadatos de cada tabla de etiquetas clasificada.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `tagName` | `String` | **PRIMARY KEY** — Nombre de la etiqueta |
| `totalBlocks` | `Int` | Total de bloques con esta etiqueta |
| `distinctBlockCount` | `Int` | Bloques distintos |
| `lastUpdated` | `Long` | Última actualización |
| `classificationDurationMillis` | `String` | Duración de clasificación |
| `preview` | `String` | Preview de los primeros bloques |

#### TaggedBlockEntity
**Tabla:** `tagged_blocks`
**Propósito:** Bloques clasificados por etiqueta individual.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `bloque` | `Int` | PK compuesto — Número de bloque |
| `etiquetaIndividual` | `String` | PK compuesto — Etiqueta individual |
| `tagName` | `String` | Nombre de la tabla de etiquetas |
| `totalBtc` | `String` | BTC del bloque |
| `totalTransacciones` | `String` | Transacciones del bloque |
| `etiquetas` | `String` | Todas las etiquetas del bloque |
| `mempool` | `String` | Datos mempool |
| `hash` | `String` | Hash del bloque |
| `total_etiquetas_en_bloque` | `Int` | Total de etiquetas |

**Índices:** `Index(value = ["tagName", "bloque"])`

### DAOs

#### BlockDao (60+ métodos)
Métodos principales:
- `getBlocksByEtiqueta(etiqueta)` — Buscar bloques por etiqueta
- `getBlocksByNumbers(blockNumbers)` — Bloques por números
- `getTotalBlockCount()` — Total de bloques
- `insertBlocks(blocks)` — Insertar bloques
- `getMinMaxFast()` — Min/max bloque rápido
- `getBlockByNumber(blockNumber)` — Un bloque específico
- `fastInsertRange(tagName, minTx, maxTx)` — Inserción rápida por rango
- `fastInsertMillonarias(tagName)` — Bloques multimillonarios
- `fastInsertPunk(tagName)` — Bloques punk
- `fastInsertPalindrome(tagName)` — Palíndromos
- `fastInsertPrimeNumber(tagName, primes)` — Números primos
- `fastInsertFibonacci(tagName)` — Fibonacci
- `fastInsertBinary(tagName)` — Binarios
- `fastInsertIsEpic(tagName)` — Épicos (multiplos de 210000)
- `fastInsertIsRare(tagName)` — Raros (multiplos de 2016)
- `getB4TagsByBlocks(blockNumbers)` — Tags B4 agregados

#### TaggedBlockDao (20+ métodos)
- `getBlocksByTagName(tagName)` — Bloques por nombre de tabla
- `getTaggedBlocksByNumber(blockNumber)` — Etiquetas de un bloque
- `searchByTagName(query)` — Búsqueda por nombre
- `getDistinctEtiquetasByTag(tagName)` — Etiquetas distintas
- `deleteTaggedBlocksByTagName(tagName)` — Eliminar por tabla

#### TagTableDao (12 métodos)
- `getAllTagTables()` — Todas las tablas
- `getTagTableByName(tagName)` — Una tabla específica
- `updateTagTableStats(...)` — Actualizar estadísticas

#### OutDao (20+ métodos)
- `getBlocksForTag(tagName)` — Bloques para una etiqueta
- `getBlocksMinimalExact(tagName)` — Proyección mínima
- `getBlocksMinimalPaged(tagName, limit, offset)` — Paginado
- `savePreview(tagName, preview)` — Guardar preview

---

## TABLA 2: BitMapCoreDatabase

**Archivo:** `data/local-bitmapcore-marketplace/database/BitMapCoreDatabase.kt`
**DB File:** `bitmapcorp_wallet.db`
**Versión:** 7

### Entidades

#### BitMapCoreWalletEntity
**Tabla:** `bitmapcorp_wallets`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `address` | `String` | Dirección Bitcoin |
| `pubkey` | `String?` | Clave pública |
| `walletType` | `String` | "unisat", "xverse", "ordinalwallet" |
| `connectedAt` | `Long` | Timestamp conexión |
| `isConnected` | `Boolean` | Si está conectada |
| `lastUsedAt` | `Long?` | Último uso |

#### BitMapCoreTransactionEntity
**Tabla:** `bitmapcorp_transactions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `bitmapId` | `String` | UUID del listing |
| `buyerAddress` | `String` | Dirección comprador |
| `sellerAddress` | `String` | Dirección vendedor |
| `price` | `Long` | Precio en satoshis |
| `status` | `String` | PENDING/AWAITING_SIGNATURE/BROADCASTING/SUCCESS/ERROR |
| `timestamp` | `Long` | Timestamp |
| `psbt` | `String?` | PSBT firmado |
| `txid` | `String?` | TX ID de la transacción |

#### BitmapCacheEntity
**Tabla:** `bitmapcorp_server_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cacheKey` | `String` | PK |
| `bitmapNumber` | `Int?` | Número del bitmap |
| `bitmapId` | `String?` | ID del listing |
| `listedPrice` | `Long?` | Precio listado |
| `listedAt` | `Long?` | Timestamp listado |
| `ownerAddress` | `String?` | Dirección propietario |
| `inscriptionNumber` | `Int?` | Número de inscripción |
| `bitmapHash` | `String?` | Hash del bitmap |
| `name` | `String?` | Nombre |
| `imageUrl` | `String?` | URL de imagen |
| `timestamp` | `Long` | Timestamp cache |

**Índices:** `cacheKey`, `bitmapNumber`, `bitmapId`

---

## TABLA 3: OkxDatabase (DESACTIVADO)

**Archivo:** `data/marketplace_data_okx/OkxDatabase.kt`
**DB File:** `okx_cache.db`

> **NOTA:** OKX está desactivado como marketplace. Esta DB existe pero no se usa activamente.

### Entidades

#### OkxCacheEntity
**Tabla:** `okx_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cacheKey` | `String` | PK |
| `bitmapNumber` | `Int?` | Número bitmap |
| `bitmapId` | `String?` | ID listing |
| `listedPrice` | `Long?` | Precio |
| `listedAt` | `Long?` | Timestamp |
| `ownerAddress` | `String?` | Propietario |
| `extraData` | `String?` | Datos extra |
| `extraData2` | `String?` | Datos extra 2 |
| `timestamp` | `Long` | Timestamp cache |
| `insertionOrder` | `Int` | Orden de inserción |

#### OkxStatsCacheEntity
**Tabla:** `okx_stats_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cacheKey` | `String` | PK, default "okx_stats" |
| `floorPrice` | `Long?` | Precio piso |
| `totalListed` | `Int?` | Total listados |
| `totalVolume` | `Long?` | Volumen total |
| `timestamp` | `Long` | Timestamp |

---

## TABLA 4: EtiquetasPorPrecioDatabase

**Archivo:** `data/etiquetas_por_precio/EtiquetasPorPrecioDatabase.kt`
**DB File:** `etiquetas_por_precio.db`
**Versión:** 3

### Entidad

#### EtiquetasPorPrecioEntity
**Tabla:** `etiquetas_por_precio`
**Propósito:** Clasificación de listings por etiqueta y rango de precio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `bitmapNumber` | `Int` | Número del bitmap |
| `etiqueta` | `String` | Nombre de la etiqueta |
| `precio` | `Long` | Precio en satoshis |
| `rangoPrecio` | `String` | "bajo" (0-10000), "medio" (10001-50000), "alto" (50001+) |
| `createdAt` | `Long` | Timestamp creación |
| `listedAtTimestamp` | `Long` | Timestamp de listado |
| `source` | `String` | Fuente: "unisat", "ordinalswallet", "local" |

**Índices:** `etiqueta`, `rangoPrecio`, `bitmapNumber`

---

## TABLA 5: BlockImageCacheDatabase (Tabla 12)

**Archivo:** `data/generador_de_imagenes_bitmap/imagenes_permanentes_tabla_12/BlockImageCacheDatabase.kt`
**DB File:** `block_image_cache.db`
**Propósito:** Almacena las imágenes Mondrian generadas permanentemente.

### Entidad

#### BlockImageCacheEntity
**Tabla:** `block_images_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `blockNumber` | `Int` | PK — Número de bloque |
| `imageBytes` | `ByteArray?` | Bytes de la imagen (null = pendiente) |
| `timestamp` | `Long` | Timestamp |
| `createdAt` | `Long?` | Cuándo Cerebro 7 generó la imagen |

**Lógica:** Si `imageBytes` es `null`, la imagen está pendiente de generación.

---

## TABLA 6: Tabla13Database (Buffer Temporal)

**Archivo:** `data/generador_de_imagenes_bitmap/tabla_TEMPORAL_13/Tabla13Database.kt`
**DB File:** `temp_table_13.db`
**Propósito:** Buffer temporal de bloques pendientes de generar imagen.

### Entidad

#### BlockTempDataEntity
**Tabla:** `temp_table_13`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `blockNumber` | `Int` | PK |
| `minBlock` | `Int` | Bloque mínimo |
| `maxBlock` | `Int` | Bloque máximo |
| `totalTransactions` | `Int` | Total transacciones |
| `blockHash` | `String?` | Hash del bloque |
| `isPerfect` | `Boolean` | Si es perfecto |
| `isPunk` | `Boolean` | Si es punk |
| `rawTags` | `String?` | Tags raw |
| `timestamp` | `Long` | Timestamp |

---

## TABLA 7: BlockSpecificDatabase

**Archivo:** `data/generador_de_imagenes_bitmap/tabla_temporal/BlockSpecificDatabase.kt`
**DB File:** `block_specific_temp.db`
**Propósito:** Detalle de transacciones por bloque específico.

### Entidades

#### BlockSummaryEntity
**Tabla:** `block_specific_summary`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `blockNumber` | `Int` | PK |
| `totalTransactions` | `Int` | Total transacciones |
| `totalBtc` | `Double` | Total BTC |
| `totalFee` | `Double` | Total fees |
| `totalWeight` | `Int` | Peso total |
| `timestamp` | `Long` | Timestamp |

#### BlockTransactionEntity
**Tabla:** `block_specific_transactions`
**FK:** `blockNumber` → `BlockSummaryEntity.blockNumber` (CASCADE)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `blockNumber` | `Int` | FK al resumen |
| `transactionIndex` | `Int` | Índice de transacción |
| `weight` | `Int` | Peso |
| `btc` | `Double` | BTC |
| `fee` | `Double` | Fee |
| `satPerVB` | `Int` | Sat/vB |

---

## TABLA 8: BlockPermanentDatabase

**Archivo:** `data/generador_de_imagenes_bitmap/tabla_temporal/BlockPermanentDatabase.kt`
**DB File:** `block_permanent_images.db`

### Entidad

#### BlockPermanentWeightsEntity
**Tabla:** `block_permanent_weights`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `blockNumber` | `Int` | PK |
| `weightsString` | `String` | Formato: `"| tx 1: 440 sv | tx 2: 2084 sv | ..."` |
| `updatedAt` | `Long` | Timestamp |

---

## TABLA 9: DescuentosDatabase (Tabla 11)

**Archivo:** `data/tabla_descuentos/DescuentosDatabase.kt`
**DB File:** `descuentos.db`

### Entidad

#### DescuentosEntity
**Tabla:** `descuentos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `bitmapNumber` | `Int` | Número bitmap |
| `bitmapName` | `String?` | Nombre |
| `listedPrice` | `Long` | Precio listado |
| `discountPercentage` | `Double` | Porcentaje descuento |
| `etiqueta` | `String` | Etiqueta |
| `source` | `String` | Fuente |
| `listedAtTimestamp` | `Long?` | Timestamp listado |

---

## TABLA 10: UnifiedListingsDatabase (Tabla 6)

**Archivo:** `data/unified_listings/UnifiedListingsDatabase.kt`
**DB File:** `unified_listings.db`

### Entidad

#### UnifiedListingEntity
**Tabla:** `unified_listings`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `String` | PK |
| `inscriptionId` | `String` | ID de inscripción |
| `contentURI` | `String?` | URI del contenido |
| `contentType` | `String?` | Tipo de contenido |
| `owner` | `String` | Propietario |
| `listedPrice` | `Long` | Precio |
| `listedAt` | `Long?` | Timestamp listado |
| `listedAtTimestamp` | `Long?` | Timestamp alternativo |
| `genesisTransactionBlockHeight` | `Long?` | Altura del bloque genesis |
| `source` | `String` | "unisat", "ordinalswallet", "local" |
| `name` | `String?` | Nombre |
| `createdAt` | `Long` | Timestamp creación |
| `updatedAt` | `Long` | Timestamp actualización |

**Índices:** `source`, `listedPrice`, `listedAtTimestamp`, `inscriptionId`

---

## TABLA 11: MisActivosDatabase (Tabla 15)

**Archivo:** `data/mis_activos_tabla_15/MisActivosDatabase.kt`
**DB File:** `mis_activos.db`
**Versión:** 2

### Entidades

#### UserInscriptionCacheEntity
**Tabla:** `user_inscription_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `walletAddress` | `String` | PK |
| `inscriptionsJson` | `String` | JSON serializado de inscripciones |
| `inscriptionCount` | `Int` | Total inscripciones |
| `lastUpdatedAt` | `Long` | Última actualización |

#### UserInscriptionImageEntity
**Tabla:** `user_inscription_image_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `inscriptionId` | `String` | PK |
| `walletAddress` | `String` | Dirección wallet |
| `imageBytes` | `ByteArray` | Bytes de imagen |
| `contentType` | `String` | Tipo de contenido |
| `cachedAt` | `Long` | Timestamp cache |

---

## TABLA 12: SelectorScreenDatabase (Tabla 14)

**Archivo:** `data/selectorscreen-cache-y-tabla-14/SelectorScreenDatabase.kt`
**DB File:** `selector_screen_cache.db`

### Entidades

#### SelectorPreviewEntity
**Tabla:** `selector_previews`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `previewId` | `String` | PK |
| `bubbleType` | `String` | Tipo de burbuja |
| `sortOrder` | `Int` | Orden |
| `blockNumber` | `Int` | Número bloque |
| `listedPrice` | `Long?` | Precio |
| `source` | `String?` | Fuente |
| `rawTags` | `String?` | Tags raw |
| `tagName` | `String?` | Nombre tag |
| `discountPercentage` | `Double?` | Descuento |
| `imageBytes` | `ByteArray?` | Imagen |
| `updatedAt` | `Long` | Timestamp |

#### SelectorBubbleStatsEntity
**Tabla:** `selector_bubble_stats`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `bubbleType` | `String` | PK |
| `floorPrice` | `Long?` | Precio piso |
| `totalListings` | `Int?` | Total listados |
| `discountCount` | `Int?` | Count descuentos |
| `maxDiscount` | `Double?` | Max descuento |
| `soldCount` | `Int?` | Vendidos |
| `soldMinPrice` | `Long?` | Precio min vendido |
| `lastSyncTimestamp` | `Long?` | Último sync |
| `updatedAt` | `Long` | Timestamp |

#### SelectorTagGroupEntity
**Tabla:** `selector_tag_groups`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `tagName` | `String` | PK |
| `sortOrder` | `Int` | Orden |
| `count` | `Int` | Cantidad |
| `floorPrice` | `Long?` | Precio piso |
| `discountPercentage` | `Double?` | Descuento |
| `updatedAt` | `Long` | Timestamp |

---

## TABLA 13: UnisatDatabase

**Archivo:** `data/marketplace_data_unisat/UnisatDatabase.kt`
**DB File:** `unisat_cache.db`

### Entidad

#### UnisatCacheEntity
**Tabla:** `unisat_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cacheKey` | `String` | PK |
| `bitmapNumber` | `Int?` | Número bitmap |
| `bitmapId` | `String?` | ID listing |
| `listedPrice` | `Long?` | Precio |
| `listedAt` | `Long?` | Timestamp |
| `ownerAddress` | `String?` | Propietario |
| `extraData` | `String?` | Datos extra |
| `extraData2` | `String?` | Datos extra 2 |
| `timestamp` | `Long` | Timestamp |
| `insertionOrder` | `Int` | Orden inserción |

**Índices:** `cacheKey`, `bitmapNumber`, `bitmapId`

---

## TABLA 14: OrdinalswalletDatabase

**Archivo:** `data/marketplace_data_ordinalswallet/OrdinalswalletDatabase.kt`
**DB File:** `ordinalswallet_cache.db`
**Versión:** 2

### Entidad

#### OrdinalswalletCacheEntity
**Tabla:** `ordinalswallet_cache`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cacheKey` | `String` | PK |
| `bitmapNumber` | `Int?` | Número bitmap |
| `bitmapId` | `String?` | ID listing |
| `listedPrice` | `Long?` | Precio |
| `listedAt` | `Long?` | Timestamp |
| `ownerAddress` | `String?` | Propietario |
| `extraData` | `String?` | Datos extra |
| `extraData2` | `String?` | Datos extra 2 |
| `timestamp` | `Long` | Timestamp |
| `insertionOrder` | `Int` | Orden inserción |

**Índices:** `cacheKey`, `bitmapNumber`, `bitmapId`

---

## TABLA 15: SoldListingsDatabase (Tabla 7)

**Archivo:** `data/sold_marketplace_incremental/SoldListingsDatabase.kt`
**DB File:** `sold_listings.db`

### Entidad

#### SoldListingEntity
**Tabla:** `sold_listings`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `String` | PK |
| `inscriptionId` | `String` | ID inscripción |
| `contentURI` | `String?` | URI contenido |
| `contentType` | `String?` | Tipo contenido |
| `owner` | `String?` | Propietario |
| `listedPrice` | `Long` | Precio listado |
| `soldPrice` | `Long` | Precio vendido |
| `soldAt` | `Long` | Timestamp venta |
| `source` | `String` | Fuente |
| `bitmapName` | `String?` | Nombre |
| `soldAtFormatted` | `String?` | Fecha formateada |

---

## Mapeo de Tablas a Web

| Tabla Android | Equivalente Web | Cómo se obtiene |
|---------------|-----------------|-----------------|
| Tabla 1 (blocks) | API blocks | `GET /api/v1/blocks/stats` (NUEVO) |
| Tabla 2 (wallets) | localStorage + API | Wallet state en browser |
| Tabla 3 (OKX) | No aplica | OKX desactivado |
| Tabla 4 (etiquetas) | API tags | `GET /api/v1/tags/stats` (NUEVO) |
| Tabla 5 (BitMapCore) | API bitmaps | `GET /api/v1/bitmaps/active` |
| Tabla 6 (unified) | API proxy | `GET /api/v1/proxy/*/listings` |
| Tabla 7 (sold) | API proxy | `GET /api/v1/proxy/ordinalswallet/sold` |
| Tabla 8 (tag groups) | API tags | `GET /api/v1/tags/stats` |
| Tabla 9 (block specific) | API blocks | `GET /api/v1/blocks/{number}` |
| Tabla 10 (permanent weights) | API blocks | `GET /api/v1/blocks/{number}/weights` |
| Tabla 11 (descuentos) | Cálculo en frontend | Se calcula con datos de API |
| Tabla 12 (images) | Canvas API browser | Se genera en el navegador |
| Tabla 13 (temp) | No aplica | Buffer temporal solo Android |
| Tabla 14 (selector) | Cálculo en frontend | Se calcula con datos de API |
| Tabla 15 (mis activos) | API owner | `GET /api/v1/bitmaps/owner/{address}` |
