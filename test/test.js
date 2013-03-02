'use strict';

var Automaton   = require('../index'),
    fs          = require('fs'),
    rimraf      = require('rimraf'),
    core        = require('./core'),
    grunt       = require('./grunt'),
    logging     = require('./logging'),
    prompting   = require('./prompt'),
    cli         = require('./cli'),
    taskBuilder = require('./task_builder'),
    automaton;

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
    prompting(automaton);
    cli(automaton);
    grunt(automaton);
    taskBuilder(automaton);
});