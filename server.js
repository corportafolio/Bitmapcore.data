const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const axios = require('axios');

const app = express();
const PORT = 5500;

app.use(cors({
  origin: ['https://bitmapcore.net', 'https://www.bitmapcore.net', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

let db = null;
try {
  db = new Database(path.join(__dirname, 'data/bitmapcorp_database.db'), { readonly: true });
  console.log('Database connected');
} catch (err) {
  console.error('Database not found, API routes will return empty data:', err.message);
}

function getTableNames() {
  if (!db) return [];
  try {
    return db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  } catch (e) { return []; }
}

function tableExists(name) {
  if (!db) return false;
  try {
    const r = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name=?").get(name);
    return r && r.c > 0;
  } catch (e) { return false; }
}

function sendSuccess(res, data) {
  res.json({ success: true, data: data });
}

function sendError(res, msg, code) {
  res.status(code || 500).json({ success: false, error: msg });
}

// ===== BLOCKS (Table principal) =====
app.get('/api/v1/blocks', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const tables = getTableNames();

    let countStmt, dataStmt;
    if (tableExists('blocks')) {
      countStmt = db.prepare('SELECT COUNT(*) as total FROM blocks');
      dataStmt = db.prepare('SELECT * FROM blocks ORDER BY rowid DESC LIMIT ? OFFSET ?');
    } else if (tableExists('tag_tables')) {
      countStmt = db.prepare('SELECT COUNT(*) as total FROM tag_tables');
      dataStmt = db.prepare('SELECT * FROM tag_tables ORDER BY rowid DESC LIMIT ? OFFSET ?');
    } else {
      return sendSuccess(res, { items: [], total: 0, page: page, limit: limit, tables: tables });
    }

    const total = countStmt.get().total;
    const items = dataStmt.all(limit, offset);
    sendSuccess(res, { items: items, total: total, page: page, limit: limit });
  } catch (err) {
    sendError(res, err.message);
  }
});

app.get('/api/v1/blocks/search', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    const q = req.query.q;
    if (!q) return sendSuccess(res, []);
    const num = parseInt(q);
    let items;
    if (!isNaN(num) && tableExists('blocks')) {
      items = db.prepare('SELECT * FROM blocks WHERE bloque = ?').all(num);
    } else if (tableExists('blocks')) {
      items = db.prepare('SELECT * FROM blocks WHERE CAST(bloque AS TEXT) LIKE ?').all('%' + q + '%');
    } else if (tableExists('tag_tables')) {
      items = db.prepare('SELECT * FROM tag_tables WHERE tagName LIKE ?').all('%' + q + '%');
    } else {
      items = [];
    }
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
});

app.get('/api/v1/blocks/:id', (req, res) => {
  if (!db) return sendError(res, 'No database', 404);
  try {
    const id = req.params.id;
    const num = parseInt(id);
    let block = null;

    if (tableExists('blocks')) {
      block = db.prepare('SELECT * FROM blocks WHERE bloque = ?').get(num);
      if (!block) block = db.prepare('SELECT * FROM blocks WHERE rowid = ?').get(num);
    }

    if (!block && tableExists('block_specific_summary')) {
      block = db.prepare('SELECT * FROM block_specific_summary WHERE blockNumber = ?').get(num);
    }

    if (!block) return sendError(res, 'Block not found', 404);

    if (block && block.bloque !== undefined) {
      block.blockNumber = block.bloque;
      block.txCount = block.totalTransacciones;
      block.txCount = block.totalTransacciones;
      block.size = block.totalBtc;
      block.date = block.etiquetas;
    }

    sendSuccess(res, block);
  } catch (err) {
    sendError(res, err.message);
  }
});

app.get('/api/v1/blocks/:id/transactions', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    const num = parseInt(req.params.id);
    let transactions = [];
    if (tableExists('block_specific_transactions')) {
      transactions = db.prepare('SELECT * FROM block_specific_transactions WHERE blockNumber = ? ORDER BY transactionIndex ASC').all(num);
    }
    sendSuccess(res, transactions);
  } catch (err) {
    sendError(res, err.message);
  }
});

// ===== TAGS =====
app.get('/api/v1/tags', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    let tags = [];
    if (tableExists('tag_tables')) {
      tags = db.prepare('SELECT * FROM tag_tables ORDER BY lastUpdated DESC').all();
    }
    sendSuccess(res, tags);
  } catch (err) {
    sendError(res, err.message);
  }
});

app.get('/api/v1/tags/:tagName', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    const tagName = req.params.tagName;
    let blocks = [];
    if (tableExists('tagged_blocks')) {
      blocks = db.prepare('SELECT * FROM tagged_blocks WHERE tagName = ?').all(tagName);
    }
    sendSuccess(res, blocks);
  } catch (err) {
    sendError(res, err.message);
  }
});

// ===== ETIQUETAS POR PRECIO =====
app.get('/api/v1/etiquetas-precio', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    let items = [];
    if (tableExists('etiquetas_por_precio')) {
      items = db.prepare('SELECT * FROM etiquetas_por_precio ORDER BY precio ASC').all();
    }
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
});

app.get('/api/v1/etiquetas-precio/:rango', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    let items = [];
    if (tableExists('etiquetas_por_precio')) {
      items = db.prepare('SELECT * FROM etiquetas_por_precio WHERE rangoPrecio = ?').all(req.params.rango);
    }
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
});

// ===== WALLET =====
app.post('/api/v1/wallet/connect', (req, res) => {
  sendSuccess(res, { connected: true, address: req.body.address || null });
});

app.get('/api/v1/wallet/:address/balance', (req, res) => {
  sendSuccess(res, { address: req.params.address, balance: 0, confirmed: 0, unconfirmed: 0 });
});

app.get('/api/v1/wallet/:address/utxos', (req, res) => {
  sendSuccess(res, { address: req.params.address, utxos: [] });
});

// ===== MIS ACTIVOS (Table 15) =====
app.get('/api/v1/bitmasowner/:address', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    const address = req.params.address;
    let inscriptions = [];
    if (tableExists('user_inscription_cache')) {
      inscriptions = db.prepare('SELECT * FROM user_inscription_cache WHERE walletAddress = ?').all(address);
    }
    sendSuccess(res, inscriptions);
  } catch (err) {
    sendError(res, err.message);
  }
});

// ===== PSBT =====
app.post('/api/v1/transaction/psbt', (req, res) => {
  sendSuccess(res, { psbt: null, message: 'PSBT creation requires wallet extension' });
});

app.post('/api/v1/transaction/psbt/sign', (req, res) => {
  sendSuccess(res, { signed: false, message: 'PSBT signing requires wallet extension' });
});

app.post('/api/v1/transaction/psbt/broadcast', (req, res) => {
  sendSuccess(res, { broadcast: false, message: 'PSBT broadcast requires wallet extension' });
});

// ===== DESCUENTOS =====
app.get('/api/v1/descuentos', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    let items = [];
    if (tableExists('etiquetas_por_precio')) {
      items = db.prepare('SELECT DISTINCT rangoPrecio, MIN(precio) as minPrecio, MAX(precio) as maxPrecio, COUNT(*) as total FROM etiquetas_por_precio GROUP BY rangoPrecio ORDER BY minPrecio ASC').all();
    }
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
});

// ===== UNIFIED =====
app.get('/api/v1/unified', (req, res) => {
  sendSuccess(res, { listings: [], total: 0 });
});

// ===== PROXY: ORDINALSWALLET =====
const ORDINALSWALLET_BASE = 'https://turbo.ordinalswallet.com';

app.get('/api/v1/proxy/ordinalswallet/listings', async (req, res) => {
  try {
    const response = await axios.get(ORDINALSWALLET_BASE + '/collection/bitmap/escrows', {
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    const data = response.data;
    const items = Array.isArray(data) ? data : (data.items || data.data || []);
    sendSuccess(res, items);
  } catch (err) {
    console.error('Ordinalswallet proxy error:', err.message);
    sendSuccess(res, []);
  }
});

app.get('/api/v1/proxy/ordinalswallet/sold', async (req, res) => {
  try {
    const response = await axios.get(ORDINALSWALLET_BASE + '/collection/bitmap/sold-escrows', {
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    const data = response.data;
    const items = Array.isArray(data) ? data : (data.items || data.data || []);
    sendSuccess(res, items);
  } catch (err) {
    console.error('Ordinalswallet sold proxy error:', err.message);
    sendSuccess(res, []);
  }
});

app.get('/api/v1/proxy/ordinalswallet/stats', async (req, res) => {
  try {
    const response = await axios.get(ORDINALSWALLET_BASE + '/collection/bitmap/stats', {
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    sendSuccess(res, response.data);
  } catch (err) {
    console.error('Ordinalswallet stats proxy error:', err.message);
    sendSuccess(res, { floor: 0, volume: 0, items: 0 });
  }
});

// ===== PROXY: UNISAT =====
const UNISAT_API_KEY = process.env.UNISAT_API_KEY || '';
const UNISAT_BASE = 'https://open-api.unisat.io';

app.post('/api/v1/proxy/unisat/actions', async (req, res) => {
  try {
    const payload = req.body || {};
    const headers = { 'Accept': 'application/json' };
    if (UNISAT_API_KEY) headers['Authorization'] = 'Bearer ' + UNISAT_API_KEY;

    const response = await axios.post(
      UNISAT_BASE + '/v3/market/collection/auction/actions',
      {
        collection: payload.collection || 'bitmap',
        events: payload.events || [],
        cursor: payload.cursor || 0,
        size: payload.size || 100
      },
      { timeout: 15000, headers: headers }
    );
    sendSuccess(res, response.data);
  } catch (err) {
    console.error('Unisat proxy error:', err.message);
    sendSuccess(res, []);
  }
});

app.get('/api/v1/proxy/unisat/listings', async (req, res) => {
  try {
    const headers = { 'Accept': 'application/json' };
    if (UNISAT_API_KEY) headers['Authorization'] = 'Bearer ' + UNISAT_API_KEY;

    const response = await axios.get(
      UNISAT_BASE + '/v3/market/collection/auction/actions?collection=bitmap&cursor=0&size=100',
      { timeout: 15000, headers: headers }
    );
    sendSuccess(res, response.data);
  } catch (err) {
    console.error('Unisat listings proxy error:', err.message);
    sendSuccess(res, []);
  }
});

// ===== SELECTOR (Table 14) =====
app.get('/api/v1/selector/previews', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    let items = [];
    if (tableExists('selector_previews')) {
      items = db.prepare('SELECT * FROM selector_previews ORDER BY bubbleType, sortOrder').all();
    }
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
});

app.get('/api/v1/selector/stats', (req, res) => {
  if (!db) return sendSuccess(res, []);
  try {
    let items = [];
    if (tableExists('selector_bubble_stats')) {
      items = db.prepare('SELECT * FROM selector_bubble_stats').all();
    }
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
});

// ===== DB INFO =====
app.get('/api/v1/db/tables', (req, res) => {
  const tables = getTableNames();
  sendSuccess(res, tables);
});

// ===== HEALTH =====
app.get('/api/v1/health', (req, res) => {
  sendSuccess(res, {
    status: 'ok',
    port: PORT,
    database: db ? 'connected' : 'not connected',
    tables: getTableNames()
  });
});

// ===== SPA CATCH-ALL =====
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('BitmapCore Web running on port ' + PORT);
  console.log('Database tables:', getTableNames().join(', ') || 'none');
});
