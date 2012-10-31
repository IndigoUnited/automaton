var task = {
    'id'     : 'exec',
    'author' : 'Indigo United',
    'name'   : 'Execute',
    'tasks'  :
    [
        {
            'task' : function (ctx, opt, next) {
                // TODO: validate required options
                // TODO: take into account the ctx.cwd

                next();
            }
        }
    ]
};

module.exports = task;