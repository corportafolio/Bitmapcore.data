# BitmapCore — Conexión de Wallets en Web: Browser Extensions

## Resumen

| Campo | Valor |
|-------|-------|
| Método en Android | Deep links (`unisat://request`, `xverse://request`) |
| Método en Web | **Browser extensions** (`window.unisat.*`, `sats-connect`) |
| Wallets soportadas | Unisat, Xverse |
| Seguridad | La extensión maneja todo (non-custodial, nunca comparte claves) |
| Nonces | **NO se necesitan** en web — la extensión maneja la autenticación |

## Diferencia Fundamental: Android vs Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Conexión | Deep link → app wallet → callback Activity | `window.unisat.requestAccounts()` → popup wallet |
| Firma PSBT | Deep link → app wallet → callback Activity | `window.unisat.signPsbt(psbtHex, options)` → popup |
| Transmisión | `POST /api/v1/transaction/broadcast` | `window.unisat.pushPsbt()` O `POST /broadcast` |
| Detección | `PackageManager.getPackageInfo()` | `typeof window.unisat !== 'undefined'` |
| Nonces | Sí (NonceRepository, UUID) | **NO** — la extensión maneja la seguridad |
| Callback | Activity callback via `WalletCallbackActivity` | **Promise/async-await** — returned value |
| Almacenamiento wallet | Room DB (BitMapCoreWalletEntity) | `localStorage` + API del servidor |
| Selección wallet | Menú que detecta apps instaladas | Detectar qué extensiones están inyectadas |

---

## 1. Unisat Wallet — API Real del Browser Extension

### Instalación
El usuario instala la extensión Unisat desde Chrome Web Store / Firefox Add-ons.

### Detección

```typescript
// Detectar si Unisat está instalado
function isUnisatInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.unisat !== 'undefined';
}
```

### Conexión (obtener direcciones)

```typescript
// Conectar wallet - abre popup de Unisat para que el usuario apruebe
async function connectUnisat(): Promise<string[]> {
  if (!isUnisatInstalled()) {
    throw new Error('Unisat Wallet no está instalada');
  }
  const accounts: string[] = await window.unisat.requestAccounts();
  return accounts; // ['bc1q...']
}
```

### Obtener clave pública

```typescript
async function getPublicKey(): Promise<string> {
  const publicKey: string = await window.unisat.getPublicKey();
  return publicKey;
}
```

### Obtener balance

```typescript
async function getBalance(): Promise<{ confirmed: number; unconfirmed: number }> {
  const balance = await window.unisat.getBalance();
  return balance; // { confirmed: 12345, unconfirmed: 0 }
}
```

### Firmar PSBT (flujo de compra)

```typescript
// Firma PSBT - abre popup de Unisat
async function signPSBT(psbtHex: string, options?: SignPsbtOptions): Promise<string> {
  const signedPsbt = await window.unisat.signPsbt(psbtHex, {
    autoFinalized: false,
    toSignInputs: [
      { index: 0, address: 'bc1p...' },
    ],
    // Para compra: SIGHASH_ALL (0x01)
    // Para listado: SIGHASH_SINGLE|ANYONECANPAY (0x83)
    sighashTypes: [0x01], // o [0x83] para listing
  });
  return signedPsbt; // PSBT firmado en hex
}
```

### Firmar múltiples PSBTs (batch)

```typescript
async function signPsbts(psbtsHex: string[]): Promise<string[]> {
  const signedPsbts = await window.unisat.signPsbts(psbtsHex, {
    autoFinalized: false,
    toSignInputs: [
      { index: 0, address: 'bc1p...' },
    ],
  });
  return signedPsbts;
}
```

### Transmitir transacción

```typescript
async function pushTx(rawTxHex: string): Promise<string> {
  const txid = await window.unisat.pushTx(rawTxHex);
  return txid;
}

// O transmitir PSBT
async function pushPsbt(signedPsbtHex: string): Promise<string> {
  const txid = await window.unisat.pushPsbt(signedPsbtHex);
  return txid;
}
```

### Escuchar cambios de cuenta

```typescript
window.unisat.on('accountsChanged', (accounts: string[]) => {
  console.log('Cuentas cambiadas:', accounts);
  if (accounts.length === 0) {
    // Wallet desconectada
    disconnectWallet();
  } else {
    // Nueva cuenta seleccionada
    updateConnectedAddress(accounts[0]);
  }
});

// También para cambios de red
window.unisat.on('networkChanged', (network: string) => {
  console.log('Red cambiada:', network);
});
```

### API Completa de Unisat

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `requestAccounts()` | Conectar wallet (popup) | `string[]` direcciones |
| `getAccounts()` | Obtener cuentas actuales | `string[]` |
| `getPublicKey()` | Obtener clave pública | `string` |
| `getBalance()` | Obtener balance | `{confirmed, unconfirmed}` |
| `signPsbt(psbt, options)` | Firmar PSBT (popup) | `string` PSBT firmado |
| `signPsbts(psbts, options)` | Firmar múltiples PSBTs | `string[]` PSBTs firmados |
| `pushTx(rawTx)` | Transmitir transacción | `string` txid |
| `pushPsbt(psbt)` | Transmitir PSBT | `string` txid |
| `on(event, callback)` | Escuchar eventos | `void` |
| `removeListener(event, callback)` | Remover listener | `void` |

---

## 2. Xverse Wallet — API Real (vía `sats-connect`)

### Instalación

```bash
npm install sats-connect
```

### Obtener direcciones

```typescript
import { request, AddressPurpose } from 'sats-connect';

async function connectXverse(): Promise<AddressInfo[]> {
  const response = await request('getAddresses', {
    purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
    message: 'Conectar a BitmapCore',
  });
  
  // response = [
  //   { address: 'bc1q...', publicKey: '02abc...', purpose: 'payment', addressType: 'p2wpkh' },
  //   { address: 'bc1p...', publicKey: '03def...', purpose: 'ordinals', addressType: 'p2tr' }
  // ]
  return response;
}
```

### Firmar PSBT

```typescript
import { request, AddressPurpose } from 'sats-connect';

async function signPsbtXverse(
  psbtBase64: string,
  address: string,
  inputIndices: number[]
): Promise<string> {
  const response = await request('signPsbt', {
    psbt: psbtBase64,
    broadcast: false, // NO transmitir, solo firmar
    inputsToSign: {
      [address]: inputIndices, // { 'bc1p...': [0] }
    },
  });
  
  return response.psbt; // PSBT firmado en base64
}
```

### Transmitir transacción

```typescript
async function sendTransferXverse(
  recipients: Array<{ address: string; amount: number }>
): Promise<string> {
  const response = await request('sendTransfer', {
    recipients: recipients.map(r => ({
      address: r.address,
      amount: r.amount.toString(),
    })),
  });
  return response.txid;
}
```

### Gestionar permisos

```typescript
// Verificar permisos actuales
const permissions = await request('wallet_getPermissions', null);

// Solicitar permisos
await request('wallet_requestPermissions', {
  permissions: ['wallet_getAddresses'],
});
```

### API Completa de Xverse (sats-connect)

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getAddresses` | Obtener direcciones | `{address, publicKey, purpose}[]` |
| `signPsbt` | Firmar PSBT | `{psbt}` PSBT firmado |
| `sendTransfer` | Enviar BTC | `{txid}` |
| `wallet_getPermissions` | Ver permisos | `Permission[]` |
| `wallet_requestPermissions` | Solicitar permisos | `void` |
| `wallet_create inscription` | Crear inscripción | `{txid}` |
| `wallet_send inscription` | Enviar inscripción | `{txid}` |

---

## 3. Librería Unificada: `sats-connect`

`sats-connect` funciona con **Unisat, Xverse, y cualquier wallet que siga WBIP004**.

```typescript
import { request, AddressPurpose } from 'sats-connect';

// Detectar wallets disponibles
const wallets = await request('getWallets', null);
// [{ name: 'Unisat', icon: '...', installed: true }, ...]

// Conectar
const addresses = await request('getAddresses', {
  purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
  message: 'Conectar a BitmapCore',
});

// Firmar
const signed = await request('signPsbt', {
  psbt: psbtBase64,
  signInputs: { [address]: [0] },
  broadcast: false,
});
```

---

## 4. Flujo de Compara en Web (completo)

### Paso 1: Conectar wallet

```typescript
// walletStore.ts (Zustand)
async function connectWallet(walletType: 'unisat' | 'xverse') {
  if (walletType === 'unisat') {
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
    
    // Escuchar cambios
    window.unisat.on('accountsChanged', handleAccountsChanged);
    
  } else if (walletType === 'xverse') {
    const { request, AddressPurpose } = await import('sats-connect');
    const addresses = await request('getAddresses', {
      purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
    });
    
    const paymentAddr = addresses.find(a => a.purpose === 'payment');
    const ordinalsAddr = addresses.find(a => a.purpose === 'ordinals');
    
    set({
      address: paymentAddr.address,
      ordinalsAddress: ordinalsAddr.address,
      publicKey: paymentAddr.publicKey,
      walletType: 'xverse',
      isConnected: true,
    });
  }
}
```

### Paso 2: Comprar bitmap

```typescript
async function buyBitmap(bitmapId: string, buyerAddress: string) {
  // 1. Solicitar PSBT al servidor
  const idempotencyKey = generateIdempotencyKey();
  const response = await axios.post('/api/v1/transaction/buy-bitmap', {
    bitmapId,
    buyerAddress,
    idempotencyKey,
  });
  
  const { psbt, transactionId, expiresAt } = response.data.data;
  
  // 2. Firmar PSBT con wallet
  let signedPsbt: string;
  
  if (walletType === 'unisat') {
    signedPsbt = await window.unisat.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: [
        { index: 1, address: buyerAddress }, // Input del comprador
      ],
      sighashTypes: [0x01], // SIGHASH_ALL
    });
  } else if (walletType === 'xverse') {
    const { request } = await import('sats-connect');
    const result = await request('signPsbt', {
      psbt: psbt,
      broadcast: false,
      inputsToSign: {
        [buyerAddress]: [1], // Input del comprador
      },
    });
    signedPsbt = result.psbt;
  }
  
  // 3. Transmitir PSBT firmado al servidor
  const broadcastResponse = await axios.post('/api/v1/transaction/broadcast', {
    signedPsbt,
    transactionId,
  });
  
  return broadcastResponse.data.data.txid;
}
```

### Paso 3: Listar bitmap para venta

```typescript
async function listBitmap(listingData: CreateListingData) {
  // 1. Crear listing en servidor (retorna PSBT para firmar)
  const response = await axios.post('/api/v1/bitmaps', {
    inscriptionId: listingData.inscriptionId,
    price: listingData.price,
    sellerAddress: listingData.sellerAddress,
    name: listingData.name,
    imageUrl: listingData.imageUrl,
    sellerOrdinalPublicKey: listingData.sellerOrdinalPublicKey,
    sellerPaymentAddress: listingData.sellerPaymentAddress,
  });
  
  const { listing, psbtToSign } = response.data.data;
  
  // 2. Firmar PSBT con wallet (SIGHASH_SINGLE | ANYONECANPAY)
  let signedPsbt: string;
  
  if (walletType === 'unisat') {
    signedPsbt = await window.unisat.signPsbt(psbtToSign, {
      autoFinalized: false,
      toSignInputs: [
        { index: 0, address: listingData.sellerAddress },
      ],
      sighashTypes: [0x83], // SIGHASH_SINGLE | ANYONECANPAY
    });
  } else if (walletType === 'xverse') {
    const { request } = await import('sats-connect');
    const result = await request('signPsbt', {
      psbt: psbtToSign,
      broadcast: false,
      inputsToSign: {
        [listingData.sellerAddress]: [0],
      },
    });
    signedPsbt = result.psbt;
  }
  
  // 3. Enviar PSBT firmado al servidor
  const signResponse = await axios.post(`/api/v1/bitmaps/${listing.id}/sign`, {
    signedPsbt,
    sellerOrdinalPublicKey: listingData.sellerOrdinalPublicKey,
  });
  
  return signResponse.data.data;
}
```

---

## 5. Seguridad en Web

### La extensión maneja la seguridad

| Aspecto | Cómo funciona |
|---------|---------------|
| Claves privadas | Nunca salen de la extensión — se almacenan localmente en el navegador |
| Firma | La extensión firma internamente y retorna solo el resultado |
| Aprobación | Cada operación requiere popup de confirmación del usuario |
| Non-custodial | La extensión nunca tiene acceso a los fondos |
| No hay nonces | La extensión usa su propio mecanismo de autenticación |

### Qué puede y qué NO puede hacer la web

| Puede hacer | NO puede hacer |
|-------------|----------------|
| Llamar `window.unisat.requestAccounts()` | Acceder a claves privadas |
| Llamar `window.unisat.signPsbt()` | Firmar sin popup de usuario |
| Obtener balance | Enviar transacciones sin aprobación |
| Escuchar eventos | Acceder a otras wallets del usuario |
| Obtener clave pública | Modificar transacciones después de firmar |

---

## 6. Mapeo de Funciones Android → Web

| Función Android (Cerebro 4) | Función Web |
|-----------------------------|-------------|
| `DeepLinkBuilder.buildWalletConnectDeepLink("unisat", nonce)` | `window.unisat.requestAccounts()` |
| `DeepLinkBuilder.buildUnisatGetAddressesDeepLink(nonce)` | `window.unisat.getAccounts()` |
| `DeepLinkBuilder.buildUnisatSignPsbtDeepLink(psbt, inputs, sigHash)` | `window.unisat.signPsbt(psbt, options)` |
| `WalletDeepLinkHandler.openDeepLink(uri, walletType)` | No se necesita — la extensión maneja |
| `PSBTSigningManager.signPSBT(psbt, inputs, sigHash, walletType)` | `window.unisat.signPsbt(psbt, options)` |
| `PSBTCallbackRepository.pendingResult.collect` | `await window.unisat.signPsbt()` (async/await) |
| `NonceRepository.generateNonce()` | No se necesita |
| `BitMapCoreWalletPreferences.getWalletPublicKey()` | `await window.unisat.getPublicKey()` |
| `MempoolApi.getUTXOs(address)` | `await fetch('/api/v1/wallet/:address/utxos')` |

---

## 7. Implementación Sugerida: walletStore.ts

```typescript
// stores/walletStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  ordinalsAddress: string | null;
  publicKey: string | null;
  walletType: 'unisat' | 'xverse' | null;
  balance: number;
  
  // Acciones
  connectWallet: (type: 'unisat' | 'xverse') => Promise<void>;
  disconnectWallet: () => void;
  signPsbt: (psbt: string, options: SignPsbtOptions) => Promise<string>;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      ordinalsAddress: null,
      publicKey: null,
      walletType: null,
      balance: 0,
      
      connectWallet: async (type) => {
        if (type === 'unisat') {
          if (typeof window.unisat === 'undefined') {
            throw new Error('Unisat Wallet no está instalada');
          }
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
          
          // Escuchar cambios
          window.unisat.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              get().disconnectWallet();
            } else {
              set({ address: accounts[0] });
            }
          });
          
        } else if (type === 'xverse') {
          const { request, AddressPurpose } = await import('sats-connect');
          const addresses = await request('getAddresses', {
            purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
          });
          
          const payment = addresses.find(a => a.purpose === 'payment');
          const ordinals = addresses.find(a => a.purpose === 'ordinals');
          
          set({
            address: payment?.address || null,
            ordinalsAddress: ordinals?.address || null,
            publicKey: payment?.publicKey || null,
            walletType: 'xverse',
            isConnected: true,
          });
        }
      },
      
      disconnectWallet: () => {
        set({
          isConnected: false,
          address: null,
          ordinalsAddress: null,
          publicKey: null,
          walletType: null,
          balance: 0,
        });
      },
      
      signPsbt: async (psbt, options) => {
        const { walletType, address } = get();
        if (!walletType || !address) throw new Error('Wallet no conectada');
        
        if (walletType === 'unisat') {
          return await window.unisat.signPsbt(psbt, options);
        } else if (walletType === 'xverse') {
          const { request } = await import('sats-connect');
          const result = await request('signPsbt', {
            psbt,
            broadcast: false,
            inputsToSign: options.toSignInputs || {},
          });
          return result.psbt;
        }
        throw new Error('Wallet type unknown');
      },
      
      refreshBalance: async () => {
        const { walletType, address } = get();
        if (!walletType || !address) return;
        
        if (walletType === 'unisat') {
          const balance = await window.unisat.getBalance();
          set({ balance: balance.confirmed });
        } else {
          const response = await fetch(`/api/v1/wallet/${address}/balance`);
          const data = await response.json();
          set({ balance: data.data.satoshis });
        }
      },
    }),
    {
      name: 'bitmapcore-wallet',
      partialize: (state) => ({
        address: state.address,
        walletType: state.walletType,
        publicKey: state.publicKey,
        ordinalsAddress: state.ordinalsAddress,
      }),
    }
  )
);
```

---

## 8. Type Declarations para TypeScript

```typescript
// types/unisat.d.ts
interface Window {
  unisat?: {
    requestAccounts(): Promise<string[]>;
    getAccounts(): Promise<string[]>;
    getPublicKey(): Promise<string>;
    getBalance(): Promise<{ confirmed: number; unconfirmed: number }>;
    signPsbt(psbtHex: string, options?: {
      autoFinalized?: boolean;
      toSignInputs?: Array<{
        index: number;
        address: string;
        signingScripts?: number[];
        redeemScripts?: Buffer[];
        tapInternalKeys?: Buffer[];
        sighashTypes?: number[];
      }>;
      sighashTypes?: number[];
    }): Promise<string>;
    signPsbts(psbtsHex: string[], options?: any): Promise<string[]>;
    pushTx(rawTxHex: string): Promise<string>;
    pushPsbt(psbtHex: string): Promise<string>;
    on(event: string, callback: (...args: any[]) => void): void;
    removeListener(event: string, callback: (...args: any[]) => void): void;
  };
}
```

---

## 9. Casos de Error

| Error | Causa | Solución |
|-------|-------|----------|
| `window.unisat is undefined` | Extensión no instalada | Mostrar link a Chrome Web Store |
| `User rejected the request` | Usuario canceló en popup | Mostrar mensaje amigable |
| `PSBT validation failed` | PSBT corrupto o expirado | Regenerar PSBT del servidor |
| `Insufficient funds` | UTXOs del comprador insuficientes | Mostrar balance actual |
| `Invalid signature` | Firma incorrecta | Reintentar firma |
| `Network mismatch` | Wallet en testnet, app en mainnet | Pedir cambiar red |
| `Accounts changed` | Usuario cambió de cuenta en wallet | Actualizar UI |
| `No address detected` | Xverse no retornó dirección | Reintentar conexión |
