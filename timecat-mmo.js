#!/usr/bin/env node

'use strict';

var Swarm = require('mdns-swarm');

var swarm = new Swarm('timecat-mmo', 'game');

swarm.on('peer', function (stream) {
  //
});
