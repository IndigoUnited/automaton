var automaton = require('../index');

automaton.loadTasks('../tasks');

automaton.run([
    {
        task: 'cp',
        description: 'first copy',
        options: {
            src: 'source',
            dst: 'destination'
        }
    },
    {
        task: 'cp_proxy',
        description: 'second copy, with proxy',
        options: {
            src: 'source from automaton',
            dst: 'destination from automaton'
        }
    },
    {
        task: 'cp_proxy'
    }
]);