# BitmapCore — Cerebro 7: BlockImageViewModel (Generador de Imágenes)

## Resumen

| Campo | Valor |
|-------|-------|
| Archivo | `data/generador_de_imagenes_bitmap/BlockImageViewModel.kt` |
| Líneas | ~200 |
| Dependencias | 3 |
| Responsabilidad | Generación de imágenes Mondrian |
| Equivalente Web | `imageStore.ts` + `imageGenerator.ts` |

---

## 1. Dependencias (3)

```kotlin
@HiltViewModel
class BlockImageViewModel @Inject constructor(
    private val blockDao: BlockDao,
    private val blockImageCacheRepository: BlockImageCacheRepository,
    private val procesadorTabla12Preview: ProcesadorTabla12Preview
)
```

---

## 2. Estado que Expone

| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `totalSavedImages` | `MutableStateFlow<Int>` | Imágenes guardadas |
| `totalToSave` | `MutableStateFlow<Int>` | Total por guardar |
| `batchProgress` | `MutableStateFlow<String>` | Progreso del lote |
| `isProcessingComplete` | `MutableStateFlow<Boolean>` | Si terminó |
| `tabla12Count` | `MutableStateFlow<Int>` | Total imágenes Tabla 12 |

---

## 3. Flujo Android

```
Cerebro 7: startImageProcessing()
    │
    ├── 1. Leer bloques pendientes de Tabla 13
    │
    ├── 2. Para cada bloque:
    │      ├── Leer datos de Tabla 1 (BlockDao)
    │      ├── Leer pesos de Tabla 10 (BlockPermanentDatabase)
    │      ├── Generar imagen Mondrian (Canvas Android)
    │      └── Guardar en Tabla 12 (BlockImageCacheDatabase)
    │
    ├── 3. Actualizar progreso
    │
    └── 4. Cuando termina → ObservadorCiclosViewModel reinicia si hay más
```

---

## 4. Equivalente Web

```typescript
// utils/imageGenerator.ts
// Genera imágenes Mondrian con Canvas API del navegador

export function generateMondrianImage(
  blockNumber: number,
  transactions: Array<{ index: number; weight: number; fee: number }>,
  width: number = 400,
  height: number = 400
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Colores Mondrian
    const colors = ['#FF0000', '#0000FF', '#FFFF00', '#FFFFFF', '#000000'];
    
    // Calcular pesos totales
    const totalWeight = transactions.reduce((sum, tx) => sum + tx.weight, 0);
    
    // Dividir canvas en rectángulos proporcionales al weight
    let currentY = 0;
    transactions.forEach((tx, i) => {
      const proportion = tx.weight / totalWeight;
      const rectHeight = proportion * height;
      
      // Color basado en el índice
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(0, currentY, width, rectHeight);
      
      // Borde negro
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, currentY, width, rectHeight);
      
      // Número de transacción
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.fillText(`tx ${tx.index}`, 5, currentY + rectHeight / 2);
      
      currentY += rectHeight;
    });
    
    // Convertir a Blob
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

// stores/imageStore.ts
export const useImageStore = create<ImageState>()(
  (set, get) => ({
    images: new Map<number, string>(), // blockNumber → dataURL
    isGenerating: false,
    progress: { saved: 0, total: 0 },
    
    generateImage: async (blockNumber: number, transactions: TransactionData[]) => {
      set({ isGenerating: true });
      
      const blob = await generateMondrianImage(blockNumber, transactions);
      const dataURL = URL.createObjectURL(blob);
      
      set((state) => {
        const newImages = new Map(state.images);
        newImages.set(blockNumber, dataURL);
        return { images: newImages, isGenerating: false };
      });
    },
    
    getImage: (blockNumber: number) => {
      return get().images.get(blockNumber) || null;
    },
    
    // Generar batch de imágenes
    generateBatch: async (blocks: Array<{ number: number; transactions: TransactionData[] }>) => {
      set({ isGenerating: true, progress: { saved: 0, total: blocks.length } });
      
      for (const block of blocks) {
        await get().generateImage(block.number, block.transactions);
        set((state) => ({
          progress: { ...state.progress, saved: state.progress.saved + 1 }
        }));
      }
      
      set({ isGenerating: false });
    },
  })
);
```

### Diferencias clave

| Aspecto | Android | Web |
|---------|---------|-----|
| Motor de renderizado | Canvas de Android | Canvas API del navegador |
| Almacenamiento | Tabla 12 (Room DB, ~50MB) | `URL.createObjectURL()` (memoria) |
| Persistencia | Imágenes se guardan permanentemente | Se regeneran bajo demanda |
| Procesamiento | Lotes de 100-500 | Bajo demanda o lazy loading |
| Ciclo automático | ObservadorCiclosViewModel reinicia | No se necesita |
