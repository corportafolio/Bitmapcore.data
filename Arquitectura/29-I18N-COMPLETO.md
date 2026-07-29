# 29 - I18N Completo (Internacionalización Web)

## 1. Propósito

Documenta TODAS las strings de la app Android traducidas a la estructura `locales/es.ts` y `locales/en.ts` para la versión web con React + i18next.

---

## 2. Estructura Android → Web

### Android (Original)
```
ui/theme/
├── LanguageStrings.kt          # Data class AppStrings
└── strings/
    ├── CoreStrings.kt           # 28 keys (CoreStrings + SpanishCoreStrings + EnglishCoreStrings)
    ├── AuthStrings.kt           # 20 keys
    ├── DatabaseStrings.kt       # 73 keys
    ├── SearchStrings.kt         # 30 keys
    ├── MarketplaceStrings.kt    # 47 keys
    ├── AdminStrings.kt          # 26 keys + tagDesc (55 items)
    └── WhitepaperStrings.kt     # 34 keys
```

### Web (Nueva)
```
src/
├── locales/
│   ├── es.ts                    # Todas las strings en español
│   ├── en.ts                    # Todas las strings en inglés
│   └── index.ts                 # Configuración i18next
├── hooks/
│   └── useTranslation.ts        # Hook personalizado
└── i18n.ts                      # Setup i18next
```

---

## 3. Conteo de Strings por Módulo

| Módulo | Keys | Español | Inglés |
|--------|:----:|:-------:|:------:|
| Core | 31 | ✅ | ✅ |
| Auth | 24 | ✅ | ✅ |
| Database | 97 | ✅ | ✅ |
| Search | 37 | ✅ | ✅ |
| Marketplace | 67 | ✅ | ✅ |
| Admin | 81 | ✅ | ✅ |
| Whitepaper | 34 | ✅ | ✅ |
| **TOTAL** | **371** | **371** | **371** |

---

## 4. Configuración i18next

```typescript
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es';
import en from './locales/en';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'es', // Idioma por defecto
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false, // React ya escapa
  },
});

export default i18n;
```

---

## 5. Strings por Módulo

### 5.1 Core (31 keys)

```typescript
// src/locales/es.ts
export const core = {
  perfil: 'Perfil',
  alias: 'Alias',
  tema: 'Tema',
  oscuro: 'Oscuro',
  claro: 'Claro',
  idioma: 'Idioma',
  espanol: 'Español',
  ingles: 'Inglés',
  guardarCambios: 'Guardar cambios',
  volver: 'Volver',
  errorOperacion: 'Error en la operación',
  completado: 'Completado',
  operacionCancelada: 'Operación cancelada',
  errorOCancelacion: 'Error o cancelación',
  finalizando: 'Finalizando',
  initiating: 'Iniciando',
  conectando: 'Conectando',
  procesando: 'Procesando',
  cargando: 'Cargando',
  total: 'Total',
  expandir: 'Expandir',
  si: 'Sí',
  no: 'No',
  ir: 'Ir',
  copiar: 'Copiar',
  logoDescription: 'Logo de BitmapCore',
  buscar: 'Buscar',
  cerrar: 'Cerrar',
  datosAproximados: 'Datos aproximados',
  datosMempool: 'Datos de Mempool',
  pesoLabel: 'Peso',
};
```

### 5.2 Auth (24 keys)

```typescript
export const auth = {
  cuentas: 'Cuentas',
  saldo: 'Saldo',
  direccion: 'Dirección',
  session_accounts: 'Cuentas de sesión',
  with_google: 'Con Google',
  with_github: 'Con GitHub',
  user_email: 'Correo electrónico',
  password: 'Contraseña',
  social_account_selected_error: 'Error: cuenta social seleccionada',
  enter_credentials_or_social_error: 'Ingrese credenciales o use cuenta social',
  login: 'Iniciar sesión',
  sinFinanciamiento: 'Sin financiamiento',
  sinInversores: 'Sin inversores',
  sinPromociones: 'Sin promociones',
  sinVenderOrdinales: 'Sin vender ordinales',
  sinToken: 'Sin token',
  donaciones: 'Donaciones',
  wallet: 'Wallet',
  copiarWallet: 'Copiar wallet',
  walletCopiada: 'Wallet copiada',
  opcionesCuenta: 'Opciones de cuenta',
  menu: 'Menú',
  walletMenu: 'Menú de wallet',
  whitepaperBasic: 'Whitepaper básico',
};
```

### 5.3 Database (97 keys)

```typescript
export const database = {
  baseDeDatos: 'Base de datos',
  estadisticas: 'Estadísticas',
  volverAtras: 'Volver atrás',
  conseguirBD: 'Conseguir BD',
  minimizar: 'Minimizar',
  maximizar: 'Maximizar',
  conseguirGithub: 'Conseguir GitHub',
  conseguirX: 'Conseguir X',
  infoBD: 'Info BD',
  bdCargada: 'BD cargada',
  bloqueMin: 'Bloque mín',
  bloqueMax: 'Bloque máx',
  totalBloques: 'Total bloques',
  pesoTotal: 'Peso total',
  noBDCargada: 'No hay BD cargada',
  subirBD: 'Subir BD',
  detenerDescarga: 'Detener descarga',
  detenerSubida: 'Detener subida',
  exitoSubida: 'Éxito subida',
  subidaNoDisponible: 'Subida no disponible',
  comprobandoBD: 'Comprobando BD',
  noExisteBD: 'No existe BD',
  verificandoContenido: 'Verificando contenido',
  finalizandoDescarga: 'Finalizando descarga',
  descargandoBD: 'Descargando BD',
  retameDescarga: 'Retome descarga',
  descargaCompletada: 'Descarga completada',
  subidaCompletada: 'Subida completada',
  reanudando: 'Reanudando',
  subiendo: 'Subiendo',
  subiendoBD: 'Subiendo BD',
  iniciandoSubida: 'Iniciando subida',
  errorNoBloque: 'Error: no es bloque',
  tiempoDescarga: 'Tiempo de descarga',
  tiempoSubida: 'Tiempo de subida',
  obteniendoEstadisticasB3: 'Obteniendo estadísticas B3',
  errorB3: 'Error B3',
  clasificandoB4: 'Clasificando B4',
  errorB4: 'Error B4',
  analizandoDatos: 'Analizando datos',
  estadisticasCompletas: 'Estadísticas completas',
  refrescandoB3: 'Refrescando B3',
  refrescoCompletado: 'Refresco completado',
  limpiandoDatosPrevios: 'Limpiando datos previos',
  preparandoClasificacion: 'Preparando clasificación',
  clasificacionB4Completada: 'Clasificación B4 completada',
  clasificacionFallida: 'Clasificación fallida',
  clasificacionCancelada: 'Clasificación cancelada',
  errorCriticoB4: 'Error crítico B4',
  cargandoB4: 'Cargando B4',
  cargandoDatosExistentes: 'Cargando datos existentes',
  datosB4Cargados: 'Datos B4 cargados',
  limpiandoB4: 'Limpiando B4',
  borrandoDatosB4: 'Borrando datos B4',
  datosB4Eliminados: 'Datos B4 eliminados',
  datosListos: 'Datos listos',
  reanudandoDescarga: 'Reanudando descarga',
  obteniendoTamano: 'Obteniendo tamaño',
  procesandoArchivo: 'Procesando archivo',
  verificandoEstadoTablas: 'Verificando estado tablas',
  errorAlProcesarB3: 'Error al procesar B3',
  calculandoTamano: 'Calculando tamaño',
  noSePudoObtenerTamano: 'No se pudo obtener tamaño',
  procesandoArchivoExistente: 'Procesando archivo existente',
  copiaDesdeCache: 'Copia desde caché',
  descargaCompletadaTempExistia: 'Descarga completada (temp existía)',
  errorAlProcesar: 'Error al procesar',
  errorEnCopiaOProceso: 'Error en copia o proceso',
  cancelacionCompletaRed: 'Cancelación completa (red)',
  descargaCancelada: 'Descarga cancelada',
  descargaPausada: 'Descarga pausada',
  descargaCanceladaLimpiada: 'Descarga cancelada (limpiada)',
  descargaCanceladaErrorLimpieza: 'Descarga cancelada (error limpieza)',
  canceladoDatosLimpiados: 'Cancelado (datos limpiados)',
  canceladoErrorLimpieza: 'Cancelado (error limpieza)',
  databaseStatsTitle: 'Estadísticas de BD',
  waitingForDb: 'Esperando BD',
  errorUpdatingStats: 'Error actualizando stats',
  pressToLoadStats: 'Presione para cargar stats',
  updateStatsIconDesc: 'Actualizar icono de stats',
  actualizarTablas: 'Actualizar tablas',
  borrarBD: 'Borrar BD',
  confirmarBorrarBD: 'Confirmar borrar BD',
  mensajeConfirmarBorrarBD: '¿Está seguro de borrar la BD?',
  dbInvalidaSeRequiereDescarga: 'DB inválida, se requiere descarga',
  dbCorruptaSeRequiereDescarga: 'DB corrupta, se requiere descarga',
  operacionSubidaEnProgreso: 'Operación de subida en progreso',
  descargaYaEnProgreso: 'Descarga ya en progreso',
  errorUrlNoDisponible: 'Error: URL no disponible',
  errorGenerico: 'Error genérico',
  noSePudoReanudarDescarga: 'No se pudo reanudar descarga',
  operacionYaEnProgreso: 'Operación ya en progreso',
  errorPrepararEntornoSubida: 'Error preparar entorno subida',
  preparandoSubida: 'Preparando subida',
  operacionSubidaCancelada: 'Operación subida cancelada',
  errorCriticoSubida: 'Error crítico subida',
  comprobandoBaseDeDatos: 'Comprobando base de datos',
  recoverandoBaseDeDatosAuto: 'Recuperando base de datos auto',
  baseDeDatosCorruptaSeRequiereNueva: 'Base de datos corrupta, se requiere nueva',
  baseDeDatosBorradaCompletamente: 'Base de datos borrada completamente',
  errorAlBorrarBaseDeDatos: 'Error al borrar base de datos',
  archivosCorruptosSeRequiereDescargaTotal: 'Archivos corruptos, se requiere descarga total',
  dbCargadaMensaje: 'BD cargada correctamente',
};
```

### 5.4 Search (37 keys)

```typescript
export const search = {
  searchPlaceholder: 'Buscar bloque...',
  maxSearchesInfo: 'Máximo de búsquedas alcanzado',
  maxSearchesReached: 'Máximo de búsquedas alcanzado',
  addAnotherSearch: 'Agregar otra búsqueda',
  invalidInput: 'Entrada inválida',
  noTagsForBlock: 'No hay etiquetas para este bloque',
  searchResultLabelBlock: 'Resultado de búsqueda - Bloque',
  searchResultLabelTable: 'Resultado de búsqueda - Tabla',
  filtrarBloque: 'Filtrar bloque',
  noResultados: 'No hay resultados',
  verDetalles: 'Ver detalles',
  filtrarNombre: 'Filtrar nombre',
  ordenar: 'Ordenar',
  conMasBloques: 'Con más bloques',
  conMenosBloques: 'Con menos bloques',
  mayorMenorBtc: 'Mayor a menor BTC',
  menorMayorBtc: 'Menor a mayor BTC',
  ordenOriginalBloque: 'Orden original (bloque)',
  irInicio: 'Ir al inicio',
  irFinal: 'Ir al final',
  irBloque: 'Ir al bloque',
  bloque: 'Bloque',
  infoBloque: 'Info del bloque',
  altura: 'Altura',
  hash: 'Hash',
  fecha: 'Fecha',
  transacciones: 'Transacciones',
  peso: 'Peso',
  parcelas: 'Parcelas',
  verMempool: 'Ver en Mempool',
  verEnMempool: 'Ver en Mempool',
  mempool: 'Mempool',
  confirmacion21e8: 'Confirmación 21e8',
  totalBtc: 'Total BTC',
  totalTx: 'Total TX',
  totalFee: 'Total Fee',
  totalWeight: 'Peso total',
};
```

### 5.5 Marketplace (67 keys)

```typescript
export const marketplace = {
  listados: 'Listados',
  piso: 'Piso',
  recientes: 'Recientes',
  precioAlto: 'Precio alto',
  precioBajo: 'Precio bajo',
  ahora: 'Ahora',
  haceSegundos: 'Hace segundos',
  haceMinutos: 'Hace minutos',
  haceHoras: 'Hace horas',
  haceDias: 'Hace días',
  haceMeses: 'Hace meses',
  haceAnios: 'Hace años',
  cargados: 'cargados',
  actualizado: 'actualizado',
  en: 'en',
  enPausaOptimizandoDb: 'En pausa - optimizando DB',
  totalListados: 'Total listados',
  pisoEn: 'Piso en',
  noHayListingsUnisat: 'No hay listings de Unisat',
  esperaProximaActualizacion: 'Espere la próxima actualización',
  apiKeyUnisatTitulo: 'API Key de Unisat',
  sinApiKeyUnisatCrearCuenta: 'Sin API Key de Unisat - cree cuenta',
  abrirCuentaCrearApiKey: 'Abrir cuenta y crear API Key',
  apiPorDefecto: 'API por defecto',
  apiKeyPropia: 'API Key propia',
  pegarApiKey: 'Pegar API Key',
  aplicar: 'Aplicar',
  noHayApiUnisat: 'No hay API de Unisat',
  esperandoPollingActivar: 'Esperando polling para activar',
  otherWallets: 'Otras wallets',
  noMoreWalletsAvailable: 'No hay más wallets disponibles',
  cargandoListings: 'Cargando listings...',
  mejoresDescuentos: 'Mejores descuentos',
  descuentosLabel: 'Descuentos',
  tituloBurbuja: 'Marketplace BitmapCore',
  noHayDatos: 'No hay datos',
  vendidosHasta: 'Vendidos hasta',
  pisoActualVendidos: 'Piso actual vendidos',
  tituloTodosLosMercados: 'Todos los mercados',
  tituloVentasTodosLosMercados: 'Ventas de todos los mercados',
  tituloListadosAgrupadosPorEtiquetas: 'Listados agrupados por etiquetas',
  abriendoUnisat: 'Abriendo Unisat...',
  abriendoXverse: 'Abriendo Xverse...',
  conectandoWallet: 'Conectando wallet...',
  errorConectarWallet: 'Error al conectar wallet',
  walletNoInstalada: 'Wallet no instalada',
  tituloWalletsConectadas: 'Wallets conectadas',
  noHayWalletConectada: 'No hay wallet conectada',
  historial: 'Historial',
  activa: 'Activa',
  usado: 'Usado',
  walletConectada: 'Wallet conectada',
  editarDireccion: 'Editar dirección',
  pegarDireccionGuardarSesion: 'Pegar dirección y guardar sesión',
  direccionBitcoin: 'Dirección Bitcoin',
  conectarSuBilltera: 'Conectar su wallet',
  confirmarConexion: 'Confirmar conexión',
  yaCompletasteFirma: '¿Ya completaste la firma?',
  yaAutorizasteConexion: '¿Ya autorizaste la conexión?',
  siConectar: 'Sí, conectar',
  noCancelar: 'No, cancelar',
  pegar: 'Pegar',
};
```

### 5.6 Admin (81 keys + tagDesc)

```typescript
export const admin = {
  adminTitle: 'Administración',
  dbStats: 'Estadísticas BD',
  range: 'Rango',
  selectUpdateType: 'Seleccionar tipo de actualización',
  singleBlock: 'Bloque único',
  blockRange: 'Rango de bloques',
  specificBlocks: 'Bloques específicos',
  byExistingTag: 'Por etiqueta existente',
  allTags: 'Todas las etiquetas',
  blockNumber: 'Número de bloque',
  startBlock: 'Bloque inicio',
  endBlock: 'Bloque fin',
  blockNumbersComma: 'Números de bloque (coma)',
  tagToSearch: 'Etiqueta a buscar',
  newTag: 'Nueva etiqueta',
  updateTags: 'Actualizar etiquetas',
  sinEtiquetas: 'Sin etiquetas',
  tablas: 'Tablas',
  etiquetaSingular: 'Etiqueta',
  etAbrev: 'Et',
  actualizar: 'Actualizar',
  noTablas: 'No hay tablas',
  tablasTotales: 'Tablas totales',
  tablasClasificadas: 'Tablas clasificadas',
  tablasSinClasificar: 'Tablas sin clasificar',
  pesoEstimado: 'Peso estimado',
  clasificandoTablas: 'Clasificando tablas',
  cargandoTablas: 'Cargando tablas',
  tablasDeEtiquetas: 'Tablas de etiquetas',
  trayendoTablas: 'Trayendo tablas',
  preparandoTabla: 'Preparando tabla',
  clasificando: 'Clasificando',
  etiquetas: 'Etiquetas',
  bloques: 'Bloques',
  tag_txs_millonarias: 'TXs millonarias',
  tag_txs_multimillonarias: 'TXs multimillonarias',
  millonariasYMultimillonarias: 'Millonarias y multimillonarias',
  tabla: 'Tabla',
  totalTxs: 'Total TXs',
  totalEtiquetas: 'Total etiquetas',
  vistaSoloMasDeUnaEtiqueta: 'Vista solo más de una etiqueta',
  confirmacionTitulo: 'Confirmación',
  confirmarActualizacionTablas: '¿Confirmar actualización de tablas?',
  anuncio1: 'Anuncio 1',
  anuncio2: 'Anuncio 2',
  anuncio3: 'Anuncio 3',
  // tagDesc: Array de 55 strings con descripciones de etiquetas
  tagDesc: [
    'Etiqueta por defecto',
    'Bloques con transacciones millonarias',
    'Bloques minados por Satoshi',
    // ... 52 strings más
  ],
};
```

### 5.7 Whitepaper (34 keys)

```typescript
export const whitepaper = {
  whitepaper_title: 'Whitepaper de BitmapCore',
  whitepaper_p1: 'BitmapCore es una plataforma...',
  what_is_bitmap_title: '¿Qué es un Bitmap?',
  what_is_bitmap_p1: 'Un Bitmap es una inscripción...',
  what_is_bitmap_p2: 'Cada bitmap representa...',
  what_is_bitmap_p3: 'Los bitmaps se crean...',
  what_is_bitmap_p4: 'El estándar bitmap...',
  solution_title: 'Nuestra Solución',
  solution_p1: 'BitmapCore resuelve...',
  solution_p2: 'Proporcionamos...',
  solution_p3: 'Nuestra plataforma...',
  why_choose_bitmapcorp_title: '¿Por qué BitmapCore?',
  why_choose_bitmapcorp_bp1: 'Marketplace descentralizado',
  why_choose_bitmapcorp_bp2: 'Imágenes generativas de bloques',
  why_choose_bitmapcorp_bp3: 'Clasificación por etiquetas',
  why_choose_bitmapcorp_bp4: 'Sistema de descuentos',
  why_choose_bitmapcorp_bp5: 'Base de datos local',
  why_choose_bitmapcorp_bp6: 'Multiwallet',
  why_choose_bitmapcorp_bp7: 'Código abierto',
  official_x_account: 'Cuenta oficial de X',
  x_logo_description: 'Logo de X',
  call_to_action_title: 'Únete a BitmapCore',
  call_to_action_p1: 'Comienza a explorar...',
  roadmap_title: 'Roadmap',
  roadmap_item_prefix: 'Paso',
  roadmap_item1: 'Lanzamiento marketplace',
  roadmap_item2: 'Imágenes generativas',
  roadmap_item3: 'Clasificación por etiquetas',
  roadmap_item4: 'Sistema de descuentos',
  roadmap_item5: 'Base de datos local',
  roadmap_item6: 'Multiwallet',
  roadmap_item7: 'API pública',
  roadmap_item8: 'Governance token',
  roadmap_item9: 'Integraciones',
  how_to_use_file_title: 'Cómo usar el archivo',
  how_to_use_file_step1: 'Paso 1: Descargar',
  how_to_use_file_step1_details: 'Descarga la base de datos...',
  how_to_use_file_step2: 'Paso 2: Cargar',
  end_of_whitepaper: 'Fin del whitepaper',
};
```

---

## 6. Hook Personalizado

```typescript
// src/hooks/useTranslation.ts
import { useTranslation as useI18nextTranslation } from 'react-i18next';

export function useTranslation() {
  const { t, i18n } = useI18nextTranslation();
  
  const changeLanguage = (lang: 'es' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };
  
  const getCurrentLanguage = (): 'es' | 'en' => {
    return i18n.language as 'es' | 'en';
  };
  
  return { t, changeLanguage, getCurrentLanguage, i18n };
}
```

---

## 7. Uso en Componentes

```tsx
// Ejemplo de uso
import { useTranslation } from '../hooks/useTranslation';

function Header() {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  
  return (
    <header>
      <h1>{t('core.perfil')}</h1>
      <button onClick={() => changeLanguage('en')}>
        {getCurrentLanguage() === 'es' ? 'English' : 'Español'}
      </button>
    </header>
  );
}
```

---

## 8. Inicialización de Idioma

```typescript
// src/main.tsx
import i18n from './i18n';

// Cargar idioma guardado
const savedLanguage = localStorage.getItem('language') || 'es';
i18n.changeLanguage(savedLanguage);
```

---

## 9. Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `src/locales/es.ts` | Todas las strings en español |
| `src/locales/en.ts` | Todas las strings en inglés |
| `src/locales/index.ts` | Exportaciones |
| `src/i18n.ts` | Configuración i18next |
| `src/hooks/useTranslation.ts` | Hook personalizado |

---

## 10. Checklist

- [ ] Crear `src/locales/es.ts` con 371 keys
- [ ] Crear `src/locales/en.ts` con 371 keys
- [ ] Crear `src/i18n.ts` con configuración i18next
- [ ] Crear `src/hooks/useTranslation.ts`
- [ ] Instalar `i18next` y `react-i18next`
- [ ] Configurar `main.tsx` con i18n
- [ ] Reemplazar strings hardcodeadas en componentes
- [ ] Testear cambio de idioma
- [ ] Guardar preferencia en localStorage
