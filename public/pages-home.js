function HomePage(props) {
  var navigate = props.navigate;
  var _a = React.useState(false);
  var sidebarOpen = _a[0];
  var setSidebarOpen = _a[1];
  var _b = React.useState('');
  var searchQuery = _b[0];
  var setSearchQuery = _b[1];
  var _c = React.useState([]);
  var searchResults = _c[0];
  var setSearchResults = _c[1];
  var _d = React.useState(false);
  var isSearching = _d[0];
  var setIsSearching = _d[1];
  var _e = React.useState([]);
  var tags = _e[0];
  var setTags = _e[1];
  var _f = React.useState(true);
  var tagsLoading = _f[0];
  var setTagsLoading = _f[1];

  var debounceTimer = null;

  React.useEffect(function() {
    TagViewModel.loadTagsWithPreviews().then(function(data) {
      setTags(data);
      setTagsLoading(false);
    }).catch(function() {
      setTagsLoading(false);
    });
  }, []);

  var handleSearch = function(query) {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      setIsSearching(true);
      var results = [];
      var num = parseInt(query);
      if (!isNaN(num)) {
        results.push({ type:'block', id:num, label:'Block #' + num });
      } else {
        results.push({ type:'tag', id:query, label:query });
        var tagBlocks = TagClassifier.getBlocksByTag(query, 3);
        for (var i = 0; i < tagBlocks.length; i++) {
          results.push({ type:'block', id:tagBlocks[i].blockNumber, label:'Block #' + tagBlocks[i].blockNumber });
        }
      }
      setSearchResults(results.slice(0, 4));
      setIsSearching(false);
    }, 300);
  };

  var handleResultClick = function(result) {
    setSidebarOpen(false);
    if (result.type === 'block') navigate('/blocks/' + result.id);
    else navigate('/tags/' + result.id);
  };

  var filteredTags = tags.filter(function(t) {
    return t.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 || searchQuery === '';
  });

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { onMenuToggle:function() { setSidebarOpen(!sidebarOpen); }, navigate:navigate }),
    React.createElement('div', { className:'flex flex-1 overflow-hidden' },
      React.createElement(Sidebar, { isOpen:sidebarOpen, onClose:function() { setSidebarOpen(false); }, navigate:navigate, currentPath:'/' }),
      React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
        React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
          React.createElement('div', { className:'bg-bitmap-surface border border-bitmap-border rounded-xl p-4' },
            React.createElement('div', { className:'flex items-center gap-2' },
              React.createElement('span', { className:'text-lg' }, '\uD83D\uDD0D'),
              React.createElement('input', {
                type:'text',
                value:searchQuery,
                onChange:function(e) { handleSearch(e.target.value); },
                placeholder:'Buscar bloque o etiqueta...',
                className:'flex-1 bg-bitmap-black border border-bitmap-border rounded-lg px-3 py-2 font-acme text-sm text-bitmap-text placeholder-bitmap-muted focus:outline-none focus:border-bitmap-orange transition-colors h-10'
              })
            ),
            isSearching ? React.createElement('div', { className:'mt-2 font-acme text-xs text-bitmap-muted' }, I18n.t('app.loading')) : null
          ),
          searchResults.length > 0 ? React.createElement('div', { className:'grid grid-cols-2 md:grid-cols-4 gap-3' },
            searchResults.map(function(result, i) {
              return React.createElement(ResultCard, {
                key: result.type + '-' + result.id + '-' + i,
                type: result.type,
                id: result.id,
                label: result.label,
                price: result.price,
                onClick: function() { handleResultClick(result); }
              });
            })
          ) : null,
          searchQuery && searchResults.length === 0 && !isSearching ? React.createElement('div', { className:'text-center py-8 font-acme text-bitmap-muted' }, I18n.t('app.noResults')) : null,
          tagsLoading ? React.createElement('div', { className:'flex items-center justify-center h-32 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
          React.createElement('div', { className:'space-y-2' },
            React.createElement('h2', { className:'font-alfaslab text-lg text-white' }, 'Tablas de Etiquetas'),
            React.createElement('div', { className:'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' },
              filteredTags.map(function(tag, i) {
                return React.createElement(TagPreviewCard, {
                  key: tag.name + '-' + i,
                  tag: tag,
                  onClick: function() { navigate('/tag-tables/' + encodeURIComponent(tag.name)); }
                });
              })
            )
          )
        )
      )
    )
  );
}

function MarketplaceSelectorPage(props) {
  var navigate = props.navigate;

  var ow = StoreMarketplaces.get('ordinalswallet');
  var un = StoreMarketplaces.get('unisat');
  var lo = StoreMarketplaces.get('local');
  var un2 = StoreMarketplaces.get('unified');
  var ta = StoreMarketplaces.get('tags');
  var sa = StoreMarketplaces.get('sales');
  var de = StoreMarketplaces.get('descuentos');

  React.useEffect(function() {
    StoreMarketplaces.fetchOrdinalswallet();
    StoreMarketplaces.fetchUnisat();
    StoreMarketplaces.fetchLocal();
    StoreMarketplaces.fetchUnified();
    StoreMarketplaces.fetchTags();
    StoreMarketplaces.fetchSales();
    StoreMarketplaces.fetchDescuentos();
  }, []);

  var marketplaces = [
    { id:'ordinalswallet', label:'Ordinalswallet', icon:'\uD83D\uDFE7', path:'/ordinalswallet' },
    { id:'unisat', label:'Unisat', icon:'\uD83D\uDFE1', path:'/unisat' },
    { id:'local', label:'BitmapCore', icon:'\uD83D\uDFE0', path:'/local' },
    { id:'discounts', label:'Descuentos', icon:'\uD83D\uDFE2', path:'/discounts', isDiscount:true },
    { id:'unified', label:'Unified', icon:'\uD83D\uDD35', path:'/unified' },
    { id:'tags', label:'Etiquetas', icon:'\uD83C\uDFF7\uFE0F', path:'/tag-tables' },
    { id:'sales', label:'Ventas', icon:'\uD83D\uDCB0', path:'/sales' }
  ];

  var getData = function(id) {
    switch (id) {
      case 'ordinalswallet': return { listings:ow.listings.length, floor:ow.floorPrice, sold:ow.soldCount };
      case 'unisat': return { listings:un.listings.length, floor:un.floorPrice, sold:un.soldCount };
      case 'local': return { listings:lo.listings.length, floor:lo.floorPrice, sold:lo.soldCount };
      case 'unified': return { listings:un2.allListings.length, floor:0, sold:0 };
      case 'tags': return { listings:ta.tags.length, floor:0, sold:0 };
      case 'sales': return { listings:sa.sales.length, floor:0, sold:sa.totalSold };
      case 'discounts': return { listings:de.discounts.length, floor:0, sold:0 };
      default: return { listings:0, floor:0, sold:0 };
    }
  };

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { title:I18n.t('marketplace.title'), navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-3xl mx-auto space-y-3' },
        React.createElement('h2', { className:'font-alfaslab text-xl text-white mb-4' }, I18n.t('marketplace.selectMarketplace')),
        marketplaces.map(function(mp) {
          var data = getData(mp.id);
          return React.createElement(MarketplaceBubble, {
            key: mp.id,
            name: mp.label,
            icon: mp.icon,
            listings: data.listings,
            floorPrice: data.floor,
            sold: data.sold,
            isDiscount: mp.isDiscount,
            onSelect: function() { navigate(mp.path); }
          });
        })
      )
    )
  );
}
