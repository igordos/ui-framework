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

let state = {
  lots: null,
  time: new Date(),
};

function App({ state }) {
  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement(Header),
    React.createElement(Clock, { time: state.time }),
    React.createElement(Lots, { lots: state.lots }),
  );
}

function Header() {
  return React.createElement('header', { className: 'header' }, React.createElement(Logo));
}

function Logo() {
  return React.createElement('img', { className: 'logo', src: 'logo.png' });
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return React.createElement(
    'div',
    { className: 'clock' },
    React.createElement('span', { className: 'value' }, time.toLocaleTimeString()),
    React.createElement('span', { className: isDay ? 'icon day' : 'icon night' }),
  );
}

function Loading() {
  return React.createElement('div', { className: 'loading' }, 'Loading...');
}

function Lots({ lots }) {
  if (lots === null) {
    return React.createElement(Loading);
  }

  return React.createElement(
    'div',
    { className: 'lost' },
    lots.map((lot) => React.createElement(Lot, { lot, key: lot.id })),
  );
}

function Lot({ lot, key }) {
  return React.createElement(
    'article',
    { className: 'lot', key },
    React.createElement('div', { className: 'price' }, lot.price),
    React.createElement('h1', { className: 'name' }, lot.name),
    React.createElement('p', { className: 'description' }, lot.description),
  );
}

api.get('/lots').then((lots) => {
  state = {
    ...state,
    lots,
  };

  renderView(state);

  const onPrice = (data) => {
    state = {
      ...state,
      lots: state.lots.map((lot) => {
        if (lot.id === data.id) {
          return {
            ...lot,
            price: data.price,
          };
        }

        return lot;
      }),
    };

    renderView(state);
  };

  lots.forEach((lot) => {
    stream.subscribe(`price-${lot.id}`, onPrice);
  });
});

function renderView(state) {
  ReactDOM.render(React.createElement(App, { state }), document.getElementById('root'));
}

renderView(state);

setInterval(() => {
  state = {
    ...state,
    time: new Date(),
  };

  renderView(state);
}, 1000);
