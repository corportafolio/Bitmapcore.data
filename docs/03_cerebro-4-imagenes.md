# Documento 03 — Cerebro 4: ImageViewModel (Generador de Imágenes)

## 1. Propósito

ImageViewModel es el **Cerebro 4** de la app web BitmapCore. Es el **único** responsable de generar y cachear imágenes Mondrian de bloques Bitcoin. Ningún otro cerebro o componente puede generar imágenes directamente — todos DELEGAN a ImageViewModel.

---

## 2. Ubicación

| Archivo | stores-images.js |
|---------|------------------|
| Ruta | `Public/stores-images.js` |
| Dependencias | `utils-advanced.js` (MondrianGenerator) |
| Cache | `IndexedDBCache` de `utils-advanced.js` |

---

## 3. Responsabilidades

| # | Responsabilidad | Descripción |
|---|----------------|-------------|
| 1 | **Generar imágenes Mondrian** | Usa el algoritmo bin-packing de `MondrianGenerator` (mismo que Android/Unisat/Bitfeed) |
| 2 | **Cache en memoria** | `imageCache[blockNumber_size]` → dataURL base64 |
| 3 | **Cache persistente** | IndexedDB `bitmapcore-images` (dataURLs entre sesiones) |
| 4 | **Batch precarga** | `generateBatch()` para grillas grandes (home, tag-tables, marketplaces) |
| 5 | **Unico punto acceso** | Todos los componentes/cerebros pasan por ImageViewModel para obtener imágenes |

---

## 4. API Pública

```javascript
// Consultar cache en memoria (sincrono — para canvas)
ImageViewModel.getCachedSync(blockNumber, size) → dataURL | null

// Obtener imagen (cache mem → IndexedDB → generar)
ImageViewModel.getImage(blockNumber, options, size) → Promise<dataURL>

// Cachear después de generar
ImageViewModel.cacheResult(blockNumber, size, canvas) → void

// Batch precarga
ImageViewModel.generateBatch(blockNumbers, options, size) → Promise<void>

// Invalidar cache
ImageViewModel.invalidateCache(blockNumber?) → void

// Reactividad
ImageViewModel.subscribe(fn) → unsubscribe
ImageViewModel.getState() → state
```

### Parámetros de options

```javascript
{
  totalTransactions: Number,
  hash: String,
  isPerfect: Boolean,
  isPunk: Boolean,
  etiquetas: String,
  transactions: Array
}
```

---

## 5. Regla de Negocio: TODOS DELEGAN A IMAGEVIEWM MODEL

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ¿Quién genera imágenes Mondrian?                                │
│                                                                   │
│  ❌ BlockViewModel (1)     → NO genera imágenes                  │
│  ❌ TagViewModel (2)       → NO genera imágenes                  │
│  ❌ MarketplaceViewModel (3) → NO genera imágenes                │
│  ❌ Cualquier componente   → NO genera imágenes                  │
│  ❌ ImageProcessor         → NO genera (delega a ImageViewModel) │
│  ❌ MondrianGenerator      → EXPUESTO solo por ImageViewModel    │
│                                                                   │
│  ✅ SOLO ImageViewModel (4) → GENERA imágenes                    │
│                                                                   │
│  ┌──────────────────────┐                                         │
│  │  BlockViewModel      │──→ delega a ImageViewModel             │
│  │  (block detail page) │                                         │
│  └──────────────────────┘                                         │
│  ┌──────────────────────┐                                         │
│  │  TagViewModel        │──→ delega a ImageViewModel             │
│  │  (tag previews)      │                                         │
│  └──────────────────────┘                                         │
│  ┌──────────────────────┐                                         │
│  │  MarketplaceViewModel│──→ delega a ImageViewModel             │
│  │  (listing images)    │                                         │
│  └──────────────────────┘                                         │
│  ┌──────────────────────┐                                         │
│  │  MondrianCanvas      │──→ delega a ImageViewModel             │
│  │  (componente UI)     │    (getCachedSync + cacheResult)       │
│  └──────────────────────┘                                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Ciclo de Vida de una Imagen

```
1. Componente necesita imagen
       │
       ▼
2. MondrianCanvas → ImageViewModel.getCachedSync(blockNumber, size)
       │
       ├── ✅ Cache hit (memoria)
       │      └── Dibuja desde dataURL via Image element
       │
       └── ❌ Cache miss
              │
              ▼
3. MondrianGenerator.generate(canvas, blockNumber, options, size)
   (algoritmo bin-packing, mismo que Android/Unisat/Bitfeed)
       │
       ▼
4. ImageViewModel.cacheResult(blockNumber, size, canvas)
       │
       ├── Guarda dataURL en memoria (imageCache)
       └── Guarda dataURL en IndexedDB (persistente)
```

---

## 7. Algoritmo Mondrian

ImageViewModel delega en `MondrianGenerator` (definido en `utils-advanced.js`), que implementa el mismo algoritmo bin-packing que Android/Unisat/Bitfeed:

| Paso | Algoritmo | Descripción |
|------|-----------|-------------|
| 1 | `getSizes()` | Tamaños predefinidos por rango de tx (tiny→mega), semilla del hash |
| 2 | `adjustSizes()` | Reduce 40% más grandes hasta que quepan en el grid |
| 3 | `placeLowest()` | Coloca parcelas en la fila más baja disponible |
| 4 | `applyGravity()` | Hace caer parcelas hacia abajo |
| 5 | Render | Escala bounding box al tamaño final con padding |

### 5 caminos de generación

| Camino | Condición | Visual |
|--------|-----------|--------|
| Special 1tx | 1 transacción + tag "1 tx" exacto | 1 celda naranja completa |
| Special 2tx | 2 transacciones + tag "2 tx" exacto | 2 filas (75%/100%) |
| 2tx Punk | 2tx + Wide neck/Standar/Pristine/Punk 2tx | Cabeza+cuello punk |
| Perfect/Punk Grid | isPerfect/isPunk + ≤35tx | Grid específico por tx |
| Mondrian Packing | Cualquier otro caso | Bin-packing clásico |

---

## 8. Cache

### Memoria (nivel 1)
```
imageCache = {
  "839201_320": "data:image/png;base64,...",
  "839201_150": "data:image/png;base64,..."
}
```
- Clave: `blockNumber_size`
- Valor: dataURL base64 del PNG
- Persistencia: mientras la página esté abierta

### IndexedDB (nivel 2)
- Base de datos: `bitmapcore-images`
- Store: `data`
- Clave: `blockNumber_size`
- Valor: dataURL string
- Persistencia: entre sesiones del navegador

---

## 9. Dependencias

```
ImageViewModel (4) — INDEPENDIENTE
       │
       ├── MondrianGenerator (utils-advanced.js)
       │     └── Algoritmo bin-packing
       │
       └── IndexedDBCache (utils-advanced.js)
             └── Cache persistente
```

ImageViewModel NO depende de:
- BlockViewModel (no necesita datos de bloques)
- TagViewModel (no necesita etiquetas)
- MarketplaceViewModel (no necesita marketplaces)
- API server (genera 100% client-side)

---

## 10. Documentos Relacionados

| Documento | Contenido |
|-----------|-----------|
| `docs/02_arquitectura_cerebros.md` | Arquitectura general de los 4 cerebros |
| `Arquitectura/16-CEREBRO-7-IMAGENES.md` | Equivalente Android (Cerebro 7) |
| `Arquitectura/24-MONDRIDAN-WEB-ALGORITHM.md` | Algoritmo Mondrian detallado |
| `utils-advanced.js` | Código de MondrianGenerator e IndexedDBCache |
| `stores-images.js` | Código de ImageViewModel (este cerebro) |
| `image-components.js` | Componentes UI que usan ImageViewModel |

---

## 11. Checklist

| Verificación | Estado |
|-------------|--------|
| ImageViewModel es el UNICO que genera imágenes | ✅ |
| BlockViewModel NO genera imágenes | ✅ (delega) |
| TagViewModel NO genera imágenes | ✅ (delega) |
| MarketplaceViewModel NO genera imágenes | ✅ (delega) |
| MondrianCanvas usa ImageViewModel | ✅ |
| Cache en memoria + IndexedDB | ✅ |
| Batch precarga | ✅ |
| Ningun componente llama MondrianGenerator.generate() directo | ✅ |
