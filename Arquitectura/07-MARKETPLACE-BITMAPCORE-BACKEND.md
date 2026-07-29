# BitmapCore — Marketplace BitMapCore Backend: Documentación Completa

## Resumen

| Campo | Valor |
|-------|-------|
| Nombre | BitMapCore Backend (Servidor Propio) |
| API Base URL | `https://bitmapcore.net` |
| API Key requerida | No (wallet-based) |
| Estado | ACTIVO |
| Método de obtención | REST API al servidor propio |
| Seguridad | PSBT trustless, verificación de ownership |

## API

### BitMapCoreBackendApi

**Archivo:** `data/local-bitmapcore-marketplace/remote/api/BitMapCoreBackendApi.kt`

#### Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /api/v1/bitmaps` | GET | Listings paginados |
| `GET /api/v1/bitmaps/active` | GET | Todos los listings activos |
| `GET /api/v1/bitmaps/sold?since=` | GET | Listings vendidos desde timestamp |
| `GET /api/v1/bitmaps/{id}` | GET | Detalle de listing |
| `GET /api/v1/bitmaps/owner/{address}` | GET | Inscripciones del propietario |
| `POST /api/v1/bitmaps` | POST | Crear listing (retorna PSBT) |
| `POST /api/v1/bitmaps/{id}/sign` | POST | Firmar listing con PSBT |
| `POST /api/v1/transaction/buy-bitmap` | POST | Iniciar compra |
| `POST /api/v1/transaction/broadcast` | POST | Transmitir PSBT firmado |
| `GET /api/v1/wallet/{address}/balance` | GET | Balance de wallet |
| `GET /api/v1/wallet/{address}/utxos` | GET | UTXOs de wallet |
| `GET /api/v1/verify-bitmap/{id}` | GET | Verificar bitmap |

## Flujo de Compra (PSBT Trustless)

```
COMPRADOR (app Android o web)
    │
    ├── 1. Selecciona bitmap a comprar
    │
    ├── 2. POST /api/v1/transaction/buy-bitmap
    │      Body: { bitmapId, buyerAddress, idempotencyKey }
    │      │
    │      │ Servidor verifica:
    │      ├── a. Listing existe y está activo
    │      ├── b. PSBT no está expirado
    │      ├── c. Idempotency key única
    │      │
    │      Servidor construye PSBT:
    │      ├── Input 0: Inscripción del bitmap (del vendedor)
    │      ├── Output 0: Inscripción → comprador
    │      ├── Output 1: Pago → vendedor
    │      ├── Output 2: Fee marketplace (1%)
    │      └── SIGHASH: SIGHASH_SINGLE | ANYONECANPAY (vendedor firmará)
    │      │
    │      Retorna: { psbt, transactionId, expiresAt }
    │
    ├── 3. Firma el PSBT con wallet (Unisat/Xverse)
    │      │
    │      │ Android: Deep link → Unisat → callback
    │      │ Web: window.unisat.signPsbt(psbt)
    │      │
    │      Retorna: PSBT firmado
    │
    ├── 4. POST /api/v1/transaction/broadcast
    │      Body: { signedPsbt, transactionId }
    │      │
    │      Servidor:
    │      ├── Valida PSBT firmado
    │      ├── Completa la transacción
    │      ├── Transmite a la red Bitcoin
    │      └── Marca listing como vendido
    │      │
    │      Retorna: { txid, status }
    │
    └── 5. Espera confirmación
           GET /api/v1/transaction/{txid}/status
```

## Flujo de Listado (Venta)

```
VENDEDOR (app Android o web)
    │
    ├── 1. Selecciona bitmap de "Mis Activos"
    │
    ├── 2. POST /api/v1/bitmaps
    │      Body: {
    │        inscriptionId,
    │        price,
    │        sellerAddress,
    │        name,
    │        imageUrl,
    │        sellerOrdinalPublicKey,
    │        sellerPaymentAddress
    │      }
    │      │
    │      Servidor verifica:
    │      ├── a. Bitmap es válido (via ordinals.com)
    │      ├── b. Vendedor es el owner actual
    │      ├── c. Bitmap no está ya listado
    │      │
    │      Servidor construye PSBT de listado:
    │      ├── Input 0: Inscripción del bitmap
    │      ├── Output 0: Inscripción → vendedor (SIGHASH_SINGLE)
    │      ├── Output 1: Pago al vendedor (SIGHASH_SINGLE)
    │      └── SIGHASH: SIGHASH_SINGLE | ANYONECANPAY
    │      │
    │      Retorna: { listing, psbtToSign }
    │
    ├── 3. Firma el PSBT con wallet
    │
    ├── 4. POST /api/v1/bitmaps/{id}/sign
    │      Body: { signedPsbt, sellerOrdinalPublicKey }
    │      │
    │      Servidor:
    │      ├── Valida PSBT firmado
    │      ├── Guarda PSBT en listing
    │      └── Marca listing como "signed" (activo)
    │      │
    │      Retorna: listing actualizado
    │
    └── 5. Listing aparece en /api/v1/bitmaps/active
```

## Seguridad PSBT

### Verificación de Ownership

```typescript
// Servidor verifica que el vendedor es el owner real
async verifyOwnership(inscriptionId: string, sellerAddress: string): Promise<boolean> {
  const response = await axios.get(
    `https://ordinals.com/r/inscription/${inscriptionId}`
  );
  const inscription = response.data;
  return inscription.address === sellerAddress;
}
```

### SIGHASH Used

| Operación | SIGHASH | Descripción |
|-----------|---------|-------------|
| Listado (venta) | `SIGHASH_SINGLE \| ANYONECANPAY` | Solo firma input y output específicos |
| Compra | `SIGHASH_ALL` | Firma toda la transacción |

### Validación de PSBT

```typescript
// El servidor valida que el PSBT firmado sea correcto
validateSignedListingPSBT(signedPsbt, sellerPaymentAddress, price): boolean {
  // 1. Decodificar PSBT
  // 2. Verificar que tiene exactamente 1 input
  // 3. Verificar que el output paga al sellerPaymentAddress
  // 4. Verificar que el monto es correcto
  // 5. Verificar firma SIGHASH_SINGLE
}
```

## Request/Response Models

### CreateListingRequest

```typescript
interface BitmapListingCreate {
  inscriptionId: string;
  price: number;                    // En satoshis
  sellerAddress: string;            // bc1p...
  name: string;
  description?: string;
  imageUrl: string;
  bitmapNumber?: number;
  inscriptionNumber?: number;
  bitmapHash?: string;
  ownerAddress?: string;
  sellerOrdinalPublicKey: string;   // Clave pública para PSBT
  sellerPaymentAddress: string;     // Dirección de pago
}
```

### BuyBitmapResponse

```typescript
interface BuyBitmapResponse {
  psbt: string;                     // PSBT parcialmente firmado
  transactionId: string;            // UUID de la transacción
  expiresAt: number;                // Timestamp de expiración (5 min)
}
```

### BroadcastRequest

```typescript
interface BroadcastRequest {
  signedPsbt: string;               // PSBT completamente firmado
  transactionId: string;            // UUID de la transacción
}
```

### BroadcastResponse

```typescript
interface BroadcastResponse {
  txid: string;                     // TX ID en la red Bitcoin
  status: string;                   // "broadcasted" | "confirmed"
}
```

## Estados de una Transacción

```typescript
type PsbtStatus = 'created' | 'signed' | 'sold' | 'expired';
type TransactionStatus = 'PENDING' | 'AWAITING_SIGNATURE' | 'BROADCASTING' | 'SUCCESS' | 'ERROR';
```

## Repository Local

### BitMapCoreWalletRepository

**Archivo:** `data/local-bitmapcore-marketplace/repository/BitMapCoreWalletRepository.kt`

**Interfaz:**
```kotlin
interface BitMapCoreWalletRepository {
    fun getConnectedWallet(): Flow<BitMapCoreWalletEntity?>
    fun getAllWallets(): Flow<List<BitMapCoreWalletEntity>>
    suspend fun connectWallet(address: String, pubkey: String, walletType: String)
    suspend fun disconnectWallet()
}
```

### BitMapCoreTransactionRepository

**Archivo:** `data/local-bitmapcore-marketplace/repository/BitMapCoreTransactionRepository.kt`

**Interfaz:**
```kotlin
interface BitMapCoreTransactionRepository {
    suspend fun getAllTransactions(): List<BitMapCoreTransactionEntity>
    suspend fun getPendingTransaction(): BitMapCoreTransactionEntity?
    suspend fun insertTransaction(transaction: BitMapCoreTransactionEntity)
    suspend fun updateTransactionStatus(id: Long, status: String, psbt: String?)
    suspend fun updateTransactionBroadcast(id: Long, status: String, txid: String?)
}
```

## UseCases

### BuyBitmapUseCase

```kotlin
class BuyBitmapUseCase @Inject constructor(
    private val api: BitMapCoreBackendApi,
    private val nonceGenerator: NonceGenerator
) {
    suspend fun execute(
        bitmapId: String,
        buyerAddress: String
    ): BuyBitmapResponse {
        val idempotencyKey = nonceGenerator.generate()
        return api.buyBitmap(PurchaseInitiateRequest(
            bitmapId = bitmapId,
            buyerAddress = buyerAddress,
            idempotencyKey = idempotencyKey
        ))
    }
}
```

### VerifyBitmapUseCase

```kotlin
class VerifyBitmapUseCase @Inject constructor(
    private val api: BitMapCoreBackendApi
) {
    suspend fun execute(inscriptionId: String): VerifyBitmapResponse {
        return api.verifyBitmap(inscriptionId)
    }
}
```

## Flujo Completo en la App

```
LocalBitMapCoreMarketplaceViewModel (Cerebro 5)
    │
    ├── Cargar listings activos
    │      GET /api/v1/bitmaps/active
    │      Guardar en activeListings StateFlow
    │
    ├── Seleccionar bitmap → Cargar detalle
    │      GET /api/v1/bitmaps/{id}
    │      Guardar en selectedBitmap StateFlow
    │
    ├── Comprar bitmap
    │      │
    │      ├── buyState = Loading
    │      ├── POST /api/v1/transaction/buy-bitmap
    │      ├── buyState = AwaitingSignature(psbt)
    │      ├── PSBTSigningManager.signPSBT(psbt)
    │      │      │
    │      │      │ Android: Deep link a wallet
    │      │      │ Web: window.unisat.signPsbt()
    │      │      │
    │      ├── buyState = Signing
    │      ├── POST /api/v1/transaction/broadcast
    │      ├── buyState = Broadcasting
    │      └── buyState = Success(txid)
    │
    └── Listar bitmap para venta
           │
           ├── listingState = Idle
           ├── POST /api/v1/bitmaps
           ├── listingState = AwaitingSignature(listingId, psbt)
           ├── PSBTSigningManager.signPSBT(psbt)
           ├── POST /api/v1/bitmaps/{id}/sign
           └── listingState = Success
```

## Equivalente Web

En la web, el flujo es **exactamente el mismo** pero con estas diferencias:

| Aspecto | Android | Web |
|---------|---------|-----|
| Firma PSBT | Deep link a Unisat/Xverse | `window.unisat.signPsbt()` |
| Almacenamiento wallet | Room DB | localStorage + API |
| Callback | Activity callback | Promise/async-await |
| Nonce | SharedPreferences | sessionStorage |
