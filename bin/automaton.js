#!/usr/bin/env node
var util   = require('util'),
    fs     = require('fs'),
    colors = require('colors');

var inspect = function (v, levels) {
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

if (!fs.existsSync(autofile)) {
    console.log('Could not find autofile: '.error + autofile);
    process.exit(1);
}

autofile     = require(autofile);
    
automaton.run(autofile.tasks);