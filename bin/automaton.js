#!/usr/bin/env node
var util = require('util');
inspect = function (v, levels) {
    levels = levels || 10;
    console.log(util.inspect(v, false, levels, true));
};

// load automaton
var automaton = require(__dirname + '/../index');

// load core tasks
automaton.loadTasks(__dirname + '/../tasks');

// TODO: create a proper CLI

automaton.setCwd(process.cwd());

var autofile = process.argv[2] || process.cwd() + '/automaton.js';
autofile     = require(autofile);
    
automaton.run(autofile.tasks);