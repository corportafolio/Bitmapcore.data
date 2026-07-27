var Header = React.createElement;

function HeaderBar(props) {
  var onMenuToggle = props.onMenuToggle;
  var showBackButton = props.showBackButton;
  var title = props.title;
  var navigate = props.navigate;
  var walletState = StoreApp.get('wallet');

  return React.createElement('header', { className:'flex items-center justify-between h-14 bg-bitmap-surface border-b border-bitmap-border px-4 sm:px-6 z-30 relative' },
    showBackButton ? React.createElement('button', {
      onClick: function() { if (navigate) navigate(-1); },
      className:'font-alfaslab text-bitmap-orange text-sm hover:text-bitmap-orange-light transition-colors mr-2'
    }, '\u2190 Volver') : null,
    !showBackButton && onMenuToggle ? React.createElement('button', {
      onClick: onMenuToggle,
      className:'font-alfaslab text-white text-xl mr-2 lg:hidden'
    }, '\u2261') : null,
    !showBackButton ? React.createElement('span', { className:'font-howdybun text-bitmap-orange text-lg tracking-wide' }, 'Bitmapcore') : null,
    title ? React.createElement('span', { className: showBackButton ? 'font-alfaslab text-white text-lg flex-1 text-center' : 'font-alfaslab text-white text-lg flex-1' }, title) : null,
    !showBackButton ? React.createElement('div', { className:'flex items-center gap-3' },
      React.createElement('span', { className:'font-acme text-xs text-bitmap-muted hidden sm:block' }, 'BTC/USDT $XX,XXX.XX'),
      React.createElement('button', { className:'relative text-xl' }, '\uD83D\uDD14',
        React.createElement('span', { className:'absolute -top-1 -right-1 w-4 h-4 bg-bitmap-red rounded-full text-[10px] text-white flex items-center justify-center font-acme' }, '0')
      )
    ) : null,
    showBackButton && !title ? React.createElement('div', { className:'flex-1' }) : null,
    React.createElement('button', {
      onClick: function() { walletState.isConnected ? navigate && navigate('/wallet/dashboard') : navigate && navigate('/wallet'); },
      className:'font-acme text-xs text-bitmap-orange hover:text-bitmap-orange-light transition-colors'
    }, walletState.isConnected ? BitmapUtils.truncateAddress(walletState.address, 4) : 'Wallet')
  );
}

function Sidebar(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var navigate = props.navigate;
  var currentPath = props.currentPath;

  var marketplaces = [
    { id:'ordinalswallet', label:'Ordinalswallet', icon:'\uD83D\uDFE7', path:'/ordinalswallet' },
    { id:'unisat', label:'Unisat', icon:'\uD83D\uDFE1', path:'/unisat' },
    { id:'local', label:'BitmapCore', icon:'\uD83D\uDFE0', path:'/local' },
    { id:'discounts', label:'Descuentos', icon:'\uD83D\uDFE2', path:'/discounts' },
    { id:'unified', label:'Unified', icon:'\uD83D\uDD35', path:'/unified' },
    { id:'tags', label:'Etiquetas', icon:'\uD83C\uDFF7\uFE0F', path:'/tag-tables' },
    { id:'sales', label:'Ventas', icon:'\uD83D\uDCB0', path:'/sales' }
  ];

  var overlay = isOpen ? React.createElement('div', {
    className:'fixed inset-0 bg-bitmap-black/50 z-40 lg:hidden',
    onClick: onClose
  }) : null;

  var sidebar = React.createElement('aside', {
    className: 'fixed top-14 left-0 bottom-0 w-60 bg-bitmap-surface border-r border-bitmap-border z-50 transform transition-transform duration-200 ' + (isOpen ? 'translate-x-0' : '-translate-x-full') + ' lg:translate-x-0 lg:relative lg:top-0 lg:z-0 overflow-y-auto'
  },
    React.createElement('nav', { className:'py-2' },
      marketplaces.map(function(mp) {
        var isActive = currentPath === mp.path;
        return React.createElement('button', {
          key: mp.id,
          onClick: function() { navigate(mp.path); onClose(); },
          className: 'flex items-center gap-3 w-full px-4 py-3 text-left transition-all ' + (isActive ? 'border-l-4 border-bitmap-orange bg-bitmap-black/30' : 'border-l-4 border-transparent hover:bg-bitmap-black/20')
        },
          React.createElement('span', { className:'text-lg' }, mp.icon),
          React.createElement('span', { className:'font-alfaslab text-sm ' + (isActive ? 'text-bitmap-orange' : 'text-bitmap-text') }, mp.label)
        );
      })
    )
  );

  return React.createElement(React.Fragment, null, overlay, sidebar);
}

function LoadingSpinner() {
  return React.createElement('div', { className:'flex items-center justify-center h-full' },
    React.createElement('div', { className:'w-8 h-8 border-2 border-bitmap-orange border-t-transparent rounded-full animate-spin' })
  );
}

function Toast(props) {
  var message = props.message;
  var type = props.type;
  var onDone = props.onDone;

  React.useEffect(function() {
    var timer = setTimeout(onDone, 3000);
    return function() { clearTimeout(timer); };
  }, []);

  var bgClass = type === 'error' ? 'bg-bitmap-red' : type === 'success' ? 'bg-bitmap-green' : 'bg-bitmap-orange';
  return React.createElement('div', { className:'fixed bottom-4 right-4 z-50 ' + bgClass + ' text-white px-4 py-3 rounded-lg font-acme text-sm shadow-lg' },
    React.createElement('div', { className:'flex items-center gap-2' },
      React.createElement('span', null, message),
      React.createElement('button', { onClick:onDone, className:'ml-2 opacity-70 hover:opacity-100' }, '\u2715')
    )
  );
}

function Modal(props) {
  if (!props.isOpen) return null;
  return React.createElement('div', { className:'fixed inset-0 bg-bitmap-black/50 flex items-center justify-center z-50' },
    React.createElement('div', { className:'bg-bitmap-surface border border-bitmap-border rounded-xl p-6 max-w-md w-full mx-4' },
      props.title ? React.createElement('h3', { className:'font-alfaslab text-lg text-white mb-4' }, props.title) : null,
      props.children,
      React.createElement('div', { className:'flex justify-end gap-3 mt-4' },
        props.onCancel ? React.createElement('button', { onClick:props.onCancel, className:'px-4 py-2 font-alfaslab text-sm text-bitmap-muted hover:text-white transition-colors' }, I18n.t('app.cancel')) : null,
        props.onConfirm ? React.createElement('button', { onClick:props.onConfirm, className:'px-4 py-2 bg-bitmap-orange text-white font-alfaslab text-sm rounded-lg hover:bg-bitmap-orange/80 transition-colors' }, I18n.t('app.confirm')) : null
      )
    )
  );
}

function NotificationBell(props) {
  var count = props.count || 0;
  return React.createElement('button', { className:'relative text-xl' },
    '\uD83D\uDD14',
    count > 0 ? React.createElement('span', { className:'absolute -top-1 -right-1 w-4 h-4 bg-bitmap-red rounded-full text-[10px] text-white flex items-center justify-center font-acme' }, count > 9 ? '9+' : count) : null
  );
}

function ErrorBoundary(props) {
  var _a = React.useState(false);
  var hasError = _a[0];
  var setHasError = _a[1];

  React.useEffect(function() {
    var handler = function() { setHasError(true); };
    window.addEventListener('error', handler);
    return function() { window.removeEventListener('error', handler); };
  }, []);

  if (hasError) {
    return React.createElement('div', { className:'flex flex-col items-center justify-center w-full h-full bg-bitmap-black p-8' },
      React.createElement('h1', { className:'font-alfaslab text-2xl text-bitmap-orange mb-4' }, 'Error'),
      React.createElement('p', { className:'font-acme text-bitmap-text mb-6' }, 'Algo salió mal'),
      React.createElement('button', { onClick:function() { setHasError(false); }, className:'px-4 py-2 bg-bitmap-orange text-white rounded-lg font-alfaslab' }, I18n.t('app.retry'))
    );
  }
  return props.children;
}
