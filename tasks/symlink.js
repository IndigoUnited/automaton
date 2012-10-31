var task = {
    'id'     : 'symlink',
    'author' : 'Indigo United',
    'name'   : 'Symlink',
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