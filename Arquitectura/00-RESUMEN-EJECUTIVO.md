# BitmapCore — Resumen Ejecutivo de Arquitectura Web

## Qué es BitmapCore

BitmapCore es una plataforma de comercio de Bitmaps (NFTs de bloques de Bitcoin) que funciona como:

1. **App Android** — Aplicación nativa con base de datos local de ~500MB, 15 tablas Room, 10 cerebros (ViewModels), y conexión a 3 marketplaces
2. **Servidor Backend** — API REST en Node.js/TypeScript corriendo en VPS (Contabo Cloud VPS 4, `80.190.76.108` / `bitmapcore.net`), puerto 3000, PM2, Nginx reverse proxy con SSL
3. **App Web** — (En desarrollo) Aplicación web que replica exactamente la funcionalidad de la app Android, comunicándose con el MISMO servidor

## El Servidor: Punto Central

```
                    ┌──────────────────────┐
                    │   BitmapCorpServer    │
                    │   bitmapcore.net:3000 │
                    │   Node.js + Express   │
                    │   better-sqlite3       │
                    │   bitcoinjs-lib        │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
              ┌─────┴─────┐         ┌──────┴──────┐
              │   App      │         │   App       │
              │  Android   │         │    Web      │
              │  (Kotlin)  │         │ (React/TS)  │
              └────────────┘         └─────────────┘
```

**El servidor EXISTE y FUNCIONA.** Ya sirve a la app Android. La versión web debe usar el MISMO servidor, los MISMOS endpoints, la MISMA base de datos SQLite.

## Stack Actual del Servidor

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Runtime | Node.js | v20.20.2 |
| Framework | Express.js | 4.18.2 |
| Lenguaje | TypeScript | 5.3.3 |
| DB | better-sqlite3 | 11.10.0 |
| Bitcoin | bitcoinjs-lib | 7.0.1 |
| Process Manager | PM2 | 7.0.3 |
| Reverse Proxy | Nginx | 1.24.0 |
| SSL | Let's Encrypt (Cloudflare) | Activo |
| DNS | Cloudflare | bitmapcore.net |

## Endpoints Actuales del Servidor

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/bitmaps` | GET | Listings paginados |
| `/api/v1/bitmaps/active` | GET | Todos los listings activos |
| `/api/v1/bitmaps/sold` | GET | Listings vendidos desde timestamp |
| `/api/v1/bitmaps/owner/:address` | GET | Inscripciones del propietario |
| `/api/v1/bitmaps/:id` | GET | Detalle de listing |
| `/api/v1/bitmaps` | POST | Crear listing (PSBT) |
| `/api/v1/bitmaps/:id/sign` | POST | Firmar listing |
| `/api/v1/transaction/buy-bitmap` | POST | Iniciar compra PSBT |
| `/api/v1/transaction/broadcast` | POST | Transmitir PSBT firmado |
| `/api/v1/wallet/:address/balance` | GET | Balance de wallet |
| `/api/v1/wallet/:address/utxos` | GET | UTXOs de wallet |
| `/api/v1/verify-bitmap/:id` | GET | Verificar bitmap |

## Endpoints Nuevos Necesarios para Web

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/proxy/ordinalswallet/listings` | GET | Proxy Ordinalswallet |
| `/api/v1/proxy/ordinalswallet/sold` | GET | Proxy Ordinalswallet vendidos |
| `/api/v1/proxy/ordinalswallet/stats` | GET | Proxy Ordinalswallet stats |
| `/api/v1/proxy/unisat/actions` | POST | Proxy Unisat bitmap actions |
| `/api/v1/proxy/okx/listings` | POST | Proxy OKX listings (desactivado) |
| `/api/v1/tags` | GET | Todas las etiquetas |
| `/api/v1/tags/:name/blocks` | GET | Bloques por etiqueta |
| `/api/v1/tags/stats` | GET | Estadísticas de etiquetas |

## ¿Por qué el mismo servidor?

1. **No duplicar lógica** — El servidor ya tiene PSBT, verificación de ownership, broadcast de transacciones
2. **Misma base de datos** — Los listings creados desde Android aparecen en la web y viceversa
3. **Mismo security model** — Rate limiting, CORS, validación, todo ya implementado
4. **Costo cero** — No se necesita otro servidor, ya tenemos VPS con 93GB libres
5. **Consistencia** — Un solo source of truth para todos los datos

## Diferencias Clave Android vs Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Wallet connection | Deep links a apps móviles | Extensiones de navegador (Unisat, Xverse) |
| PSBT signing | `unisat://response` callback | `window.unisat.signPsbt()` |
| Base de datos local | Room DB (~500MB, 15 tablas) | Ninguna (todo del servidor) |
| Polling | WorkManager background | `setInterval` en navegador |
| Imágenes Mondrian | Canvas de Android | Canvas API del navegador |
| Descarga de DB | Manual (archivo .db) | No aplica |
| Offline mode | Sí (DB local) | No (requiere conexión) |

## Cerebros (ViewModels) — 10 Total

| # | Nombre | Responsabilidad | Tablas |
|---|--------|-----------------|--------|
| 1 | `BlockViewModel` | Sistema central: descarga, clasificación, búsqueda | Tabla 1 |
| 2 | `MarketplaceViewModel` | Coordinador de marketplaces externos | Caches Ordinalswallet/Unisat |
| 3 | `LanguageStrings` | Traducciones español/inglés | Ninguna |
| 4 | `ConnectionWalletsViewModel` | Conexión wallet + PSBT + Mis Activos | Tabla 5 (cols 10,11) + Tabla 15 |
| 5 | `LocalBitMapCoreMarketplaceViewModel` | Marketplace local compra/venta | Tabla 5 (wallets, transactions) |
| 6 | `UnifiedListingsViewModel` | Listings unificados de 3 marketplaces | Tablas 6, 7, 8, 11 |
| 7 | `BlockImageViewModel` | Generación imágenes Mondrian | Tablas 12, 13, 14 |
| 8 | `ObservadorCiclosViewModel` | Observador siempre activo de ciclos imagen | Tabla 13 (solo lectura) |
| 9 | `SelectorScreenViewModel` | Datos pantalla selector de marketplaces | Tabla 14 (solo lectura) |
| 10 | `DuranteElPollingBloquearImagenesViewModel` | Bloqueo imágenes durante polling | Ninguna |
| — | `SelectorScreenViewModel` | Datos de pantalla selector (Tabla 14) |
| — | `BlockViewModel` | Datos de bloques, búsqueda, DB management |

## Bases de Datos — 15 Tablas Room

| # | Tabla | Propósito | Tamaño aprox. |
|---|-------|-----------|---------------|
| 1 | `BlockDatabase` | Bloques de Bitcoin + etiquetas | ~350MB |
| 2 | `BitMapCoreDatabase` | Wallets, transacciones, cache servidor | ~1MB |
| 3 | `OkxDatabase` | Cache de listings OKX (desactivado) | ~5MB |
| 4 | `EtiquetasPorPrecioDatabase` | Etiquetas clasificadas por precio | ~2MB |
| 5 | `BlockImageCacheDatabase` | Imágenes Mondrian permanentes (Tabla 12) | ~50MB |
| 6 | `Tabla13Database` | Buffer temporal de imágenes | ~5MB |
| 7 | `BlockSpecificDatabase` | Detalle de transacciones por bloque | ~10MB |
| 8 | `BlockPermanentDatabase` | Pesos permanentes de transacciones | ~5MB |
| 9 | `DescuentosDatabase` | Descuentos calculados (Tabla 11) | ~1MB |
| 10 | `UnifiedListingsDatabase` | Listings unificados (Tabla 6) | ~5MB |
| 11 | `MisActivosDatabase` | Inscripciones del usuario (Tabla 15) | ~10MB |
| 12 | `SelectorScreenDatabase` | Cache pantalla selector (Tabla 14) | ~2MB |
| 13 | `UnisatDatabase` | Cache de listings Unisat | ~5MB |
| 14 | `OrdinalswalletDatabase` | Cache de listings Ordinalswallet | ~10MB |
| 15 | `SoldListingsDatabase` | Listings vendidos (Tabla 7) | ~2MB |

**Total approx: ~460MB en la app Android**

## Marketplaces Activos

| # | Marketplace | Estado | Requiere API Key | Endpoints |
|---|-------------|--------|------------------|-----------|
| 1 | **Ordinalswallet** | ACTIVO | No | `turbo.ordinalswallet.com/collection/bitmap/*` |
| 2 | **Unisat** | ACTIVO | Opcional (usuario puede poner la suya) | `open-api.unisat.io/v3/market/collection/auction/actions` |
| 3 | **BitMapCore Backend** | ACTIVO | No (wallet-based) | `bitmapcore.net/api/v1/*` |

## APIs Auxiliares (No marketplaces)

| API | Propósito | Base URL |
|-----|-----------|----------|
| Ordinals.com | Contenido de inscripciones, verificación | `ordinals.com/r` |
| Mempool.space | UTXOs, transacciones | `mempool.space/api` |
| Ordiscan | Detalle de inscripciones, runes | `api.ordiscan.com` |
| Ord | API de ordinals alternativa | Varias |
| Block Transactions | Datos de transacciones por bloque | `bitmapcore.net/api/v1/block/*` |

## Fases de Implementación

| Fase | Descripción | Tiempo estimado |
|------|-------------|-----------------|
| Fase 1 | Preparar servidor (proxy routes, CORS, static files) | 2-3 días |
| Fase 2 | Frontend base (React + Vite + Tailwind + routing) | 2-3 días |
| Fase 3 | Marketplace externo (Ordinalswallet + Unisat pages) | 3-4 días |
| Fase 4 | Marketplace local (BitMapCore buy/sell + PSBT) | 3-4 días |
| Fase 5 | Funcionalidad core (Home, Unified, Tags, Discounts) | 3-4 días |
| Fase 6 | Wallet + Assets + Perfil | 2-3 días |
| Fase 7 | Pulido (responsive, polling, testing) | 2-3 días |
| **Total** | | **17-24 días** |
