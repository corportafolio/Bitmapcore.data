# 24 - Algoritmo Mondrian Web (Canvas API)

## 1. Propósito

Traducción del algoritmo de generación de imágenes de bloques Bitcoin de Android (`BlockBitmapGenerator.kt`) a **HTML Canvas API** para la versión web. El algoritmo genera representaciones visuales estilo Bitfeed de cada bloque usando arte generativo.

---

## 2. Arquitectura

### Android (Original)
```
BlockBitmapGenerator.kt → Canvas (Android) → Bitmap → SQLite (Tabla 12)
```

### Web (Nueva)
```
mondrianGenerator.ts → OffscreenCanvas/ImageData → Base64 Data URL → IndexedDB (cache imágenes)
```

---

## 3. Tipos de Bloque y Algoritmos

| Tipo de Bloque | Algoritmo | Función Web |
|---------------|-----------|-------------|
| Normal (proporcional) | **Mondrian Bin-Packing** | `drawMondrianPacking()` |
| Perfect / Punk | **Grid específico por tx** | `drawPerfectGrid()` |
| 1 tx (etiqueta exacta) | **1 celda completa** | `draw1Tx()` |
| 2 tx (etiqueta exacta) | **1 col x 2 filas** | `draw2TxGrid()` |
| Wide neck / Standard / Pristine / Punk 2tx | **1 col x 2 filas punk** | `draw2txPunk()` |

---

## 4. Constantes del Algoritmo

```typescript
const CONSTANTS = {
  BORDER: 1,           // Borde exterior mínimo (px)
  STREET_PX: {         // Calle entre parcelas (px)
    smallBlock: 2,     // ≤20 tx
    largeBlock: 1      // >20 tx
  },
  MIN_PARCEL_PX: 0.2,  // Tamaño mínimo de parcela visible
  MIN_SPACING: 0.2,    // Espaciado mínimo entre parcelas
  DEFAULT_PADDING: 1,  // Padding interno
  IMAGE_SIZE: 320,     // Resolución de la imagen (320x320 px)
  
  // Colores
  BITMAP_ORANGE: '#FFA500',  // Color de celdas/lotes
  STREET_COLOR: '#000000',   // Color de calles/fondo
  
  // Punk 2tx
  SIDE_MARGIN_PUNK_2TX: 20,
  TOP_BOTTOM_MARGIN_PUNK_2TX: 2,
};
```

---

## 5. Modelo de Datos

### BlockData (Entrada)
```typescript
interface BlockData {
  blockNumber: number;
  totalTransactions: number;
  totalBTC: number;
  hash: string;
  isPerfect: boolean;
  isPunk: boolean;
  transactionWeights?: number[];
  selectedTransactionIndex?: number;
  etiquetas?: string;
  drawLines: boolean;
}
```

### Parcela (Unidad visual)
```typescript
interface Parcel {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  txIndex: number;
}
```

---

## 6. Algoritmo Mondrian Bin-Packing (Web)

### 6.1 Función Principal

```typescript
function generateBlockImage(block: BlockData): string {
  const canvas = new OffscreenCanvas(CONSTANTS.IMAGE_SIZE, CONSTANTS.IMAGE_SIZE);
  const ctx = canvas.getContext('2d')!;
  
  // 1. Fondo negro
  ctx.fillStyle = CONSTANTS.STREET_COLOR;
  ctx.fillRect(0, 0, CONSTANTS.IMAGE_SIZE, CONSTANTS.IMAGE_SIZE);
  
  // 2. Seleccionar algoritmo según tipo
  if (block.isPerfect || block.isPunk) {
    drawPerfectGrid(ctx, block);
  } else if (block.totalTransactions === 1) {
    draw1Tx(ctx, block);
  } else if (block.totalTransactions === 2) {
    draw2TxGrid(ctx, block);
  } else {
    drawMondrianPacking(ctx, block);
  }
  
  // 3. Convertir a Data URL
  return canvasToDataURL(canvas);
}
```

### 6.2 Generación de Pesos Pseudo-Aleatorios

El hash del bloque se usa como semilla para generar tamaños de parcela deterministas:

```typescript
function generateWeights(block: BlockData): number[] {
  const txCount = block.totalTransactions;
  const sizeList = getSizeList(txCount);
  const weights: number[] = [];
  
  // Usar hash como semilla para Math.random() determinista
  let seed = hashToInt(block.hash);
  
  for (let i = 0; i < txCount; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff; // LCG
    const index = seed % sizeList.length;
    weights.push(sizeList[index]);
  }
  
  return weights;
}

function getSizeList(txCount: number): number[] {
  if (txCount < 20) {
    return [1.0, 4.0, 3.4, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0];
  } else if (txCount <= 100) {
    return [0.9, 1.4, 1.8, 2.3, 2.7, 3.2, 3.6, 4.5, 5.0, 5.5, 5.9, 6.3, 6.8, 7.2, 7.7, 8.1, 8.6, 9.1];
  } else if (txCount <= 500) {
    return [0.8, 1.5, 2.2, 2.9, 3.6, 4.3, 5.0, 5.7, 6.4, 6.9, 7.4];
  } else if (txCount <= 1999) {
    return [0.8, 1.4, 2.0, 2.6, 3.2, 3.8, 4.4, 5.0, 5.6, 6.2, 6.8];
  } else if (txCount <= 2999) {
    return [0.7, 1.2, 1.7, 2.2, 2.7, 3.2, 3.7, 4.2, 4.7, 5.2, 5.7, 6.2];
  } else if (txCount <= 3999) {
    return [0.6, 1.1, 1.6, 2.1, 2.6, 3.1, 3.6, 4.1, 4.6, 5.1, 5.6];
  } else if (txCount <= 4999) {
    return [0.5, 0.9, 1.3, 1.7, 2.1, 2.6, 3.0, 3.4, 3.8, 4.2, 4.6, 5.0];
  } else if (txCount <= 5999) {
    return [0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4];
  } else if (txCount <= 6999) {
    return [0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0, 3.5, 3.8];
  } else {
    return [0.2, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.3, 2.6, 2.9, 3.2];
  }
}
```

### 6.3 Cálculo del Grid

```typescript
function calculateGrid(weights: number[]): { gridWidth: number; area: number } {
  // Área total = suma de (peso²)
  const area = weights.reduce((sum, w) => sum + w * w, 0);
  
  // Ancho del grid = ceil(sqrt(area))
  const gridWidth = Math.ceil(Math.sqrt(area));
  
  return { gridWidth, area };
}
```

### 6.4 Empacado Bin-Packing (Bin Packing)

```typescript
function packParcels(weights: number[], gridWidth: number): Parcel[] {
  const parcels: Parcel[] = [];
  const occupied: boolean[][] = [];
  
  // Inicializar grid de ocupación
  for (let y = 0; y < gridWidth + 10; y++) {
    occupied[y] = [];
    for (let x = 0; x < gridWidth + 10; x++) {
      occupied[y][x] = false;
    }
  }
  
  // Para cada transacción, encontrar posición libre
  for (let i = 0; i < weights.length; i++) {
    const size = Math.ceil(weights[i]);
    const pos = findFreePosition(occupied, size, gridWidth);
    
    if (pos) {
      // Marcar ocupado
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          occupied[pos.y + dy][pos.x + dx] = true;
        }
      }
      
      parcels.push({
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        color: CONSTANTS.BITMAP_ORANGE,
        txIndex: i,
      });
    }
  }
  
  return parcels;
}

function findFreePosition(
  occupied: boolean[][],
  size: number,
  gridWidth: number
): { x: number; y: number } | null {
  // Buscar la primera posición libre (de arriba a abajo, izquierda a derecha)
  for (let y = 0; y < gridWidth + 10; y++) {
    for (let x = 0; x < gridWidth + 10; x++) {
      if (isPositionFree(occupied, x, y, size)) {
        return { x, y };
      }
    }
  }
  return null;
}

function isPositionFree(
  occupied: boolean[][],
  x: number,
  y: number,
  size: number
): boolean {
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      if (occupied[y + dy]?.[x + dx]) {
        return false;
      }
    }
  }
  return true;
}
```

### 6.5 Renderizado en Canvas

```typescript
function drawMondrianPacking(ctx: CanvasRenderingContext2D, block: BlockData) {
  const weights = block.transactionWeights || generateWeights(block);
  const { gridWidth } = calculateGrid(weights);
  const parcels = packParcels(weights, gridWidth);
  
  // Calcular escala para llenar la imagen
  const maxExtent = Math.max(
    ...parcels.map(p => Math.max(p.x + p.width, p.y + p.height))
  );
  
  const streetPx = block.totalTransactions <= 20
    ? CONSTANTS.STREET_PX.smallBlock
    : CONSTANTS.STREET_PX.largeBlock;
  
  // Para bloques ≤20 tx, usar expansión por extent
  const cellSize = block.totalTransactions <= 20
    ? (CONSTANTS.IMAGE_SIZE - CONSTANTS.BORDER * 2) / maxExtent
    : (CONSTANTS.IMAGE_SIZE - CONSTANTS.BORDER * 2) / gridWidth;
  
  // Dibujar cada parcela
  for (const parcel of parcels) {
    const px = CONSTANTS.BORDER + parcel.x * cellSize + streetPx;
    const py = CONSTANTS.BORDER + parcel.y * cellSize + streetPx;
    const pw = parcel.width * cellSize - streetPx * 2;
    const ph = parcel.height * cellSize - streetPx * 2;
    
    if (pw > 0 && ph > 0) {
      ctx.fillStyle = CONSTANTS.BITMAP_ORANGE;
      ctx.fillRect(px, py, pw, ph);
    }
  }
}
```

---

## 7. Grid Perfect/Punk

### 7.1 Tabla de Grids

| Tx | Grid (Perfect) | Grid (Punk) | Margen Extra | Células Negras |
|----|---------------|-------------|--------------|----------------|
| 1 | 1x1 | 1x1 | Ninguno | 0 |
| 2 | 1x2 | 1x2 | Ninguno | 0 |
| 3 | 1x3 | 1x3 | top/bottom 5f | 0 |
| 4 | 2x2 | 2x2 | Ninguno | 0 |
| 5 | 3x2 | 2x3 | sides 5f (Punk) | Perfect=0, Punk=1 |
| 6 | 3x3 | 3x3 | top/bottom 5f | 0 |
| 7 | 2x4 | 4x2 | sides 5f (Punk) | 1 |
| 8 | 3x3 | 3x3 | Ninguno | 1 |
| 9 | 3x3 | 3x3 | Ninguno | 0 |
| 10 | 2x5 | 3x4 | Ninguno | Perfect=0, Punk=2 |
| 11 | 2x6 | 3x4 | Ninguno | Perfect=0, Punk=1 |
| 12 | 3x4 | 3x4 | Ninguno | 0 |
| 13-15 | 3x5 | 3x5 | Ninguno | 0 |
| 16 | 4x4 | 4x4 | Ninguno | 0 |
| 17-24 | 5x5 | 5x5 | Ninguno | resto negro |
| 25-35 | 6x6 | 6x6 | Ninguno | resto negro |
| 36+ | ceil(sqrt) | ceil(sqrt) | Ninguno | resto negro |

### 7.2 Implementación

```typescript
function drawPerfectGrid(ctx: CanvasRenderingContext2D, block: BlockData) {
  const txCount = block.totalTransactions;
  const grid = getGridForTx(txCount, block.isPunk);
  
  const streetPx = CONSTANTS.STREET_PX.smallBlock;
  const cellSize = (CONSTANTS.IMAGE_SIZE - CONSTANTS.BORDER * 2) / Math.max(grid.cols, grid.rows);
  
  // Calcular márgenes extra
  const marginExtra = getMarginExtra(grid, block.isPunk);
  
  let txIndex = 0;
  
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (txIndex >= txCount) break;
      
      // Verificar si es célula negra (punk)
      if (isBlackCell(row, col, grid, block.isPunk, txCount)) {
        txIndex++;
        continue;
      }
      
      let px = CONSTANTS.BORDER + col * cellSize + streetPx + marginExtra.left;
      let py = CONSTANTS.BORDER + row * cellSize + streetPx + marginExtra.top;
      let pw = cellSize - streetPx * 2 - marginExtra.left - marginExtra.right;
      let ph = cellSize - streetPx * 2 - marginExtra.top - marginExtra.bottom;
      
      if (pw > 0 && ph > 0) {
        ctx.fillStyle = CONSTANTS.BITMAP_ORANGE;
        ctx.fillRect(px, py, pw, ph);
      }
      
      txIndex++;
    }
  }
}

function getGridForTx(txCount: number, isPunk: boolean): { cols: number; rows: number } {
  const grids: Record<number, { cols: number; rows: number }> = {
    1: { cols: 1, rows: 1 },
    2: { cols: 1, rows: 2 },
    3: { cols: 1, rows: 3 },
    4: { cols: 2, rows: 2 },
    5: isPunk ? { cols: 2, rows: 3 } : { cols: 3, rows: 2 },
    6: { cols: 3, rows: 3 },
    7: isPunk ? { cols: 4, rows: 2 } : { cols: 2, rows: 4 },
    8: { cols: 3, rows: 3 },
    9: { cols: 3, rows: 3 },
    10: isPunk ? { cols: 3, rows: 4 } : { cols: 2, rows: 5 },
    11: isPunk ? { cols: 3, rows: 4 } : { cols: 2, rows: 6 },
    12: { cols: 3, rows: 4 },
    15: { cols: 3, rows: 5 },
    16: { cols: 4, rows: 4 },
    24: { cols: 5, rows: 5 },
    35: { cols: 6, rows: 6 },
  };
  
  if (grids[txCount]) return grids[txCount];
  
  const sqrt = Math.ceil(Math.sqrt(txCount));
  return { cols: sqrt, rows: sqrt };
}
```

---

## 8. Expansión para Bloques Pequeños (≤20 tx)

```typescript
function expandForSmallBlock(parcels: Parcel[], gridWidth: number): number {
  // PASADA 1: Posicionar y medir extent máximo
  let maxExtent = 0;
  for (const parcel of parcels) {
    const extent = Math.max(parcel.x + parcel.width, parcel.y + parcel.height);
    maxExtent = Math.max(maxExtent, extent);
  }
  
  // PASADA 2: Calcular cellSize expandido
  const cellSize = (CONSTANTS.IMAGE_SIZE - CONSTANTS.BORDER * 2) / maxExtent;
  
  return cellSize;
}
```

---

## 9. Conversión a Data URL

```typescript
function canvasToDataURL(canvas: OffscreenCanvas): string {
  // Para OffscreenCanvas, usar convertToBlob
  // En implementación real, se retorna como Promise<string>
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Convertir a PNG base64
  // Nota: OffscreenCanvas no tiene toDataURL directamente
  // Se usa convertToBlob + FileReader
  return ''; // Implementación asíncrona
}

// Implementación alternativa con Canvas normal (para SSR compat)
function generateBlockImageSync(block: BlockData): string {
  if (typeof document === 'undefined') {
    // SSR: retornar placeholder
    return generatePlaceholder(block.blockNumber);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = CONSTANTS.IMAGE_SIZE;
  canvas.height = CONSTANTS.IMAGE_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  // ... lógica de dibujo ...
  
  return canvas.toDataURL('image/png');
}

function generatePlaceholder(blockNumber: number): string {
  // SVG placeholder para SSR
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
    <rect width="320" height="320" fill="#000"/>
    <text x="160" y="160" text-anchor="middle" fill="#FFA500" font-size="24">
      #${blockNumber}
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
```

---

## 10. Cache en IndexedDB

```typescript
// stores/imageCacheStore.ts
interface CachedImage {
  blockNumber: number;
  imageData: string; // Base64 Data URL
  createdAt: number;
}

class ImageCacheStore {
  private dbName = 'bitmapcore-images';
  private storeName = 'block-images';
  
  async getImage(blockNumber: number): Promise<string | null> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const result = await store.get(blockNumber);
    return result?.imageData || null;
  }
  
  async saveImage(blockNumber: number, imageData: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await store.put({ blockNumber, imageData, createdAt: Date.now() });
  }
  
  async hasImage(blockNumber: number): Promise<boolean> {
    const image = await this.getImage(blockNumber);
    return image !== null;
  }
}
```

---

## 11. Reglas de Negocio Inquebrantables

| # | Regla | Implementación Web |
|---|-------|-------------------|
| 1 | **Única fuente de imágenes** | Solo `mondrianGenerator.ts` genera imágenes |
| 2 | **Datos de BlockDatabase** | Consultar IndexedDB/cache, NO APIs externas |
| 3 | **Determinismo visual** | Mismo bloque = misma imagen siempre (semilla hash) |
| 4 | **Colores oficiales** | BITMAP_ORANGE (#FFA500) + STREET_COLOR (#000000) |
| 5 | **Resolución fija** | 320x320 px siempre |
| 6 | **Sin Math.random()** | Usar LCG con hash como semilla |
| 7 | **Calles dinámicas** | ≤20 tx: 2px, >20 tx: 1px |

---

## 12. Diferencias Android → Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Canvas | `android.graphics.Canvas` | `HTMLCanvasElement` / `OffscreenCanvas` |
| Bitmap | `android.graphics.Bitmap` | `ImageData` / `Blob` |
| Persistencia | SQLite (Tabla 12) | IndexedDB |
| Conversión | `Bitmap.compress()` | `canvas.toDataURL()` |
| Threading | `viewModelScope` (coroutines) | `requestIdleCallback` / Web Workers |
| SSR | N/A | SVG placeholder + hydration |

---

## 13. Optimizaciones Web

1. **OffscreenCanvas**: Para generación en Web Worker (no bloquear UI)
2. **Web Workers**: Procesar múltiples bloques en paralelo
3. **requestIdleCallback**: Generar imágenes cuando el navegador esté idle
4. **Cache-first**: Siempre buscar en IndexedDB antes de generar
5. **Lazy generation**: Solo generar imágenes visibles en viewport
6. **ImageBitmap**: Usar `createImageBitmap()` para renderizado más rápido
