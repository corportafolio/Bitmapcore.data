# BitmapCore — Cerebro 2: MarketplaceViewModel (Coordinador Principal)

## Resumen

| Campo | Valor |
|-------|-------|
| Archivo | `viewmodel/MarketplaceViewModel.kt` |
| Líneas | ~600 |
| Dependencias | 15 (el segundo más grande) |
| Responsabilidad | Coordinar el polling de los 3 marketplaces |
| Equivalente Web | `marketplaceStore.ts` (Zustand) |

---

## 1. Dependencias (15)

```kotlin
@HiltViewModel
class MarketplaceViewModel @Inject constructor(
    private val application: Application,
    private val repository: OrdinalswalletRepository,      // API Ordinalswallet
    private val unisatRepository: UnisatRepository,        // API Unisat
    private val okxRepository: OkxRepository,              // API OKX (desactivado)
    private val blockDao: BlockDao,                        // Tabla 1
    private val blockImageCacheRepository: BlockImageCacheRepository, // Tabla 12
    private val cacheManager: OrdinalswalletCacheManager,  // Cache Ordinalswallet
    private val unisatCacheManager: UnisatCacheManager,    // Cache Unisat
    private val okxCacheManager: OkxCacheManager,          // Cache OKX
    private val userPreferences: UserPreferences,          // Preferencias
    private val connectivityObserver: ConnectivityObserver, // Conectividad
    private val pollingPrimerPlano: PollingPrimerPlano,    // Polling foreground
    private val soldListingDao: SoldListingDao,            // Tabla 7
    private val unifiedListingDao: UnifiedListingDao,      // Tabla 6
    private val imageSyncRepository: MarketplaceImageSyncRepository, // Sync imágenes
    private val unifiedProcessor: UnifiedMarketplaceProcessor,       // Cerebro 6
    private val descuentosProcessor: DescuentosProcessor,           // Tabla 11
    private val procesadorTabla12Preview: ProcesadorTabla12Preview, // Tabla 12
    private val procesador14SelectorScreen: Procesador14SelectorScreen, // Tabla 14
    private val etiquetasPorPrecioDao: EtiquetasPorPrecioDao,       // Tabla 8
    private val procesador8: Procesador8TablasDeEtiquetasDeLosListados // Clasificación
)
```

---

## 2. Estado que Expone (companion object — compartido globalmente)

| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `ordinalsFloorPrice` | `MutableStateFlow<Long?>` | Floor price Ordinalswallet |
| `ordinalsTotalListings` | `MutableStateFlow<Int>` | Total listings Ordinalswallet |
| `unisatFloorPrice` | `MutableStateFlow<Long?>` | Floor price Unisat |
| `unisatTotalListings` | `MutableStateFlow<Int>` | Total listings Unisat |
| `localFloorPrice` | `MutableStateFlow<Long?>` | Floor price OKX (desactivado) |
| `localTotalListings` | `MutableStateFlow<Int>` | Total listings OKX |
| `lowestFloorPrice` | `StateFlow<Long?>` | Floor price más bajo de todos |
| `lowestFloorMarketplace` | `StateFlow<String>` | Nombre del marketplace con floor más bajo |
| `listings` | `StateFlow<List<BitmapListing>>` | Listings combinados |
| `isAutoRefreshRunning` | `StateFlow<Boolean>` | Si el auto-refresh está corriendo |
| `lastApiUpdateTime` | `StateFlow<Long>` | Última actualización de API |

---

## 3. Funciones Principales

| Función | Descripción |
|---------|-------------|
| `startAutoRefresh()` | Inicia el ciclo de polling de 300s |
| `stopAutoRefresh()` | Detiene el polling |
| `executeAutoRefresh()` | Ejecuta un ciclo de refresh completo |
| `setPaused(paused)` | Pausa/reanuda el polling |
| `refreshAllMarketplaces()` | Fuerza refresh de todos los marketplaces |

---

## 4. Flujo de Auto-Refresh

```
CronometroUniversalDelPolling (300s countdown)
    │
    ├── countdown == 0 && !isPollingPausedExternally
    │       │
    │       └── executeAutoRefresh()
    │              │
    │              ├── 1. PollingPrimerPlano.execute()
    │              │      ├── OrdinalswalletRepository.syncIncremental()
    │              │      ├── UnisatRepository.syncIncremental()
    │              │      └── LocalMarketplacePollingRepository.sync()
    │              │
    │              ├── 2. Procesador7Ventas.process()
    │              │      └── Detectar ventas → Tabla 7
    │              │
    │              ├── 3. UnifiedMarketplaceProcessor.combine()
    │              │      └── Combinar → Tabla 6
    │              │
    │              ├── 4. Procesador8TablasEtiquetas.classify()
    │              │      └── Clasificar → Tabla 8
    │              │
    │              ├── 5. DescuentosProcessor.calculate()
    │              │      └── Calcular → Tabla 11
    │              │
    │              ├── 6. Procesador14SelectorScreen.populate()
    │              │      └── Poblar → Tabla 14
    │              │
    │              └── 7. RecuperarBloquesPerdidos.check()
    │                     └── Recuperar bloques faltantes → Tabla 13
    │
    └── Actualizar estadísticas (floor prices, totals)
```

---

## 5. Equivalente Web

### marketplaceStore.ts (Zustand)

```typescript
// stores/marketplaceStore.ts
export const useMarketplaceStore = create<MarketplaceState>()(
  (set, get) => ({
    // Estado
    ordinalsFloorPrice: null,
    ordinalsTotalListings: 0,
    unisatFloorPrice: null,
    unisatTotalListings: 0,
    localFloorPrice: null,
    localTotalListings: 0,
    lowestFloorPrice: null,
    lowestFloorMarketplace: '',
    isPollingActive: false,
    lastApiUpdateTime: 0,
    
    // Acciones
    startPolling: () => {
      const interval = setInterval(async () => {
        await get().executeAutoRefresh();
      }, 300000); // 5 minutos
      
      set({ isPollingActive: true, pollingInterval: interval });
    },
    
    stopPolling: () => {
      const { pollingInterval } = get();
      if (pollingInterval) clearInterval(pollingInterval);
      set({ isPollingActive: false, pollingInterval: null });
    },
    
    executeAutoRefresh: async () => {
      // 1. Fetch Ordinalswallet listings
      const ordinalsListings = await fetchOrdinalswalletListings();
      
      // 2. Fetch Unisat listings
      const unisatListings = await fetchUnisatListings();
      
      // 3. Fetch local listings
      const localListings = await fetchLocalListings();
      
      // 4. Calcular floor prices
      const ordinalsFloor = calculateFloor(ordinalsListings);
      const unisatFloor = calculateFloor(unisatListings);
      const localFloor = calculateFloor(localListings);
      
      // 5. Determinar lowest floor
      const lowest = Math.min(ordinalsFloor, unisatFloor, localFloor);
      
      set({
        ordinalsFloorPrice: ordinalsFloor,
        ordinalsTotalListings: ordinalsListings.length,
        unisatFloorPrice: unisatFloor,
        unisatTotalListings: unisatListings.length,
        localFloorPrice: localFloor,
        localTotalListings: localListings.length,
        lowestFloorPrice: lowest,
        lowestFloorMarketplace: getLowestMarketplace(lowest, ordinalsFloor, unisatFloor, localFloor),
        lastApiUpdateTime: Date.now(),
      });
    },
  })
);
```

### Diferencia clave Android vs Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Polling mechanism | CronometroUniversalDelPolling (300s) | `setInterval` (5 min) |
| Almacenamiento | Room DB (15 tablas) | Ninguno (consumo directo de API) |
| Procesamiento | 7 procesadores en secuencia | Cálculo en frontend |
| Estado global | companion object MutableStateFlow | Zustand store |
| Pause polling | `isPollingPausedExternally` | `clearInterval` |
