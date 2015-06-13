#!/usr/bin/env node

'use strict';

var blessed = require('blessed');

// Create a screen object.
var screen = blessed.screen({
  autoPadding: true,
  dockBorders: true,
  smartCSR: true
});

screen.title = 'my window title';

var game = blessed.box({
  top: 'top',
  left: 'left',
  width: '100%',
  height: '20%',
  content: 'Hello {bold}world{/bold}!',
  scrollable: true,
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Create a box perfectly centered horizontally and vertically.
var box = blessed.log({
  top: '20%',
  left: '0%',
  width: '50%',
  height: '80%',
  content: 'Hello {bold}world{/bold}!',
  scrollable: true,
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

var box2 = blessed.log({
  top: '20%',
  left: '50%',
  width: '50%',
  height: '80%',
  content: 'You have joined the {bold}Timecat-verse{/bold}.',
  scrollable: true,
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(game);
screen.append(box);
screen.append(box2);

// If box is focused, handle `enter`/`return` and give us some more content.
box.key('enter', function (ch, key) {
  // box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
  // box.setLine(1, 'bar');
  box.log('foo');

  screen.render();
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
  return process.exit(0);
});

// Focus our element.
box.focus();

// Render the screen.
screen.render();
