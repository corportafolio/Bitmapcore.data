# BitmapCore — Cerebro 6: UnifiedListingsViewModel

## Resumen

| Campo | Valor |
|-------|-------|
| Archivo | `viewmodel/UnifiedListingsViewModel.kt` |
| Líneas | ~400 |
| Dependencias | 9 |
| Responsabilidad | Combinar listings de 3 fuentes + clasificar por tags |
| Equivalente Web | `unifiedStore.ts` (Zustand) |

---

## 1. Dependencias (9)

```kotlin
@HiltViewModel
class UnifiedListingsViewModel @Inject constructor(
    private val unifiedListingDao: UnifiedListingDao,
    private val soldListingDao: SoldListingDao,
    private val blockDao: BlockDao,
    private val descuentosProcessor: DescuentosProcessor,
    private val procesador8: Procesador8TablasDeEtiquetasDeLosListados,
    private val procesador7: Procesador7Ventas,
    private val etiquetasPorPrecioDao: EtiquetasPorPrecioDao,
    private val blockImageCacheRepository: BlockImageCacheRepository,
    private val processor: UnifiedMarketplaceProcessor
)
```

---

## 2. Estado que Expone (companion object)

| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `unifiedListings` | `MutableStateFlow<List<UnifiedListingEntity>>` | Listings unificados |
| `tagGroups` | `MutableStateFlow<List<TagGroup>>` | Grupos por etiqueta |
| `soldListings` | `MutableStateFlow<List<SoldListingEntity>>` | Listings vendidos |
| `totalListings` | `MutableStateFlow<Int>` | Total listings |
| `floorPrice` | `MutableStateFlow<Long?>` | Floor price unificado |

---

## 3. Funciones Principales

| Función | Descripción |
|---------|-------------|
| `updateUnisatList(listings)` | Actualiza datos de Unisat |
| `updateOrdinalswalletList(listings)` | Actualiza datos de Ordinalswallet |
| `updateLocalList(listings)` | Actualiza datos local |
| `refreshTagGroups()` | Refresca grupos de etiquetas |
| `getDiscountedListings()` | Obtiene listings con descuento |

---

## 4. Flujo de Unificación

```
UnifiedMarketplaceProcessor.combine()
    │
    ├── 1. Recibe listings de Ordinalswallet
    │      ├── TaggeSource: "ordinalswallet"
    │      ├── Deduplicar por inscriptionId
    │      └── Mapear a UnifiedListingEntity
    │
    ├── 2. Recibe listings de Unisat
    │      ├── TaggeSource: "unisat"
    │      ├── Deduplicar por inscriptionId
    │      └── Mapear a UnifiedListingEntity
    │
    ├── 3. Recibe listings de BitMapCore Backend
    │      ├── TaggeSource: "local"
    │      ├── Deduplicar por inscriptionId
    │      └── Mapear a UnifiedListingEntity
    │
    ├── 4. Combinar y deduplicar
    │      ├── Prioridad: local > unisat > ordinalswallet
    │      └── Guardar en Tabla 6 (unified_listings)
    │
    └── 5. Actualizar StateFlows
           ├── unifiedListings
           ├── totalListings
           └── floorPrice
```

---

## 5. Entidad UnifiedListingEntity (Tabla 6)

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

---

## 6. Equivalente Web

```typescript
// stores/unifiedStore.ts
export const useUnifiedStore = create<UnifiedState>()(
  (set, get) => ({
    unifiedListings: [],
    tagGroups: [],
    soldListings: [],
    totalListings: 0,
    floorPrice: null,
    
    combineListings: (ordinalsListings, unisatListings, localListings) => {
      // Mapear a formato unificado
      const mapped = [
        ...ordinalsListings.map(l => ({ ...l, source: 'ordinalswallet' })),
        ...unisatListings.map(l => ({ ...l, source: 'unisat' })),
        ...localListings.map(l => ({ ...l, source: 'local' })),
      ];
      
      // Deduplicar por inscriptionId (prioridad: local > unisat > ordinalswallet)
      const deduplicated = deduplicateByPriority(mapped, ['local', 'unisat', 'ordinalswallet']);
      
      // Calcular floor price
      const floorPrice = Math.min(...deduplicated.map(l => l.listedPrice));
      
      set({
        unifiedListings: deduplicated,
        totalListings: deduplicated.length,
        floorPrice,
      });
    },
    
    // Calcular tag groups (solo si hay datos de tags disponibles)
    calculateTagGroups: (listings, tagData) => {
      const groups = groupByTag(listings, tagData);
      set({ tagGroups: groups });
    },
  })
);
```

### Diferencia clave Android vs Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Unificación | Procesador en Room DB | Cálculo en memoria |
| Deduplicación | SQL queries | JavaScript `reduce` |
| Tag classification | Procesador8 (local) | Tags del servidor o frontend |
| Almacenamiento | Tabla 6 (UnifiedListingsDatabase) | Zustand state (memoria) |
