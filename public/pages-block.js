function BlockDetailPage(props) {
  var navigate = props.navigate;
  var blockId = props.blockId;
  var _a = React.useState(null);
  var currentBlock = _a[0];
  var setCurrentBlock = _a[1];
  var _b = React.useState(true);
  var isLoading = _b[0];
  var setIsLoading = _b[1];

  React.useEffect(function() {
    if (!blockId) return;
    setIsLoading(true);
    BlockchainApi.getBlock(blockId).then(function(data) {
      setCurrentBlock(data.data || data);
      setIsLoading(false);
    }).catch(function() { setIsLoading(false); });
  }, [blockId]);

  if (isLoading) {
    return React.createElement('div', { className:'flex flex-col h-full' },
      React.createElement(HeaderBar, { showBackButton:true, title:'Bloque', navigate:navigate }),
      React.createElement('main', { className:'flex-1 flex items-center justify-center font-acme text-bitmap-muted' }, I18n.t('app.loading'))
    );
  }

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:'Block #' + blockId, navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-2xl mx-auto space-y-6' },
        React.createElement('div', { className:'flex justify-center' },
          React.createElement(MondrianCanvas, { blockNumber:Number(blockId), transactions:currentBlock ? (currentBlock.transactions || []) : [], size:320 })
        ),
        React.createElement('div', { className:'bg-bitmap-surface border border-bitmap-border rounded-xl p-4 space-y-3' },
          React.createElement('div', { className:'flex justify-between' },
            React.createElement('span', { className:'font-alfaslab text-sm text-bitmap-muted' }, I18n.t('block.bitmap')),
            React.createElement('span', { className:'font-acme text-sm text-white' }, '#' + blockId)
          ),
          React.createElement('div', { className:'flex justify-between' },
            React.createElement('span', { className:'font-alfaslab text-sm text-bitmap-muted' }, I18n.t('block.transactions')),
            React.createElement('span', { className:'font-acme text-sm text-white' }, (currentBlock && currentBlock.txCount) || 'N/A')
          ),
          React.createElement('div', { className:'flex justify-between' },
            React.createElement('span', { className:'font-alfaslab text-sm text-bitmap-muted' }, I18n.t('block.size')),
            React.createElement('span', { className:'font-acme text-sm text-white' }, (currentBlock && currentBlock.size) || 'N/A', ' bytes')
          ),
          React.createElement('div', { className:'flex justify-between' },
            React.createElement('span', { className:'font-alfaslab text-sm text-bitmap-muted' }, I18n.t('block.date')),
            React.createElement('span', { className:'font-acme text-sm text-white' }, (currentBlock && currentBlock.date) || 'N/A')
          )
        ),
        React.createElement('button', {
          onClick:function() { navigate('/mondrian/' + blockId); },
          className:'w-full py-3 bg-bitmap-orange text-white font-alfaslab text-sm rounded-lg hover:bg-bitmap-orange/80 transition-colors'
        }, I18n.t('block.viewMondrian'))
      )
    )
  );
}

function MondrianPreviewPage(props) {
  var navigate = props.navigate;
  var blockId = props.blockId;

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:'Mondrian #' + blockId, navigate:navigate }),
    React.createElement('main', { className:'flex-1 flex items-center justify-center p-4' },
      React.createElement(MondrianCanvas, { blockNumber:Number(blockId), transactions:[], size:500 })
    )
  );
}

function BlockSearchPage(props) {
  var navigate = props.navigate;
  var _a = React.useState('');
  var query = _a[0];
  var setQuery = _a[1];
  var _b = React.useState([]);
  var results = _b[0];
  var setResults = _b[1];
  var _c = React.useState(false);
  var isSearching = _c[0];
  var setIsSearching = _c[1];

  var handleSearch = function(value) {
    setQuery(value);
    if (!value.trim()) { setResults([]); return; }
    setIsSearching(true);
    var num = parseInt(value);
    var r = [];
    if (!isNaN(num)) {
      for (var i = 0; i < 8; i++) r.push({ blockNumber:num + i, label:'Block #' + (num + i) });
    } else {
      r.push({ blockNumber:1, label:value });
      r.push({ blockNumber:2, label:value });
    }
    setResults(r);
    setIsSearching(false);
  };

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement(HeaderBar, { showBackButton:true, title:I18n.t('search.title'), navigate:navigate }),
    React.createElement('main', { className:'flex-1 overflow-y-auto p-4 lg:p-6' },
      React.createElement('div', { className:'max-w-4xl mx-auto space-y-4' },
        React.createElement('input', {
          type:'text', value:query,
          onChange:function(e) { handleSearch(e.target.value); },
          placeholder:I18n.t('search.placeholder'),
          className:'w-full bg-bitmap-surface border border-bitmap-border rounded-lg px-4 py-3 font-acme text-sm text-bitmap-text placeholder-bitmap-muted focus:outline-none focus:border-bitmap-orange',
          autoFocus:true
        }),
        isSearching ? React.createElement('div', { className:'text-center font-acme text-sm text-bitmap-muted' }, I18n.t('search.searching')) : null,
        results.length > 0 ? React.createElement('div', { className:'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' },
          results.map(function(r, i) {
            return React.createElement('button', {
              key:i,
              onClick:function() { navigate('/blocks/' + r.blockNumber); },
              className:'bg-bitmap-surface border border-bitmap-border rounded-xl p-3 hover:border-bitmap-orange transition-all text-left'
            },
              React.createElement('div', { className:'w-full aspect-square mb-2 rounded-lg overflow-hidden bg-bitmap-black' },
                React.createElement(MondrianCanvas, { blockNumber:r.blockNumber, transactions:[], size:150 })
              ),
              React.createElement('div', { className:'font-alfaslab text-xs text-white' }, r.label)
            );
          })
        ) : null
      )
    )
  );
}


