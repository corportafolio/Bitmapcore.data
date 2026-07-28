// CEREBRO 2: TagViewModel — Dueño de Etiquetas y Clasificacion
// REGLA: Este store NO accede a /api/v1/blocks/ directamente
// USA BlockViewModel.getBlock() para enriquecer datos de bloques

var TagViewModel = {
  _state: {
    allTags: [],              // Array de nombres: ["Palindrome", "Punk PERFECT", ...]
    tagCounts: {},            // { tagName: count }
    tagPreviews: {},          // { tagName: blockEntity } - primer bloque para Mondrian
    tagBlocksCache: {},       // { tagName: [blockNumbers] }
    isLoading: false,
    error: null
  },
  _listeners: new Set(),

  getState: function() {
    return Object.assign({}, this._state);
  },

  subscribe: function(fn) {
    this._listeners.add(fn);
    var self = this;
    return function() { self._listeners.delete(fn); };
  },

  _notify: function() {
    var state = this.getState();
    this._listeners.forEach(function(fn) { fn(state); });
  },

  _set: function(partial) {
    Object.assign(this._state, partial);
    this._notify();
  },

  // ===== METODOS PUBLICOS =====

  // Cargar todos los nombres de tags (55 tablas)
  loadAllTagNames: function() {
    var self = this;
    if (self._state.allTags.length > 0) {
      return Promise.resolve(self._state.allTags);
    }

    self._set({ isLoading: true });

    return ApiClient.get('/api/v1/tags', true)
      .then(function(res) {
        var tags = res.data || res;
        if (!Array.isArray(tags)) tags = [];

        // Extraer nombres de tags - el server devuelve tag_tables con tagName
        var names = tags.map(function(t) {
          return t.tagName || t.name || t;
        }).filter(function(n) { return n && n !== ''; });

        // Ordenar alfabeticamente
        names.sort();

        self._set({ allTags: names, isLoading: false });
        return names;
      })
      .catch(function(err) {
        self._set({ isLoading: false, error: err.message });
        return [];
      });
  },

  // Cargar conteos de todas las tags
  loadTagCounts: function() {
    var self = this;
    if (Object.keys(self._state.tagCounts).length > 0) {
      return Promise.resolve(self._state.tagCounts);
    }

    return ApiClient.get('/api/v1/tags', true)
      .then(function(res) {
        var tags = res.data || res;
        if (!Array.isArray(tags)) tags = [];

        var counts = {};
        tags.forEach(function(t) {
          if (t.tagName && t.count !== undefined) {
            counts[t.tagName] = parseInt(t.count);
          }
        });

        self._set({ tagCounts: counts });
        return counts;
      })
      .catch(function() { return {}; });
  },

  // Cargar preview (primer bloque) de un tag para Mondrian
  loadTagPreview: function(tagName) {
    var self = this;
    if (self._state.tagPreviews[tagName]) {
      return Promise.resolve(self._state.tagPreviews[tagName]);
    }

    return ApiClient.get('/api/v1/tags/' + encodeURIComponent(tagName) + '?limit=1', true)
      .then(function(res) {
        var blocks = res.data || res;
        if (!Array.isArray(blocks)) blocks = [];

        var preview = null;
        if (blocks.length > 0) {
          var block = blocks[0];
          if (block.bloque !== undefined) {
            block.blockNumber = block.bloque;
            block.txCount = block.totalTransacciones;
            preview = block;
          }
        }

        if (preview) {
          var newPreviews = Object.assign({}, self._state.tagPreviews);
          newPreviews[tagName] = preview;
          self._set({ tagPreviews: newPreviews });
        }
        return preview;
      })
      .catch(function() { return null; });
  },

  // Cargar lista completa de numeros de bloque de un tag (paginado)
  loadTagBlocks: function(tagName, page, limit) {
    var self = this;
    page = page || 1;
    limit = limit || 50;
    var offset = (page - 1) * limit;

    var cacheKey = tagName + '_page' + page;
    if (self._state.tagBlocksCache[cacheKey]) {
      return Promise.resolve(self._state.tagBlocksCache[cacheKey]);
    }

    return ApiClient.get('/api/v1/tags/' + encodeURIComponent(tagName) + '?limit=' + limit + '&offset=' + offset, true)
      .then(function(res) {
        var blocks = res.data || res;
        if (!Array.isArray(blocks)) blocks = [];

        var blockNumbers = blocks.map(function(b) {
          return b.bloque || b.blockNumber;
        }).filter(function(n) { return n !== undefined && n !== null; });

        var newCache = Object.assign({}, self._state.tagBlocksCache);
        newCache[cacheKey] = blockNumbers;
        self._set({ tagBlocksCache: newCache });
        return blockNumbers;
      })
      .catch(function() { return []; });
  },

  // Obtener conteo de un tag
  getTagCount: function(tagName) {
    var count = this._state.tagCounts[tagName];
    if (count !== undefined) return Promise.resolve(count);

    return this.loadTagCounts().then(function() {
      return this._state.tagCounts[tagName] || 0;
    }.bind(this));
  },

  // Buscar tags por nombre (filtro local)
  searchTags: function(query) {
    var self = this;
    if (!query || !query.trim()) return Promise.resolve(self._state.allTags);

    var q = query.toLowerCase();
    return Promise.resolve(self._state.allTags.filter(function(tag) {
      return tag.toLowerCase().indexOf(q) !== -1;
    }));
  },

  // Cargar tags con previews (para PantallaDeTablas)
  loadTagsWithPreviews: function() {
    var self = this;
    return self.loadAllTagNames().then(function(names) {
      var promises = names.map(function(name) {
        return self.loadTagPreview(name).then(function(preview) {
          return { name: name, preview: preview, count: self._state.tagCounts[name] || 0 };
        });
      });
      return Promise.all(promises);
    });
  },

  // Invalidar cache
  invalidateCache: function() {
    this._set({
      allTags: [],
      tagCounts: {},
      tagPreviews: {},
      tagBlocksCache: {}
    });
  }
};