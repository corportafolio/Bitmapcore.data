# 22 - CEREBRO #10: DURANTEELPOLLINGBLOQUEARIMAGENES - CEREBRO BLOQUEADOR

## 1. Propósito

DuranteElPollingBloquearImagenesViewModel es el **semáforo de seguridad** del sistema. Siempre activo, monitorea el estado del polling y bloquea el inicio de generación de nuevas imágenes mientras el polling está en curso.

**Ubicación:** `viewmodel/DuranteElPollingBloquearImagenesViewModel.kt`
**Tipo:** `@HiltViewModel` (ViewModel simple)

---

## 2. Responsabilidades

| # | Responsabilidad | Descripción |
|---|----------------|-------------|
| 1 | **Observar polling** | Observa `CronometroUniversalDelPolling.isPollingActive` |
| 2 | **Bloquear imágenes** | Activa flag `_bloquearInicioImagenes` cuando polling está activo |
| 3 | **Liberar imágenes** | Desactiva flag cuando polling termina |
| 4 | **Proteger recursos** | Evita ANR y competencia de CPU/red |

---

## 3. Tablas que Controla

**NO controla tablas de base de datos.** Este cerebro es puramente de lógica de estado.

---

## 4. StateFlow que Observa

| StateFlow | Fuente | Tipo | Descripción |
|-----------|--------|------|-------------|
| `CronometroUniversalDelPolling.isPollingActive` | Companion object global | `Boolean` | Si el polling de marketplaces está activo |

---

## 5. Flag Global

```kotlin
companion object {
    var _bloquearInicioImagenes = false
    
    fun isBloqueoActivo(): Boolean = _bloquearInicioImagenes
    
    fun setBloqueoActivo(bloqueo: Boolean) {
        _bloquearInicioImagenes = bloqueo
    }
}
```

---

## 6. Flujo

```
App inicia → Cerebro 10 creado → Observa isPollingActive
    ↓
Polling COMIENZA → _bloquearInicioImagenes = true
    ↓
Bloquea: BlockImageBubble, DiscountItemCard, SelectorScreen
    ↓
Polling TERMINA → _bloquearInicioImagenes = false
    ↓
Libera: BlockImageBubble, DiscountItemCard, SelectorScreen
```

---

## 7. Componentes Afectados

| Componente | Qué hace cuando está bloqueado |
|------------|-------------------------------|
| `BlockImageBubble` | No inicia peticiones de generación de bitmaps |
| `DiscountItemCard` | Pausa carga de imágenes |
| `SelectorScreen` | Evita actualizar miniaturas |

---

## 8. ¿Por qué es Vital?

Sin Cerebro #10:
- La generación masiva de imágenes (Cerebro #7) competiría con el tráfico de red del polling (Cerebro #2)
- CPU y memoria sobrecargadas
- Caídas de frames (jank)
- Posibles Application Not Responding (ANR)
- Experiencia del usuario deteriorada

---

## 9. Web Equivalente (React + TypeScript + Zustand)

```typescript
// stores/usePollingStore.ts
import { create } from 'zustand'

interface PollingStore {
  isPollingActive: boolean
  bloquearInicioImagenes: boolean
  setPollingActive: (active: boolean) => void
}

export const usePollingStore = create<PollingStore>((set) => ({
  isPollingActive: false,
  bloquearInicioImagenes: false,
  setPollingActive: (active) => set({
    isPollingActive: active,
    bloquearInicioImagenes: active // Bloquea/libera automáticamente
  })
}))

// hooks/useBloqueoImagenes.ts
export function useBloqueoImagenes() {
  const bloquearInicioImagenes = usePollingStore(s => s.bloquearInicioImagenes)
  return { bloqueado: bloquearInicioImagenes }
}

// En componente:
function BlockImageBubble({ blockNumber }: Props) {
  const { bloqueado } = useBloqueoImagenes()
  
  const handleGenerateImage = () => {
    if (bloqueado) {
      console.log('Polling activo, imagen bloqueada')
      return // No generar imagen
    }
    // Generar imagen...
  }
}
```

**Diferencias Android → Web:**
- Companion object static var → Zustand global state
- `CronometroUniversalDelPolling.isPollingActive` → Zustand `usePollingStore.isPollingActive`
- `isBloqueoActivo()` → `useBloqueoImagenes()` hook
- ViewModel lifecycle → Component mount/unmount
- Hilt injection → Direct import de store
