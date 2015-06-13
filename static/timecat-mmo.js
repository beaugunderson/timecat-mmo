/*global $:true*/

'use strict';

var breeds = require('./cat-breeds.js');
var names = require('cat-names');
var ndjson = require('ndjson');
var process = require('process');
var Swarm = require('mdns-swarm');
var swarm = new Swarm('timecat-mmo', 'game');
var through2 = require('through2');
var uuid = require('uuid');
var _ = require('lodash');

window.$ = window.jQuery = require('jquery');

var name = names.random();
var peerUuid = uuid.v1();
var seen = {};
var outStream = ndjson.stringify();

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

var currentEnemy;

function next() {
  currentEnemy = enemy();

  $('#game-lines').html('<li>You happen upon a ' + currentEnemy.breed +
    ' named ' + currentEnemy.name + '. <strong>(F)</strong>ight or ' +
    '<strong>(R)</strong>un?</li>');
}

var start;

document.addEventListener('keydown', function (e) {
  // e.preventDefault();

  // 'F'
  if (e.keyCode === 70) {
    fightCat();
  }

  // 'R'
  if (e.keyCode === 82) {
    fleeCat();
  }

  // Enter
  if (e.keyCode === 13) {
    $('#first-cursor').hide();
    start = process.hrtime();
  }

  // Ctrl-C
  if (e.ctrlKey && e.keyCode === 67) {
    var diff = process.hrtime(start);
    $('#result-time').text('0m' + diff[0] + '.' +
      Math.floor(diff[1] / 1000000) + 's');
    $('#result').show();
  }

  // Ctrl-D
  if (e.ctrlKey && e.keyCode === 68) {
    $('#event').hide();

    $('#quest-lines').append('<li>You beat ' + currentEnemy.name +
      ', a ' + currentEnemy.breed + '</li>.');

    outStream.write({
      uuid: uuid.v1(),
      type: 'event',
      enemy: currentEnemy,
      name: name
    });

    next();
  }

  // $('#quest-lines').append($('<li>' + e.keyCode + '</li>'));
});

function handleMessage(message) {
  if (seen[message.uuid]) {
    return;
  }

  seen[message.uuid] = true;

  // $('#connection-lines').append($('<li>' + message.uuid + '</li>'));

  switch (message.type) {
    case 'peer':
      $('#connection-lines').append($('<li>' + message.name +
        ' joins the Timecat-verse.</li>'));
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

swarm.on('peer', function (stream) {
  stream
    .pipe(ndjson.parse())
    .pipe(inStream);

  outStream.pipe(stream);
  outStream.write({uuid: peerUuid, type: 'peer', name: name});
});

next();
