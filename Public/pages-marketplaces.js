function OrdinalswalletPage(props) {
  var navigate = props.navigate;
  var _a = React.useState([]);
  var listings = _a[0];
  var setListings = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];
  var _c = React.useState('');
  var searchQuery = _c[0];
  var setSearchQuery = _c[1];
  var _d = React.useState('price');
  var sortBy = _d[0];
  var setSortBy = _d[1];

  React.useEffect(function() {
    setIsLoading(true);
    MarketplaceApi.getOrdinalswallet().then(function(data) {
      var items = data.data || data || [];
      setListings(Array.isArray(items) ? items : []);
      setIsLoading(false);
    }).catch(function() { setIsLoading(false); });
  }, []);

  var filtered = listings
    .filter(function(l) { return !searchQuery || String(l.blockNumber || l.block || l.id || '').indexOf(searchQuery) !== -1; })
    .sort(function(a, b) {
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
      return (a.blockNumber || 0) - (b.blockNumber || 0);
    });

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:'Ordinalswallet', navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
        React.createElement('div', { className:'flex flex-col sm:flex-row gap-3' },
          React.createElement('input', {
            type:'text', value:searchQuery,
            onChange:function(e) { setSearchQuery(e.target.value); },
            placeholder:'Buscar por número de bloque...',
            className:'flex-1 bg-bitmap-surface border border-bitmap-border rounded-lg px-4 py-2.5 font-acme text-sm text-bitmap-text placeholder-bitmap-muted focus:outline-none focus:border-bitmap-orange'
          }),
          React.createElement('select', {
            value:sortBy,
            onChange:function(e) { setSortBy(e.target.value); },
            className:'bg-bitmap-surface border border-bitmap-border rounded-lg px-3 py-2.5 font-acme text-sm text-bitmap-text focus:outline-none'
          },
            React.createElement('option', { value:'price' }, 'Precio'),
            React.createElement('option', { value:'block' }, 'Bloque')
          )
        ),
        isLoading ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
        filtered.length === 0 ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('marketplace.noListings')) :
        React.createElement(MarketPreview, { listings:filtered, marketplace:'ordinalswallet' })
      )
    )
  );
}

function UnisatPage(props) {
  var navigate = props.navigate;
  var _a = React.useState([]);
  var listings = _a[0];
  var setListings = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];
  var _c = React.useState('');
  var searchQuery = _c[0];
  var setSearchQuery = _c[1];
  var _d = React.useState('price');
  var sortBy = _d[0];
  var setSortBy = _d[1];

  React.useEffect(function() {
    setIsLoading(true);
    MarketplaceApi.getUnisat().then(function(data) {
      var items = data.data || data || [];
      setListings(Array.isArray(items) ? items : []);
      setIsLoading(false);
    }).catch(function() { setIsLoading(false); });
  }, []);

  var filtered = listings
    .filter(function(l) { return !searchQuery || String(l.blockNumber || l.block || l.id || '').indexOf(searchQuery) !== -1; })
    .sort(function(a, b) {
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
      return (a.blockNumber || 0) - (b.blockNumber || 0);
    });

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:'Unisat', navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
        React.createElement('div', { className:'flex flex-col sm:flex-row gap-3' },
          React.createElement('input', {
            type:'text', value:searchQuery,
            onChange:function(e) { setSearchQuery(e.target.value); },
            placeholder:'Buscar por número de bloque...',
            className:'flex-1 bg-bitmap-surface border border-bitmap-border rounded-lg px-4 py-2.5 font-acme text-sm text-bitmap-text placeholder-bitmap-muted focus:outline-none focus:border-bitmap-orange'
          }),
          React.createElement('select', {
            value:sortBy,
            onChange:function(e) { setSortBy(e.target.value); },
            className:'bg-bitmap-surface border border-bitmap-border rounded-lg px-3 py-2.5 font-acme text-sm text-bitmap-text focus:outline-none'
          },
            React.createElement('option', { value:'price' }, 'Precio'),
            React.createElement('option', { value:'block' }, 'Bloque')
          )
        ),
        isLoading ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('app.loading')) :
        filtered.length === 0 ? React.createElement('div', { className:'text-center py-12 font-acme text-bitmap-muted' }, I18n.t('marketplace.noListings')) :
        React.createElement(MarketPreview, { listings:filtered, marketplace:'unisat' })
      )
    )
  );
}
