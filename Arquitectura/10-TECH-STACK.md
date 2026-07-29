# BitmapCore — Stack Tecnológico Web

## Resumen

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Framework | React | 18.x | UI library |
| Lenguaje | TypeScript | 5.x | Tipado fuerte |
| Bundler | Vite | 5.x | Build tool |
| Styling | Tailwind CSS | 3.x | CSS utility-first |
| Estado | Zustand | 4.x | State management |
| HTTP | Axios | 1.x | Cliente HTTP |
| Rutas | React Router | 6.x | Navegación |
| Formularios | React Hook Form | 7.x | Form handling |
| i18n | i18next | 24.x | Internacionalización |
| Wallet | sats-connect | 1.x | Conexión wallet |
| Canvas | Canvas API | Nativo | Imágenes Mondrian |
| Linting | ESLint | 8.x | Code quality |
| Formatting | Prettier | 3.x | Code formatting |

---

## 1. Por qué cada tecnología

### React + TypeScript + Vite

| Opción | Ventaja | Desventaja |
|--------|---------|------------|
| **React + Vite** (ELEGIDO) | Rápido, ecosistema maduro, fácil de mantener | — |
| Next.js | SSR, ISR | Over-engineering para esta app |
| Vue + Vite | Alternativa válida | Menor ecosistema Bitcoin |
| Svelte | Más rápido | Menor ecosistema |

### Zustand vs Otros

| Opción | Ventaja | Desventaja |
|--------|---------|------------|
| **Zustand** (ELEGIDO) | Simple, mínimo boilerplate, persist middleware | — |
| Redux Toolkit | Más features | Overhead innecesario |
| Jotai | Atomic state | Más complejo |
| MobX | Observable | Menor community |

### Tailwind CSS

| Opción | Ventaja | Desventaja |
|--------|---------|------------|
| **Tailwind** (ELEGIDO) | Rápido de desarrollar, responsive fácil | CSS más verbose |
| CSS Modules | Más limpio | Más tiempo de desarrollo |
| Styled Components | CSS-in-JS | Performance overhead |

---

## 2. Estructura de Directorios Web

```
BitmapCorpServer/web/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router setup
│   ├── routes.tsx                  # Definición de rutas
│   │
│   ├── pages/                      # 25 páginas
│   │   ├── HomePage.tsx
│   │   ├── WalletPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── WhitepaperPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── OrdinalswalletPage.tsx
│   │   ├── UnisatPage.tsx
│   │   ├── LocalMarketplacePage.tsx
│   │   ├── BitmapDetailPage.tsx
│   │   ├── BuyBitmapPage.tsx
│   │   ├── MyAssetsPage.tsx
│   │   ├── AssetDetailPage.tsx
│   │   ├── TransactionHistoryPage.tsx
│   │   ├── WalletHistoryPage.tsx
│   │   ├── TablesPage.tsx
│   │   ├── TagTableDetailPage.tsx
│   │   ├── TagInfoPage.tsx
│   │   ├── BlockDetailPage.tsx
│   │   ├── DiscountsPage.tsx
│   │   ├── TagTablesPage.tsx
│   │   ├── TagGroupsPage.tsx
│   │   └── SalesPage.tsx
│   │
│   ├── components/                 # Componentes reutilizables
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MarketplaceBubble.tsx
│   │   ├── BlockImageBubble.tsx
│   │   ├── InscriptionImage.tsx
│   │   ├── CircularProgress.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── WalletConnectMenu.tsx
│   │   ├── WalletStatusButton.tsx
│   │   ├── TransactionConfirmDialog.tsx
│   │   ├── SuccessDialog.tsx
│   │   ├── SortOptionButton.tsx
│   │   ├── AutoSizeText.tsx
│   │   ├── TagsDisplay.tsx
│   │   ├── UniversalTagDesign.tsx
│   │   └── ui/                     # Primitivos UI
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Input.tsx
│   │       └── Badge.tsx
│   │
│   ├── stores/                     # Zustand stores (10 cerebros)
│   │   ├── settingsStore.ts        # MainViewModel
│   │   ├── marketplaceStore.ts     # Cerebro 2
│   │   ├── walletStore.ts          # Cerebro 4
│   │   ├── localMarketplaceStore.ts # Cerebro 5
│   │   ├── unifiedStore.ts         # Cerebro 6
│   │   ├── imageStore.ts           # Cerebro 7
│   │   ├── blockStore.ts           # BlockViewModel
│   │   ├── tagStore.ts             # Tags/etiquetas
│   │   ├── salesStore.ts           # Ventas
│   │   └── uiStore.ts              # UI state
│   │
│   ├── api/                        # API layer
│   │   ├── axiosClient.ts          # Configuración axios
│   │   ├── bitmapsApi.ts           # /api/v1/bitmaps/*
│   │   ├── transactionApi.ts       # /api/v1/transaction/*
│   │   ├── walletApi.ts            # /api/v1/wallet/*
│   │   ├── marketplaceProxyApi.ts  # /api/v1/proxy/*
│   │   └── types.ts                # Tipos TypeScript
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── usePolling.ts           # Polling de marketplaces
│   │   ├── useWallet.ts            # Conexión wallet
│   │   ├── useBitmapImage.ts       # Generación imágenes Mondrian
│   │   └── useMarketplaceData.ts   # Datos de marketplaces
│   │
│   ├── utils/                      # Utilidades
│   │   ├── bitcoin.ts              # Formateo BTC
│   │   ├── imageGenerator.ts       # Canvas API Mondrian
│   │   └── helpers.ts              # Funciones helper
│   │
│   ├── theme/                      # Tema
│   │   ├── colors.ts
│   │   ├── fonts.ts
│   │   └── Theme.tsx
│   │
│   ├── i18n/                       # Internacionalización
│   │   ├── index.ts
│   │   ├── es/                     # Español
│   │   │   ├── admin.json
│   │   │   ├── database.json
│   │   │   ├── auth.json
│   │   │   ├── marketplace.json
│   │   │   ├── search.json
│   │   │   ├── core.json
│   │   │   └── whitepaper.json
│   │   └── en/                     # Inglés
│   │       └── (mismos archivos)
│   │
│   └── types/                      # Tipos globales
│       ├── wallet.ts
│       ├── marketplace.ts
│       ├── bitmap.ts
│       └── image.ts
│
├── public/
│   └── favicon.ico
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── .env.local
```

---

## 3. Configuración de Tailwind

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bitmap: {
          primary: '#FF6B35',
          secondary: '#004E89',
          accent: '#F7C948',
          dark: '#1A1A2E',
          light: '#F8F9FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

---

## 4. Configuración de Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

---

## 5. Configuración de Nginx (VPS)

```nginx
server {
    listen 443 ssl http2;
    server_name bitmapcore.net;

    ssl_certificate /etc/letsencrypt/live/bitmapcore.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bitmapcore.net/privkey.pem;

    # API - Proxy a Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000;
    }

    # Web - Archivos estáticos
    location / {
        root /home/bitmapcorp/BitmapCorpServer/web/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 6. Dependencias de package.json

```json
{
  "name": "bitmapcore-web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src/**/*.{ts,tsx}"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4",
    "axios": "^1.7.4",
    "i18next": "^24.0.5",
    "react-i18next": "^15.1.1",
    "react-hook-form": "^7.53.0",
    "sats-connect": "^1.2.0",
    "lucide-react": "^0.441.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "prettier": "^3.3.3",
    "@typescript-eslint/eslint-plugin": "^8.3.0",
    "@typescript-eslint/parser": "^8.3.0"
  }
}
```
