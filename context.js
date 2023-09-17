const api = {
  get(url) {
    switch (url) {
      case '/lots':
        return new Promise((resolve) => {
          setTimeout(() => {
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
      setInterval(() => {
        listener({ id: parseInt(match[1]), price: Math.round(Math.random() * 100) });
      }, 1000);
    }
  },
};

// ###########################

const clockInitialState = {
  time: new Date(),
};

const SET_TIME = 'SET_TIME';

function clockReducer(state = clockInitialState, action) {
  switch (action.type) {
    case SET_TIME:
      return {
        ...state,
        time: action.time,
      };

    default:
      return state;
  }
}

// ###########################

const auctionInitialState = {
  lots: null,
};

const SET_LOTS = 'SET_LOTS';
const CHANGE_LOT_PRICE = 'CHANGE_LOT_PRICE';
const FAVORITE_LOT = 'FAVORITE_LOT';
const UNFAVORITE_LOT = 'UNFAVORITE_LOT';

function auctionReducer(state = auctionInitialState, action) {
  switch (action.type) {
    case SET_LOTS:
      return {
        ...state,
        lots: action.lots,
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

// Actions creators

function setTime(time) {
  return { type: SET_TIME, time };
}

function setLots(lots) {
  return { type: SET_LOTS, lots };
}

function changeLotPrice(id, price) {
  return { type: CHANGE_LOT_PRICE, id, price };
}

function favoriteLot(id) {
  return {
    type: FAVORITE_LOT,
    id,
  };
}

function unfavoriteLot(id) {
  return {
    type: UNFAVORITE_LOT,
    id,
  };
}

// ###########################

const store = Redux.createStore(
  Redux.combineReducers({
    clock: clockReducer,
    auction: auctionReducer,
  }),
);

// ###########################

const StoreContext = React.createContext();

// ###########################

function App() {
  return (
    <div className="div">
      <Header />
      <ClockConnected />
      <LotsConnected />
    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <Logo />
    </header>
  );
}

function Logo() {
  return <img className="logo" src="logo.png" />;
}

function ClockConnected() {
  return (
    <StoreContext.Consumer>
      {(store) => {
        const state = store.getState();
        const time = state.clock.time;

        return <Clock time={time} />;
      }}
    </StoreContext.Consumer>
  );
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return (
    <div className="clock">
      <span className="value">{time.toLocaleTimeString()}</span>
      <span className={isDay ? 'icon day' : 'icon night'}></span>
    </div>
  );
}

// ####################
// Test Clock

mocha.setup('bdd');
const assert = chai.assert;

describe('Clock', () => {
  it('Render time of day', () => {
    const container = document.createElement('div');

    ReactDOM.render(<Clock time={new Date('2020-10-19T14:12:31')} />, container);

    const clock = container.querySelector('.clock');

    assert.equal(clock.querySelector('.value').innerText, '2:12:31 PM');
    assert.equal(clock.querySelector('.icon').className, 'icon day');
  });

  it('Time of night', () => {
    const container = document.createElement('div');

    ReactDOM.render(<Clock time={new Date('2020-10-19T03:24:12')} />, container);

    const clock = container.querySelector('.clock');

    assert.equal(clock.querySelector('.value').innerText, '3:24:12 AM');
    assert.equal(clock.querySelector('.icon').className, 'icon night');
  });
});

mocha.run();

// ####################

function Loading() {
  return <div className="loading">Loading...</div>;
}

function LotsConnected() {
  return (
    <StoreContext.Consumer>
      {(store) => {
        const state = store.getState();
        const lots = state.auction.lots;

        return <Lots lots={lots} />;
      }}
    </StoreContext.Consumer>
  );
}

function Lots({ lots }) {
  if (lots === null) {
    return <Loading />;
  }

  return (
    <div className="lots">
      {lots.map((lot) => (
        <LotConnected key={lot.id} lot={lot} />
      ))}
    </div>
  );
}

function LotConnected({ lot }) {
  return (
    <StoreContext.Consumer>
      {(store) => {
        const dispatch = store.dispatch;

        function favorite(id) {
          api.post(`/lots/${id}/favorite`).then(() => {
            dispatch(favoriteLot(id));
          });
        }

        function unfavorite(id) {
          api.post(`/lots/${id}/unfavorite`).then(() => {
            dispatch(unfavoriteLot(id));
          });
        }

        return <Lot lot={lot} favorite={favorite} unfavorite={unfavorite} />;
      }}
    </StoreContext.Consumer>
  );
}

function Lot({ lot, favorite, unfavorite }) {
  return (
    <article className={`lot ${lot.favorite ? 'lot_favorite' : ''}`}>
      <div className="price">{lot.price}</div>
      <h1 className="name">{lot.name}</h1>
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
  return active ? (
    <button type="button" onClick={unfavorite}>
      -
    </button>
  ) : (
    <button type="button" onClick={favorite}>
      +
    </button>
  );
}

// #######################

function renderView(store) {
  ReactDOM.render(
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>,
    document.getElementById('root'),
  );
}

store.subscribe(() => {
  renderView(store);
});

setInterval(() => {
  store.dispatch(setTime(new Date()));
}, 1000);

api.get('/lots').then((lots) => {
  store.dispatch(setLots(lots));

  lots.forEach((lot) => {
    stream.subscribe(`price-${lot.id}`, (data) => {
      store.dispatch(changeLotPrice(data.id, data.price));
    });
  });
});
