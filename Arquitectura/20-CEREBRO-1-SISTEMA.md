# 20 - CEREBRO #1: BLOCKVIEWMODEL - CEREBRO DEL SISTEMA

## 1. Propósito

BlockViewModel es el **cerebro principal** de todo BitmapCorpApp. Orquesta el flujo completo de descarga, clasificación, búsqueda y estado de la aplicación. Sin este componente funcional, el sistema completo se colapsa.

**Ubicación:** `ui/BlockViewModel.kt`
**Tipo:** `@HiltViewModel` (AndroidViewModel)
**Líneas:** ~3300+

---

## 2. Responsabilidades

| # | Responsabilidad | Descripción |
|---|----------------|-------------|
| 1 | **Descarga de BD** | Descargar base de datos de bloques Bitcoin desde GitHub, con soporte de reanudación |
| 2 | **Clasificación B3** | Procesar estadísticas de la base datos (min/max block, total blocks, peso) |
| 3 | **Clasificación B4** | Clasificar +920,000 bloques en 36 categorías (etiquetas) |
| 4 | **Coordinación** | Pausar/reanudar polling de Cerebro 2 durante clasificación |
| 5 | **Búsqueda** | Búsqueda unificada de bloques y etiquetas |
| 6 | **Estado UI** | Mantener estado reactivo de toda la app (descarga, progreso, errores) |
| 7 | **Gestión de tabs** | Carga paginada de bloques por etiqueta (500 por página) |
| 8 | **Cronómetro** | Tiempo real de operaciones (descarga, clasificación) |

---

## 3. Tablas que Controla

| Tabla | Base de Datos | Acceso | Propósito |
|-------|---------------|--------|-----------|
| **Tabla 1** | BlockDatabase | Lectura/Escritura | Datos permanentes de bloques Bitcoin |

### Sub-tablas de BlockDatabase:
- `blocks` — Bloques con datos blockchain (hash, peso, transacciones)
- `tag_tables` — Índice de 36 categorías (nombre, total bloques)
- `tagged_blocks` — Bloques clasificados por categoría

---

## 4. StateFlows Principales

### 4.1 Estado de Base de Datos
| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `isDatabaseLoaded` | `Boolean` | Si la BD está cargada y lista |
| `appInitialState` | `AppInitialState` | Estado: NEEDS_DOWNLOAD / NEEDS_FULL_PROCESSING / NEEDS_FAST_LOAD |
| `databaseStats` | `DatabaseStats?` | Estadísticas de la BD (min, max, total, peso) |

### 4.2 Descarga
| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `isDownloading` | `Boolean` | Si hay descarga en curso |
| `downloadProgress` | `Float` | Progreso de descarga (0.0 a 1.0) |
| `downloadMessage` | `String?` | Mensaje actual de descarga |
| `downloadedBytes` | `Long` | Bytes descargados |
| `totalOperationSize` | `Long` | Tamaño total |
| `canResumeDownload` | `Boolean` | Si se puede reanudar descarga |
| `downloadErrorOccurred` | `Boolean` | Si hubo error |

### 4.3 Clasificación (B3/B4)
| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `tablesProcessingStarted` | `Boolean` | Si la clasificación B4 está activa |
| `classifiedTablesCount` | `Int` | Tablas clasificadas hasta ahora |
| `totalTablesCount` | `Int` | Total de tablas (36) |
| `classificationProgressMessage` | `String` | Mensaje de progreso |
| `rawTagTables` | `List<TagTableEntity>` | Lista cruda de tablas de etiquetas |
| `tagTables` | `StateFlow<List<TagTableEntity>>` | Lista ordenada de tablas |
| `b4ReclassificationTrigger` | `Long` | Trigger para reclasificación |

### 4.4 Búsqueda
| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `unifiedSearchResults` | `List<SearchResultItem>` | Resultados unificados (bloques + etiquetas) |
| `searchSuggestions` | `List<String>` | Sugerencias de búsqueda |
| `blockSearchResults` | `List<Pair<String, List<String>>>` | Resultados de bloques |
| `tagSearchResults` | `List<TagSearchResult>` | Resultados de etiquetas |

### 4.5 Paginación de Tabla
| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `currentBlocks` | `List<TaggedBlockEntity>` | Bloques de la página actual |
| `currentOffset` | `Int` | Offset de numeración |
| `isLoading` | `Boolean` | Si está cargando más datos |
| `totalCountTitle` | `Int` | Total de bloques en la tabla actual |
| `blockDetails` | `TaggedBlockEntity?` | Detalles de bloque seleccionado |

### 4.6 Tiempos
| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `uiTimecronometrodetiempo` | `String?` | Cronómetro principal en tiempo real |
| `uiTimeFileSizeFetch` | `String?` | Tiempo de obtención de tamaño |
| `uiTimeDownloadOrUploadToTemp` | `String?` | Tiempo de descarga a temporal |
| `uiTimeCopyTempToFinal` | `String?` | Tiempo de copia temp→final |
| `uiTimeContentSearchAfterCopy` | `String?` | Tiempo de búsqueda post-copia |

---

## 5. Funciones Principales

### 5.1 Descarga
- `startDatabaseDownloadFromUrl(url, isResuming)` — Descarga principal con 3 fases: preparación, ejecución, post-procesamiento
- `resumeInterruptedDownload()` — Reanuda descarga interrumpida
- `startDatabaseUploadFromUri(uri)` — Sube BD desde archivo local

### 5.2 Clasificación
- `resetOrderAndReclassify()` — Reset completo y reclasificación desde cero
- `checkDatabaseStatus()` — Verifica estado físico de la BD
- `evaluateInitialAppState()` — Decide: descargar, clasificar o carga rápida

### 5.3 Búsqueda
- `performSearch(input)` — Búsqueda unificada (número de bloque o nombre de tabla)
- `performTagSearch(input)` — Búsqueda por nombre de tabla de etiquetas
- `updateSearchSuggestions(query)` — Actualiza sugerencias en tiempo real

### 5.4 Tabla
- `loadBlocksTurbo(tagName)` — Carga primera página (500 bloques)
- `loadMoreBlocksInternal()` — Carga siguiente página (scroll infinito)
- `loadLastPage()` — Carga última página
- `changeSortOrder(newOrder, tagName)` — Cambia orden (A-Z, más bloques, menos bloques, BTC asc/desc)
- `clearTableState()` — Limpia RAM de la pantalla actual

### 5.5 Bloque
- `loadBlockDetails(blockNumber)` — Carga detalles de un bloque
- `loadBlockDetailsWithFallback(blockNumber)` — Carga con respaldo a BD original
- `loadBlockTransactions(blockNumber)` — Carga transacciones desde servidor
- `selectTransaction(transaction)` — Selecciona transacción para vista 3D

---

## 6. Coordinación con Otros Cerebros

### 6.1 Con Cerebro #2 (MarketplaceViewModel)
| # | De BlockViewModel | Hacia MarketplaceViewModel | Propósito |
|---|-------------------|---------------------------|-----------|
| 1 | `isPollingPausedExternally = true` | Pausa polling | Cuando B4 inicia |
| 2 | `triggerPollingInitialization()` | Inicia polling | Cuando B4 termina |
| 3 | `triggerCacheLoad()` | Carga cache | Muestra datos inmediatos |

**REGLA:** BlockViewModel es el cerebro principal. MarketplaceViewModel es el cerebro secundario. NO se comunican excepto en estas3 excepciones.

### 6.2 Con Cerebro #7 (BlockImageViewModel)
- Cerebro 1 provee datos de bloques (Tabla 1) que Cerebro 7 usa para generar imágenes

---

## 7. Callbacks Implementados

BlockViewModel implementa 3 interfaces de callbacks:
- `DownloadLogicCallbacks` — Eventos de descarga
- `SubirLogicCallbacks` — Eventos de subida
- `ClasificacionCallbacks` — Eventos de clasificación B3/B4

---

## 8. Web Equivalente (React + TypeScript + Zustand)

```typescript
// stores/useBlockStore.ts
import { create } from 'zustand'

interface BlockStore {
  // Estado de BD
  isDatabaseLoaded: boolean
  appInitialState: 'NEEDS_DOWNLOAD' | 'NEEDS_FULL_PROCESSING' | 'NEEDS_FAST_LOAD' | 'UNKNOWN'
  
  // Descarga
  isDownloading: boolean
  downloadProgress: number
  downloadMessage: string | null
  downloadedBytes: number
  totalOperationSize: number
  canResumeDownload: boolean
  
  // Clasificación
  tablesProcessingStarted: boolean
  classifiedTablesCount: number
  totalTablesCount: number
  classificationProgressMessage: string
  
  // Búsqueda
  unifiedSearchResults: SearchResultItem[]
  searchSuggestions: string[]
  
  // Tabla
  currentBlocks: TaggedBlockEntity[]
  currentOffset: number
  isLoading: boolean
  
  // Acciones
  startDownload: (url: string) => Promise<void>
  resumeDownload: () => Promise<void>
  performSearch: (input: string) => void
  loadBlocksTurbo: (tagName: string) => Promise<void>
  loadMoreBlocks: () => Promise<void>
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  // ... implementación con fetch API en lugar de Room
}))
```

**Diferencias Android → Web:**
- Room DB → IndexedDB o fetch API al servidor
- StateFlow → Zustand state
- CoroutineScope → async/await
- Hilt injection → import directo de stores
- Deep links → browser navigation (React Router)
