# BitmapCore — Tabla 2: BitMapCoreDatabase (Wallets + Transacciones)

## Resumen

| Campo | Valor |
|-------|-------|
| Database Class | `BitMapCoreDatabase` |
| Archivo DB | `bitmapcorp_wallet.db` |
| Versión | 7 |
| Entidades | 3 (WalletEntity, TransactionEntity, CacheEntity) |
| DAOs | 3 |
| Equivalente Web | `walletStore.ts` (localStorage) + API |

---

## 1. Entidades

### BitMapCoreWalletEntity (tabla `bitmapcorp_wallets`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `address` | `String` | Dirección Bitcoin |
| `pubkey` | `String?` | Clave pública |
| `walletType` | `String` | "unisat", "xverse", "ordinalwallet" |
| `connectedAt` | `Long` | Timestamp conexión |
| `isConnected` | `Boolean` | Si está conectada |
| `lastUsedAt` | `Long?` | Último uso |

### BitMapCoreTransactionEntity (tabla `bitmapcorp_transactions`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `Long` | PK auto-increment |
| `bitmapId` | `String` | UUID del listing |
| `buyerAddress` | `String` | Dirección comprador |
| `sellerAddress` | `String` | Dirección vendedor |
| `price` | `Long` | Precio en satoshis |
| `status` | `String` | PENDING/AWAITING_SIGNATURE/BROADCASTING/SUCCESS/ERROR |
| `timestamp` | `Long` | Timestamp |
| `psbt` | `String?` | PSBT firmado |
| `txid` | `String?` | TX ID de la transacción |

### BitmapCacheEntity (tabla `bitmapcorp_server_cache`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cacheKey` | `String` | PK |
| `bitmapNumber` | `Int?` | Número del bitmap |
| `bitmapId` | `String?` | ID del listing |
| `listedPrice` | `Long?` | Precio listado |
| `listedAt` | `Long?` | Timestamp listado |
| `ownerAddress` | `String?` | Dirección propietario |
| `inscriptionNumber` | `Int?` | Número de inscripción |
| `bitmapHash` | `String?` | Hash del bitmap |
| `name` | `String?` | Nombre |
| `imageUrl` | `String?` | URL de imagen |
| `timestamp` | `Long` | Timestamp cache |

---

## 2. Equivalente Web

```typescript
// stores/walletStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletData {
  address: string;
  walletType: 'unisat' | 'xverse';
  connectedAt: number;
  isConnected: boolean;
}

interface TransactionData {
  bitmapId: string;
  buyerAddress: string;
  sellerAddress: string;
  price: number;
  status: 'PENDING' | 'AWAITING_SIGNATURE' | 'BROADCASTING' | 'SUCCESS' | 'ERROR';
  timestamp: number;
  psbt?: string;
  txid?: string;
}

interface WalletState {
  // Wallet
  wallet: WalletData | null;
  address: string | null;
  ordinalsAddress: string | null;
  publicKey: string | null;
  walletType: 'unisat' | 'xverse' | null;
  isConnected: boolean;
  balance: number;
  
  // Transacciones
  transactions: TransactionData[];
  
  // Acciones
  connectWallet: (type: 'unisat' | 'xverse') => Promise<void>;
  disconnectWallet: () => void;
  signPsbt: (psbt: string, options: any) => Promise<string>;
  refreshBalance: () => Promise<void>;
  addTransaction: (tx: TransactionData) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      address: null,
      ordinalsAddress: null,
      publicKey: null,
      walletType: null,
      isConnected: false,
      balance: 0,
      transactions: [],
      
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
            wallet: {
              address: accounts[0],
              walletType: 'unisat',
              connectedAt: Date.now(),
              isConnected: true,
            },
          });
          
          window.unisat.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) get().disconnectWallet();
            else set({ address: accounts[0] });
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
          wallet: null,
          address: null,
          ordinalsAddress: null,
          publicKey: null,
          walletType: null,
          isConnected: false,
          balance: 0,
        });
      },
      
      signPsbt: async (psbt, options) => {
        const { walletType } = get();
        if (walletType === 'unisat') {
          return await window.unisat.signPsbt(psbt, options);
        } else if (walletType === 'xverse') {
          const { request } = await import('sats-connect');
          const result = await request('signPsbt', {
            psbt, broadcast: false,
            inputsToSign: options.toSignInputs || {},
          });
          return result.psbt;
        }
        throw new Error('Wallet not connected');
      },
      
      refreshBalance: async () => {
        const { walletType, address } = get();
        if (!address) return;
        if (walletType === 'unisat') {
          const balance = await window.unisat.getBalance();
          set({ balance: balance.confirmed });
        } else {
          const res = await fetch(`/api/v1/wallet/${address}/balance`);
          const data = await res.json();
          set({ balance: data.data.satoshis });
        }
      },
      
      addTransaction: (tx) => {
        set((state) => ({
          transactions: [...state.transactions, tx],
        }));
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

### Diferencias clave

| Aspecto | Android | Web |
|---------|---------|-----|
| Wallet storage | Room DB (BitMapCoreWalletEntity) | localStorage (Zustand persist) |
| Transacciones | Room DB (BitMapCoreTransactionEntity) | Zustand state (memoria) |
| Cache | Room DB (BitmapCacheEntity) | Ninguna |
| Callback wallet | Activity callback | async/await |
