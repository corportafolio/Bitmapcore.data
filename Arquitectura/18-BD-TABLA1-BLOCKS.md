# BitmapCore — Tabla 1: BlockDatabase (Bloques Bitcoin)

## Resumen

| Campo | Valor |
|-------|-------|
| Database Class | `BlockDatabase` |
| Archivo DB | `bitmapcorp_database.db` |
| Versión | 12 (12 migraciones) |
| Tamaño aprox | ~350MB |
| Entidades | 3 (BlockEntity, TagTableEntity, TaggedBlockEntity) |
| DAOs | 4 (BlockDao, TaggedBlockDao, TagTableDao, OutDao) |
| Equivalente Web | `blockStore.ts` — consume datos del servidor |

---

## 1. Entidades

### BlockEntity (tabla `blocks`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `bloque` | `Int` | **PRIMARY KEY** — Número de bloque |
| `totalBtc` | `String` | Total BTC en el bloque |
| `totalTransacciones` | `String` | Número total de transacciones |
| `etiquetas` | `String` | Etiquetas separadas por `\|` (ej: `\|2 tx perfect\|punk\|sub10k\|`) |
| `mempool` | `String` | Datos de mempool |
| `hash` | `String` | Hash del bloque |

### TagTableEntity (tabla `tag_tables`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `tagName` | `String` | **PRIMARY KEY** — Nombre de la etiqueta |
| `totalBlocks` | `Int` | Total de bloques con esta etiqueta |
| `distinctBlockCount` | `Int` | Bloques distintos |
| `lastUpdated` | `Long` | Última actualización |
| `classificationDurationMillis` | `String` | Duración de clasificación |
| `preview` | `String` | Preview de los primeros bloques |

### TaggedBlockEntity (tabla `tagged_blocks`)

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

---

## 2. DAO Principales (BlockDao — 60+ métodos)

| Método | Descripción |
|--------|-------------|
| `getBlocksByEtiqueta(etiqueta)` | Buscar bloques por etiqueta |
| `getBlocksByNumbers(blockNumbers)` | Bloques por números |
| `getTotalBlockCount()` | Total de bloques |
| `insertBlocks(blocks)` | Insertar bloques |
| `getMinMaxFast()` | Min/max bloque rápido |
| `getBlockByNumber(blockNumber)` | Un bloque específico |
| `fastInsertRange(tagName, minTx, maxTx)` | Inserción rápida por rango |
| `fastInsertMillonarias(tagName)` | Bloques multimillonarios |
| `fastInsertPunk(tagName)` | Bloques punk |
| `fastInsertPalindrome(tagName)` | Palíndromos |
| `fastInsertPrimeNumber(tagName, primes)` | Números primos |
| `fastInsertFibonacci(tagName)` | Fibonacci |
| `fastInsertBinary(tagName)` | Binarios |
| `fastInsertIsEpic(tagName)` | Épicos (multiplos de 210000) |
| `fastInsertIsRare(tagName)` | Raros (multiplos de 2016) |

---

## 3. Equivalente Web

```typescript
// stores/blockStore.ts
import { create } from 'zustand';

interface BlockData {
  bloque: number;
  totalBtc: string;
  totalTransacciones: string;
  etiquetas: string;
  hash: string;
}

interface TagTable {
  tagName: string;
  totalBlocks: number;
  distinctBlockCount: number;
  lastUpdated: number;
  preview: string;
}

interface BlockState {
  blocks: BlockData[];
  tagTables: TagTable[];
  minBlock: number;
  maxBlock: number;
  isLoading: boolean;
  
  // Acciones
  fetchBlocks: (page: number, limit: number) => Promise<void>;
  fetchBlockByNumber: (number: number) => Promise<BlockData>;
  fetchTagTables: () => Promise<void>;
  searchByTag: (tag: string) => Promise<BlockData[]>;
}

export const useBlockStore = create<BlockState>()(
  (set, get) => ({
    blocks: [],
    tagTables: [],
    minBlock: 0,
    maxBlock: 0,
    isLoading: false,
    
    fetchBlocks: async (page, limit) => {
      set({ isLoading: true });
      // En web NO hay DB local — se consume del servidor
      const response = await fetch(`/api/v1/blocks?page=${page}&limit=${limit}`);
      const data = await response.json();
      set({ blocks: data.data, isLoading: false });
    },
    
    fetchBlockByNumber: async (number) => {
      const response = await fetch(`/api/v1/blocks/${number}`);
      const data = await response.json();
      return data.data;
    },
    
    fetchTagTables: async () => {
      const response = await fetch('/api/v1/tags');
      const data = await response.json();
      set({ tagTables: data.data });
    },
    
    searchByTag: async (tag) => {
      const response = await fetch(`/api/v1/tags/${encodeURIComponent(tag)}/blocks`);
      const data = await response.json();
      return data.data;
    },
  })
);
```

### Diferencias clave

| Aspecto | Android | Web |
|---------|---------|-----|
| Almacenamiento | Room DB local (~350MB) | API del servidor |
| Datos | Descargados manualmente (.db) | Fetch en tiempo real |
| Queries SQL | 60+ métodos en BlockDao | Fetch HTTP |
| Búsqueda | `LIKE` en SQLite | Filtro en frontend |
| Descarga | ForegroundService (~500MB) | No aplica |
