const api = {
  get(url) {
    switch (url) {
      case '/lots':
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.25) {
              resolve([
                {
                  id: 1,
                  name: 'name lot 12',
                  description: 'description lot 1',
                  price: 41,
                  favorite: true,
                },
                {
                  id: 2,
                  name: 'name lot 23',
                  description: 'description lot 2',
                  price: 42,
                  favorite: false,
                },
              ]);
            } else {
              reject(new Error('Connection error'));
            }
          }, 2000);
        });
        break;

      default:
        throw new Error('Miss url');
        break;
    }
  },
  post(url) {
    if (/^\/lots\/(\d+)\/favorite$/.exec(url)) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({});
        }, 500);
      });
    }

    if (/^\/lots\/(\d+)\/unfavorite$/.exec(url)) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({});
        }, 500);
      });
    }

    throw new Error('Unknown address');
  },
};

const stream = {
  subscribe(channel, listener) {
    const match = /price-(\d+)/.exec(channel);

    if (match) {
      console.log('On, ' + match[1]);
      const interval = setInterval(() => {
        listener({ id: parseInt(match[1]), price: Math.round(Math.random() * 100) });
      }, 1000);

      return () => {
        console.log('Off, ' + match[1]);
        clearInterval(interval);
      };
    }
  },
};

// ###########################

const auctionInitialState = {
  lots: [],
  loading: false,
  loaded: false,
  error: null,
};
const LOTS_CLEAR = 'LOTS_CLEAR';
const LOTS_LOADING_PENDING = 'LOTS_LOADING_PENDING';
const LOTS_LOADING_SUCCESS = 'LOTS_LOADING_SUCCESS';
const LOTS_LOADING_ERROR = 'LOTS_LOADING_ERROR';
const CHANGE_LOT_PRICE = 'CHANGE_LOT_PRICE';
const FAVORITE_LOT = 'FAVORITE_LOT';
const UNFAVORITE_LOT = 'UNFAVORITE_LOT';

function auctionReducer(state = auctionInitialState, action) {
  switch (action.type) {
    case LOTS_CLEAR:
      return {
        ...state,
        lots: [],
        loading: false,
        loaded: false,
        error: null,
      };
    case LOTS_LOADING_PENDING:
      return {
        ...state,
        lots: [],
        loading: true,
        loaded: false,
        error: null,
      };
    case LOTS_LOADING_SUCCESS:
      return {
        ...state,
        lots: action.lots,
        loading: false,
        loaded: true,
        error: null,
      };
    case LOTS_LOADING_ERROR:
      return {
        ...state,
        loading: false,
        loaded: false,
        error: action.error,
      };
    case CHANGE_LOT_PRICE:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              price: action.price,
            };
          }

          return lot;
        }),
      };
    case FAVORITE_LOT:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              id: Math.round(Math.random() * 100),
              favorite: true,
            };
          }

          return lot;
        }),
      };
    case UNFAVORITE_LOT:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              id: Math.round(Math.random() * 100),
              favorite: false,
            };
          }

          return lot;
        }),
      };
    default:
      return state;
  }
}

// ###########################

// Actions creator
function lotsClear() {
  // Action
  return { type: LOTS_CLEAR };
}

function lotsLoadingPending() {
  return { type: LOTS_LOADING_PENDING };
}

function lotsLoadingSuccess(lots) {
  return { type: LOTS_LOADING_SUCCESS, lots };
}

function lotsLoadingError(error) {
  return { type: LOTS_LOADING_ERROR, error };
}

function loadLotsAsync() {
  return (dispatch, getState, { api }) => {
    dispatch(lotsLoadingPending);
    api
      .get('/lots')
      .then((lots) => {
        dispatch(lotsLoadingSuccess(lots));
      })
      .catch((error) => dispatch(lotsLoadingError(error)));
  };
}

function changeLotPrice(id, price) {
  return { type: CHANGE_LOT_PRICE, id, price };
}

function subscribeToLotPrice(id) {
  return (dispatch, getState, { stream }) => {
    return stream.subscribe(`price-${id}`, (data) => {
      dispatch(changeLotPrice(data.id, data.price));
    });
  };
}

function favoriteLot(id) {
  return {
    type: FAVORITE_LOT,
    id,
  };
}

function favoriteAsync(id) {
  return (dispatch, getState, { api }) => {
    return api.post(`/lots/${id}/favorite`).then(() => {
      dispatch(favoriteLot(id));
    });
  };
}

function unfavoriteLot(id) {
  return {
    type: UNFAVORITE_LOT,
    id,
  };
}

function unfavoriteAsync(id) {
  return (dispatch, getState, { api }) => {
    return api.post(`/lots/${id}/unfavorite`).then(() => {
      dispatch(unfavoriteLot(id));
    });
  };
}

// ###########################

const store = Redux.createStore(
  Redux.combineReducers({
    auction: auctionReducer,
  }),
  Redux.applyMiddleware(ReduxThunk.withExtraArgument({ api, stream })),
);

// ###########################

const StoreContext = React.createContext();

// ###########################

const RouterContext = React.createContext();

function Router({ children }) {
  const [location, setLocation] = React.useState(window.location.hash.slice(1) || '/');

  React.useEffect(() => {
    const listener = () => {
      setLocation(window.location.hash.slice(1));
    };
    window.addEventListener('hashchange', listener, false);

    return () => {
      window.removeEventListener('hashchange', listener);
    };
  }, [setLocation]);

  const navigate = (location) => {
    window.location.hash = location;
  };

  const createHref = (path) => `#${path}`;

  return <RouterContext.Provider value={{ location, navigate, createHref }} children={children} />;
}

function Link({ to, children, ...options }) {
  return (
    <RouterContext.Consumer>
      {({ navigate, createHref }) => {
        const href = to ? createHref(to) : '';

        const onClick = (e) => {
          e.preventDefault();
          navigate(to);
        };

        return (
          <a href={href} onClick={onClick} {...options}>
            {children}
          </a>
        );
      }}
    </RouterContext.Consumer>
  );
}

function matchPath(location, params) {
  const regexp = new RegExp(params.exact ? '^' + params.path + '$' : '^' + params.path + '(/.*)?');
  return regexp.exec(location);
}

function Route(props) {
  return (
    <RouterContext.Consumer>
      {(value) => {
        const match = props.computedMatch ? props.computedMatch : matchPath(value.location, props);
        if (match) {
          return <RouterContext.Provider value={{ ...value, match }} children={props.children} />;
        }

        return null;
      }}
    </RouterContext.Consumer>
  );
}

function Switch({ children }) {
  return (
    <RouterContext.Consumer>
      {(value) => {
        for (const child of children) {
          const match = matchPath(value.location, child.props);
          if (match) {
            // return {
            //   child,
            //   props: {
            //     ...child.props,
            //     computedMatch: match,
            //   },
            // };
            return React.cloneElement(child, { computedMatch: match });
          }
        }

        return null;
      }}
    </RouterContext.Consumer>
  );
}

function useParams() {
  const router = React.useContext(RouterContext);
  return router.match.groups;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Header />

        <Content />
      </div>
    </Router>
  );
}

function Header() {
  return (
    <header className="header">
      <Logo />
      <Nav />
    </header>
  );
}

function Nav() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/lots">Lots</Link>
        </li>
        <li>
          <Link to="/help">Help</Link>
        </li>
      </ul>
    </nav>
  );
}

function Logo() {
  return <img className="logo" src="logo.png" />;
}

function Content() {
  return (
    <Switch>
      <Route path="/" exact>
        <HomePage />
      </Route>
      <Route path="/lots" exact>
        <LotsPage />
      </Route>
      <Route path="/lots/(?<id>[\w-]+)" exact>
        <LotPage />
      </Route>
      <Route path="/help" exact>
        <HelpPage />
      </Route>

      <Route path=".*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function NotFound() {
  return <>Not Found</>;
}

function Page({ children, title }) {
  return (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  );
}

function HomePage() {
  return (
    <Page title="Welcome to Home Page!">
      <Link to="/lots">See lots</Link>
      <br />
      <Link to="/help">See help</Link>
    </Page>
  );
}

function HelpPage() {
  return (
    <Page title="Welcome to Help Page!">
      <Link to="/">See home</Link>
      <br />
      <Link to="/lots">See lots</Link>
    </Page>
  );
}

function LotsPage() {
  return (
    <>
      <ClockContainer />
      <LotsContainerConnected />
    </>
  );
}

function LotPage() {
  const params = useParams();

  return (
    <Page>
      <h1>Lot #{params.id}</h1>
      <p>Lot description</p>
    </Page>
  );
}

const ClockContainer = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [setTime]);

  return <Clock time={time} />;
};

const Clock = ({ time }) => {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return (
    <div className="clock">
      <span className="value">{time.toLocaleTimeString()}</span>
      <span className={isDay ? 'icon day' : 'icon night'}></span>
    </div>
  );
};

function Loading() {
  return <div className="loading">Loading...</div>;
}

function AlertError({ message, retry }) {
  return (
    <div className="alert-error">
      Error {message}
      {retry ? (
        <button type="button" onClick={retry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

const LotsContainer = ({ lots, loading, loaded, error, load, unload }) => {
  React.useEffect(() => {
    if (!loaded && !loading && error === null) {
      load();
    }
  }, [loaded, loading, error]);

  React.useEffect(() => {
    if (loaded && error === !null) {
      return unload;
    }
  }, [loaded, unload, error]);

  if (error !== null) {
    return <AlertError message={error.message} retry={load} />;
  }

  if (loading) {
    return <Loading />;
  }

  if (!loaded) {
    return null;
  }

  return <Lots lots={lots} />;
};

const lotsContainerMapStateToProps = (state) => ({
  lots: state.auction.lots,
  loading: state.auction.loading,
  loaded: state.auction.loaded,
  error: state.auction.error,
});

const lotsContainerMapDispatchToProps = {
  load: loadLotsAsync,
  unload: lotsClear,
};

const LotsContainerConnected = ReactRedux.connect(
  lotsContainerMapStateToProps,
  lotsContainerMapDispatchToProps,
)(LotsContainer);

function Lots({ lots }) {
  return (
    <div className="lots">
      {lots.map((lot) => (
        <LotContainerConnected key={lot.id} lot={lot} />
      ))}
    </div>
  );
}

const LotContainer = ({ lot, subscribe }) => {
  React.useEffect(() => {
    return subscribe(lot.id);
  }, [lot.id]);

  return <LotConnected lot={lot} />;
};

const lotContainerMapDispatchToProps = {
  subscribe: subscribeToLotPrice,
};

const LotContainerConnected = ReactRedux.connect(
  null,
  lotContainerMapDispatchToProps,
)(LotContainer);

const lotMapDispatchToProps = {
  favorite: favoriteAsync,
  unfavorite: unfavoriteAsync,
};

const LotConnected = ReactRedux.connect(null, lotMapDispatchToProps)(Lot);

function Lot({ lot, favorite, unfavorite }) {
  return (
    <article className={`lot ${lot.favorite ? 'lot_favorite' : ''}`}>
      <div className="price">{lot.price}</div>
      <h1 className="name">
        <Link to={`/lots/${lot.id}`}>{lot.name}</Link>
      </h1>
      <p className="description">{lot.description}</p>
      <Favorite
        active={lot.favorite}
        id={lot.id}
        favorite={() => favorite(lot.id)}
        unfavorite={() => unfavorite(lot.id)}
      />
    </article>
  );
}

function Favorite({ active, favorite, unfavorite }) {
  const [enabled, setEnabled] = React.useState(true);

  const onClickUnfavorite = () => {
    setEnabled(false);
    unfavorite()
      .then(() => setEnabled(true))
      .catch(() => setEnabled(true));
  };

  const onClickFavorite = () => {
    setEnabled(false);
    favorite()
      .then(() => setEnabled(true))
      .catch(() => setEnabled(true));
  };

  return active ? (
    <button type="button" onClick={onClickUnfavorite} disabled={!enabled}>
      -
    </button>
  ) : (
    <button type="button" onClick={onClickFavorite} disabled={!enabled}>
      +
    </button>
  );
}

// #######################

ReactDOM.render(
  <ReactRedux.Provider store={store}>
    <App />
  </ReactRedux.Provider>,
  document.getElementById('root'),
);
