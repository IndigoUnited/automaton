var task = {
    'id'     : 'cp',
    'author' : 'Indigo United',
    'name'   : 'Copy',
    'tasks'  :
    [
        {
            'task' : function (context, options, next) {
                console.log('copying...', options);
                next();
            }
        }
    ],
    'incompatibilities': []
};

module.exports = task;