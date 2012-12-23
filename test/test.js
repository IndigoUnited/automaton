var Automaton = require('../index'),
    fs        = require('fs'),
    rimraf    = require('rimraf'),
    core      = require('./core.js'),
    tasks     = require('./tasks.js'),
    cli       = require('./cli.js'),
    automaton;

function cleanUpTmp(done) {
    rimraf(__dirname + '/tmp', done);
}

function prepareTmp(done) {
    cleanUpTmp(function (err) {
        if (err) {
            return done(err);
        }

        fs.mkdir(__dirname + '/tmp', parseInt('0777', 8), done);
    });
}

function loadTestTasks() {
    automaton.loadTasks(__dirname + '/helpers/tasks');
}

// init automaton, disabling logging
automaton = new Automaton({ verbosity: 0 });

describe('Automaton', function () {
    before(loadTestTasks);
    beforeEach(prepareTmp);
    //after(cleanUpTmp);

    core(automaton);
    tasks(automaton);
    cli(automaton);

});