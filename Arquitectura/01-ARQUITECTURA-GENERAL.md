# BitmapCore — Arquitectura General: Android + Servidor + Web

## Visión General de la Arquitectura

```
╔══════════════════════════════════════════════════════════════════╗
║                    ARQUITECTURA BITMAPCORE                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌─────────────────┐    ┌─────────────────┐                     ║
║  │   APP ANDROID    │    │    APP WEB       │                    ║
║  │   (Kotlin)       │    │  (React + TS)    │                    ║
║  │                  │    │                   │                    ║
║  │ • 265 archivos   │    │ • ~80 archivos    │                    ║
║  │ • 15 DBs Room    │    │ • Sin DB local    │                    ║
║  │ • 10 ViewModels  │    │ • 10 stores       │                    ║
║  │ • 25 pantallas   │    │ • 25 páginas      │                    ║
║  │ • Deep links     │    │ • Extensiones     │                    ║
║  └────────┬─────────┘    └────────┬──────────┘                   ║
║           │                       │                               ║
║           │    HTTPS/REST API     │                               ║
║           └───────────┬───────────┘                               ║
║                       │                                           ║
║           ┌───────────┴───────────┐                               ║
║           │   BITMAPCORPSERVER     │                              ║
║           │   bitmapcore.net:3000  │                              ║
║           │                        │                              ║
║           │ • Express.js + TS      │                              ║
║           │ • better-sqlite3       │                              ║
║           │ • bitcoinjs-lib        │                              ║
║           │ • PM2 + Nginx          │                              ║
║           └───────────┬────────────┘                              ║
║                       │                                           ║
║           ┌───────────┴───────────┐                               ║
║           │    APIs EXTERNAS       │                              ║
║           │                        │                              ║
║           │ • Ordinalswallet API   │                              ║
║           │ • Unisat API           │                              ║
║           │ • Ordinals.com         │                              ║
║           │ • Mempool.space        │                              ║
║           └────────────────────────┘                              ║
╚══════════════════════════════════════════════════════════════════╝
```

## El Servidor como Punto Central

El servidor BitmapCorpServer es el **corazón del sistema**. Funciona como:

1. **API REST** para la app Android
2. **API REST** para la app web (mismos endpoints)
3. **Proxy** para APIs externas (Ordinalswallet, Unisat) — necesario para web因为浏览器 tiene restricciones CORS
4. **Almacén de datos** con SQLite (listings, transacciones, wallets)
5. **Motor de PSBT** para transacciones Bitcoin trustless

### Por qué el mismo servidor para ambas plataformas

| Razón | Explicación |
|-------|-------------|
| **Consistencia de datos** | Un listing creado en Android aparece en la web al instante |
| **Sin duplicación** | La lógica de PSBT, verificación, broadcast está una sola vez |
| **Seguridad unificada** | Rate limiting, validación, CORS — todo centralizado |
| **Costo cero** | Ya tenemos VPS con 93GB libres, Node.js v20, PM2 |
| **Mantenimiento** | Un solo código fuente del servidor para mantener |

## Flujo de Datos: Android

```
Android App
    │
    ├── 1. Scrapea Ordinalswallet API (cada 5 min)
    │      └── Guarda en Room DB (OrdinalswalletDatabase)
    │
    ├── 2. Scrapea Unisat API (cada 5 min)
    │      └── Guarda en Room DB (UnisatDatabase)
    │
    ├── 3. Llama a BitMapCoreBackendApi (servidor propio)
    │      └── Listings, compras, ventas, PSBT
    │
    ├── 4. Combina todo en Tabla 6 (UnifiedListingsDatabase)
    │
    ├── 5. Clasifica por tags en Tabla 8 (EtiquetasPorPrecioDatabase)
    │
    ├── 6. Genera imágenes Mondrian → Tabla 12 (BlockImageCacheDatabase)
    │
    └── 7. Muestra en 25 pantallas con 10 ViewModels
```

## Flujo de Datos: Web

```
Web App (React)
    │
    ├── 1. Llama a /api/v1/proxy/ordinalswallet/listings
    │      └── El SERVIDOR scrapea Ordinalswallet y retorna JSON
    │
    ├── 2. Llama a /api/v1/proxy/unisat/actions
    │      └── El SERVIDOR scrapea Unisat y retorna JSON
    │
    ├── 3. Llama a /api/v1/bitmaps/active (MISMO endpoint que Android)
    │      └── Listings, compras, ventas, PSBT
    │
    ├── 4. El SERVIDOR combina y retorna datos unificados
    │
    ├── 5. El SERVIDOR retorna tags y estadísticas
    │
    ├── 6. El NAVEGADOR genera imágenes Mondrian (Canvas API)
    │
    └── 7. Muestra en 25 páginas con React components
```

**Diferencia clave:** En Android, la app hace el scraping y procesamiento localmente. En Web, el SERVIDOR hace el scraping y el navegador solo consume JSON.

## Capas de la Arquitectura Android

```
┌─────────────────────────────────────────────────┐
│                    UI LAYER                       │
│  25 pantallas (@Composable)                      │
│  10 ViewModels (@HiltViewModel)                  │
│  Componentes reutilizables                        │
├─────────────────────────────────────────────────┤
│                  DOMAIN LAYER                    │
│  6 UseCases                                       │
│  4 Processors (Procesador7Ventas, Descuentos,    │
│                UnifiedMarketplace, Procesador8)   │
│  Modelos de dominio                               │
├─────────────────────────────────────────────────┤
│                   DATA LAYER                     │
│  15 Room Databases (24 entidades, 21 DAOs)       │
│  21 Repositories                                  │
│  3 CacheManagers                                  │
│  10 Retrofit APIs                                 │
├─────────────────────────────────────────────────┤
│                 SERVICE LAYER                     │
│  Polling (8 clases)                               │
│  Image Generation (5 clases)                      │
│  PSBT Signing (5 clases)                          │
│  Wallet Connection (12 clases)                    │
├─────────────────────────────────────────────────┤
│                INFRASTRUCTURE                     │
│  Hilt DI (3 módulos)                              │
│  WorkManager (ImageWorker)                        │
│  Foreground Service (CacheProgressiveLoad)        │
│  Deep Links (Unisat, Xverse, OrdinalsWallet)      │
└─────────────────────────────────────────────────┘
```

## Capas de la Arquitectura Web (Objetivo)

```
┌─────────────────────────────────────────────────┐
│                    UI LAYER                       │
│  25 páginas (React Components)                    │
│  10 stores (Zustand)                              │
│  Componentes reutilizables                        │
├─────────────────────────────────────────────────┤
│                  HOOKS LAYER                      │
│  usePolling                                       │
│  useWallet                                        │
│  useMarketplaceData                               │
│  useBitmapImage                                   │
├─────────────────────────────────────────────────┤
│                   API LAYER                       │
│  axiosClient (HTTP)                               │
│  bitmapsApi                                       │
│  marketplaceProxyApi                              │
│  transactionApi                                   │
│  walletApi                                        │
├─────────────────────────────────────────────────┤
│                 STORE LAYER (Zustand)             │
│  blockStore                                       │
│  marketplaceStore                                 │
│  walletStore                                      │
│  localMarketplaceStore                            │
│  settingsStore                                    │
├─────────────────────────────────────────────────┤
│              SERVIDOR (BitmapCorpServer)           │
│  Express.js + TypeScript + SQLite                 │
│  MISMO servidor que sirve a Android               │
└─────────────────────────────────────────────────┘
```

## Mapeo de Capas: Android → Web

| Android | Web | Notas |
|---------|-----|-------|
| `@Composable` screens | React components | Mismas 25 pantallas |
| `@HiltViewModel` | Zustand stores | Mismos 10 cerebros |
| Room Database | API calls al servidor | Sin DB local en web |
| Retrofit API | Axios HTTP client | Mismos endpoints |
| Repository | API service layer | Mismas funciones |
| CacheManager | Server-side cache | Cache en servidor |
| WorkManager | `setInterval` | Polling en navegador |
| Deep links | Browser extension API | `window.unisat.*` |
| Canvas Android | Canvas API browser | Imágenes Mondrian |
| Hilt DI | React Context / Zustand | Inyección simple |
| SharedPreferences | localStorage | Preferencias |

## Infraestructura del VPS

```
┌─────────────────────────────────────────────┐
│         Contabo Cloud VPS 4                  │
│         80.190.76.108                        │
│         Ubuntu 24.04                         │
│         100GB SSD (93GB libres)              │
│         16GB RAM                             │
├─────────────────────────────────────────────┤
│                                              │
│  Nginx 1.24.0                                │
│  ├── Puerto 443 (HTTPS) → bitmapcore.net     │
│  ├── /api/* → localhost:3000 (BitmapCorp)     │
│  ├── / → web/dist (React build)  [NUEVO]     │
│  └── SSL Let's Encrypt via Cloudflare        │
│                                              │
│  PM2 7.0.3                                   │
│  ├── bitmapcorp-server (port 3000)           │
│  └── bittick (port 4001)                     │
│                                              │
│  Node.js v20.20.2                            │
│  └── BitmapCorpServer (TypeScript)           │
│      ├── /api/v1/bitmaps/*                   │
│      ├── /api/v1/transaction/*               │
│      ├── /api/v1/wallet/*                    │
│      ├── /api/v1/proxy/* (NUEVO)             │
│      └── / (static React files) (NUEVO)      │
│                                              │
│  SQLite                                      │
│  ├── data/bitmapcorp.db                      │
│  └── data/btc_bloques.db                     │
│                                              │
└─────────────────────────────────────────────┘
```

## Arquitectura de Seguridad

### Android
- Deep links con nonces para autenticación de wallet
- PSBT validación en servidor (SIGHASH_SINGLE|ANYONECANPAY)
- Rate limiting por IP
- HTTPS obligatorio

### Web
- Misma validación PSBT en servidor
- CORS configurado para dominios permitidos
- Wallet connection vía extensiones de navegador
- Misma rate limiting
- HTTPS obligatorio

### Servidor (compartido)
- Helmet.js (security headers)
- CORS por whitelist de dominios
- Rate limiting (general: 10/min, purchase: 5/min)
- Validación con Zod
- Idempotency keys para prevenir duplicados
- Graceful shutdown
