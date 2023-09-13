# Ui framework

## File name:

### immutable-flow.js

Flow: action -> state -> view

Pros: simple one way data flow

Cons: all time rerender all DOM elements

![immutable-flow](./immutable-flow.png)

### virtual-dom.js

Simple sync virtual dom and real dom

Pros: doesn't re render all DOM element, just spot update DOM element
