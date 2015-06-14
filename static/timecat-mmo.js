/*global $:true*/

'use strict';

var breeds = require('./cat-breeds.js');
var cuid = require('cuid');
var endOfStream = require('end-of-stream');
var names = require('cat-names');
var ndjson = require('ndjson');
var process = require('process');
var Swarm = require('mdns-swarm');
var swarm = new Swarm('timecat-mmo', 'game');
var through2 = require('through2');
var uuid = require('uuid');
var words = require('./words.js');
var _ = require('lodash');

window.$ = window.jQuery = require('jquery');

var KEY_C = 67;
var KEY_D = 68;
var KEY_ENTER = 13;
var KEY_F = 70;
var KEY_R = 82;
var KEY_SPACE = 32;

var currentEnemy;
var difficulty = 1;
var hitPoints = 100;
var leader;
var players = {};
var name = process.env.USER || names.random();
var outStream = ndjson.stringify();
var myUuid = cuid();
var peerUuid = uuid.v1();
var score = 0;
var seen = {};
var start;

// Prevent pinch zoom
document.addEventListener('mousewheel', function (e) {
  if (e.deltaY % 1 !== 0) {
    e.preventDefault();
  }
});

$('#close-help').click(function () {
  $('#help').hide();
});

function s(number) {
  if (number === 0) {
    return 's';
  }

  if (number > 1) {
    return 's';
  }

  return '';
}

function getLeader() {
  return _(players).sortBy(function (player) {
    return -player.score;
  }).first();
}

function showEvent() {
  $('#first-cursor').show();
  $('#result').hide();
  $('#count').text(currentEnemy.time);
  $('#count-s').text(s(currentEnemy.time));
  $('#success, #failure').hide();
  $('#event').show();
}

function fightCat() {
  $('#event-type').text(_.sample(words.fight));

  showEvent();
}

function fleeCat() {
  $('#event-type').text(_.sample(words.flee));

  showEvent();
}

function enemy() {
  return {
    breed: _.sample(breeds),
    name: names.random(),
    strength: _.random(1 * difficulty, 5 * difficulty),
    time: Math.floor(_.random(1, 5))
  };
}

function an(word) {
  return /^[aeiou]/.test(word) ? 'an' : 'a';
}

function nextEvent() {
  currentEnemy = enemy();

  var type = _.sample(words.events);

  var adjective;

  if (currentEnemy.strength < 5) {
    adjective = _.sample(words.adjectives.easy);
  } else if (currentEnemy.strength < 10) {
    adjective = _.sample(words.adjectives.medium);
  } else {
    adjective = _.sample(words.adjectives.hard);
  }

  $('#event-text').html('You ' + type + ' ' + an(adjective) + ' ' +
    adjective + ' ' + currentEnemy.breed + ' named ' + currentEnemy.name + '.');
}

function send(message) {
  message.cuid = myUuid;

  if (!message.uuid) {
    message.uuid = uuid.v1();
  }

  outStream.write(message);
}

function youLose() {
  $('#event').hide();
  $('#you-lose').show();
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

  if (e.ctrlKey && e.keyCode === KEY_C) {
    var diff = process.hrtime(start);

    var milliseconds = String(Math.floor(diff[1] / 1000000));
    var seconds = diff[0] + (milliseconds / 1000);
    var displaySeconds = diff[0] + '.' + _.padLeft(milliseconds, 3, '0');

    var ratio = seconds / currentEnemy.time;

    var outcome;
    var outcomeDescription;

    if (ratio >= 0.8 && ratio <= 1) {
      outcome = 'win';
      outcomeDescription = _.sample(words.outcomes.success);

      var points = currentEnemy.strength * ratio;

      score += Math.floor(points * 100);

      $('#score').text(score);
      $('#success').show();
    } else {
      outcome = 'lose';
      outcomeDescription = _.sample(words.outcomes.failure);

      hitPoints -= Math.ceil(currentEnemy.strength * ratio);

      $('#hit-points').text(hitPoints);
      $('#failure').show();

      if (hitPoints <= 0) {
        youLose();
      }
    }

    $('#result-time').text('0m' + displaySeconds + 's');
    $('#result').show();

    $('#quest-lines').append('<li>You ' + outcomeDescription + ' ' +
      currentEnemy.name + '.</li>');

    send({
      outcome: outcome,
      outcomeDescription: outcomeDescription,
      type: 'event',
      enemy: currentEnemy,
      score: score,
      name: name,
      seconds: displaySeconds,
      time: currentEnemy.time
    });
  }

  if ((e.ctrlKey && e.keyCode === KEY_D) || e.keyCode === KEY_SPACE) {
    $('#event').hide();

    nextEvent();
  }
});

function handleMessage(message, trackingUuid, callback) {
  if (seen[message.uuid]) {
    return callback();
  }

  seen[message.uuid] = true;

  switch (message.type) {
    case 'peer':
      players[trackingUuid].name = message.name;

      $('#connection-lines').append($('<li>' + message.name +
        ' joined the Timecat-verse.</li>'));

      break;

    case 'event':
      $('#quest-lines').append($('<li>' + message.name +
        ' ' + message.outcomeDescription + ' ' + message.enemy.name +
        '.' + '(' + message.seconds + '/' + message.time + ')</li>'));

      players[trackingUuid].score = message.score;

      var potentialLeader = getLeader();

      if (!potentialLeader) {
        break;
      }

      if ((!leader && potentialLeader) ||
          leader.trackingUuid !== potentialLeader.trackingUuid) {
        if (potentialLeader.score === score) {
          $('#quest-lines').append($('<li>You\'re tied with ' + leader.name +
            '!</li>'));
        } else if (potentialLeader.score > score) {
          leader = potentialLeader;

          $('#quest-lines').append($('<li>' + leader.name + ' is the new ' +
            'leader with ' + leader.score + ' points!</li>'));
        } else {
          $('#quest-lines').append($('<li>You are the leader by ' +
            (score - leader.score) + ' points!</li>'));
        }
      }

      break;

    default:
      $('#connection-lines').append($('<li>Unknown message: ' +
        JSON.stringify(message) + '</li>'));
  }

  callback();
}

function inStream(trackingUuid) {
  return through2.obj(function (chunk, enc, callback) {
    handleMessage(chunk, trackingUuid, callback);
  });
}

swarm.on('peer', function (peerStream) {
  var trackingUuid = uuid.v1();

  players[trackingUuid] = {trackingUuid: trackingUuid};

  endOfStream(peerStream, function () { // err
    delete players[trackingUuid];

    $('#connection-lines').append($('<li>Someone left the Timecat-verse.' +
      '</li>'));
  });

  peerStream
    .pipe(ndjson.parse())
    .pipe(inStream(trackingUuid));

  outStream.pipe(peerStream);

  send({uuid: peerUuid, type: 'peer', name: name});
});

nextEvent();
