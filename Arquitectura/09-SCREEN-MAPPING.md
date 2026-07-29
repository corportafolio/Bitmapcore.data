# BitmapCore — Mapeo de Pantallas: Android → Web

## Resumen

| Total pantallas Android | 25+ pantallas Compose |
|--------------------------|----------------------|
| Total pantallas web | ~25 páginas React |
| Componentes compartidos | ~40 composables reutilizables |
| Navegación Android | Navigation Compose (NavHost) |
| Navegación web | React Router v6 |

---

## 1. Pantallas Principales

| # | Pantalla Android | Archivo Android | Pantalla Web (React) | Notas |
|---|------------------|-----------------|----------------------|-------|
| 1 | Home / Selector | `ui/screens/marketplace/MarketplaceSelectorScreen.kt` | `pages/HomePage.tsx` | Burbujas de marketplaces + stats |
| 2 | Cuentas / Wallet | `ui/CuentasScreen.kt` | `pages/WalletPage.tsx` | Conexión de wallets, balance |
| 3 | Perfil | `ui/PerfilScreen.kt` | `pages/ProfilePage.tsx` | Configuración usuario, tema |
| 4 | Admin | `ui/AdminScreen.kt` | `pages/AdminPage.tsx` | Panel admin (futuro) |
| 5 | Whitepaper | `ui/WithepaperScreen.kt` | `pages/WhitepaperPage.tsx` | Documentación bitmap |

---

## 2. Marketplace Selector (Pantalla Principal)

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `MarketplaceSelectorScreen` | `HomePage` | Contenedor principal |
| `MarketplaceBubble` | `MarketplaceBubble` | Burbuja con stats de marketplace |
| `OkxBubble` | No aplica | OKX desactivado |
| `BlockImageBubble` | `BlockImageBubble` | Imagen Mondrian del bloque |
| `SortOptionButton` | `SortOptionButton` | Botón de ordenamiento |

### Sub-pantallas del Selector

| Sub-pantalla Android | Sub-pantalla Web | Descripción |
|----------------------|------------------|-------------|
| `PantallaDescuentosScreen` | `DiscountsPage` | Descuentos por etiqueta |
| `TablasDeEtiquetasPorPrecioMasBajoScreen` | `TagTablesPage` | Tablas por precio más bajo |
| `SepararEtiquetasEnGruposPorPreciosScreen` | `TagGroupsPage` | Grupos de etiquetas por precio |
| `VentasTodosLosMarketplacesScreen` | `SalesPage` | Ventas de todos los marketplaces |

---

## 3. Marketplace Externo: Ordinalswallet

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `OrdinalswalletMarketplaceScreen` | `OrdinalswalletPage` | Lista de listings de Ordinalswallet |
| `BlockImageBubble` | `BlockImageBubble` | Imagen Mondrian reutilizable |

---

## 4. Marketplace Externo: Unisat

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `UnisatMarketplaceScreen` | `UnisatPage` | Lista de listings de Unisat |

---

## 5. Marketplace Local: BitMapCore Backend

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `LocalBitmapCoreMarketplaceScreen` | `LocalMarketplacePage` | Lista de listings locales |
| `BitMapDetailScreen` | `BitmapDetailPage` | Detalle de bitmap específico |
| `BuyBitmapScreen` | `BuyBitmapPage` | Flujo de compra |
| `MyAssetsScreen` | `MyAssetsPage` | Inscripciones del usuario |
| `DetalleScreen` | `AssetDetailPage` | Detalle de inscripción |
| `TransactionHistoryScreen` | `TransactionHistoryPage` | Historial de transacciones |
| `HistorialWalletsScreen` | `WalletHistoryPage` | Historial de wallets conectadas |

### Composables del Marketplace Local

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `WalletConnectMenu` | `WalletConnectMenu` | Menú de conexión wallet |
| `WalletStatusButton` | `WalletStatusButton` | Botón estado de wallet |
| `LoadingOverlay` | `LoadingOverlay` | Overlay de carga |
| `TransactionConfirmDialog` | `TransactionConfirmDialog` | Diálogo confirmación compra |
| `SuccessDialog` | `SuccessDialog` | Diálogo de éxito |

---

## 6. Bloques y Etiquetas

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `PantalladeTablas` | `TablesPage` | Lista de tablas de etiquetas |
| `TagTableScreen` | `TagTableDetailPage` | Detalle de tabla de etiquetas |
| `TagInfoScreen` | `TagInfoPage` | Info de etiqueta específica |
| `PantallaDeBloqueEspecificoScreen` | `BlockDetailPage` | Detalle de bloque específico |
| `EtiquetasDisplay` | `TagsDisplay` | Display de etiquetas |
| `ClasificacionBurbujas3y4` | `BubbleClassification` | Clasificación de burbujas |
| `Burbujas1-2-3` | `Bubbles123` | Burbujas 1-2-3 |
| `BurbujaDeAnuncios` | `AdBubble` | Burbuja de anuncios |
| `DisenoEtiquetasUniversal` | `UniversalTagDesign` | Diseño universal de etiquetas |

---

## 7. Components Reutilizables

| Componente Android | Componente Web | Descripción |
|--------------------|----------------|-------------|
| `TopBar` | `Header` | Barra superior |
| `InscriptionImage` | `InscriptionImage` | Imagen de inscripción |
| `CircularProgressView` | `CircularProgress` | Progreso circular |
| `LoadingSpinnerView` | `LoadingSpinner` | Spinner de carga |
| `LoadingCircle` | `LoadingCircle` | Círculo de carga |
| `AutoSizeText` | `AutoSizeText` | Texto auto-dimensionado |
| `SortOptionButton` | `SortOptionButton` | Botón de orden |

---

## 8. Tema y Strings

| Archivo Android | Archivo Web | Descripción |
|-----------------|-------------|-------------|
| `ui/theme/Color.kt` | `theme/colors.ts` | Colores del tema |
| `ui/theme/Theme.kt` | `theme/Theme.tsx` | Tema claro/oscuro |
| `ui/theme/Type.kt` | `theme/fonts.ts` | Tipografías |
| `ui/theme/strings/AdminStrings.kt` | `i18n/es/admin.json` | Strings admin (ES) |
| `ui/theme/strings/DatabaseStrings.kt` | `i18n/es/database.json` | Strings DB (ES) |
| `ui/theme/strings/AuthStrings.kt` | `i18n/es/auth.json` | Strings auth (ES) |
| `ui/theme/strings/MarketplaceStrings.kt` | `i18n/es/marketplace.json` | Strings marketplace (ES) |
| `ui/theme/strings/SearchStrings.kt` | `i18n/es/search.json` | Strings búsqueda (ES) |
| `ui/theme/strings/CoreStrings.kt` | `i18n/es/core.json` | Strings core (ES) |
| `ui/theme/strings/WhitepaperStrings.kt` | `i18n/es/whitepaper.json` | Strings whitepaper (ES) |

---

## 9. Pantallas que NO aplican en Web

| Pantalla Android | Razón |
|------------------|-------|
| `DescargarBDLogic.kt` | Web no descarga DB |
| `SubirBDlogic.kt` | Web no sube DB |
| `MarketplaceSelectorScreen.kt` (polling background) | Web usa `setInterval` |
| `BlockImageViewModel` (generación local) | Web genera bajo demanda |

---

## 10. Rutas de Navegación Web (React Router)

```typescript
// routes.tsx
const routes = [
  // Principales
  { path: '/', element: <HomePage /> },
  { path: '/wallet', element: <WalletPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/whitepaper', element: <WhitepaperPage /> },
  
  // Marketplace Ordinalswallet
  { path: '/ordinalswallet', element: <OrdinalswalletPage /> },
  
  // Marketplace Unisat
  { path: '/unisat', element: <UnisatPage /> },
  
  // Marketplace Local
  { path: '/local', element: <LocalMarketplacePage /> },
  { path: '/local/:id', element: <BitmapDetailPage /> },
  { path: '/local/:id/buy', element: <BuyBitmapPage /> },
  { path: '/my-assets', element: <MyAssetsPage /> },
  { path: '/my-assets/:id', element: <AssetDetailPage /> },
  { path: '/transactions', element: <TransactionHistoryPage /> },
  { path: '/wallet-history', element: <WalletHistoryPage /> },
  
  // Bloques y Etiquetas
  { path: '/tables', element: <TablesPage /> },
  { path: '/tables/:tagName', element: <TagTableDetailPage /> },
  { path: '/tag/:tagName', element: <TagInfoPage /> },
  { path: '/block/:number', element: <BlockDetailPage /> },
  
  // Marketplace Selector
  { path: '/discounts', element: <DiscountsPage /> },
  { path: '/tag-tables', element: <TagTablesPage /> },
  { path: '/tag-groups', element: <TagGroupsPage /> },
  { path: '/sales', element: <SalesPage /> },
  
  // Admin
  { path: '/admin', element: <AdminPage /> },
];
```
