var task = {
    'id'     : 'cp',
    'author' : 'Indigo United',
    'name'   : 'Copy',
    'tasks'  :
    [
        {
            'task' : function (options, next) {
                console.log('copying...');
                next();
            }
        }
    ],
    'incompatibilities': []
};

module.exports = task;