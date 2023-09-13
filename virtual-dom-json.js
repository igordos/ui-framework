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
  return {
    type: 'div',
    props: {
      className: 'app',
      children: [
        {
          type: Header,
          props: {},
        },
        {
          type: Clock,
          props: { time: state.time },
        },
        {
          type: Lots,
          props: { lots: state.lots },
        },
      ],
    },
  };
}

function Header() {
  return {
    type: 'header',
    props: {
      className: 'header',
      children: [{ type: Logo }],
    },
  };
}

// function Block() {
//   return {
//     type: 'div',
//     props: {
//       className: 'block',
//       children: props.children,
//     },
//   };
// }

function Logo() {
  return {
    type: 'img',
    props: {
      className: 'logo',
      src: 'logo.png',
    },
  };
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return {
    type: 'div',
    props: {
      className: 'clock',
      children: [
        {
          type: 'span',
          props: {
            className: 'value',
            children: [time.toLocaleTimeString()],
          },
        },
        {
          type: 'span',
          props: {
            className: isDay ? 'icon day' : 'icon night',
          },
        },
      ],
    },
  };
}

function Loading() {
  return {
    type: 'div',
    props: {
      className: 'loading',
      children: ['Loading...'],
    },
  };
}

function Lots({ lots }) {
  if (lots === null) {
    return {
      type: Loading,
      props: {},
    };
  }

  return {
    type: 'div',
    props: {
      className: 'lost',
      children: lots.map((lot) => ({
        type: Lot,
        props: {
          lot,
        },
      })),
    },
  };
}

function Lot({ lot }) {
  return {
    type: 'article',
    key: lot.id,
    props: {
      className: 'lot',
      children: [
        {
          type: 'div',
          props: {
            className: 'price',
            children: lot.price,
          },
        },
        {
          type: 'h1',
          props: {
            className: 'name',
            children: [lot.name],
          },
        },
        {
          type: 'p',
          props: {
            className: 'description',
            children: [lot.description],
          },
        },
      ],
    },
  };
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
  render(App({ state }), document.getElementById('root'));
}

renderView(state);

setInterval(() => {
  state = {
    ...state,
    time: new Date(),
  };

  renderView(state);
}, 1000);

function render(virtualDom, realDomRoot) {
  const evaluatedVirtualDom = evaluate(virtualDom);

  const virtualDomRoot = {
    type: realDomRoot.tagName.toLowerCase(),
    props: {
      id: realDomRoot.id,
      ...realDomRoot.attributes,
      children: [evaluatedVirtualDom],
    },
  };

  sync(virtualDomRoot, realDomRoot);
}

function evaluate(virtualNode) {
  if (typeof virtualNode !== 'object') {
    return virtualNode;
  }

  if (typeof virtualNode.type === 'function') {
    return evaluate(virtualNode.type(virtualNode.props));
  }

  const props = virtualNode.props || {};

  return {
    ...virtualNode,
    props: {
      ...props,
      children: Array.isArray(props.children)
        ? props.children.map(evaluate)
        : [evaluate(props.children)],
    },
  };
}

function sync(virtualNode, realNode) {
  // Sync element
  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([name, value]) => {
      if (name === 'children' && name === 'key') {
        return;
      }

      if (realNode[name] !== value) {
        realNode[name] = value;
      }
    });
  }

  if (virtualNode.key) {
    realNode.dataset.key = virtualNode.key;
  }

  if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode;
  }

  // Sync child nodes

  const virtualChildren = virtualNode.props ? virtualNode.props.children || [] : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i];

    // Remove
    if (virtual === undefined && real !== undefined) {
      realNode.remove(real);
    }

    // Update
    if (
      virtual !== undefined &&
      real !== undefined &&
      (virtual.type || '') === (real.tagName || '').toLowerCase()
    ) {
      sync(virtual, real);
    }

    // Replace
    if (
      virtual !== undefined &&
      real !== undefined &&
      (virtual.type || '') !== (real.tagName || '').toLowerCase()
    ) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      realNode.replaceChild(newReal, real);
    }

    // Add
    if (virtual !== undefined && real === undefined) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      realNode.appendChild(newReal);
    }
  }
}

function createRealNodeByVirtual(virtual) {
  if (typeof virtual !== 'object') {
    return document.createTextNode('');
  }

  return document.createElement(virtual.type);
}
