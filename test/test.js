var Automaton = require('../index'),
    fs        = require('fs'),
    rimraf    = require('rimraf'),
    core      = require('./core'),
    logging   = require('./logging'),
    tasks     = require('./tasks'),
    cli       = require('./cli'),
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
automaton = new Automaton();

describe('Automaton', function () {
    before(loadTestTasks);
    beforeEach(prepareTmp);
    after(cleanUpTmp);

    core(automaton);
    logging(automaton);
    tasks(automaton);
    cli(automaton);

});