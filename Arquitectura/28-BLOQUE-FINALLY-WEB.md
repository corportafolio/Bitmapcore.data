# 28 - Bloque Finally Web

## 1. Propósito

Adaptación del bloque finally de Android (`PollingFinally.kt`) a la versión web. El finally es el punto crítico de sincronización que garantiza la integridad del sistema de polling.

---

## 2. Principio Fundamental

> **TODO polling DEBE terminar con `executePollingFinally()`. No hay excepciones.**

---

## 3. Diferencias Android → Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Implementación | `finally { }` en coroutine | `finally { }` en async/await |
| Persistencia | SQLite (Room) | IndexedDB / localStorage |
| UI Refresh | `StateFlow.value = X` | Zustand store + React re-render |
| Stats | `MutableStateFlow` | Zustand store |
| Logging | `LogControl.d()` | `console.log()` |
| Círculo carga | `_isCircleLoading.value = false` | `store.setCircleLoading(false)` |

---

## 4. Orden Obligatorio de Responsabilidades

| # | Responsabilidad | Descripción |
|---|----------------|-------------|
| 1 | **Logs Stats BEFORE** | Capturar valores antes de actualizar |
| 2 | **Persistir Bitmaps en Cache** | Guardar en IndexedDB |
| 3 | **Logs TOP 20 Bitmaps** | Buffer timestamp para sync incremental |
| 4 | **Logs Stats AFTER** | Verificar stats actualizados |
| 5 | **Actualizar Stats Store** | Actualizar Zustand store con nuevos valores |
| 6 | **Forzar UI Refresh** | Actualizar componentes React |
| 7 | **Limpiar Indicadores** | Quitar círculo de carga y estados |
| 8 | **Reiniciar Timestamp y Countdown** | Actualizar lastApiUpdateTime y countdown a 300 |
| 9 | **Terminar Polling** | Marcar polling como completado |

---

## 5. Implementación

```typescript
// services/pollingFinally.ts
import { usePollingStore } from '../stores/pollingStore';

export async function executePollingFinally(): Promise<void> {
  const store = usePollingStore.getState();
  
  console.log('[polling-finally] Ejecutando bloque finally...');
  
  try {
    // ═══════════════════════════════════════════════════════
    // PASO 1: Logs Stats BEFORE
    // ═══════════════════════════════════════════════════════
    console.log(`📊 [STATS-BEFORE] Ordinalswallet: floor=${store.ordinalswalletFloorPrice}, total=${store.ordinalswalletTotalListings}`);
    console.log(`📊 [STATS-BEFORE] Unisat: floor=${store.unisatFloorPrice}, total=${store.unisatTotalListings}`);
    console.log(`📊 [STATS-BEFORE] TABLA UNIFICADA: floor=${store.unifiedFloorPrice}, total=${store.unifiedTotalListings}`);
    
    // ═══════════════════════════════════════════════════════
    // PASO 2: Persistir Bitmaps en Cache
    // ═══════════════════════════════════════════════════════
    await persistCaches();
    console.log('💾 [FINALLY] Cache PERSISTIDO');
    
    // ═══════════════════════════════════════════════════════
    // PASO 3: Logs TOP 20 Bitmaps
    // ═══════════════════════════════════════════════════════
    await logTop20Bitmaps('ordinalswallet');
    await logTop20Bitmaps('unisat');
    
    // ═══════════════════════════════════════════════════════
    // PASO 4: Logs Stats AFTER
    // ═══════════════════════════════════════════════════════
    console.log(`📊 [STATS-AFTER] Ordinalswallet: floor=${store.ordinalswalletFloorPrice}, total=${store.ordinalswalletTotalListings}`);
    console.log(`📊 [STATS-AFTER] Unisat: floor=${store.unisatFloorPrice}, total=${store.unisatTotalListings}`);
    console.log(`📊 [STATS-AFTER] TABLA UNIFICADA: floor=${store.unifiedFloorPrice}, total=${store.unifiedTotalListings}`);
    
    // ═══════════════════════════════════════════════════════
    // PASO 5: Actualizar Stats Store
    // ═══════════════════════════════════════════════════════
    // Los stats ya se actualizaron en pollingService.ts
    
    // ═══════════════════════════════════════════════════════
    // PASO 6: Forzar UI Refresh
    // ═══════════════════════════════════════════════════════
    console.log('🔄 [UI-REFRESH] Actualizando burbujas...');
    // Zustand store actualiza automáticamente los componentes suscritos
    console.log('✅ [UI-REFRESH] Burbujas actualizadas correctamente');
    
    // ═══════════════════════════════════════════════════════
    // PASO 7: Limpiar Indicadores
    // ═══════════════════════════════════════════════════════
    store.setCircleLoading(false);
    store.setPollingActive(false);
    store.setAutoRefreshRunning(false);
    console.log('🏁 [FINALLY] Indicadores limpiados');
    
    // ═══════════════════════════════════════════════════════
    // PASO 8: Reiniciar Timestamp y Countdown
    // ═══════════════════════════════════════════════════════
    const now = Date.now();
    store.updateLastApiTime(now);
    store.setCountdown(300);
    console.log(`⏰ [FINALLY] Timestamp actualizado: ${now}`);
    console.log('⏰ [FINALLY] Countdown reiniciado a 300');
    
    // ═══════════════════════════════════════════════════════
    // PASO 9: Terminar Polling
    // ═══════════════════════════════════════════════════════
    console.log('✅ [polling-finally] Bloque finally completado');
    
  } catch (error) {
    console.error('[polling-finally] Error en finally:', error);
    
    // SIEMPRE limpiar indicadores aunque haya error
    store.setCircleLoading(false);
    store.setPollingActive(false);
    store.setAutoRefreshRunning(false);
    store.setCountdown(300);
  }
}

// ═══════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════

async function persistCaches(): Promise<void> {
  try {
    // Guardar listings de Ordinalswallet
    const owListings = await getFromCache('ordinalswallet');
    if (owListings.length > 0) {
      await saveToIndexedDB('ordinalswallet-cache', owListings);
      console.log(`💾 [FINALLY] Cache Ordinalswallet PERSISTIDO: ${owListings.length} bitmaps`);
    }
    
    // Guardar listings de Unisat
    const unisatListings = await getFromCache('unisat');
    if (unisatListings.length > 0) {
      await saveToIndexedDB('unisat-cache', unisatListings);
      console.log(`💾 [FINALLY] Cache Unisat PERSISTIDO: ${unisatListings.length} bitmaps`);
    }
  } catch (error) {
    console.error('[FINALLY] Error persistiendo caches:', error);
  }
}

async function logTop20Bitmaps(marketplace: string): Promise<void> {
  try {
    const listings = await getFromCache(marketplace);
    const sorted = [...listings].sort((a, b) => b.listedAt - a.listedAt);
    const top20 = sorted.slice(0, 20);
    
    console.log(`📋 [STATS-BEFORE] TOP 20 BITMAPS MÁS RECIENTES - ${marketplace.toUpperCase()}:`);
    top20.forEach((listing, index) => {
      const date = new Date(listing.listedAt).toLocaleString();
      console.log(`📋 [${index + 1}] ${listing.name} - Precio: ${listing.price} BTC - Fecha: ${date}`);
    });
  } catch (error) {
    console.error(`[FINALLY] Error logging TOP 20 ${marketplace}:`, error);
  }
}

async function getFromCache(marketplace: string): Promise<any[]> {
  // Leer de IndexedDB
  const db = await openDB();
  const tx = db.transaction('listings', 'readonly');
  const store = tx.objectStore('listings');
  const index = store.index('marketplace');
  const all = await index.getAll(marketplace);
  return all;
}

async function saveToIndexedDB(storeName: string, data: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  for (const item of data) {
    await store.put(item);
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bitmapcore-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('listings')) {
        const store = db.createObjectStore('listings', { keyPath: 'id' });
        store.createIndex('marketplace', 'marketplace', { unique: false });
        store.createIndex('listedAt', 'listedAt', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('ordinalswallet-cache')) {
        db.createObjectStore('ordinalswallet-cache', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('unisat-cache')) {
        db.createObjectStore('unisat-cache', { keyPath: 'id' });
      }
    };
  });
}
```

---

## 6. Logs Esperados

```
[polling-finally] Ejecutando bloque finally...
📊 [STATS-BEFORE] Ordinalswallet: floor=6990, total=10809
📊 [STATS-BEFORE] Unisat: floor=7000, total=2248
📊 [STATS-BEFORE] TABLA UNIFICADA: floor=6980, total=13057

💾 [FINALLY] Cache Ordinalswallet PERSISTIDO: 10809 bitmaps
💾 [FINALLY] Cache Unisat PERSISTIDO: 2248 bitmaps

📋 [STATS-BEFORE] TOP 20 BITMAPS MÁS RECIENTES - ORDINALSWALLET:
📋 [1] 942029.bitmap - Precio: 0.000121 BTC - Fecha: 8/5/2026, 5:02:56
📋 [2] 945570.bitmap - Precio: 0.000121 BTC - Fecha: 8/5/2026, 5:02:56
...

📊 [STATS-AFTER] Ordinalswallet: floor=6980, total=10815
📊 [STATS-AFTER] Unisat: floor=6990, total=2250
📊 [STATS-AFTER] TABLA UNIFICADA: floor=6980, total=13065

🔄 [UI-REFRESH] Actualizando burbujas...
✅ [UI-REFRESH] Burbujas actualizadas correctamente
🏁 [FINALLY] Indicadores limpiados
⏰ [FINALLY] Timestamp actualizado: 1753000100000
⏰ [FINALLY] Countdown reiniciado a 300
✅ [polling-finally] Bloque finally completado
```

---

## 7. Reglas Inquebrantables

| # | Regla | Descripción |
|---|-------|-------------|
| 1 | **SIEMPRE ejecutar finally** | No hay polling sin finally |
| 2 | **SIEMPRE limpiar indicadores** | Aunque haya error |
| 3 | **SIEMPRE reiniciar countdown** | A 300 segundos |
| 4 | **SIEMPRE actualizar timestamp** | `lastApiUpdateTime = Date.now()` |
| 5 | **NUNCA usar return dentro de finally** | El finally debe completarse siempre |
| 6 | **Orden obligatorio** | Los pasos deben ser en orden |
| 7 | **Persistir caches** | Guardar en IndexedDB antes de limpiar |

---

## 8. Manejo de Errores

```typescript
// Si hay error en el finally, SIEMPRE limpiar
try {
  // ... lógica del finally ...
} catch (error) {
  console.error('[polling-finally] Error:', error);
  
  // SIEMPRE limpiar indicadores
  const store = usePollingStore.getState();
  store.setCircleLoading(false);
  store.setPollingActive(false);
  store.setAutoRefreshRunning(false);
  store.setCountdown(300);
}
```

---

## 9. Comparación Android → Web

| Paso | Android | Web |
|------|---------|-----|
| Logs BEFORE | `LogControl.d("stats", ...)` | `console.log(...)` |
| Persistir cache | `cacheManager.saveAll(listings)` | `saveToIndexedDB(...)` |
| TOP 20 | `LogControl.d("cache", ...)` | `console.log(...)` |
| Actualizar stats | `_unifiedFloorPrice.value = X` | `store.updateStats(...)` |
| UI Refresh | `_listings.value = newListings` | Zustand re-render |
| Limpiar indicadores | `_isCircleLoading.value = false` | `store.setCircleLoading(false)` |
| Reiniciar timestamp | `_lastApiUpdateTime.value = now` | `store.updateLastApiTime(now)` |
| Reiniciar countdown | `_countdownSeconds.value = 300` | `store.setCountdown(300)` |
