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

let initialState = {
  lots: null,
  time: new Date(),
};

// Patter observable
class Store {
  constructor(state) {
    this.state = state;
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  getState() {
    return this.state;
  }

  changeState(diff) {
    this.state = {
      ...this.state,
      ...(typeof diff === 'function' ? diff(this.state) : diff),
    };

    this.listeners.forEach((listener) => {
      listener();
    });
  }
}

const store = new Store(initialState);

function App({ state }) {
  return (
    <div className="div">
      <Header />
      <Clock time={state.time} />
      <Lots lots={state.lots} />
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

api.get('/lots').then((lots) => {
  store.changeState({ lots });

  const onPrice = (data) => {
    store.changeState((state) => ({
      lots: state.lots.map((lot) => {
        if (lot.id === data.id) {
          return {
            ...lot,
            price: data.price,
          };
        }

        return lot;
      }),
    }));
  };

  lots.forEach((lot) => {
    stream.subscribe(`price-${lot.id}`, onPrice);
  });
});

function renderView(state) {
  ReactDOM.render(<App state={state} />, document.getElementById('root'));
}

store.subscribe(() => {
  renderView(store.getState());
});

setInterval(() => {
  store.changeState({
    time: new Date(),
  });
}, 1000);
