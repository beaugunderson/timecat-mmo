#!/usr/bin/env node

'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');

var INDEX = 'file://' + path.join(__dirname, 'static', 'timecat-mmo.html');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function () {
  mainWindow = new BrowserWindow({width: 1024, height: 768});

  // and load the index.html of the app.
  mainWindow.loadUrl(INDEX);

  // Open the devtools.
  // mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
