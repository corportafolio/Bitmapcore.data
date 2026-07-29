# 04 - LOS 10 CEREBROS DE BITMAPCOREAPP

## Resumen de los 10 Cerebros

| # | ViewModel | Archivo | Responsabilidad | Tablas |
|---|-----------|---------|-----------------|--------|
| 1 | `BlockViewModel` | `ui/BlockViewModel.kt` | Sistema central: descarga, clasificación, búsqueda, estado | Tabla 1 (BlockDatabase) |
| 2 | `MarketplaceViewModel` | `viewmodel/MarketplaceViewModel.kt` | Coordinador de marketplaces externos | Caches Ordinalswallet/Unisat |
| 3 | `LanguageStrings` | `ui/theme/LanguageStrings.kt` | Sistema de traducciones español/inglés | Ninguna |
| 4 | `ConnectionWalletsViewModel` | `viewmodel/.../ConnectionWalletsViewModel.kt` | Conexión wallet + PSBT + Mis Activos | Tabla 5 (columnas 10,11) + Tabla 15 |
| 5 | `LocalBitMapCoreMarketplaceViewModel` | `viewmodel/.../LocalBitMapCoreMarketplaceViewModel.kt` | Marketplace local compra/venta | Tabla 5 (wallets, transactions) |
| 6 | `UnifiedListingsViewModel` | `viewmodel/UnifiedListingsViewModel.kt` | Listings unificados de 3 marketplaces | Tablas 6, 7, 8, 11 |
| 7 | `BlockImageViewModel` | `data/.../BlockImageViewModel.kt` | Generación imágenes Mondrian | Tablas 12, 13, 14 |
| 8 | `ObservadorCiclosViewModel` | `data/.../ObservadorCiclosViewModel.kt` | Observador siempre activo de ciclos imagen | Tabla 13 (solo lectura) |
| 9 | `SelectorScreenViewModel` | `viewmodel/SelectorScreenViewModel.kt` | Datos pantalla selector de marketplaces | Tabla 14 (solo lectura) |
| 10 | `DuranteElPollingBloquearImagenesViewModel` | `viewmodel/DuranteElPollingBloquearImagenesViewModel.kt` | Bloqueo imágenes durante polling | Ninguna |

---

## CEREBRO #1: BlockViewModel — Cerebro del Sistema

**Archivo:** `ui/BlockViewModel.kt` (~3300 líneas)
**Inyección:** `@HiltViewModel` + `@Inject`

### Responsabilidades
- Descarga de base de datos desde GitHub (con reanudación)
- Clasificación B3 (estadísticas) y B4 (36 categorías)
- Coordinación con Cerebro 2 (pausar/reanudar polling)
- Búsqueda unificada de bloques y etiquetas
- Gestión de estado global de la app
- Paginación de bloques por tabla (500/página)
- Cronómetro en tiempo real de operaciones

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 1** | BlockDatabase | Lectura/Escritura |

### Coordinación con Cerebro 2
| # | De → Hacia | Propósito |
|---|-----------|-----------|
| 1 | BlockViewModel → `isPollingPausedExternally = true` | Pausar polling cuando B4 inicia |
| 2 | BlockViewModel → `triggerPollingInitialization()` | Iniciar polling cuando B4 termina |
| 3 | BlockViewModel → `triggerCacheLoad()` | Cargar datos desde cache |

### Web Equivalente
**`useBlockStore` (Zustand)** — Consume datos del servidor, sin download/upload de DB.

---

## CEREBRO #2: MarketplaceViewModel — Cerebro de Marketplaces

**Archivo:** `viewmodel/MarketplaceViewModel.kt` (~600 líneas)
**Inyección:** `@HiltViewModel` + `@Inject` (15 dependencias)

### Responsabilidades
- Coordinar polling de Ordinalswallet, Unisat y Local Marketplace
- Auto-refresh cada 300 segundos
- Detectar ventas y actualizar Tabla 7
- Alimentar Cerebro 6 con datos de cada marketplace
- Trigger Cerebro 7 (imágenes) después de cada ciclo
- Manejar estadísticas de floor price

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| Cache Ordinalswallet | OrdinalswalletDatabase | Lectura/Escritura |
| Cache Unisat | UnisatDatabase | Lectura/Escritura |

### Web Equivalente
**`useMarketplaceStore` (Zustand)** — Llama a endpoints proxy del servidor.

---

## CEREBRO #3: LanguageStrings — Cerebro de Traducciones

**Archivo:** `ui/theme/LanguageStrings.kt` (~430 líneas)
**Tipo:** Data class + CompositionLocal

### Responsabilidades
- Almacenar todas las strings en español e inglés
- Proveer acceso reactivo via CompositionLocal
- Soportar cambio dinámico de idioma

### Tablas que Controla
**Ninguna.** Cerebro puramente de strings.

### 7 Módulos de Strings
| # | Módulo | Ejemplo |
|---|--------|---------|
| 1 | CoreStrings | perfil, alias, tema, volver |
| 2 | AuthStrings | login, wallet, donaciones |
| 3 | DatabaseStrings | descargandoBD, subiendoBD (~120 strings) |
| 4 | SearchStrings | searchPlaceholder, filtrarBloque |
| 5 | MarketplaceStrings | listados, piso, vendidos (~60 strings) |
| 6 | AdminStrings | tablas, etiquetas, clasificando |
| 7 | WhitepaperStrings | what_is_bitmap, roadmap |

### Web Equivalente
**`useI18nStore` (Zustand)** + React Context `I18nProvider`.

---

## CEREBRO #4: ConnectionWalletsViewModel — Cerebro de Billeteras

**Archivo:** `viewmodel/local-bitmapcore-marketplace/ConnectionWalletsViewModel.kt` (~1200 líneas)
**Inyección:** `@HiltViewModel` + `@Inject` (16 dependencias)

### Responsabilidades
- Conectar/desconectar wallets (Unisat, Xverse, OrdinalsWallet) vía deep links
- Firmar PSBTs para compra y venta
- Cargar inscripciones del usuario (Tabla 15)
- Verificar parcels (TX1 + TX2 históricos)
- Cargar saldos de runes
- Generar imágenes de bitmaps del usuario
- Gestionar historial de conexiones (Tabla 5, columnas 10 y 11)

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 5** (BitMapCorpWalletDatabase) | `BitMapCorpWalletEntity` | Lectura/Escritura |
| **Tabla 15** (MisActivosDatabase) | `UserInscriptionCacheEntity` + `UserInscriptionImageEntity` | Lectura/Escritura |

### Web Equivalente
**`useWalletStore` (Zustand)** — Usa `window.unisat.*` en vez de deep links.

---

## CEREBRO #5: LocalBitMapCoreMarketplaceViewModel — Cerebro del Marketplace Local

**Archivo:** `viewmodel/local-bitmapcore-marketplace/LocalBitMapCoreMarketplaceViewModel.kt` (~600 líneas)
**Inyección:** `@HiltViewModel` + `@Inject` (8 dependencias)

### Responsabilidades
- Carga listings activos del servidor BitmapCorp
- Carga detalles de bitmap específico
- Ejecuta compra de bitmap (flujo PSBT trustless)
- Ejecuta listado de bitmap para venta
- Maneja historial de transacciones

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 5** (BitMapCorpWalletDatabase) | `BitMapCorpTransactionEntity` | Lectura/Escritura |

### Web Equivalente
**`useLocalMarketplaceStore` (Zustand)** — Mismo flujo pero `window.unisat.signPsbt()`.

---

## CEREBRO #6: UnifiedListingsViewModel — Cerebro de Listados Unificados

**Archivo:** `viewmodel/UnifiedListingsViewModel.kt` (~400 líneas)
**Inyección:** `@HiltViewModel` + `@Inject`

### Responsabilidades
- Combinar listings de Unisat + Ordinalswallet + Local en una sola lista
- Clasificar por grupos de etiquetas con precios
- Manejar descuentos calculados
- Exponer ventas de todos los marketplaces

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 6** | UnifiedListingsDatabase | Lectura/Escritura |
| **Tabla 7** | SoldListingsDatabase | Lectura/Escritura |
| **Tabla 8** | EtiquetasPorPrecioDatabase | Lectura/Escritura |
| **Tabla 11** | DescuentosDatabase | Lectura/Escritura |

### Web Equivalente
**`useUnifiedStore` (Zustand)** — Se alimenta de datos del servidor.

---

## CEREBRO #7: BlockImageViewModel — Cerebro Generador de Imágenes

**Archivo:** `data/generador_de_imagenes_bitmap/BlockImageViewModel.kt` (~200 líneas)
**Inyección:** `@HiltViewModel` + `@Inject`

### Responsabilidades
- Coordinar generación de imágenes Mondrian (BlockBitmapGenerator)
- Crear Tabla 12 (imágenes permanentes BLOB)
- Tracking de progreso (guardadas/total, lotes)
- Generar 30 imágenes preview para SelectorScreen (Tabla 14)
- Procesar imágenes restantes via processAllRemaining()

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 12** | BlockImageCacheDatabase | Lectura/Escritura |
| **Tabla 13** | BlockTempDataDatabase | Lectura/Escritura |
| **Tabla 14** | SelectorScreenDatabase | Escritura (previews) |

### Web Equivalente
**`useImageStore` (Zustand)** — Genera imágenes con Canvas API del navegador.

---

## CEREBRO #8: ObservadorCiclosViewModel — Cerebro Observador de Ciclos

**Archivo:** `data/OBSERVADOR_de_INSTANCIAS_Y_ESTADOS-cerebro-8/ObservadorCiclosViewModel.kt` (~80 líneas)
**Tipo:** Siempre activo

### Responsabilidades
- Observar SharedFlow `cicloTerminado` de ProcesadorTabla12Preview
- Ejecutar Callback 2: Auditoría de Tabla 13
- Ejecutar Callback 3: Si hay datos en Tabla 13, reiniciar ciclo
- Marcar proceso como completado cuando Tabla 13 está vacía

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 13** | BlockTempDataDatabase | Solo lectura |

### Web Equivalente
No se necesita — la web genera imágenes bajo demanda.

---

## CEREBRO #9: SelectorScreenViewModel — Cerebro de Pantalla Selector

**Archivo:** `viewmodel/SelectorScreenViewModel.kt` (~150 líneas)
**Inyección:** `@HiltViewModel` + `@Inject`

### Responsabilidades
- Leer datos de Tabla 14 (previews, stats, tag groups)
- Exponer StateFlows reactivos para MarketplaceSelectorScreen
- NO escribe en Tabla 14 (solo lectura)

### Tablas que Controla
| Tabla | Base de Datos | Acceso |
|-------|---------------|--------|
| **Tabla 14** | SelectorScreenDatabase | Solo lectura |

### Web Equivalente
**`useSelectorScreenStore` (Zustand)** — Calculado en frontend con datos de API.

---

## CEREBRO #10: DuranteElPollingBloquearImagenesViewModel — Cerebro Bloqueador

**Archivo:** `viewmodel/DuranteElPollingBloquearImagenesViewModel.kt` (~64 líneas)
**Tipo:** Siempre activo

### Responsabilidades
- Observar `CronometroUniversalDelPolling.isPollingActive`
- Activar flag `_bloquearInicioImagenes` cuando polling comienza
- Desactivar flag cuando polling termina
- Proteger BlockImageBubble, DiscountItemCard, SelectorScreen

### Tablas que Controla
**Ninguna.** Cerebro puramente de lógica de estado.

### Web Equivalente
**`usePollingStore.bloquearInicioImagenes` (Zustand)** — Flag global que se actualiza con polling.

---

## Reglas de Separación

**REGLA ABSOLUTA:** Cada cerebro tiene una responsabilidad ÚNICA. NO deben comunicarse excepto en las excepciones documentadas (BlockViewModel → MarketplaceViewModel).

| Cerebro | NO puede hacer |
|---------|---------------|
| #1 | Consultar datos de marketplaces |
| #2 | Usar lógica de BlockViewModel |
| #4 | Modificar Tabla 12/13/14 |
| #5 | Modificar Tabla 6/7/8/11 |
| #6 | Modificar Tabla 1/12/13/14 |
| #7 | Modificar Tabla 6/7/8/11 |
| #8 | Escribir en Tabla 13 |
| #9 | Escribir en Tabla 14 |
| #10 | Modificar ninguna tabla |
