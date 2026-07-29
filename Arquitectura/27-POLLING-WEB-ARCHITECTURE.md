# 27 - Arquitectura de Polling Web

## 1. Propósito

Adaptación del sistema de polling de Android (4 archivos mandatory) a la versión web usando React + Zustand + setInterval.

---

## 2. Diferencias Android → Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Timer | `while(true)` + `delay(1000)` en coroutine | `setInterval(1000)` en Zustand store |
| Background | `AlarmManager` + `BroadcastReceiver` | `document.visibilitychange` + `Page Visibility API` |
| Persistencia | SQLite (Room) | IndexedDB / localStorage |
| Singleton | Companion object / Hilt | Zustand store global |
| UI Update | `StateFlow` + `collectAsState` | Zustand store + React hooks |
| Cancelación | `Job.cancel()` | `clearInterval()` |

---

## 3. Archivos Android → Equivalente Web

### 3.1 Android (4 archivos mandatory)

| # | Archivo Android | Propósito |
|---|-----------------|-----------|
| 1 | `CronometroUniversalDelPolling.kt` | Timer universal 300s con estados |
| 2 | `EstadoCompartidoDelPolling.kt` | lastApiUpdateTime + stats |
| 3 | `PollingPrimerPlano.kt` | Polling en foreground |
| 4 | `PollingFinally.kt` | Bloque finally obligatorio |

### 3.2 Web (4 archivos equivalentes)

| # | Archivo Web | Propósito |
|---|-------------|-----------|
| 1 | `usePollingTimer.ts` | Hook con `setInterval` + estados |
| 2 | `pollingStore.ts` | Zustand store con lastApiUpdateTime + stats |
| 3 | `pollingService.ts` | Lógica de polling (fetch de marketplaces) |
| 4 | `pollingFinally.ts` | Bloque finally obligatorio |

---

## 4. Implementación

### 4.1 Zustand Store (`pollingStore.ts`)

```typescript
// stores/pollingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PollingState {
  // Estados del cronómetro
  countdownSeconds: number;
  isCircleLoading: boolean;
  isPollingActive: boolean;
  isAutoRefreshRunning: boolean;
  
  // Estados de foreground/background
  isInForeground: boolean;
  isInBackground: boolean;
  isPollingPausedExternally: boolean;
  
  // Datos compartidos
  lastApiUpdateTime: number;
  
  // Stats de marketplaces
  ordinalswalletFloorPrice: number | null;
  ordinalswalletTotalListings: number | null;
  unisatFloorPrice: number | null;
  unisatTotalListings: number | null;
  unifiedFloorPrice: number | null;
  unifiedTotalListings: number | null;
  
  // Acciones
  setCountdown: (seconds: number) => void;
  setCircleLoading: (loading: boolean) => void;
  setPollingActive: (active: boolean) => void;
  setAutoRefreshRunning: (running: boolean) => void;
  setForeground: (foreground: boolean) => void;
  setBackground: (background: boolean) => void;
  setPollingPaused: (paused: boolean) => void;
  updateLastApiTime: (time: number) => void;
  updateStats: (marketplace: string, floor: number, total: number) => void;
  reset: () => void;
}

export const usePollingStore = create<PollingState>()(
  persist(
    (set) => ({
      // Valores iniciales
      countdownSeconds: 300,
      isCircleLoading: false,
      isPollingActive: false,
      isAutoRefreshRunning: false,
      isInForeground: true,
      isInBackground: false,
      isPollingPausedExternally: false,
      lastApiUpdateTime: 0,
      ordinalswalletFloorPrice: null,
      ordinalswalletTotalListings: null,
      unisatFloorPrice: null,
      unisatTotalListings: null,
      unifiedFloorPrice: null,
      unifiedTotalListings: null,
      
      // Acciones
      setCountdown: (seconds) => set({ countdownSeconds: seconds }),
      setCircleLoading: (loading) => set({ isCircleLoading: loading }),
      setPollingActive: (active) => set({ isPollingActive: active }),
      setAutoRefreshRunning: (running) => set({ isAutoRefreshRunning: running }),
      setForeground: (foreground) => set({ isInForeground: foreground, isInBackground: !foreground }),
      setBackground: (background) => set({ isInBackground: background, isInForeground: !background }),
      setPollingPaused: (paused) => set({ isPollingPausedExternally: paused }),
      updateLastApiTime: (time) => set({ lastApiUpdateTime: time }),
      updateStats: (marketplace, floor, total) => {
        const key = `${marketplace}FloorPrice`;
        const totalKey = `${marketplace}TotalListings`;
        set({ [key]: floor, [totalKey]: total } as any);
      },
      reset: () => set({
        countdownSeconds: 300,
        isCircleLoading: false,
        isPollingActive: false,
        isAutoRefreshRunning: false,
        lastApiUpdateTime: Date.now(),
      }),
    }),
    {
      name: 'polling-storage',
      partialize: (state) => ({
        lastApiUpdateTime: state.lastApiUpdateTime,
        ordinalswalletFloorPrice: state.ordinalswalletFloorPrice,
        ordinalswalletTotalListings: state.ordinalswalletTotalListings,
        unisatFloorPrice: state.unisatFloorPrice,
        unisatTotalListings: state.unisatTotalListings,
      }),
    }
  )
);
```

### 4.2 Timer Hook (`usePollingTimer.ts`)

```typescript
// hooks/usePollingTimer.ts
import { useEffect, useRef, useCallback } from 'react';
import { usePollingStore } from '../stores/pollingStore';
import { executePollingFinally } from '../services/pollingFinally';

const COUNTDOWN_SECONDS = 300; // 5 minutos

export function usePollingTimer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    countdownSeconds,
    isAutoRefreshRunning,
    isPollingActive,
    isInForeground,
    isPollingPausedExternally,
    lastApiUpdateTime,
    setCountdown,
    setCircleLoading,
    setPollingActive,
    setAutoRefreshRunning,
    updateLastApiTime,
  } = usePollingStore();

  // Función de auto-refresh
  const executeAutoRefresh = useCallback(async () => {
    if (isPollingActive || isAutoRefreshRunning) return;
    if (isPollingPausedExternally) return;
    if (!isInForeground) return;
    
    console.log('[Polling] Iniciando auto-refresh...');
    
    setAutoRefreshRunning(true);
    setCircleLoading(true);
    setPollingActive(true);
    
    try {
      // Importar dinámicamente para evitar circular deps
      const { executePolling } = await import('../services/pollingService');
      await executePolling();
    } catch (error) {
      console.error('[Polling] Error:', error);
    } finally {
      // SIEMPRE ejecutar finally
      await executePollingFinally();
    }
  }, [isPollingActive, isAutoRefreshRunning, isPollingPausedExternally, isInForeground]);

  // Efecto del timer
  useEffect(() => {
    // Calcular countdown basado en lastApiUpdateTime
    const calculateCountdown = () => {
      const elapsed = Math.floor((Date.now() - lastApiUpdateTime) / 1000);
      const remaining = COUNTDOWN_SECONDS - (elapsed % COUNTDOWN_SECONDS);
      return remaining;
    };
    
    // Actualizar countdown cada segundo
    intervalRef.current = setInterval(() => {
      if (isAutoRefreshRunning || isPollingActive) {
        // Congelar countdown durante polling
        setCountdown(0);
        return;
      }
      
      const remaining = calculateCountdown();
      setCountdown(remaining);
      
      // Si countdown llega a 0, ejecutar auto-refresh
      if (remaining <= 0) {
        executeAutoRefresh();
      }
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastApiUpdateTime, isAutoRefreshRunning, isPollingActive]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      const store = usePollingStore.getState();
      
      if (document.hidden) {
        store.setBackground(true);
        console.log('[Polling] App en background');
      } else {
        store.setForeground(true);
        console.log('[Polling] App en foreground');
        
        // Al volver a foreground, verificar si necesita polling
        const elapsed = Date.now() - store.lastApiUpdateTime;
        if (elapsed > COUNTDOWN_SECONDS * 1000) {
          executeAutoRefresh();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    countdownSeconds,
    isCircleLoading,
    isPollingActive,
    startPolling: executeAutoRefresh,
  };
}
```

### 4.3 Servicio de Polling (`pollingService.ts`)

```typescript
// services/pollingService.ts
import { usePollingStore } from '../stores/pollingStore';

const API_BASE = 'https://bitmapcore.net/api/v1';

interface PollingResult {
  ordinalswallet: {
    listings: any[];
    floorPrice: number;
    totalListings: number;
  };
  unisat: {
    listings: any[];
    floorPrice: number;
    totalListings: number;
  };
}

export async function executePolling(): Promise<PollingResult> {
  const store = usePollingStore.getState();
  
  console.log('[Polling] Ejecutando polling...');
  console.log(`[STATS-BEFORE] Ordinalswallet: floor=${store.ordinalswalletFloorPrice}, total=${store.ordinalswalletTotalListings}`);
  console.log(`[STATS-BEFORE] Unisat: floor=${store.unisatFloorPrice}, total=${store.unisatTotalListings}`);
  
  // Ejecutar en paralelo
  const [ordinalswalletResult, unisatResult] = await Promise.all([
    fetchOrdinalswalletListings(),
    fetchUnisatListings(),
  ]);
  
  // Actualizar stats
  store.updateStats('ordinalswallet', ordinalswalletResult.floorPrice, ordinalswalletResult.totalListings);
  store.updateStats('unisat', unisatResult.floorPrice, unisatResult.totalListings);
  
  console.log(`[STATS-AFTER] Ordinalswallet: floor=${ordinalswalletResult.floorPrice}, total=${ordinalswalletResult.totalListings}`);
  console.log(`[STATS-AFTER] Unisat: floor=${unisatResult.floorPrice}, total=${unisatResult.totalListings}`);
  
  return {
    ordinalswallet: ordinalswalletResult,
    unisat: unisatResult,
  };
}

async function fetchOrdinalswalletListings() {
  const response = await fetch(`${API_BASE}/proxy/ordinalswallet/listings?limit=100`);
  const data = await response.json();
  
  const listings = data.data?.listings || [];
  const floorPrice = calculateFloor(listings);
  const totalListings = data.data?.total || 0;
  
  // Guardar en cache
  await saveToCache('ordinalswallet', listings);
  
  return { listings, floorPrice, totalListings };
}

async function fetchUnisatListings() {
  const response = await fetch(`${API_BASE}/proxy/unisat/listings?limit=100`);
  const data = await response.json();
  
  const listings = data.data?.listings || [];
  const floorPrice = calculateFloor(listings);
  const totalListings = data.data?.total || 0;
  
  // Guardar en cache
  await saveToCache('unisat', listings);
  
  return { listings, floorPrice, totalListings };
}

function calculateFloor(listings: any[]): number {
  if (listings.length === 0) return 0;
  return Math.min(...listings.map(l => l.price));
}

async function saveToCache(marketplace: string, listings: any[]) {
  // Guardar en IndexedDB
  const db = await openDB();
  const tx = db.transaction('listings', 'readwrite');
  const store = tx.objectStore('listings');
  
  for (const listing of listings) {
    await store.put({ ...listing, marketplace, cachedAt: Date.now() });
  }
}
```

### 4.4 Bloque Finally (`pollingFinally.ts`)

Ver Doc 28: Bloque Finally Web.

---

## 5. Ciclo de Vida del Polling

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE POLLING WEB                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. APP CARGA                                               │
│     → usePollingTimer() se inicializa                       │
│     → Calcula countdown basado en lastApiUpdateTime         │
│     → Inicia setInterval(1000)                              │
│                                                             │
│  2. COUNTDOWN 300→0                                         │
│     → Cada segundo actualiza countdownSeconds               │
│     → Cuando llega a 0 → executeAutoRefresh()              │
│                                                             │
│  3. POLLING ACTIVO                                          │
│     → setPollingActive(true)                                │
│     → setCircleLoading(true)                                │
│     → setAutoRefreshRunning(true)                           │
│     → countdown se congela en 0                             │
│     → fetchOrdinalswalletListings() + fetchUnisatListings() │
│                                                             │
│  4. POLLING COMPLETADO                                      │
│     → executePollingFinally()                               │
│     → Persistir caches                                     │
│     → Actualizar stats                                      │
│     → Refrescar UI                                          │
│     → Limpiar indicadores                                   │
│     → Reiniciar countdown a 300                             │
│                                                             │
│  5. BACKGROUND (Tab oculta)                                 │
│     → document.visibilitychange → hidden                    │
│     → Polling se pausa                                      │
│     → Al volver → verificar si necesita refresh             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Estados del Store

| Estado | Tipo | Valor Inicial | Descripción |
|--------|------|:-------------:|-------------|
| `countdownSeconds` | number | 300 | Cuenta regresiva hasta próximo polling |
| `isCircleLoading` | boolean | false | Círculo de carga visible |
| `isPollingActive` | boolean | false | Polling en ejecución |
| `isAutoRefreshRunning` | boolean | false | Auto-refresh activo |
| `isInForeground` | boolean | true | App visible |
| `isInBackground` | boolean | false | App oculta |
| `isPollingPausedExternally` | boolean | false | Polling pausado por wallet/dialog |
| `lastApiUpdateTime` | number | 0 | Timestamp del último polling |
| `ordinalswalletFloorPrice` | number | null | Floor price Ordinalswallet |
| `ordinalswalletTotalListings` | number | null | Total listings Ordinalswallet |
| `unisatFloorPrice` | number | null | Floor price Unisat |
| `unisatTotalListings` | number | null | Total listings Unisat |

---

## 7. Reglas Obligatorias

| # | Regla | Descripción |
|---|-------|-------------|
| 1 | **Timer único** | Solo un `setInterval` activo a la vez |
| 2 | **Countdown 300s** | Siempre 300 segundos entre pollings |
| 3 | **Congelar durante polling** | countdown = 0 cuando `isPollingActive = true` |
| 4 | **Background pausa** | No hacer polling si `document.hidden = true` |
| 5 | **Polling pausado** | No hacer polling si `isPollingPausedExternally = true` |
| 6 | **Finally obligatorio** | SIEMPRE ejecutar `executePollingFinally()` |
| 7 | **Persistir stats** | Guardar lastApiUpdateTime en localStorage |
| 8 | **Visibility change** | Re-ejecutar al volver a foreground si pasó 5min |

---

## 8. Comparación con Android

| Función | Android | Web |
|---------|---------|-----|
| `CronometroUniversalDelPolling.start()` | `while(true) { delay(1000) }` | `setInterval(1000)` |
| `CronometroUniversalDelPolling.countdownSeconds` | `MutableStateFlow<Int>` | Zustand store |
| `EstadoCompartidoDelPolling.lastApiUpdateTime` | `MutableStateFlow<Long>` | Zustand + persist |
| `PollingPrimerPlano.execute()` | `async { launch { ... } }` | `async/await` |
| `PollingFinally.execute()` | `finally { ... }` | `finally { ... }` |
| `BitmapCorpApplication.isInForeground` | `Lifecycle` callbacks | `document.visibilitychange` |
| `CacheProgressiveLoadScheduler` | `AlarmManager` | `setInterval` + visibility |
