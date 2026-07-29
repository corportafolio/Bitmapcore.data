# 21 - CEREBRO #3: LANGUAGESTRINGS - CEREBRO DE TRADUCCIONES

## 1. Propósito

LanguageStrings.kt es el cerebro central que gestiona todas las traducciones de la aplicación en español e inglés. Permite que la app sea multilenguaje sin cambiar la arquitectura.

**Ubicación:** `ui/theme/LanguageStrings.kt`
**Tipo:** Data class + CompositionLocal

---

## 2. Responsabilidades

| # | Responsabilidad | Descripción |
|---|----------------|-------------|
| 1 | **Almacenar strings** | Todas las strings de la app en español e inglés |
| 2 | **Acceso reactivo** | Composición via CompositionLocal |
| 3 | **Compatibilidad** | Extensiones para código existente |
| 4 | **Cambio dinámico** | Cambio de idioma sin reiniciar app |

---

## 3. Tablas que Controla

**NO controla tablas de base de datos.** Este cerebro es puramente de strings.

---

## 4. Arquitectura de Strings

LanguageStrings usa **7 módulos** de strings separados:

| # | Módulo | Clase | Descripción | Ejemplo |
|---|--------|-------|-------------|---------|
| 1 | **Core** | `CoreStrings` | Strings generales | perfil, alias, tema, volver |
| 2 | **Auth** | `AuthStrings` | Autenticación y wallet | login, wallet, donaciones |
| 3 | **Database** | `DatabaseStrings` | Base de datos | descargandoBD, subiendoBD, estadisticas |
| 4 | **Search** | `SearchStrings` | Búsqueda | searchPlaceholder, filtrarBloque, hash |
| 5 | **Marketplace** | `MarketplaceStrings` | Marketplaces | listados, piso, vendidos, wallet connection |
| 6 | **Admin** | `AdminStrings` | Administración | tablas, etiquetas, clasificando |
| 7 | **Whitepaper** | `WhitepaperStrings` | Whitepaper | what_is_bitmap, roadmap, call_to_action |

---

## 5. Estructura de Datos

```kotlin
data class AppStrings(
    val core: CoreStrings,
    val auth: AuthStrings,
    val database: DatabaseStrings,
    val search: SearchStrings,
    val marketplace: MarketplaceStrings,
    val admin: AdminStrings,
    val whitepaper: WhitepaperStrings
)
```

Cada módulo es una interface con todas las strings de esa categoría.

---

## 6. Instancias

| Instancia | Idioma | Descripción |
|-----------|--------|-------------|
| `SpanishStrings` | Español | AppStrings con todos los módulos en español |
| `EnglishStrings` | Inglés | AppStrings con todos los módulos en inglés |

---

## 7. Uso en Compose

```kotlin
// CompositionLocal para acceso global
val LocalAppStrings = staticCompositionLocalOf<AppStrings> { SpanishStrings }

// En cualquier Composable:
val strings = LocalAppStrings.current
Text(text = strings.listados) // "Listados" en español, "Listings" en inglés
```

---

## 8. Cómo Selecciona Idioma

1. `UserPreferences` guarda el idioma seleccionado (`"es"` o `"en"`)
2. `BlockViewModel` (Cerebro #1) lee el idioma y asigna `_appStrings.value`
3. `CompositionLocalProvider` provee el `AppStrings` correcto a toda la UI
4. Cambio de idioma → `UserPreferences.saveLanguage()` → `BlockViewModel` actualiza → UI se re-renderiza

---

## 9. Cantidad de Strings

| Módulo | Español | Inglés | Total |
|--------|---------|--------|-------|
| Core | ~40 | ~40 | ~80 |
| Auth | ~30 | ~30 | ~60 |
| Database | ~120 | ~120 | ~240 |
| Search | ~30 | ~30 | ~60 |
| Marketplace | ~60 | ~60 | ~120 |
| Admin | ~40 | ~40 | ~80 |
| Whitepaper | ~30 | ~30 | ~60 |
| **Total** | **~350** | **~350** | **~700** |

---

## 10. Web Equivalente (React + TypeScript + Zustand)

```typescript
// stores/useI18nStore.ts
import { create } from 'zustand'

interface I18nStore {
  language: 'es' | 'en'
  strings: AppStrings
  setLanguage: (lang: 'es' | 'en') => void
}

// types/i18n.ts
interface AppStrings {
  core: CoreStrings
  auth: AuthStrings
  database: DatabaseStrings
  search: SearchStrings
  marketplace: MarketplaceStrings
  admin: AdminStrings
  whitepaper: WhitepaperStrings
}

// locales/es.ts
export const SpanishStrings: AppStrings = {
  core: { perfil: 'Perfil', alias: 'Alias', ... },
  auth: { login: 'Iniciar sesión', wallet: 'Billetera', ... },
  database: { descargandoBD: 'Descargando BD', ... },
  ...
}

// locales/en.ts
export const EnglishStrings: AppStrings = {
  core: { perfil: 'Profile', alias: 'Alias', ... },
  auth: { login: 'Login', wallet: 'Wallet', ... },
  database: { downloadingDB: 'Downloading DB', ... },
  ...
}

// hooks/useStrings.ts
export function useStrings() {
  const { strings } = useI18nStore()
  return strings
}

// En componente:
function MyComponent() {
  const strings = useStrings()
  return <h1>{strings.marketplace.listados}</h1>
}
```

**Diferencias Android → Web:**
- CompositionLocal → React Context + Zustand
- `staticCompositionLocalOf` → `createContext` + Provider
- `by lazy` initialization → import estático de objetos
- `UserPreferences` (DataStore) → Zustand persist + localStorage
