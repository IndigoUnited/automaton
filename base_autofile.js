var task = {
    id: '{{name}}',
    author: 'Task author',
    name: '{{name}}',

    options: {
        opt1: {
            description: 'Opt1 description',
            'default': 'foo'                 // if mandatory, remove the default
        }
    },

    filter: function (opt) {
        // do any validation/sanitization you need here
    },

    tasks: [
        {
            task: ''
        }
    ]
};

module.exports = task;