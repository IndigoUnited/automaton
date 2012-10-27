var automaton = require('./index');

automaton.loadTasks('./tasks');

automaton.run([
    {
        task: 'cp',
        options: {
            src: 'source',
            dst: 'destination'
        }
    },
    {
        task: 'cp_proxy',
        options: {
            src: 'source',
            dst: 'destination'
        }
    }
]);