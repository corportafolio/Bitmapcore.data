var MondrianGenerator = {
  generate: function(canvas, blockNumber, transactions, size) {
    size = size || 320;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    var colors = BitmapConstants.COLORS.mondrian;
    var txCount = (transactions && transactions.length) || 0;
    if (txCount === 0) txCount = Math.abs(blockNumber % 50) + 1;
    var rects = MondrianGenerator.calculateLayout(txCount, size);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      ctx.fillStyle = colors[(blockNumber + i) % colors.length];
      if (ctx.fillStyle === '#000000') ctx.fillStyle = colors[(blockNumber + i + 1) % colors.length];
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  },
  calculateLayout: function(txCount, size) {
    var rects = [];
    var padding = 4;
    var avail = size - padding * 2;
    if (txCount <= 2) {
      for (var i = 0; i < txCount; i++) {
        rects.push({ x: padding + (i * avail / txCount), y: padding, w: avail / txCount - 2, h: avail });
      }
    } else if (txCount <= 6) {
      var cols = Math.ceil(Math.sqrt(txCount));
      var rows = Math.ceil(txCount / cols);
      var cw = avail / cols;
      var ch = avail / rows;
      for (var i = 0; i < txCount; i++) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        rects.push({ x: padding + col * cw + 1, y: padding + row * ch + 1, w: cw - 2, h: ch - 2 });
      }
    } else {
      var grid = Math.ceil(Math.sqrt(txCount));
      var cellSize = avail / grid;
      for (var i = 0; i < Math.min(txCount, grid * grid); i++) {
        var col = i % grid;
        var row = Math.floor(i / grid);
        rects.push({ x: padding + col * cellSize + 1, y: padding + row * cellSize + 1, w: cellSize - 2, h: cellSize - 2 });
      }
    }
    return rects;
  }
};

var TagClassifier = {
  classify: function(blockNumber) {
    var n = blockNumber;
    if (n % 10000 === 0) return 'Pumpkin';
    if (n % 7777 === 0) return 'Diamond';
    if (n % 5555 === 0) return 'Gold';
    if (n % 3333 === 0) return 'Ruby';
    if (n % 2222 === 0) return 'Emerald';
    if (n % 1111 === 0) return 'Sapphire';
    if (n % 1000 === 0) return 'Silver';
    if (n % 500 === 0) return 'Bronze';
    if (n % 250 === 0) return 'Platinum';
    if (n % 100 === 0) return 'Jade';
    return null;
  },
  getBlocksByTag: function(tag, maxResults) {
    maxResults = maxResults || 20;
    var results = [];
    var multiplier = { Pumpkin:10000, Diamond:7777, Gold:5555, Ruby:3333, Emerald:2222, Sapphire:1111, Silver:1000, Bronze:500, Platinum:250, Jade:100 };
    var m = multiplier[tag];
    if (!m) return results;
    for (var i = 1; i <= maxResults; i++) {
      results.push({ blockNumber: m * i, tag: tag, price: 0.001 * i });
    }
    return results;
  }
};

var ImageProcessor = {
  createThumbnail: function(blockNumber, size) {
    var canvas = document.createElement('canvas');
    MondrianGenerator.generate(canvas, blockNumber, [], size || 150);
    return canvas.toDataURL();
  },
  loadImage: function(url, callback) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { callback(null, img); };
    img.onerror = function() { callback(new Error('Failed to load image')); };
    img.src = url;
  }
};

var PollingManager = {
  intervals: {},
  start: function(key, interval, callback) {
    PollingManager.stop(key);
    PollingManager.intervals[key] = window.setInterval(function() {
      if (document.hidden) return;
      callback();
    }, interval || BitmapConstants.POLLING_INTERVAL);
  },
  stop: function(key) {
    if (PollingManager.intervals[key]) {
      clearInterval(PollingManager.intervals[key]);
      delete PollingManager.intervals[key];
    }
  },
  stopAll: function() {
    var keys = Object.keys(PollingManager.intervals);
    for (var i = 0; i < keys.length; i++) {
      PollingManager.stop(keys[i]);
    }
  }
};

var IndexedDBCache = {
  open: function(dbName, version, storeName) {
    return new Promise(function(resolve, reject) {
      var request = indexedDB.open(dbName, version || 1);
      request.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(storeName || 'data')) {
          db.createObjectStore(storeName || 'data');
        }
      };
      request.onsuccess = function(e) { resolve(e.target.result); };
      request.onerror = function(e) { reject(e.target.error); };
    });
  },
  save: function(dbName, key, value) {
    return IndexedDBCache.open(dbName).then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction('data', 'readwrite');
        tx.objectStore('data').put(value, key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function(e) { reject(e.target.error); };
      });
    });
  },
  load: function(dbName, key) {
    return IndexedDBCache.open(dbName).then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction('data', 'readonly');
        var req = tx.objectStore('data').get(key);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }
};

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    PollingManager.stopAll();
  }
});
