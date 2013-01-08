'use strict';

var cp          = require('./tasks/cp'),
    mv          = require('./tasks/mv'),
    chmod       = require('./tasks/chmod'),
    mkdir       = require('./tasks/mkdir'),
    rm          = require('./tasks/rm'),
    run         = require('./tasks/run'),
    scaffolding = require('./tasks/scaffolding'),
    symlink     = require('./tasks/symlink'),
    init        = require('./tasks/init')
;

module.exports = function (automaton) {
    describe('Built in tasks', function () {
        chmod(automaton);
        cp(automaton);
        mv(automaton);
        mkdir(automaton);
        rm(automaton);
        run(automaton);
        scaffolding(automaton);
        symlink(automaton);
        init(automaton);
    });
};