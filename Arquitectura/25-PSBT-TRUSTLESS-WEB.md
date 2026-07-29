# 25 - PSBT Trustless Web (Extensiones de Navegador)

## 1. Propósito

Adaptación del sistema PSBT trustless de Android a la versión web usando extensiones de navegador (Unisat, Xverse). El vendedor **NUNCA** pierde la custodia de su Bitmap.

---

## 2. Principio Fundamental

> **El Bitmap permanece en la wallet del vendedor hasta que el comprador paga y la transacción se confirma on-chain.**

Se logra con PSBTs usando:
- **`SIGHASH_SINGLE | ANYONECANPAY`** en la firma del vendedor
- **`SIGHASH_ALL`** en la firma del comprador

---

## 3. Diferencias Android → Web

| Aspecto | Android | Web |
|---------|---------|-----|
| Wallet connection | Deep links (`unisat://`) | Browser extension APIs (`window.unisat.*`) |
| Firma PSBT | `signPsbt()` via deep link | `window.unisat.signPsbt()` directo |
| Obtener pubkey | `getPublicKey()` via deep link | `window.unisat.getPublicKey()` directo |
| Push TX | `pushTx()` via deep link | `window.unisat.pushTx()` directo |
| Listener cambios | `BroadcastReceiver` | `window.unisat.on('accountsChanged')` |
| Obtener UTXOs | Mempool API directa | Mempool API via proxy (CORS) |

---

## 4. APIs de Wallets en Web

### 4.1 Unisat Browser Extension

```typescript
// Verificar si Unisat está instalado
function isUnisatInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.unisat !== 'undefined';
}

// Conectar wallet
async function connectUnisat(): Promise<string[]> {
  if (!isUnisatInstalled()) {
    throw new Error('Unisat Wallet no está instalada');
  }
  const accounts = await window.unisat.requestAccounts();
  return accounts; // ['bc1q...']
}

// Obtener dirección actual
async function getUnisatAddress(): Promise<string> {
  const accounts = await window.unisat.requestAccounts();
  return accounts[0];
}

// Obtener pubkey
async function getUnisatPublicKey(): Promise<string> {
  return await window.unisat.getPublicKey();
}

// Obtener balance
async function getUnisatBalance(): Promise<{ confirmed: number; unconfirmed: number }> {
  return await window.unisat.getBalance();
}

// Firmar PSBT
async function signUnisatPsbt(psbtBase64: string, options?: {
  autoFinalized?: boolean;
  toSignInputs?: Array<{ index: number; address: string; sighashTypes?: number[] }>;
}): Promise<string> {
  const signed = await window.unisat.signPsbt(psbtBase64, options);
  return signed; // PSBT firmado en base64
}

// Push transacción
async function pushUnisatTx(signedPsbt: string): Promise<string> {
  const txid = await window.unisat.pushTx(signedPsbt);
  return txid;
}

// Listener para cambios de cuenta
function onUnisatAccountsChanged(callback: (accounts: string[]) => void): void {
  window.unisat.on('accountsChanged', callback);
}
```

### 4.2 Xverse Wallet (via sats-connect)

```typescript
import { request, Permission } from 'sats-connect';

// Conectar wallet
async function connectXverse(): Promise<string> {
  const response = await request('getAddresses', {
    purposes: ['ordinals', 'payment'],
    message: 'Conectar a BitmapCore',
  });
  
  // response.addresses[0].address → dirección ordinals
  // response.addresses[1].address → dirección payment
  return response.addresses[0].address;
}

// Obtener pubkey
async function getXversePublicKey(): Promise<string> {
  const response = await request('getAddresses', {
    purposes: ['ordinals'],
    message: 'Obtener pubkey',
  });
  return response.addresses[0].publicKey;
}

// Firmar PSBT
async function signXversePsbt(psbtBase64: string): Promise<string> {
  const response = await request('signPsbt', {
    psbtBase64,
    broadcast: false,
    message: 'Firmar PSBT para listing',
  });
  return response.psbtBase64;
}

// Push transacción
async function pushXverseTx(signedPsbt: string): Promise<string> {
  const response = await request('sendTransfer', {
    psbtBase64: signedPsbt,
    message: 'Broadcast transacción',
  });
  return response.txid;
}
```

---

## 5. Flujo Completo Web

### 5.1 FASE 1: Listing (Vendedor pone en venta)

```
USUARIO (Web)                    SERVER (bitmapcore.net)
     │                                │
     │ 1. Click "Vender Bitmap"       │
     │    → Selecciona inscriptionId  │
     │    → Pone precio               │
     │                                │
     │ 2. POST /api/v1/bitmaps        │
     │    { inscriptionId, price,     │
     │      sellerAddress,            │
     │      sellerOrdinalPublicKey,   │
     │      sellerPaymentAddress }    │
     │───────────────────────────────►│
     │                                │ VERIFICACIONES:
     │                                │ a) verifyBitmap(inscriptionId)
     │                                │ b) verifyOwnership(inscriptionId, sellerAddress)
     │                                │ c) Obtener inscription UTXO
     │                                │ d) Construir PSBT template
     │                                │ e) Guardar en DB
     │                                │
     │ 3. { listingId, unsignedPsbt } │
     │◄───────────────────────────────│
     │                                │
     │ 4. Unisat.signPsbt(unsignedPsbt, {
     │      toSignInputs: [{
     │        index: 0,
     │        address: sellerAddress,
     │        sighashTypes: [
     │          SIGHASH_SINGLE | ANYONECANPAY
     │        ]
     │      }]
     │    })                          │
     │    → Usuario aprueba en wallet │
     │                                │
     │ 5. POST /api/v1/bitmaps/{id}/sign
     │    { signedPsbt,               │
     │      sellerOrdinalPublicKey }  │
     │───────────────────────────────►│
     │                                │ VALIDACIONES:
     │                                │ a) Deserializar PSBT
     │                                │ b) Verificar 1 input, 1 output
     │                                │ c) Verificar precio = output value
     │                                │ d) Verificar firma del vendedor
     │                                │ e) Guardar signedPsbt, psbtStatus='signed'
     │                                │
     │ 6. { listingId, status }       │
     │◄───────────────────────────────│
     │                                │
     │ 7. UI: "Listado activo en      │
     │    marketplace"                │
```

### 5.2 FASE 2: Compra (Comprador compra)

```
COMPRADOR (Web)                  SERVER (bitmapcore.net)
     │                                │
     │ 1. GET /api/v1/bitmaps/active  │
     │◄───────────────────────────────│
     │    [listings con signedPsbt]   │
     │                                │
     │ 2. Click "Comprar"             │
     │                                │
     │ 3. POST /api/v1/transaction/buy-bitmap
     │    { bitmapId, buyerAddress,   │
     │      idempotencyKey }          │
     │───────────────────────────────►│
     │                                │ FLUJO:
     │                                │ a) Obtener signedPsbt del listing
     │                                │ b) GET mempool.space/api/address/{buyer}/utxo
     │                                │ c) Seleccionar UTXOs confirmados
     │                                │ d) Calcular: price + fee(1%) + dust(546)
     │                                │ e) Completar PSBT:
     │                                │    - Agregar inputs del comprador
     │                                │    - Agregar output marketplace fee
     │                                │    - Agregar output change
     │                                │ f) Guardar transacción
     │                                │
     │ 4. { psbt, transactionId,      │
     │      expiresAt }               │
     │◄───────────────────────────────│
     │                                │
     │ 5. Unisat.signPsbt(psbt)       │
     │    → Usuario aprueba en wallet │
     │                                │
     │ 6. POST /api/v1/transaction/broadcast
     │    { signedPsbt, transactionId }│
     │───────────────────────────────►│
     │                                │ FLUJO:
     │                                │ a) Validar firmas
     │                                │ b) Finalizar PSBT
     │                                │ c) Extraer raw TX
     │                                │ d) Broadcast a mempool.space/api/tx
     │                                │ e) Marcar listing como vendido
     │                                │
     │ 7. { txid, status }            │
     │◄───────────────────────────────│
     │                                │
     │ 8. Polling GET /api/v1/transaction/{txid}/status
     │    → confirmed                  │
     │                                │
     │ 9. UI: "¡Compra completada!"   │
```

---

## 6. Estructura PSBT en la Transacción

### 6.1 Listing PSBT (Vendedor firma)

```
INPUT:
  [0] Inscription UTXO (txid:vout) - firmado con SIGHASH_SINGLE|ANYONECANPAY

OUTPUT:
  [0] sellerPaymentAddress - value: price (sat)
```

### 6.2 Purchase PSBT (Comprador completa)

```
INPUTS:
  [0] Inscription UTXO (seller) - firmado con SIGHASH_SINGLE|ANYONECANPAY
  [1...n] Buyer's payment UTXOs - firmados con SIGHASH_ALL

OUTPUTS:
  [0] Seller payment address - value: price (sat)
  [1] Marketplace fee address - value: price * 1%
  [2] Buyer change address - value: remaining sats
  [3] Inscription destination (buyer address) - value: 546 sat (dust limit)
```

---

## 7. Implementación en React

### 7.1 Wallet Provider

```typescript
// hooks/useWallet.ts
import { useState, useEffect, useCallback } from 'react';

type WalletType = 'unisat' | 'xverse' | null;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  walletType: WalletType;
  balance: number;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    publicKey: null,
    walletType: null,
    balance: 0,
  });

  const connectUnisat = useCallback(async () => {
    if (!window.unisat) {
      throw new Error('Unisat Wallet no instalada');
    }
    
    const accounts = await window.unisat.requestAccounts();
    const publicKey = await window.unisat.getPublicKey();
    const balance = await window.unisat.getBalance();
    
    setState({
      isConnected: true,
      address: accounts[0],
      publicKey,
      walletType: 'unisat',
      balance: balance.confirmed,
    });
    
    // Listener para cambios
    window.unisat.on('accountsChanged', (accounts: string[]) => {
      setState(prev => ({ ...prev, address: accounts[0] }));
    });
  }, []);

  const connectXverse = useCallback(async () => {
    const { request } = await import('sats-connect');
    
    const response = await request('getAddresses', {
      purposes: ['ordinals', 'payment'],
      message: 'Conectar a BitmapCore',
    });
    
    const ordinalsAddress = response.addresses[0].address;
    const publicKey = response.addresses[0].publicKey;
    
    setState({
      isConnected: true,
      address: ordinalsAddress,
      publicKey,
      walletType: 'xverse',
      balance: 0, // Obtener después
    });
  }, []);

  const signPsbt = useCallback(async (psbtBase64: string): Promise<string> => {
    if (state.walletType === 'unisat') {
      return await window.unisat.signPsbt(psbtBase64, {
        toSignInputs: [{
          index: 0,
          address: state.address!,
          sighashTypes: [0x03], // SIGHASH_SINGLE | ANYONECANPAY
        }],
      });
    } else if (state.walletType === 'xverse') {
      const { request } = await import('sats-connect');
      const response = await request('signPsbt', {
        psbtBase64,
        broadcast: false,
      });
      return response.psbtBase64;
    }
    throw new Error('Wallet no conectada');
  }, [state]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      publicKey: null,
      walletType: null,
      balance: 0,
    });
  }, []);

  return { ...state, connectUnisat, connectXverse, signPsbt, disconnect };
}
```

### 7.2 Listing Service

```typescript
// services/listingService.ts
const API_BASE = 'https://bitmapcore.net/api/v1';

export async function createListing(data: {
  inscriptionId: string;
  price: number;
  sellerAddress: string;
  sellerOrdinalPublicKey: string;
  sellerPaymentAddress: string;
  name: string;
  imageUrl: string;
}) {
  const response = await fetch(`${API_BASE}/bitmaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error creando listing');
  }
  
  return response.json();
}

export async function signListing(
  listingId: string,
  signedPsbt: string,
  sellerOrdinalPublicKey: string
) {
  const response = await fetch(`${API_BASE}/bitmaps/${listingId}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedPsbt, sellerOrdinalPublicKey }),
  });
  
  return response.json();
}

export async function buyBitmap(bitmapId: string, buyerAddress: string) {
  const idempotencyKey = crypto.randomUUID();
  
  const response = await fetch(`${API_BASE}/transaction/buy-bitmap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bitmapId, buyerAddress, idempotencyKey }),
  });
  
  return response.json();
}

export async function broadcastPsbt(signedPsbt: string, transactionId: string) {
  const response = await fetch(`${API_BASE}/transaction/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedPsbt, transactionId }),
  });
  
  return response.json();
}
```

---

## 8. Estados del PSBT

| Estado | Significado | Transición |
|--------|-------------|------------|
| `created` | Listing creado, PSBT template sin firmar | `POST /bitmaps` → `POST /bitmaps/{id}/sign` |
| `signed` | Vendedor firmó, listing activo | `POST /bitmaps/{id}/sign` success |
| `sold` | Transacción completada on-chain | `POST /transaction/broadcast` success |
| `expired` | PSBT expiró (5 min para firmar) | Job nocturno / manual |

---

## 9. Marketplace Fee

```typescript
const MARKETPLACE_FEE_PERCENT = 1;

function calculateMarketplaceFee(price: number): number {
  return Math.floor(price * MARKETPLACE_FEE_PERCENT / 100);
}

function calculateTotalNeeded(price: number): bigint {
  const fee = calculateMarketplaceFee(price);
  const DUST_LIMIT = 546n;
  return BigInt(price) + BigInt(fee) + DUST_LIMIT;
}
```

---

## 10. Manejo de Errores

```typescript
// Errores comunes en web
const WALLET_ERRORS = {
  NOT_INSTALLED: 'La extensión de wallet no está instalada',
  NOT_CONNECTED: 'La wallet no está conectada',
  USER_REJECTED: 'El usuario rechazó la operación',
  INVALID_PSBT: 'El PSBT es inválido',
  INSUFFICIENT_FUNDS: 'Fondos insuficientes',
  PSBT_EXPIRED: 'El PSBT ha expirado',
  ALREADY_LISTED: 'El bitmap ya está listado',
  NOT_OWNER: 'No eres el propietario del bitmap',
};

// Función para manejar errores de wallet
function handleWalletError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('User rejected')) {
      return WALLET_ERRORS.USER_REJECTED;
    }
    if (error.message.includes('not installed')) {
      return WALLET_ERRORS.NOT_INSTALLED;
    }
  }
  return 'Error desconocido';
}
```

---

## 11. Seguridad Web

| Medida | Implementación |
|--------|---------------|
| SIGHASH flags | `SIGHASH_SINGLE \| ANYONECANPAY` para listings |
| Validación server | Server valida PSBT antes de guardar |
| Idempotency | Keys UUID únicas por operación |
| Rate limiting | 5 req/min por wallet en compras |
| PSBT expiration | 5 min para firmar, 24h para venta |
| HTTPS | Siempre usar HTTPS en producción |
| CORS | Solo orígenes permitidos |

---

## 12. Wallet Detection

```typescript
// Verificar wallets disponibles
function detectAvailableWallets(): {
  unisat: boolean;
  xverse: boolean;
} {
  return {
    unisat: typeof window !== 'undefined' && typeof window.unisat !== 'undefined',
    xverse: typeof window !== 'undefined' && typeof window.sats !== 'undefined',
  };
}

// Prompt de instalación si no hay wallets
function promptInstallWallet(): void {
  const wallets = detectAvailableWallets();
  
  if (!wallets.unisat && !wallets.xverse) {
    // Mostrar UI de instalación
    // Links a Chrome Web Store / Firefox Add-ons
  }
}
```
