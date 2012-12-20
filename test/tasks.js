var cp          = require('./tasks/cp.js'),
    chmod       = require('./tasks/chmod.js'),
    mkdir       = require('./tasks/mkdir.js'),
    rm          = require('./tasks/rm.js'),
    run         = require('./tasks/run.js'),
    scaffolding = require('./tasks/scaffolding.js'),
    symlink     = require('./tasks/symlink.js'),
    init        = require('./tasks/init.js')
;

module.exports = function (automaton) {
    describe('Built in tasks', function () {
        chmod(automaton);
        cp(automaton);
        mkdir(automaton);
        rm(automaton);
        run(automaton);
        scaffolding(automaton);
        symlink(automaton);
        init(automaton);
    });
};