var task = {
    'id'      : 'task-init',
    'author'  : 'Indigo United',
    'name'    : 'Task init',
    'options' : {
        'name': {
            'description': 'The task name',
            'default': 'autofile'
        },
        'dst': {
            'description': 'Directory where the task will be created',
            'default': process.cwd()
        }
    },
    'tasks'  :
    [
        {
            'task': 'cp',
            'options': {
                'src': __dirname + '/../base_autofile.js',
                'dst': '{{dst}}/{{name}}.js'
            }
        },
        {
            'task': 'scaffolding-replace',
            'options': {
                'what': '{{dst}}/{{name}}.js:name',
                'with': '{{name}}',
                'type': 'string'
            }
        }
    ]
};

module.exports = task;