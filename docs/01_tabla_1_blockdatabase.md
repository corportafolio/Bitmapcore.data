# Documento 01 — Tabla 1: BlockDatabase

## Descripcion General

**Tabla 1 = BlockDatabase = tabla `blocks`** en SQLite.

Es la tabla maestra del sistema BitmapCore. Contiene el registro completo de la blockchain Bitcoin desde el bloque Genesis (0) hasta el bloque mas reciente. Cada fila representa un bloque de la blockchain.

### Ubicacion en el codigo Android
- **Entidad:** `BlockEntity.kt`
- **DAO:** `BlockDao.kt`
- **Repositorio:** `BlockRepository.kt`
- **Clasificacion:** `TotalTablas.kt`
- **Cerebro que la controla:** `BlockViewModel` (Cerebro #1) — **VER DOCUMENTO 02**

### Ubicacion en el codigo Web
- **API:** `server.js` (rutas `/api/v1/blocks/...`)
- **Cliente:** `api.js` (funciones `getBlock()`, `searchBlocks()`, etc.)
- **Cerebro que la controla:** `BlockViewModel` (Cerebro 1) — **VER DOCUMENTO 02**

---

## Estructura de la Tabla `blocks` (6 columnas)

| # | Campo | Tipo | Descripcion | Ejemplo |
|---|-------|------|-------------|---------|
| 1 | `bloque` | INTEGER | Numero de bloque (PK) | `0`, `170`, `57043` |
| 2 | `totalBtc` | TEXT | Total BTC generados en la transaccion coinbase | `50`, `1000000` |
| 3 | `totalTransacciones` | TEXT | Cantidad total de transacciones en el bloque | `1`, `2000`, `8000` |
| 4 | `etiquetas` | TEXT | Tags clasificatorios separados por `\|` (pipe) | `grid punk\|punk perfect\|3 tx perfect` |
| 5 | `mempool` | TEXT | Estado de mempool al momento del bloque | (variable) |
| 6 | `hash` | TEXT | Hash del bloque en hexadecimal | `000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f` |

### Notas importantes
- **`bloque` es la PRIMARY KEY.** Es el unico campo garantizado unico.
- **`etiquetas` es el campo mas importante para clasificacion.** Contiene tags como `grid punk`, `punk perfect`, `3 tx perfect`, `palindrome`, `multimillonaria`, etc., separados por `|`.
- **`totalTransacciones` y `totalBtc` son TEXT**, no INTEGER. Se castea con `CAST(... AS INTEGER)` en queries de filtro.
- **`hash` se usa solo para la tabla `21e8`** (buscar `21e8` dentro del hash).
- **Todos los INSERT a `tagged_blocks` copian las 6 columnas** para mantener contexto completo.

---

## Las 55 Tablas de Clasificacion (Tablas de Etiquetas)

### REGLA FUNDAMENTAL: Todas son "Tablas de Etiquetas"

**Las 55 tablas son, por diseno y obligacion, "tablas de etiquetas".** Cada tabla produce registros en `tagged_blocks` donde el campo `tagName` identifica la etiqueta. Todas las 55 son parte del sistema de clasificacion de bloques.

**Sin embargo, NO todas buscan en la columna `etiquetas`.** Cada tabla usa la columna que corresponde segun la logica de negocio:

| Grupo | Columna de busqueda | Cantidad |
|-------|-------------------|----------|
| Grupo 1 + 2 + 3 | `etiquetas` | 25 tablas |
| Grupo 4 | `totalTransacciones` | 10 tablas |
| Grupo 5 | `bloque` | 19 tablas |
| Grupo 2 (excepcion) | `hash` | 1 tabla (21e8) |

**Las 25 tablas que buscan en `etiquetas` (el 45%):**
1. txS millonarias
2. TXs MULTIMILLONARIAS
3. 100k out (CTE busca tag en etiquetas)
4. 250k out (CTE busca tag en etiquetas)
5. 500k out (CTE busca tag en etiquetas)
6. 1M out (CTE busca tag en etiquetas)
7. 2M out (CTE busca tag en etiquetas)
8. 3M out (CTE busca tag en etiquetas)
9. 5M out (CTE busca tag en etiquetas)
10. 2 tx PERFECT
11. 3 tx PERFECT
12. 4 tx PERFECT
13. 6 tx PERFECT
14. Grid Punk
15. Grid PERFECT
16. Punk PERFECT
17. 5 tx Punk PERFECT
18. Punk PERFECT 10 tx
19. Giga Punk PERFECT
20. Palindrome
21. Palindrome PERFECT
22. Wide Neck Punk
23. Standar Punk
24. Pristine Punk
25. Punk 2tx

**Las 19 tablas que buscan en `bloque` (el 35%):**
- sub 100k, sub 50k, sub 25k, sub 10k, sub 1k
- power of 10
- mythic, epic, rare
- first transaction, pizza transaction
- block 9, block 78
- 66 dao, prime number, fibonacci, binary
- chinese lucky number, pizza day

**Las 10 tablas que buscan en `totalTransacciones` (el 18%):**
- 8000 tx, 7000 tx, 6000 tx, 5000 tx, 4000 tx, 3000 tx, 2000 tx, 1000 tx, 1 tx

**Las 2 tablas con busqueda hibrida:**
- 2 tx (totalTransacciones + exclusiones en etiquetas)
- 21e8 (hash — la unica que busca en hash)

---

## Los 5 Grupos de Clasificacion

### Grupo 1 — Tablas Primarias (9 tablas)

Clasifican por **monto de BTC** o **valor textual de etiqueta**. Son las primeras en procesarse.

#### Subgrupo A — Por etiqueta textual (2 tablas)

| # | Tabla | Funcion DAO | Query WHERE | Descripcion |
|---|-------|-------------|-------------|-------------|
| 1 | txS millonarias | `fastInsertMillonarias()` | `etiquetas LIKE '%millonaria%'` | Bloques con transacciones de valor millonario |
| 2 | TXs MULTIMILLONARIAS | `fastInsertMultiMillonarias()` | `lower(etiquetas) LIKE '%multimillonaria%'` | Bloques con transacciones multimillonarias |

**Detalles tecnicos:**
- Usan **CTE recursivo** para dividir la cadena `etiquetas` por `|` y buscar en cada tag individual.
- `fastInsertMillonarias()`: Busca `millonaria` (miniscula) en etiquetas
- `fastInsertMultiMillonarias()`: Busca `multimillonaria` (lowercase) en etiquetas

#### Subgrupo B — Por rango de outputs (7 tablas)

| # | Tabla | Funcion DAO | Query WHERE | Descripcion |
|---|-------|-------------|-------------|-------------|
| 3 | 100k out | `fastInsertOutTable()` | `etiquetas LIKE '%100k out%'` | +100,000 salidas |
| 4 | 250k out | `fastInsertOutTable()` | `etiquetas LIKE '%250k out%'` | +250,000 salidas |
| 5 | 500k out | `fastInsertOutTable()` | `etiquetas LIKE '%500k out%'` | +500,000 salidas |
| 6 | 1M out | `fastInsertOutTable()` | `etiquetas LIKE '%1m out%'` | +1,000,000 salidas |
| 7 | 2M out | `fastInsertOutTable()` | `etiquetas LIKE '%2m out%'` | +2,000,000 salidas |
| 8 | 3M out | `fastInsertOutTable()` | `etiquetas LIKE '%3m out%'` | +3,000,000 salidas |
| 9 | 5M out | `fastInsertOutTable()` | `etiquetas LIKE '%5m out%'` | +5,000,000 salidas |

**Detalles tecnicos:**
- Todas usan la **misma funcion generica** `fastInsertOutTable(tagName)`.
- Buscan el nombre de la tabla en la columna `etiquetas`.
- Tambien usan CTE recursivo para dividir tags.

---

### Grupo 2 — Tablas Especiales (13 tablas)

Clasifican por **patrones speciales** en hash, etiquetas, o combinaciones.

| # | Tabla | Funcion DAO | Query WHERE | Columna | Descripcion |
|---|-------|-------------|-------------|---------|-------------|
| 10 | 21e8 | `fastInsert21e8()` | `lower(hash) LIKE '%21e8%'` | **hash** | Hash contiene "21e8" (hash del genesis) |
| 11 | 2 tx PERFECT | `fastInsert2TxPerfect()` | `('\|' \|\| lower(etiquetas) \|\| '\|') LIKE '%\|2 tx perfect\|%'` | etiquetas | Exactamente 2 transacciones, tag "2 tx perfect" |
| 12 | 3 tx PERFECT | `fastInsert3TxPerfect()` | `lower(etiquetas) LIKE '%3 tx perfect%'` | etiquetas | Tag "3 tx perfect" |
| 13 | 4 tx PERFECT | `fastInsert4TxPerfect()` | `lower(etiquetas) LIKE '%4 tx perfect%'` | etiquetas | Tag "4 tx perfect" |
| 14 | 6 tx PERFECT | `fastInsert6TxPerfect()` | `lower(etiquetas) LIKE '%6 tx perfect%'` | etiquetas | Tag "6 tx perfect" |
| 15 | Grid Punk | `fastInsertGridPunk()` | `lower(etiquetas) LIKE '%grid punk%'` | etiquetas | Grid + Punk |
| 16 | Grid PERFECT | `fastInsertGridPerfect()` | `lower(etiquetas) LIKE '%grid perfect%'` | etiquetas | Grid + Perfect |
| 17 | Punk PERFECT | `fastInsertPunkPerfect()` | `lower(etiquetas) LIKE '%punk perfect%'` | etiquetas | Punk + Perfect |
| 18 | 5 tx Punk PERFECT | `fastInsert5TxPunkPerfect()` | `lower(etiquetas) LIKE '%punk perfect%' AND lower(etiquetas) LIKE '%5 tx%'` | etiquetas | Punk PERFECT con 5 tx |
| 19 | Punk PERFECT 10 tx | `fastInsertPunkPerfect10Tx()` | `lower(etiquetas) LIKE '%punk perfect%' AND lower(etiquetas) LIKE '%10 tx%'` | etiquetas | Punk PERFECT con 10 tx |
| 20 | Giga Punk PERFECT | `fastInsertGigaPunkPerfect()` | `lower(etiquetas) LIKE '%punk perfect%' AND lower(etiquetas) LIKE '%giga%'` | etiquetas | Punk PERFECT + Giga |
| 21 | Palindrome | `fastInsertPalindrome()` | `lower(etiquetas) LIKE '%palindrome%'` | **etiquetas** | Bloque es palindrome (sin ser necesariamente perfect) |
| 22 | Palindrome PERFECT | `fastInsertPalindromePerfect()` | `lower(etiquetas) LIKE '%palindrome perfect%'` | **etiquetas** | Bloque es palindrome perfecto |

**Detalles tecnicos importantes:**

- **21e8:** La UNICA tabla que busca en `hash` directamente. Busca la cadena `21e8` en el hash del bloque.
- **2 tx PERFECT:** Usa concatenacion de pipes `'|' || etiquetas || '|'` para match EXACTO y evitar falsos positivos como "12 tx perfect".
- **5 tx Punk PERFECT, Punk PERFECT 10 tx, Giga Punk PERFECT:** Usan **dos condiciones LIKE** simultaneas para combinar tags.
- **Palindrome y Palindrome PERFECT:** Ambas buscan en la columna **`etiquetas`**, NO en `hash`. La etiqueta `palindrome` o `palindrome perfect` esta pre-calculada y almacenada en la columna `etiquetas` de la tabla `blocks`.

---

### Grupo 3 — Punks Ordinarios (4 tablas)

Clasifican por **tipos de punk** en la columna etiquetas.

| # | Tabla | Funcion DAO | Query WHERE | Descripcion |
|---|-------|-------------|-------------|-------------|
| 23 | Wide Neck Punk | `fastInsertWideNeckPunk()` | `lower(etiquetas) LIKE '%wide neck punk%'` | Punk con cuello ancho |
| 24 | Standar Punk | `fastInsertStandarPunk()` | `lower(etiquetas) LIKE '%standar punk%'` | Punk estandar |
| 25 | Pristine Punk | `fastInsertPristinePunk()` | `lower(etiquetas) LIKE '%pristine punk%'` | Punk pristine (perfecto sin tx extra) |
| 26 | Punk 2tx | `fastInsertPunk2tx()` | `lower(etiquetas) LIKE '%punk 2tx%'` | Punk con exactamente 2 transacciones |

**Detalles tecnicos:**
- Todas buscan en `etiquetas` con matching simple por `LIKE`.
- Punk 2tx tiene tag especifico `punk 2tx` (no confundir con `punk perfect` + `2 tx`).

---

### Grupo 4 — Por Cantidad de Transacciones (10 tablas)

Clasifican por **cantidad de transacciones** usando la columna `totalTransacciones`. **NO buscan en `etiquetas`**.

| # | Tabla | Funcion DAO | Query WHERE | Descripcion |
|---|-------|-------------|-------------|-------------|
| 27 | 8000 tx | `fastInsertByMinTx(8000)` | `CAST(totalTransacciones AS INTEGER) >= 8000` | 8000 o mas transacciones |
| 28 | 7000 tx | `fastInsertByTxRange(7000,7999)` | `BETWEEN 7000 AND 7999` | 7000-7999 transacciones |
| 29 | 6000 tx | `fastInsertByTxRange(6000,6999)` | `BETWEEN 6000 AND 6999` | 6000-6999 transacciones |
| 30 | 5000 tx | `fastInsertByTxRange(5000,5999)` | `BETWEEN 5000 AND 5999` | 5000-5999 transacciones |
| 31 | 4000 tx | `fastInsertByTxRange(4000,4999)` | `BETWEEN 4000 AND 4999` | 4000-4999 transacciones |
| 32 | 3000 tx | `fastInsertByTxRange(3000,3999)` | `BETWEEN 3000 AND 3999` | 3000-3999 transacciones |
| 33 | 2000 tx | `fastInsertByTxRange(2000,2999)` | `BETWEEN 2000 AND 2999` | 2000-2999 transacciones |
| 34 | 1000 tx | `fastInsertByTxRange(1000,1999)` | `BETWEEN 1000 AND 1999` | 1000-1999 transacciones |
| 35 | 1 tx | `fastInsertByExactTx(1)` | `= 1` | Exactamente 1 transaccion |
| 36 | 2 tx | `fastInsert2TxNoPunks()` | `= 2` + exclusiones | 2 tx SIN ser Punk ni 2 tx PERFECT |

**Detalles tecnicos:**
- **8000 tx** es la unica que usa `>=` (mayor o igual). Las demas rangos usan `BETWEEN`.
- **1 tx** usa matching exacto `= 1`.
- **2 tx** es especial: busca `totalTransacciones = 2` pero EXCLUYE bloques que ya clasificaron como Punks o 2 tx PERFECT. Usa 5 condiciones `NOT LIKE` en `etiquetas`:
  ```sql
  CAST(totalTransacciones AS INTEGER) = 2 
  AND lower(etiquetas) NOT LIKE '%wide neck punk%'
  AND lower(etiquetas) NOT LIKE '%standar punk%'
  AND lower(etiquetas) NOT LIKE '%pristine punk%'
  AND lower(etiquetas) NOT LIKE '%punk 2tx%'
  AND ('|' || lower(etiquetas) || '|') NOT LIKE '%|2 tx perfect|%'
  ```

---

### Grupo 5 — Por Rango de Bloque (19 tablas)

Clasifican por **posicion o rango del bloque** usando la columna `bloque`. **NO buscan en `etiquetas`**.

| # | Tabla | Funcion DAO | Query WHERE | Descripcion |
|---|-------|-------------|-------------|-------------|
| 37 | sub 100k | `fastInsertSub100k()` | `bloque BETWEEN 50001 AND 100000` | Bloques 50,001 - 100,000 |
| 38 | sub 50k | `fastInsertSub50k()` | `bloque BETWEEN 25001 AND 50000` | Bloques 25,001 - 50,000 |
| 39 | sub 25k | `fastInsertSub25k()` | `bloque BETWEEN 10001 AND 25000` | Bloques 10,001 - 25,000 |
| 40 | sub 10k | `fastInsertSub10k()` | `bloque BETWEEN 1001 AND 10000` | Bloques 1,001 - 10,000 |
| 41 | sub 1k | `fastInsertSub1k()` | `bloque BETWEEN 1 AND 1000` | Bloques 1 - 1,000 |
| 42 | power of 10 | `fastInsertPowerOf10()` | `bloque IN (10,100,1000,10000,100000)` | Bloques que son potencia de 10 |
| 43 | mythic | `fastInsertIsMythic()` | `bloque = 0` | Genesis Block (unico) |
| 44 | epic | `fastInsertIsEpic()` | `bloque % 210000 = 0` | Bloques de halving (cada 210,000) |
| 45 | rare | `fastInsertIsRare()` | `bloque % 2016 = 0` | Bloques de dificultad (cada 2,016) |
| 46 | first transaction | `fastInsertIsFirstTransaction()` | `bloque = 170` | Primera transaccion de la historia |
| 47 | pizza transaction | `fastInsertIsPizzaTransaction()` | `bloque = 57043` | La transaccion de las 2 pizzas (10,000 BTC) |
| 48 | block 9 | `fastInsertIsBlock9()` | `bloque = 9` | Bloque 9 |
| 49 | block 78 | `fastInsertIsBlock78()` | `bloque = 78` | Bloque 78 |
| 50 | 66 dao | `fastInsertIs66Dao()` | `bloque BETWEEN 660000 AND 669999` | Bloques del rango 660,000 - 669,999 |
| 51 | prime number | `fastInsertIsPrimeNumber()` | `bloque IN (:primes)` | Numeros primos (pre-calculados) |
| 52 | fibonacci | `fastInsertIsFibonacci()` | `bloque IN (0,1,2,3,5,8,13,...,832040)` | Secuencia Fibonacci |
| 53 | binary | `fastInsertIsBinary()` | 8 condiciones `NOT LIKE` en bloque | Solo digitos 0 y 1 |
| 54 | chinese lucky number | `fastInsertIsChineseLuckyNumber()` | `CAST(bloque AS TEXT) LIKE '%168%'` | Contiene "168" (suerte china) |
| 55 | pizza day | `fastInsertIsPizzaDay()` | `bloque BETWEEN 56899 AND 57093` | Rango del dia de la pizza |

**Detalles tecnicos:**
- **mythic** es el bloque Genesis (0). Solo hay 1.
- **epic** usa modulo `% 210000` (halving cada 4 anos).
- **rare** usa modulo `% 2016` (ajuste de dificultad cada 2 semanas).
- **binary** es la mas compleja: verifica que el numero de bloque solo contenga digitos 0 y 1 (8 condiciones NOT LIKE para排除 2-9).
- **prime number** recibe una lista pre-calculada de primos.
- **fibonacci** usa una lista hardcodeada de 31 numeros.
- **pizza day** es el rango que incluye la transaccion pizza (57043).

---

## Resumen por Columna de Busqueda

| Columna | Tablas que la usan | Cantidad |
|---------|-------------------|----------|
| `etiquetas` (directo) | txS millonarias, TXs MULTIMILLONARIAS, 2 tx PERFECT, 3 tx PERFECT, 4 tx PERFECT, 6 tx PERFECT, Grid Punk, Grid PERFECT, Punk PERFECT, 5 tx Punk PERFECT, Punk PERFECT 10 tx, Giga Punk PERFECT, Palindrome, Palindrome PERFECT, Wide Neck Punk, Standar Punk, Pristine Punk, Punk 2tx | **18** |
| `etiquetas` (via CTE) | 100k-5M out (7 tablas: buscan el tag en etiquetas con CTE recursivo) | **7** |
| `bloque` | sub 100k-1k (5), power of 10, mythic, epic, rare, first transaction, pizza transaction, block 9, block 78, 66 dao, prime number, fibonacci, binary, chinese lucky number, pizza day | **19** |
| `totalTransacciones` | 8000-1000 tx (8), 1 tx | **9** |
| `totalTransacciones` + `etiquetas` | 2 tx (excluyente: 2 tx pero NO punks ni perfect) | **1** |
| `hash` | 21e8 (la unica que busca en hash) | **1** |

**Total: 25 + 19 + 9 + 1 + 1 = 55 tablas**

---

## La Tabla `tagged_blocks` (Resultado de Clasificacion)

Las 55 tablas de clasificacion INSERTAN registros en `tagged_blocks`. Esta tabla es el resultado de la clasificacion.

### Columnas de `tagged_blocks`

| # | Campo | Tipo | Descripcion |
|---|-------|------|-------------|
| 1 | `bloque` | INTEGER | Numero de bloque (FK de `blocks`) |
| 2 | `tagName` | TEXT | Nombre de la tabla de clasificacion |
| 3 | `etiquetaIndividual` | TEXT | Etiqueta especifica (ej: "Palindrome PERFECT") |
| 4 | `totalBtc` | TEXT | BTC del bloque (copiado de `blocks`) |
| 5 | `totalTransacciones` | TEXT | TX del bloque (copiado de `blocks`) |
| 6 | `etiquetas` | TEXT | Tags del bloque (copiado de `blocks`) |
| 7 | `mempool` | TEXT | Mempool del bloque (copiado de `blocks`) |
| 8 | `hash` | TEXT | Hash del bloque (copiado de `blocks`) |
| 9 | `total_etiquetas_en_bloque` | INTEGER | Cantidad total de tags en el bloque |

### Como funciona la clasificacion

1. Se ejecuta `fastInsert*()` para cada una de las 55 tablas.
2. Cada funcion busca en la columna correspondiente de `blocks`.
3. Los bloques que coinciden se INSERTAN en `tagged_blocks` con su `tagName`.
4. Un bloque puede aparecer en MULTIPLES tablas (ej: bloque 57043 aparece en "pizza transaction" Y en "pizza day").
5. Para consultas rapida: `tagged_blocks` permite buscar por `tagName` con `WHERE tagName = :tagName`.

### Query tipica para consultar una tabla

```sql
-- Obtener todos los bloques de la tabla "Palindrome"
SELECT * FROM tagged_blocks WHERE tagName = 'Palindrome' ORDER BY bloque;

-- Contar bloques de una tabla
SELECT COUNT(*) FROM tagged_blocks WHERE tagName = 'Palindrome';

-- Obtener bloques de una tabla con datos del bloque original
SELECT t.*, b.etiquetas 
FROM tagged_blocks t 
JOIN blocks b ON t.bloque = b.bloque 
WHERE t.tagName = 'Palindrome';
```

---

## Las 3 Pantallas que usan Tabla 1

> **IMPORTANTE:** Todas estas pantallas usan **BlockViewModel (Cerebro 1)** y **TagViewModel (Cerebro 2)** como intermediarios. Ninguna hace fetch directo a la API. Ver Documento 02 para detalles de la arquitectura.

### Pantalla 1: `/tag-tables` (PantallaDeTablas)

**Muestra:** Los 55 nombres de tablas como previews. Cada preview tiene:
- Nombre de la tabla
- 1 miniatura Mondrian del primer bloque de esa tabla
- Conteo de bloques

**Flujo:** 
1. Usuario entra a `/tag-tables`
2. Se muestran 55 cards/burbujas
3. Al tocar una, navega a `/tag-tables/:tagName`

### Pantalla 2: `/blocks/:id` (BurbujaDeResultadosScreen)

**Muestra:** Detalle de un bloque especifico. Contiene:
- **Mondrian 320px:** Visualizacion del bloque
- **3 columnas de datos:** bloque, totalBtc, totalTransacciones
- **Hash completo:** Hash hexadecimal del bloque
- **Etiquetas:** Tags del bloque como UniversalTag (Doc 37)

**Flujo:**
1. Se busca el bloque por numero en `blocks`
2. Se muestran todas sus 6 columnas
3. Las etiquetas se muestran como UniversalTag con color `#FE3E00`

### Pantalla 3: `/tag-tables/:tagName` (TagTableScreen)

**Muestra:** Lista completa de todos los bloques de una tabla de clasificacion especifica.

**Flujo:**
1. Se consulta `tagged_blocks WHERE tagName = :tagName`
2. Se muestra lista de bloques con su Mondrian miniatura
3. Al tocar un bloque, navega a `/blocks/:id`

---

## Referencia en el Codigo

### Android (Kotlin)
- `BlockEntity.kt` — Definicion de las 6 columnas
- `BlockDao.kt` — 55+ funciones de INSERT y SELECT
- `BlockRepository.kt` — Orquestacion de los 5 grupos
- `TotalTablas.kt` — Lista de los 55 nombres de tablas

### Web (JavaScript)
- `server.js` — API REST con better-sqlite3
- `api.js` — Cliente HTTP para consumir la API
- `stores-block.js` — **Cerebro 1: BlockViewModel** (dueño de tabla blocks)
- `stores-tags.js` — **Cerebro 2: TagViewModel** (dueño de etiquetas)
- `stores-marketplaces.js` — **Cerebro 3: Marketplaces** (ya existente)
- `pages-block.js` — BurbujaDeResultadosScreen (detalle bloque)
- `pages-tables.js` — PantallaDeTablas (55 previews) + TagTableScreen (lista de una tabla)
- `pages-unified.js` — TagTablePage (routing a las tablas)

---

## Estadisticas de la Base de Datos

| Metrica | Valor |
|---------|-------|
| Total bloques en `blocks` | ~955,001 |
| Total tablas de clasificacion | 55 |
| Tablas que buscan en `etiquetas` | 25 (45%) |
| Tablas que buscan en `bloque` | 19 (35%) |
| Tablas que buscan en `totalTransacciones` | 10 (18%) |
| Tablas que buscan en `hash` | 1 (2%) |
| Tamano de `bitmapcorp_database.db` | ~177 MB |

---

## Errores Comunes a Evitar

1. **NO confundir `etiquetas` con la tabla `blocks` completa.** `etiquetas` es solo 1 de las 6 columnas.
2. **NO decir que "21e8 busca en etiquetas".** Busca en `hash` (la unica que lo hace).
3. **NO decir que "Palindrome busca en hash".** Busca en `etiquetas` (como todas las demas del Grupo 2, excepto 21e8).
4. **NO decir que "2 tx busca solo en totalTransacciones".** Busca en `totalTransacciones` + exclusiones en `etiquetas`.
5. **NO confundir "2 tx" (Grupo 4) con "2 tx PERFECT" (Grupo 2).** Son tablas diferentes con querys diferentes.
6. **El numero correcto de tablas es 55, no 56.**
7. **TODAS las 55 tablas son "etiquetas" por diseno** (producen `tagged_blocks`), pero NO todas buscan en la columna `etiquetas`. Cada tabla busca en la columna que le corresponde.
