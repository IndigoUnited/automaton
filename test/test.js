/*global describe, before, beforeEach, after*/

'use strict';

var Automaton   = require('../');
var fs          = require('fs');
var rimraf      = require('rimraf');
var core        = require('./core');
var grunt       = require('./grunt');
var logging     = require('./logging');
var cli         = require('./cli');
var taskBuilder = require('./task_builder');

var automaton;

function cleanUpTmp(done) {
    rimraf(__dirname + '/tmp', done);
}

function prepareTmp(done) {
    cleanUpTmp(function (err) {
        if (err) {
            throw err;
        }

        fs.mkdir(__dirname + '/tmp', parseInt('0777', 8), done);
    });
}

function loadTestTasks() {
    automaton.loadTasks(__dirname + '/helpers/tasks');
}

// init automaton, disabling logging
automaton = new Automaton();

describe('Automaton', function () {
    before(loadTestTasks);
    beforeEach(prepareTmp);
    after(cleanUpTmp);

    core(automaton);
    logging(automaton);
    cli(automaton);
    grunt(automaton);
    taskBuilder(automaton);
});