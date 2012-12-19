var automaton = require('../index').create(),
    fs        = require('fs'),
    rimraf    = require('rimraf'),
    core      = require('./core.js'),
    tasks     = require('./tasks.js'),
    cli       = require('./cli.js')
;

// disable output
automaton.setVerbosity(0);

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

describe('Automaton', function () {
    before(loadTestTasks);
    beforeEach(prepareTmp);
    after(cleanUpTmp);

    core(automaton);
    tasks(automaton);
    cli(automaton);

});