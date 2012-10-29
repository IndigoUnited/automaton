var task = {
    'id'     : 'rm',
    'author' : 'Indigo United',
    'name'   : 'Remove',
    'tasks'  :
    [
        {
            'task' : function (ctx, opt, next) {
                // TODO: validate required options
                // TODO: take into account the ctx.cwd

                next();
            }
        }
    ],
    'incompatibilities': []
};

module.exports = task;