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
              },
              {
                id: 2,
                name: 'name lot 23',
                description: 'description lot 2',
                price: 42,
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
  post(url) {},
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

// ###########################

// Patter observable
class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = reducer(initialState, { type: null });
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf[listener];
      this.listeners.splice(index, 1);
    };
  }

  dispatch(action) {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach((listener) => listener());
  }
}

function combineReducers(reducer) {
  return (state = {}, action) => {
    const result = {};

    Object.entries(reducer).forEach(([key, reducer]) => {
      result[key] = reducer(state[key], action);
    });

    return result;
  };
}

const store = new Store(
  combineReducers({
    clock: clockReducer,
    auction: auctionReducer,
  }),
);

// ###########################

function App({ state }) {
  return (
    <div className="div">
      <Header />
      <Clock time={state.clock.time} />
      <Lots lots={state.auction.lots} />
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

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return (
    <div className="clock">
      <span className="value">{time.toLocaleTimeString()}</span>
      <span className={isDay ? 'icon day' : 'icon night'}></span>
    </div>
  );
}

function Loading() {
  return <div className="loading">Loading...</div>;
}

function Lots({ lots }) {
  if (lots === null) {
    return <Loading />;
  }

  return (
    <div className="lost">
      {lots.map((lot) => (
        <Lot key={lot.id} lot={lot} />
      ))}
    </div>
  );
}

function Lot({ lot }) {
  return (
    <article className="lot">
      <div className="price">{lot.price}</div>
      <h1 className="name">{lot.name}</h1>
      <p className="description">{lot.description}</p>
    </article>
  );
}

function renderView(state) {
  ReactDOM.render(<App state={state} />, document.getElementById('root'));
}

store.subscribe(() => {
  renderView(store.getState());
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
