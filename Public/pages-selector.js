function SelectorScreenPage(props) {
  var navigate = props.navigate;
  var _loading = React.useState(true);
  var isLoading = _loading[0];
  var setIsLoading = _loading[1];

  var marketplaces = [
    { id:'ordinalswallet', label:'ORDINALSWALLET', path:'/ordinalswallet', logo:'ordinalswallet_logo.png' },
    { id:'unisat', label:'UNISAT', path:'/unisat', logo:'unisat_logo.png' },
    { id:'local', label:'BITMAPCORE', path:'/local', logo:'logo_bitmapcore.png' },
    { id:'discounts', label:'DESCUENTOS', path:'/discounts', icon:'\uD83D\uDFE2' },
    { id:'unified', label:'UNIFIED', path:'/unified', icon:'\uD83D\uDD35' },
    { id:'tags', label:'ETIQUETAS POR PRECIO', path:'/tag-tables', icon:'\uD83C\uDFF7\uFE0F' },
    { id:'sales', label:'VENTAS', path:'/sales', icon:'\uD83D\uDCB0' }
  ];

  React.useEffect(function() {
    setIsLoading(true);
    SelectorScreenViewModel.loadAllMarketplaces();
    var timer = setTimeout(function() { setIsLoading(false); }, 1500);
    return function() { clearTimeout(timer); };
  }, []);

  return React.createElement('div', { className:'flex flex-col h-full' },
    React.createElement('header', { className:'flex items-center h-14 bg-bitmap-orange px-4 z-30' },
      React.createElement('button', {
        onClick: function() { navigate('/'); },
        className:'font-alfaslab text-black text-sm hover:text-black/70 transition-colors mr-3'
      }, '\u2190 Volver'),
      React.createElement('span', { className:'font-alfaslab text-black text-lg' }, 'Marketplaces'),
      React.createElement('div', { className:'flex-1' }),
      React.createElement('img', { src:'logo_bitmapcore.png', alt:'BitmapCore', className:'h-8 w-8 object-contain' })
    ),
    isLoading ? React.createElement('div', { className:'flex-1 flex items-center justify-center' },
      React.createElement('p', { className:'font-acme text-bitmap-muted' }, I18n.t ? I18n.t('app.loading') : 'Cargando...')
    ) :
    React.createElement('main', { className:'flex-1 overflow-y-auto p-3 space-y-2' },
      marketplaces.map(function(mp) {
        var data = SelectorScreenViewModel.getMarketplaceData(mp.id);
        return React.createElement(SelectorBubble, {
          key: mp.id,
          name: mp.label,
          logo: mp.logo,
          icon: mp.icon,
          listings: data.listings,
          floorPrice: data.floorPrice,
          sold: data.sold,
          previews: data.previews,
          onClick: function() { navigate(mp.path); }
        });
      })
    )
  );
}
