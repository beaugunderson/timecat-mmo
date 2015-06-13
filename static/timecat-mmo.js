/*global $:true*/

'use strict';

var breeds = require('./cat-breeds.js');
// var debug = require('debug')('timecat-mmo');
var names = require('cat-names');
var Swarm = require('mdns-swarm');
var swarm = new Swarm('timecat-mmo', 'game');
var _ = require('lodash');

window.$ = window.jQuery = require('jquery');

// Prevent pinch zoom
document.addEventListener('mousewheel', function (e) {
  if (e.deltaY % 1 !== 0) {
    e.preventDefault();
  }
});

function enemy() {
  return {
    breed: _.sample(breeds),
    name: names.random()
  };
}

swarm.on('peer', function (stream) {
  $('#connection-lines').append($('<li>' + names.random() +
    ' joins the Timecat-verse.</li>'));
});

function next() {
  var cat = enemy();

  $('#game-lines').html('<li>You happen upon a ' + cat.breed + ' named ' +
    cat.name + '. <strong>(F)</strong>ight or <strong>(R)</strong>un?</li>');
}

next();
