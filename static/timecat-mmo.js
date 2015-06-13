/*global $:true*/

'use strict';

var breeds = require('./cat-breeds.js');
var endOfStream = require('end-of-stream');
var names = require('cat-names');
var ndjson = require('ndjson');
var process = require('process');
var Swarm = require('mdns-swarm');
var swarm = new Swarm('timecat-mmo', 'game');
var through2 = require('through2');
var uuid = require('uuid');
var _ = require('lodash');

window.$ = window.jQuery = require('jquery');

var KEY_C = 67;
var KEY_D = 68;
var KEY_ENTER = 13;
var KEY_F = 70;
var KEY_R = 82;

var currentEnemy;
var name = names.random();
var outStream = ndjson.stringify();
var peerUuid = uuid.v1();
var seen = {};
var start;

// Prevent pinch zoom
document.addEventListener('mousewheel', function (e) {
  if (e.deltaY % 1 !== 0) {
    e.preventDefault();
  }
});

function fightCat() {
  $('#first-cursor').show();
  $('#result').hide();

  $('#event').show();
}

function fleeCat() {
  $('#first-cursor').show();
  $('#result').hide();

  $('#event').show();
}

function enemy() {
  return {
    breed: _.sample(breeds),
    name: names.random()
  };
}

function nextEvent() {
  currentEnemy = enemy();

  $('#game-lines').html('<li>You happen upon a ' + currentEnemy.breed +
    ' named ' + currentEnemy.name + '. <strong>(F)</strong>ight or ' +
    '<strong>(R)</strong>un?</li>');
}

document.addEventListener('keydown', function (e) {
  // e.preventDefault();

  if (e.keyCode === KEY_F) {
    fightCat();
  }

  if (e.keyCode === KEY_R) {
    fleeCat();
  }

  if (e.keyCode === KEY_ENTER) {
    $('#first-cursor').hide();

    start = process.hrtime();
  }

  if (e.ctrlKey) {
    if (e.keyCode === KEY_C) {
      var diff = process.hrtime(start);

      $('#result-time').text('0m' + diff[0] + '.' +
        Math.floor(diff[1] / 1000000) + 's');

      $('#result').show();
    }

    if (e.keyCode === KEY_D) {
      $('#event').hide();

      $('#quest-lines').append('<li>You beat ' + currentEnemy.name +
        ', a ' + currentEnemy.breed + '.</li>');

      outStream.write({
        uuid: uuid.v1(),
        type: 'event',
        enemy: currentEnemy,
        name: name
      });

      nextEvent();
    }
  }
});

function handleMessage(message) {
  if (seen[message.uuid]) {
    return;
  }

  seen[message.uuid] = true;

  switch (message.type) {
    case 'peer':
      $('#connection-lines').append($('<li>' + message.name +
        ' joined the Timecat-verse.</li>'));
      break;

    case 'event':
      $('#quest-lines').append($('<li>' + message.name +
        ' beat ' + enemy.name + '.</li>'));
      break;

    default:
      $('#connection-lines').append($('<li>Unknown message: ' +
        JSON.stringify(message) + '</li>'));
  }
}

var inStream = through2.obj(function (chunk, enc, callback) {
  handleMessage(chunk);

  callback();
});

swarm.on('peer', function (peerStream) {
  endOfStream(peerStream, function () { // err
    $('#connection-lines').append($('<li>Someone left the Timecat-verse.' +
      '</li>'));
  });

  peerStream
    .pipe(ndjson.parse())
    .pipe(inStream);

  outStream.pipe(peerStream);
  outStream.write({uuid: peerUuid, type: 'peer', name: name});
});

nextEvent();
