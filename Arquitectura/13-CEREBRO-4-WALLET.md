# BitmapCore — Cerebro 4: ConnectionWalletsViewModel (Wallet + PSBT)

## Resumen

| Campo | Valor |
|-------|-------|
| Archivo | `viewmodel/local-bitmapcore-marketplace/ConnectionWalletsViewModel.kt` |
| Líneas | 1200 (el más grande) |
| Dependencias | 16 |
| Responsabilidad | Conexión wallet + firma PSBT + inscripciones del usuario |
| Equivalente Web | `walletStore.ts` (Zustand) |

---

## 1. Dependencias (16)

```kotlin
@HiltViewModel
class ConnectionWalletsViewModel @Inject constructor(
    private val connectWalletUseCase: ConnectWalletUseCase,
    private val disconnectWalletUseCase: DisconnectWalletUseCase,
    private val walletRepository: BitMapCoreWalletRepository,
    private val walletDeepLinkHandler: WalletDeepLinkHandler,
    private val nonceRepository: NonceRepository,
    private val logger: SanitizedLogger,
    private val preferences: BitMapCoreWalletPreferences,
    private val blockImageCacheRepository: BlockImageCacheRepository,
    private val blockTempDataRepository: BlockTempDataRepository,
    private val blockDao: BlockDao,
    private val procesadorTabla12Preview: ProcesadorTabla12Preview,
    private val inscriptionCacheRepository: UserInscriptionCacheRepository,
    private val etiquetasPorPrecioDao: EtiquetasPorPrecioDao,
    private val mempoolApi: MempoolApi,
    private val psbtCallbackRepository: PSBTCallbackRepository,
    private val psbtSigningManager: PSBTSigningManager
)
```

---

## 2. Estado que Expone

| StateFlow | Tipo | Descripción |
|-----------|------|-------------|
| `walletConnectionState` | `StateFlow<WalletConnectionState>` | Estado de conexión |
| `connectedWallet` | `StateFlow<BitMapCoreWallet?>` | Wallet conectada |
| `availableWallets` | `StateFlow<List<String>>` | Wallets disponibles |
| `walletHistory` | `StateFlow<List<BitMapCoreWallet>>` | Historial de wallets |
| `userInscriptions` | `StateFlow<List<UserInscription>>` | Inscripciones del usuario |
| `isLoadingInscriptions` | `StateFlow<Boolean>` | Cargando inscripciones |
| `psbtSignResult` | `StateFlow<PSBTSignResult?>` | Resultado de firma PSBT |
| `parcelVerificationMap` | `StateFlow<Map<String, ParcelVerificationState>>` | Verificación de parcels |
| `bitmapTagInfos` | `StateFlow<Map<Int, BitmapTagInfo>>` | Tags de bitmaps del usuario |
| `userRunes` | `StateFlow<List<UserRuneBalance>>` | Balances de runes |

---

## 3. Estados de UI

```kotlin
sealed class WalletConnectionState {
    object Disconnected : WalletConnectionState()
    data class Connecting(val walletType: String) : WalletConnectionState()
    data class Connected(val address: String, val walletType: String) : WalletConnectionState()
    data class Error(val message: String?) : WalletConnectionState()
}

sealed interface PSBTSignResult {
    data class Success(val signedPsbtBase64: String) : PSBTSignResult
    data class Error(val message: String) : PSBTSignResult
}
```

---

## 4. Funciones Principales

| Función | Descripción |
|---------|-------------|
| `connectWallet(walletType)` | Inicia conexión via deep link |
| `disconnectWallet()` | Desconecta wallet actual |
| `getWalletPublicKey()` | Obtiene clave pública |
| `getWalletUTXOs()` | Obtiene UTXOs |
| `signPSBT(psbtBase64, inputsToSign, sigHashType)` | Firma PSBT via deep link |
| `loadUserInscriptions(address)` | Carga inscripciones del usuario |
| `verifyParcel(bitmapNumber)` | Verifica si un bitmap es parcel |
| `generateWalletBitmapImage(bitmapNumber)` | Genera imagen del bitmap |
| `loadSavedInscriptions(address)` | Carga inscripciones cacheadas |
| `loadBitmapTagInfos(blockNumbers)` | Carga tags de bitmaps |

---

## 5. Flujo de Conexión (Android)

```
1. Usuario hace click "Conectar Wallet"
    │
2. connectWallet("unisat")
    │   │
    │   ├── walletConnectionState = Connecting("unisat")
    │   ├── CronometroUniversalDelPolling.isPollingPausedExternally = true
    │   ├── nonceRepository.savePendingWalletType("unisat")
    │   └── connectWalletUseCase("unisat")
    │           │
    │           └── Genera nonce único
    │
3. DeepLinkBuilder.buildWalletConnectDeepLink("unisat", nonce)
    │   │
    │   └── Uri: "unisat://request?method=signMessage&data=...&nonce=..."
    │
4. WalletDeepLinkHandler.openDeepLink(deepLink, "unisat")
    │   │
    │   ├── Intent.ACTION_VIEW con deep link
    │   └── Abre app Unisat
    │
5. Usuario aprueba en Unisat
    │
6. Unisat retorna callback a "unisat://response"
    │
7. WalletCallbackActivity captura callback
    │   │
    │   └── psbtCallbackRepository.consumeResult()
    │
8. PSBTSigningManager observa resultado
    │   │
    │   └── onPSBTSigned(signedPsbtBase64, success, error)
    │
9. walletConnectionState = Connected(address, walletType)
    │
10. loadUserInscriptions(address)
```

---

## 6. Flujo de Firma PSBT (Android)

```
Cerebro 4: signPSBT(psbtBase64, inputsToSign, sigHashType)
    │
    ├── 1. Validar wallet conectada
    │
    ├── 2. DeepLinkBuilder.buildUnisatSignPsbtDeepLink(
    │          psbtBase64, inputsToSign, sigHash, message)
    │      │
    │      └── Uri: "unisat://request?method=signPsbt&data=..."
    │
    ├── 3. WalletDeepLinkHandler.openDeepLink(deepLink, walletType)
    │      │
    │      └── Abre app Unisat
    │
    ├── 4. Usuario aprueba firma en Unisat
    │
    ├── 5. Unisat retorna PSBT firmado
    │
    ├── 6. Callback llega a PSBTCallbackRepository
    │
    └── 7. PSBTSignResult.Success(signedPsbtBase64)
```

---

## 7. Equivalente Web

```typescript
// stores/walletStore.ts
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Conexión
      connectWallet: async (type: 'unisat' | 'xverse') => {
        if (type === 'unisat') {
          const accounts = await window.unisat.requestAccounts();
          const publicKey = await window.unisat.getPublicKey();
          const balance = await window.unisat.getBalance();
          
          set({
            address: accounts[0],
            publicKey,
            balance: balance.confirmed,
            walletType: 'unisat',
            isConnected: true,
          });
          
          window.unisat.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) get().disconnectWallet();
            else set({ address: accounts[0] });
          });
        }
      },
      
      // Firma PSBT
      signPsbt: async (psbt: string, options: any) => {
        const { walletType } = get();
        if (walletType === 'unisat') {
          return await window.unisat.signPsbt(psbt, options);
        }
        throw new Error('Wallet not connected');
      },
      
      // Cargar inscripciones (vía API, no scraping local)
      loadUserInscriptions: async (address: string) => {
        const response = await fetch(`/api/v1/bitmaps/owner/${address}`);
        const data = await response.json();
        set({ userInscriptions: data.data });
      },
    }),
    { name: 'bitmapcore-wallet' }
  )
);
```

### Diferencias clave Android vs Web

| Función | Android | Web |
|---------|---------|-----|
| `connectWallet` | Deep link → app wallet | `window.unisat.requestAccounts()` |
| `signPSBT` | Deep link → app wallet → callback | `window.unisat.signPsbt()` (async) |
| `getWalletPublicKey` | `preferences.getWalletPublicKey()` | `window.unisat.getPublicKey()` |
| `getWalletUTXOs` | `mempoolApi.getUTXOs()` | `fetch('/api/v1/wallet/:address/utxos')` |
| `loadUserInscriptions` | Scraping ordinals.com HTML | `fetch('/api/v1/bitmaps/owner/:address')` |
| `NonceRepository` | UUID generation | **NO se necesita** |
| `WalletDeepLinkHandler` | Intent.ACTION_VIEW | **NO se necesita** |
| `PSBTCallbackRepository` | Activity callback | **async/await** (returned value) |
