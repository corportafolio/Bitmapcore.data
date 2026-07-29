# Documento 02 — Arquitectura de Cerebros (Web)

## Vision General

BitmapCore usa un sistema de **"Cerebros"** (ViewModels especializados) que orquestan diferentes funcionalidades. Cada Cerebro tiene una **responsabilidad unica**, **tablas propias**, y **dependencias claras**. Esta arquitectura existe para separar responsabilidades, evitar conflictos de estado, y mantener el sistema escalable.

---

## Los 10 Cerebros Android (Referencia)

| # | ViewModel | Responsabilidad | Tablas que controla |
|---|-----------|-----------------|---------------------|
| **1** | `BlockViewModel` | **Sistema Central** — descarga, clasificacion, busqueda, estado | `blocks`, `tag_tables`, `tagged_blocks` |
| 2 | `MarketplaceViewModel` | Marketplace principal (Ordinalswallet, Unisat, Local) | `ordinalswallet_cache`, `unisat_cache`, escribe metadata Tabla 14 |
| 3 | `LanguageStrings` | Traducciones (ES/EN) | Ninguna (es un objeto Kotlin, no ViewModel) |
| 4 | `LocalBitMapCoreMarketplaceViewModel` | Marketplace local — listar, comprar, PSBT | `BitMapCorpTransactionEntity` |
| 5 | `ConnectionWalletsViewModel` | Billeteras (Unisat, Xverse), nonce, inscripciones | `BitMapCorpWalletEntity`, Tabla 15 |
| 6 | `UnifiedListingsViewModel` | Unified listings, ventas, descuentos, etiquetas por precio | Tablas 6, 7, 8, 11 |
| 7 | `BlockImageViewModel` | Generacion y cache de imagenes Mondrian | Tablas 12, 13, 14 |
| 8 | `ObservadorCiclosViewModel` | Observador de ciclos (siempre activo) | Ninguna (lee Tabla 13) |
| 9 | `SelectorScreenViewModel` | Datos del SelectorScreen | Tabla 14 (solo lectura) |
| 10 | `DuranteElPollingBloquearImagenesViewModel` | Bloqueo de imagenes durante polling | Ninguna (flag global) |

### Fuente
- Documentacion oficial: `/docs/15_10-Cerebros-y-14-tablas.md`
- Cada Cerebro tiene su propio doc: `/docs/02_BlockViewModel-Cerebro-Sistema.md`, etc.

---

## Los 4 Cerebros Web (Implementacion)

La version web tiene **4 Cerebros especializados**. Cada Cerebro web replica la **misma responsabilidad** que su equivalente Android.

### CEREBRO 1: `BlockViewModel` — Dueño Exclusivo de Tabla 1

| Campo | Valor |
|-------|-------|
| **Nombre** | `BlockViewModel` |
| **Archivo** | `stores-block.js` |
| **Tabla que controla** | `blocks` (Tabla 1 — 6 columnas, ~955,001 filas) |
| **Responsabilidad** | Unico punto de acceso a la tabla `blocks`. Orquesta todas las consultas: por bloque, por etiqueta, por hash, por rango de TX, busqueda, conteo. |
| **Equivalente Android** | Cerebro #1 `BlockViewModel` |

#### Metodos publicos

```javascript
BlockViewModel = {
  getBlock(blockNumber),                    // GET /api/v1/blocks/:id
  getBlocksByTag(tagName, limit),           // GET /api/v1/blocks?tag=...
  getBlocksByHashPrefix(hashPrefix),        // GET /api/v1/blocks?hash=...
  getBlocksByTxRange(minTx, maxTx),         // GET /api/v1/blocks?txRange=...
  getBlocksByBlockRange(minBlock, maxBlock),// GET /api/v1/blocks?range=...
  searchBlocks(query),                      // GET /api/v1/blocks/search?q=...
  getBlockCount(),                          // GET /api/v1/blocks/count
  getMinMaxBlock(),                         // GET /api/v1/blocks/minmax
  subscribe(listener),                      // Reactividad
  invalidateCache(),                        // Limpieza total
  getState()                                // Estado actual
}
```

#### Reglas estrictas

| # | Regla | Razon |
|---|-------|-------|
| 1 | **SOLO BlockViewModel** puede hacer `fetch('/api/v1/blocks/...')` | Control centralizado |
| 2 | **NINGUN** otro store/VM puede tener bloques en su state | Evita duplicados |
| 3 | Cache de bloques SOLO en `BlockViewModel._state.cache` | Invalidacion coherente |
| 4 | TagViewModel USA BlockViewModel para enriquecer datos | Separacion de responsabilidades |
| 5 | MarketplaceViewModel NO toca BlockViewModel | Independencia |

---

### CEREBRO 2: `TagViewModel` — Dueño de Etiquetas y Clasificacion

| Campo | Valor |
|-------|-------|
| **Nombre** | `TagViewModel` |
| **Archivo** | `stores-tags.js` |
| **Tabla que controla** | `tagged_blocks` (resultado de clasificacion) |
| **Responsabilidad** | Gestiona las 55 tablas de clasificacion. Provee nombres de tags, conteos, previews, y listas de bloques por tag. **Depende de BlockViewModel** para obtener datos completos de bloques. |
| **Equivalente Android** | Parte del Cerebro #1 (la clasificacion B4 vive en BlockRepository) |

#### Metodos publicos

```javascript
TagViewModel = {
  loadAllTagNames(),                        // Lista de 55 nombres
  loadTagCounts(),                          // tagName -> count
  loadTagPreview(tagName),                  // Primer bloque (Mondrian preview)
  loadTagBlocks(tagName, page, limit),      // Lista completa bloques
  searchTags(query),                        // Filtrar nombres de tags
  getTagCount(tagName),                     // Conteo de una tag
  subscribe(listener),                      // Reactividad
  getState()                                // Estado actual
}
```

#### Por que NO tiene tabla propia

| Concepto | Explicacion |
|----------|-------------|
| **Tabla fisica** | `tagged_blocks` es resultado de INSERT desde `blocks` |
| **Tabla origen** | `blocks` (controlada por BlockViewModel) |
| **Rol de TagViewModel** | Orquestar consultas a `tagged_blocks` + enriquecer con `BlockViewModel.getBlock()` |
| **Dependencia** | TagViewModel **depende de** BlockViewModel (no al reves) |

#### Flujo de datos

```
TagViewModel.loadTagBlocks('Palindrome')
    │
    ├─ SELECT bloque FROM tagged_blocks WHERE tagName='Palindrome'
    │  → Resultado: [123, 456, 789]
    │
    ├─ Para cada bloque: BlockViewModel.getBlock(123)
    │  → BlockEntity completo: { bloque:123, etiquetas:'...', hash:'...', ... }
    │
    └─ Ensambla lista completa → notifica a UI
```

---

### CEREBRO 3: `MarketplaceViewModel` — Dueño de Marketplaces (ya existente)

| Campo | Valor |
|-------|-------|
| **Nombre** | `MarketplaceViewModel` |
| **Archivo** | `stores-marketplaces.js` (ya existe) |
| **Tabla que controla** | Ninguna tabla SQLite propia. Usa API externas. |
| **Responsabilidad** | Coordina polls a Ordinalswallet, Unisat, y marketplace local. Calcula floor prices, listados, ventas. |
| **Equivalente Android** | Cerebro #2 `MarketplaceViewModel` |

#### Relacion con otros Cerebros

| Cerebro | Relacion con MarketplaceViewModel |
|---------|-----------------------------------|
| BlockViewModel (1) | **INDEPENDIENTE** — No lo importa, no lo usa |
| TagViewModel (2) | MarketplaceViewModel **USA** TagViewModel para obtener tags de listados |

---

### CEREBRO 4: `ImageViewModel` — Generador y Cache de Imágenes Mondrian (NUEVO)

| Campo | Valor |
|-------|-------|
| **Nombre** | `ImageViewModel` |
| **Archivo** | `stores-images.js` (nuevo) |
| **Tabla que controla** | IndexedDB `bitmapcore-images` (cache persistente de dataURLs) |
| **Responsabilidad** | Unico punto de acceso para generar y cachear imágenes Mondrian. Usa el mismo algoritmo bin-packing que Android/Unisat/Bitfeed. Cache en memoria + IndexedDB. |
| **Equivalente Android** | Cerebro #7 `BlockImageViewModel` |

#### API publica

```javascript
ImageViewModel = {
  getCachedSync(blockNumber, size),      // Cache en memoria (sincrono)
  getImage(blockNumber, options, size),  // Cache → IndexedDB → generar
  cacheResult(blockNumber, size, canvas),// Cachear despues de generar
  generateBatch(blockNumbers, options),  // Batch precarga
  invalidateCache(blockNumber?),         // Limpiar cache
  subscribe(listener),                   // Reactividad
  getState()                             // Estado actual
}
```

#### Responsabilidades

| # | Responsabilidad | Detalle |
|---|----------------|---------|
| 1 | **Cache en memoria** | `imageCache[blockNumber_size]` → dataURL |
| 2 | **Cache persistente** | IndexedDB `bitmapcore-images` (dataURLs) |
| 3 | **Generación** | Delega en `MondrianGenerator.generate()` (algoritmo bin-packing) |
| 4 | **Batch precarga** | `generateBatch()` para home, tag-tables, marketplaces |
| 5 | **Independencia** | NO depende de BlockViewModel, TagViewModel, ni MarketplaceViewModel |

#### Reglas estrictas

| # | Regla | Razon |
|---|-------|-------|
| 1 | **SOLO ImageViewModel** puede generar imágenes Mondrian | Centralizacion del algoritmo |
| 2 | **NINGUN** componente llama MondrianGenerator.generate() directo | Cache bypass |
| 3 | **Cache SOLO** en `ImageViewModel._state.imageCache` | Invalidacion coherente |
| 4 | ImageViewModel es **INDEPENDIENTE** de otros cerebros | Separacion de responsabilidades |
| 5 | Las imagenes se cachean como dataURL (PNG base64) | Portable, sin dependencias |
| 6 | Cuando un canvas genera una imagen, **siempre** cachea el resultado | Evita regeneracion |

---

## Diagrama de Dependencias

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          UI LAYER                                         │
│                                                                           │
│  PantallaDeTablas  BurbujaResultados  TagTableScreen  MondrianCanvas      │
│       │                  │                  │               │             │
│       ▼                  ▼                  ▼               ▼             │
│  TagVM(2)         BlockVM(1)          TagVM(2)       ImageVM(4)          │
│       │                  │                  │               │             │
│       │              ┌───┴────────┐         │               │             │
│       │              │ BlockVM(1) │◄────────┘               │             │
│       │              │ (UNICO     │                         │             │
│       │              │  ACCESO A  │                         │             │
│       │              │  blocks)   │                         │             │
│       │              └───┬────────┘                         │             │
│       │                  │                                  │             │
│       ▼                  ▼                                  ▼             │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                    API LAYER (server.js)                      │       │
│  │  /api/v1/blocks/:id                                           │       │
│  │  /api/v1/blocks/search?q=...                                  │       │
│  │  /api/v1/tags/:tagName                                        │       │
│  └─────────────────────────────┬────────────────────────────────┘       │
│                                │                                        │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │              DATABASE (SQLite via server.js)                  │       │
│  │  blocks (Tabla 1),  tagged_blocks                            │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  MarketplaceVM(3) — INDEPENDIENTE                                         │
│  - Ordinalswallet / Unisat / Local API                                    │
│                                                                           │
│  ImageVM(4) — INDEPENDIENTE                                               │
│  - MondrianGenerator (algoritmo bin-packing)                             │
│  - IndexedDB (cache persistente de dataURLs)                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Reglas de Dependencia (OBLIGATORIAS)

### Jerarquia de dependencias

```
BlockViewModel (1)  ←  RAIZ (no depende de nadie)
       ▲
       │
TagViewModel (2)    ←  DEPENDE de BlockViewModel
       ▲
       │
MarketplaceViewModel (3) ← DEPENDE de TagViewModel (para tags de listados)

ImageViewModel (4)  ←  INDEPENDIENTE (no depende de nadie)
```

### Reglas estrictas

| # | Regla | Consecuencia si se viola |
|---|-------|-------------------------|
| 1 | **BlockViewModel NO importa ni usa a TagViewModel, MarketplaceViewModel ni ImageViewModel** | Loops de dependencia, estado inconsistente |
| 2 | **TagViewModel USA a BlockViewModel.getBlock()** para enriquecer datos | Datos incompletos en UI |
| 3 | **MarketplaceViewModel USA a TagViewModel** para clasificar listados por tags | Listados sin clasificar |
| 4 | **BlockViewModel es RAIZ** — no tiene dependencias de otros Cerebros | El sistema colapsa si se rompe |
| 5 | **ImageViewModel es INDEPENDIENTE** — solo necesita blockNumber + options para generar | Acoplamiento innecesario |
| 6 | **Ningun componente/ pagina hace fetch directo a /api/v1/blocks/** | Cache invalidado, duplicados, race conditions |
| 7 | **Ningun componente llama MondrianGenerator.generate() directo** | Bypass de cache, imagenes regeneradas |
| 8 | **TODOS los cerebros y tablas DELEGAN a ImageViewModel para generar imágenes** | Inconsistencia visual, cache bypass |

---

## Implementacion Web — React Hooks

### Hook para BlockViewModel

```javascript
// hooks/useBlockViewModel.js
function useBlockViewModel() {
  var _a = React.useState(BlockViewModel.getState());
  var state = _a[0];
  var setState = _a[1];

  React.useEffect(function() {
    return BlockViewModel.subscribe(setState);
  }, []);

  return {
    currentBlock: state.currentBlock,
    isLoading: state.isLoading,
    error: state.error,
    cache: state.cache,
    loadBlock: function(id) { return BlockViewModel.getBlock(id); },
    searchBlocks: function(q) { return BlockViewModel.searchBlocks(q); },
    getBlocksByTag: function(tag, limit) { return BlockViewModel.getBlocksByTag(tag, limit); },
    invalidateCache: function() { BlockViewModel.invalidateCache(); }
  };
}
```

### Hook para TagViewModel

```javascript
// hooks/useTagViewModel.js
function useTagViewModel() {
  var _a = React.useState(TagViewModel.getState());
  var state = _a[0];
  var setState = _a[1];

  React.useEffect(function() {
    return TagViewModel.subscribe(setState);
  }, []);

  return {
    allTags: state.allTags,
    tagCounts: state.tagCounts,
    tagPreviews: state.tagPreviews,
    isLoading: state.isLoading,
    loadAllTags: function() { return TagViewModel.loadAllTagNames(); },
    loadTagBlocks: function(tag, page, limit) { return TagViewModel.loadTagBlocks(tag, page, limit); },
    loadTagPreview: function(tag) { return TagViewModel.loadTagPreview(tag); }
  };
}
```

### Hook combinado (para paginas que necesitan ambos)

```javascript
// hooks/useBlockAndTags.js
function useBlockAndTags() {
  var blockVM = useBlockViewModel();
  var tagVM = useTagViewModel();

  return {
    // De BlockViewModel
    loadBlock: blockVM.loadBlock,
    currentBlock: blockVM.currentBlock,

    // De TagViewModel
    allTags: tagVM.allTags,
    loadTagBlocks: tagVM.loadTagBlocks,

    // Combinado: cargar bloques de un tag con datos completos
    loadTagBlocksWithDetails: async function(tagName) {
      var blockNumbers = await TagViewModel.loadTagBlocks(tagName);
      var blocks = [];
      for (var i = 0; i < blockNumbers.length; i++) {
        var block = await BlockViewModel.getBlock(blockNumbers[i]);
        if (block) blocks.push(block);
      }
      return blocks;
    }
  };
}
```

---

## Checklist de Cumplimiento (OBLIGATORIO)

### Antes de cada commit

| Verificacion | S/N |
|--------------|-----|
| Ningun componente hace `fetch('/api/v1/blocks/...')` directo | |
| Ningun store aparte de BlockViewModel tiene `blocks` en su state | |
| TagViewModel usa `BlockViewModel.getBlock()` para enriquecer datos | |
| MarketplaceViewModel NO importa `BlockViewModel` | |
| Cache de bloques esta SOLO en `BlockViewModel._state.cache` | |
| Invalidacion de cache se hace via `BlockViewModel.invalidateCache()` | |
| No hay imports circulares entre stores | |
| Cada hook React solo consume UN Cerebro a la vez (o useBlockAndTags) | |
| ImageViewModel es el UNICO que genera imagenes Mondrian | |
| Ningun componente llama `MondrianGenerator.generate()` directo | |
| Cache de imagenes esta SOLO en `ImageViewModel._state.imageCache` | |

---

## Errores Comunes a Evitar

1. **NO hacer fetch directo a blocks desde componentes.** Siempre usar `BlockViewModel.getBlock(id)`.
2. **NO crear cache propio de bloques en otro store.** Todo el cache vive en BlockViewModel.
3. **NO llamar a TagViewModel desde BlockViewModel.** La dependencia es unidireccional: TagViewModel → BlockViewModel.
4. **NO mezclar responsabilidades.** Si una funcion toca `blocks`, va en BlockViewModel. Si toca `tagged_blocks`, va en TagViewModel.
5. **NO generar imagenes fuera de ImageViewModel.** Siempre usar `ImageViewModel.getImage()` o `MondrianCanvas` (que usa ImageViewModel internamente).
6. **NO crear cache propio de imagenes.** Todo el cache de imagenes vive en `ImageViewModel._state.imageCache`.
7. **NO llamar `MondrianGenerator.generate()` directo desde ningun cerebro o componente.** TODOS delegan a ImageViewModel.
8. **BlockViewModel, TagViewModel y MarketplaceViewModel NO generan imagenes.** Delegan a ImageViewModel.
9. **NO usar nombres diferentes a los documentados.** Siempre `BlockViewModel`, `TagViewModel`, `MarketplaceViewModel`, `ImageViewModel`.
