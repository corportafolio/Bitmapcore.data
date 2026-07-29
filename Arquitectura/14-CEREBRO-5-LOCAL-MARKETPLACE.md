# BitmapCore — Cerebro 5: LocalBitMapCoreMarketplaceViewModel

## Resumen

| Campo | Valor |
|-------|-------|
| Archivo | `viewmodel/local-bitmapcore-marketplace/LocalBitMapCoreMarketplaceViewModel.kt` |
| Líneas | ~600 |
| Dependencias | 8 |
| Responsabilidad | Marketplace local compra/venta |
| Equivalente Web | `localMarketplaceStore.ts` (Zustand) |

---

## 1. Dependencias (8)

```kotlin
@HiltViewModel
class LocalBitMapCoreMarketplaceViewModel @Inject constructor(
    private val api: BitMapCoreBackendApi,
    private val walletRepository: BitMapCoreWalletRepository,
    private val transactionRepository: BitMapCoreTransactionRepository,
    private val buyBitmapUseCase: BuyBitmapUseCase,
    private val nonceGenerator: NonceGenerator,
    private val walletDeepLinkHandler: WalletDeepLinkHandler,
    private val logger: SanitizedLogger,
    private val psbtSigningManager: PSBTSigningManager
)
```

---

## 2. Estado que Expone

| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `activeListings` | `StateFlow<List<BitmapListing>>` | Listings activos |
| `selectedBitmap` | `StateFlow<BitmapDetail?>` | Bitmap seleccionado |
| `buyState` | `StateFlow<BuyBitmapState>` | Estado de compra |
| `listingState` | `StateFlow<ListingState>` | Estado de listado |
| `isLoading` | `StateFlow<Boolean>` | Cargando |
| `transactionHistory` | `StateFlow<List<Transaction>>` | Historial |

---

## 3. Estados de Compra

```kotlin
sealed class BuyBitmapState {
    object Idle : BuyBitmapState()
    object Loading : BuyBitmapState()
    data class AwaitingSignature(val psbt: String) : BuyBitmapState()
    object Signing : BuyBitmapState()
    object Broadcasting : BuyBitmapState()
    data class Success(val txid: String) : BuyBitmapState()
    data class Error(val message: String?) : BuyBitmapState()
}
```

---

## 4. Flujo de Compra (Android)

```
1. Usuario hace click "Comprar"
    │
2. buyState = Loading
    │
3. buyBitmapUseCase.execute(bitmapId, buyerAddress, idempotencyKey)
    │   POST /api/v1/transaction/buy-bitmap
    │   Body: { bitmapId, buyerAddress, idempotencyKey }
    │   │
    │   └── Retorna: { psbt, transactionId, expiresAt }
    │
4. buyState = AwaitingSignature(psbt)
    │
5. psbtSigningManager.signPSBT(psbt, [1], 0x01)
    │   │
    │   ├── DeepLinkBuilder.buildUnisatSignPsbtDeepLink(psbt, [1], 0x01)
    │   └── WalletDeepLinkHandler.openDeepLink(deepLink, walletType)
    │
6. buyState = Signing
    │
7. Callback llega con PSBT firmado
    │
8. api.broadcastTransaction(BroadcastRequest(signedPsbt, transactionId))
    │   POST /api/v1/transaction/broadcast
    │   Body: { signedPsbt, transactionId }
    │
9. buyState = Broadcasting
    │
10. buyState = Success(txid) o Error(message)
```

---

## 5. Flujo de Listado (Android)

```
1. Usuario selecciona bitmap de "Mis Activos"
    │
2. listingState = Loading
    │
3. api.createListing(CreateListingRequest(...))
    │   POST /api/v1/bitmaps
    │   Body: { inscriptionId, price, sellerAddress, name, imageUrl, 
    │           sellerOrdinalPublicKey, sellerPaymentAddress }
    │   │
    │   └── Retorna: { listing, psbtToSign }
    │
4. listingState = AwaitingSignature(listingId, psbtToSign)
    │
5. connectionWalletsViewModel.signPSBT(psbtToSign, [0], 0x83)
    │   │
    │   ├── DeepLinkBuilder.buildUnisatSignPsbtDeepLink(psbt, [0], 0x83)
    │   └── WalletDeepLinkHandler.openDeepLink(deepLink, walletType)
    │
6. listingState = Signing
    │
7. Callback llega con PSBT firmado
    │
8. api.signListing(listingId, signedPsbt, sellerOrdinalPublicKey)
    │   POST /api/v1/bitmaps/{id}/sign
    │   Body: { signedPsbt, sellerOrdinalPublicKey }
    │
9. listingState = Success
    │
10. Listing aparece en /api/v1/bitmaps/active
```

---

## 6. Equivalente Web

```typescript
// stores/localMarketplaceStore.ts
export const useLocalMarketplaceStore = create<LocalMarketplaceState>()(
  (set, get) => ({
    // Comprar bitmap
    buyBitmap: async (bitmapId: string, buyerAddress: string) => {
      set({ buyState: 'loading' });
      
      try {
        // 1. Solicitar PSBT al servidor
        const idempotencyKey = generateIdempotencyKey();
        const response = await axios.post('/api/v1/transaction/buy-bitmap', {
          bitmapId, buyerAddress, idempotencyKey,
        });
        
        const { psbt, transactionId, expiresAt } = response.data.data;
        set({ buyState: 'awaiting_signature', psbt });
        
        // 2. Firmar PSBT con wallet
        const signedPsbt = await useWalletStore.getState().signPsbt(psbt, {
          autoFinalized: false,
          toSignInputs: [{ index: 1, address: buyerAddress }],
          sighashTypes: [0x01], // SIGHASH_ALL
        });
        
        set({ buyState: 'signing' });
        
        // 3. Transmitir PSBT
        const broadcastResponse = await axios.post('/api/v1/transaction/broadcast', {
          signedPsbt, transactionId,
        });
        
        set({ buyState: 'broadcasting' });
        
        // 4. Éxito
        set({ buyState: 'success', txid: broadcastResponse.data.data.txid });
        
      } catch (error) {
        set({ buyState: 'error', error: error.message });
      }
    },
    
    // Listar bitmap
    createListing: async (listingData: CreateListingData) => {
      set({ listingState: 'loading' });
      
      try {
        // 1. Crear listing en servidor
        const response = await axios.post('/api/v1/bitmaps', listingData);
        const { listing, psbtToSign } = response.data.data;
        
        set({ listingState: 'awaiting_signature', listingId: listing.id });
        
        // 2. Firmar PSBT
        const signedPsbt = await useWalletStore.getState().signPsbt(psbtToSign, {
          autoFinalized: false,
          toSignInputs: [{ index: 0, address: listingData.sellerAddress }],
          sighashTypes: [0x83], // SIGHASH_SINGLE|ANYONECANPAY
        });
        
        // 3. Enviar PSBT firmado
        await axios.post(`/api/v1/bitmaps/${listing.id}/sign`, {
          signedPsbt,
          sellerOrdinalPublicKey: listingData.sellerOrdinalPublicKey,
        });
        
        set({ listingState: 'success' });
        
      } catch (error) {
        set({ listingState: 'error', error: error.message });
      }
    },
  })
);
```

### Diferencias clave

| Aspecto | Android | Web |
|---------|---------|-----|
| Compra PSBT | Deep link → Unisat → callback | `window.unisat.signPsbt()` (async) |
| Listado PSBT | Deep link → Unisat → callback | `window.unisat.signPsbt()` (async) |
| Almacenamiento transacciones | Room DB (BitMapCoreTransactionEntity) | localStorage + API |
| Idempotency | NonceGenerator (UUID) | `crypto.randomUUID()` |
