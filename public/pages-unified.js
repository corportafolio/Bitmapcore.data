function UnifiedPage(props) {
  var navigate = props.navigate;
  var _a = React.useState([]);
  var allListings = _a[0];
  var setAllListings = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];
  var _c = React.useState('');
  var searchQuery = _c[0];
  var setSearchQuery = _c[1];

  React.useEffect(function() {
    setIsLoading(true);
    MarketplaceApi.getUnified().then(function(data) {
      var items = data.data || data || [];
      setAllListings(Array.isArray(items) ? items : []);
      setIsLoading(false);
    }).catch(function() { setIsLoading(false); });
  }, []);

  var filtered = allListings.filter(function(l) {
    return !searchQuery || String(l.blockNumber || l.block || l.id || '').indexOf(searchQuery) !== -1;
  });

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:I18n.t('unified.title'), navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
        React.createElement('h2', { className:'font-alfaslab text-xl text-white' }, I18n.t('unified.subtitle')),
        React.createElement('input', {
          type:'text', value:searchQuery,
          onChange:function(e) { setSearchQuery(e.target.value); },
          placeholder:'Buscar...',
          className:'w-full bg-bitmap-surface border border-bitmap-border rounded-lg px-4 py-2.5 font-acme text-sm text-bitmap-text placeholder-bitmap-muted focus:outline-none focus:border-bitmap-orange'
        }),
        isLoading ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
        filtered.length === 0 ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('unified.noListings')) :
        React.createElement(MarketPreview, { listings:filtered, marketplace:'unified' })
      )
    )
  );
}

function TagTablesPage(props) {
  var navigate = props.navigate;
  var _a = React.useState([]);
  var tags = _a[0];
  var setTags = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];

  React.useEffect(function() {
    setIsLoading(true);
    MarketplaceApi.getTags().then(function(data) {
      var items = data.data || data || [];
      setTags(Array.isArray(items) ? items : []);
      setIsLoading(false);
    }).catch(function() { setIsLoading(false); });
  }, []);

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:I18n.t('tags.title'), navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-3xl mx-auto space-y-3' },
        React.createElement('h2', { className:'font-alfaslab text-xl text-white mb-4' }, I18n.t('tags.subtitle')),
        isLoading ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
        tags.length === 0 ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, 'No hay etiquetas disponibles') :
        tags.map(function(tag, i) {
          return React.createElement(TagGroupCard, {
            key:i,
            tag: tag.name || tag.tag || '',
            count: tag.count || 0,
            floorPrice: tag.floorPrice || 0,
            onSelect: function() { navigate('/tag-tables/' + encodeURIComponent(tag.name || tag.tag || '')); }
          });
        })
      )
    )
  );
}

function TagGroupsPage(props) {
  var navigate = props.navigate;
  var tagName = props.tagName;
  var _a = React.useState([]);
  var tagBlocks = _a[0];
  var setTagBlocks = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];

  React.useEffect(function() {
    if (tagName) {
      setIsLoading(true);
      MarketplaceApi.getTagBlocks(tagName).then(function(data) {
        var items = data.data || data || [];
        setTagBlocks(Array.isArray(items) ? items : []);
        setIsLoading(false);
      }).catch(function() { setIsLoading(false); });
    }
  }, [tagName]);

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:'Etiqueta: ' + tagName, navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
        React.createElement('h2', { className:'font-alfaslab text-xl text-white' }, 'Bloques con etiqueta: ' + tagName),
        isLoading ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
        tagBlocks.length === 0 ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('tags.noBlocks')) :
        React.createElement('div', { className:'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' },
          tagBlocks.map(function(block, i) {
            return React.createElement('button', {
              key:i,
              onClick:function() { navigate('/blocks/' + (block.blockNumber || block.id || i)); },
              className:'bg-bitmap-surface border border-bitmap-border rounded-xl p-3 text-center hover:border-bitmap-orange transition-all'
            },
              React.createElement('div', { className:'w-full aspect-square mb-2 rounded-lg overflow-hidden bg-bitmap-black flex items-center justify-center' },
                React.createElement(MondrianCanvas, { blockNumber:block.blockNumber || i, transactions:[], size:150 })
              ),
              React.createElement('div', { className:'font-alfaslab text-xs text-white' }, '#' + (block.blockNumber || i)),
              block.price ? React.createElement('div', { className:'font-acme text-[10px] text-bitmap-orange-light' }, BitmapUtils.formatBtc(block.price) + ' BTC') : null
            );
          })
        )
      )
    )
  );
}

function VentasPage(props) {
  var navigate = props.navigate;
  var _a = React.useState([]);
  var sales = _a[0];
  var setSales = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];

  React.useEffect(function() {
    setIsLoading(true);
    MarketplaceApi.getSales().then(function(data) {
      var items = data.data || data || [];
      setSales(Array.isArray(items) ? items : []);
      setIsLoading(false);
    }).catch(function() { setIsLoading(false); });
  }, []);

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:I18n.t('sales.title'), navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
        React.createElement('h2', { className:'font-alfaslab text-xl text-white' }, I18n.t('sales.title')),
        isLoading ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
        sales.length === 0 ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('sales.noSales')) :
        React.createElement('div', { className:'space-y-2' },
          sales.map(function(sale, i) {
            return React.createElement(SaleCard, {
              key:i,
              blockNumber: sale.blockNumber || i,
              price: sale.price || 0,
              date: sale.date || sale.saleDate || '',
              marketplace: sale.marketplace || sale.source || '',
              image: sale.image || ''
            });
          })
        )
      )
    )
  );
}
