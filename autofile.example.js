var task = {
    id: '{{name}}',
    author: '',
    name: '{{name}}',

    options: {
        opt1: {
            description: '',
            'default': null
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