#!/usr/bin/env node
var util = require('util');
inspect = function (v, levels) {
    levels = levels || 10;
    console.log(util.inspect(v, false, levels, true));
};

var automaton = require(__dirname + '/../index');

automaton.loadTasks(__dirname + '/../tasks');

// TODO: create a proper CLI

var autofile = process.argv[3] || process.cwd() + '/automaton.js';
autofile     = require(autofile);
    
automaton.run(autofile.tasks);