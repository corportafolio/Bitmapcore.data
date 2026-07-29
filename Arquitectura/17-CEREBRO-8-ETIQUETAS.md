# BitmapCore — Cerebro 8: Procesador8TablasDeEtiquetasDeLosListados

## Resumen

| Campo | Valor |
|-------|-------|
| Archivo | `service/polling/Procesador8TablasDeEtiquetasDeLosListados.kt` |
| Responsabilidad | Clasificar listings por etiquetas y rangos de precio |
| Equivalente Web | Cálculo en frontend con datos de API |

---

## 1. Qué hace

Toma los listings de la Tabla 6 (unified_listings) y los clasifica en la Tabla 8 (etiquetas_por_precio) según:
- **Etiqueta**: El tag del bitmap (punk, sub10k, prime number, etc.)
- **Rango de precio**: bajo (0-10000), medio (10001-50000), alto (50001+)

---

## 2. Flujo Android

```
Procesador8.classify()
    │
    ├── 1. Leer todos los listings de Tabla 6
    │
    ├── 2. Para cada listing:
    │      ├── Obtener etiquetas del bitmap (de Tabla 1)
    │      ├── Clasificar rango de precio
    │      └── Guardar en Tabla 8 (etiquetas_por_precio)
    │
    ├── 3. Calcular estadísticas por etiqueta
    │      ├── Total listings por tag
    │      ├── Floor price por tag
    │      └── Count por rango de precio
    │
    └── 4. Actualizar TagGroups en companion object
```

---

## 3. Entidad EtiquetasPorPrecioEntity (Tabla 8)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `bitmapNumber` | `Int` | Número del bitmap |
| `etiqueta` | `String` | Nombre de la etiqueta |
| `precio` | `Long` | Precio en satoshis |
| `rangoPrecio` | `String` | "bajo", "medio", "alto" |
| `createdAt` | `Long` | Timestamp creación |
| `listedAtTimestamp` | `Long` | Timestamp de listado |
| `source` | `String` | "unisat", "ordinalswallet", "local" |

---

## 4. Equivalente Web

```typescript
// utils/tagClassifier.ts

export type PrecioRange = 'bajo' | 'medio' | 'alto';

export interface TaggedListing {
  bitmapNumber: number;
  etiqueta: string;
  precio: number;
  rangoPrecio: PrecioRange;
  source: string;
  listedAtTimestamp: number;
}

export function classifyListing(listing: UnifiedListing, tags: string[]): TaggedListing[] {
  return tags.map(tag => ({
    bitmapNumber: listing.bitmapNumber,
    etiqueta: tag,
    precio: listing.listedPrice,
    rangoPrecio: getPrecioRange(listing.listedPrice),
    source: listing.source,
    listedAtTimestamp: listing.listedAt || Date.now(),
  }));
}

export function getPrecioRange(price: number): PrecioRange {
  if (price <= 10000) return 'bajo';
  if (price <= 50000) return 'medio';
  return 'alto';
}

export interface TagGroup {
  tagName: string;
  count: number;
  floorPrice: number;
  minPrice: number;
  maxPrice: number;
}

export function calculateTagGroups(taggedListings: TaggedListing[]): TagGroup[] {
  const grouped = taggedListings.reduce((acc, item) => {
    if (!acc[item.etiqueta]) {
      acc[item.etiqueta] = [];
    }
    acc[item.etiqueta].push(item);
    return acc;
  }, {} as Record<string, TaggedListing[]>);
  
  return Object.entries(grouped).map(([tagName, listings]) => ({
    tagName,
    count: listings.length,
    floorPrice: Math.min(...listings.map(l => l.precio)),
    minPrice: Math.min(...listings.map(l => l.precio)),
    maxPrice: Math.max(...listings.map(l => l.precio)),
  }));
}
```

### Diferencias clave

| Aspecto | Android | Web |
|---------|---------|-----|
| Almacenamiento | Tabla 8 (Room DB) | Zustand state (memoria) |
| Clasificación | Procesador8 en background | Función JavaScript síncrona |
| Tags disponibles | Tabla 1 (BlockDao) | API del servidor o frontend |
| Estadísticas | SQL queries | `reduce()` en JavaScript |
