(function() {
  var Router = ReactRouterDOM;
  var HashRouter = Router.HashRouter;
  var Routes = Router.Routes;
  var Route = Router.Route;
  var useNavigate = Router.useNavigate;
  var useParams = Router.useParams;
  var useLocation = Router.useLocation;

  function AppRoutes() {
    var navigate = useNavigate();
    var location = useLocation();
    var params = useParams();

    var p = {};
    try { p = useParams(); } catch(e) {}

    var currentPath = location.pathname;

    var wrapper = function(PageComponent, extraProps) {
      return React.createElement(PageComponent, Object.assign({ navigate:navigate, currentPath:currentPath }, extraProps, p));
    };

    return React.createElement(Routes, null,
      React.createElement(Route, { path:'/', element:wrapper(HomePage) }),
      React.createElement(Route, { path:'/marketplace', element:wrapper(MarketplaceSelectorPage) }),
      React.createElement(Route, { path:'/ordinalswallet', element:wrapper(OrdinalswalletPage) }),
      React.createElement(Route, { path:'/unisat', element:wrapper(UnisatPage) }),
      React.createElement(Route, { path:'/local', element:wrapper(LocalPage) }),
      React.createElement(Route, { path:'/discounts', element:wrapper(DescuentosPage) }),
      React.createElement(Route, { path:'/unified', element:wrapper(UnifiedPage) }),
      React.createElement(Route, { path:'/tag-tables', element:wrapper(PantallaDeTablas) }),
      React.createElement(Route, { path:'/tag-tables/:tagName', element:wrapper(TagTableScreen, { tagName:p.tagName }) }),
      React.createElement(Route, { path:'/sales', element:wrapper(VentasPage) }),
      React.createElement(Route, { path:'/blocks/:id', element:wrapper(PantallaDeBloqueEspecifico, { blockId:p.id }) }),
      React.createElement(Route, { path:'/wallet', element:wrapper(WalletConnectPage) }),
      React.createElement(Route, { path:'/wallet/dashboard', element:wrapper(WalletDashboardPage) }),
      React.createElement(Route, { path:'/mis-activos', element:wrapper(MisActivosPage) }),
      React.createElement(Route, { path:'/wallet/transaction/:id', element:wrapper(TransactionPage, { txId:p.id }) }),
      React.createElement(Route, { path:'/mondrian/:id', element:wrapper(MondrianPreviewPage, { blockId:p.id }) }),
      React.createElement(Route, { path:'/search', element:wrapper(BlockSearchPage) }),
      React.createElement(Route, { path:'/settings', element:wrapper(SettingsPage) })
    );
  }

  function Root() {
    return React.createElement(ErrorBoundary, null,
      React.createElement(HashRouter, null,
        React.createElement(AppRoutes, null)
      )
    );
  }

  var root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(Root));
})();
