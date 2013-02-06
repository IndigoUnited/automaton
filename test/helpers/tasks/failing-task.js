'use strict';

module.exports = {
    id: 'failing-task',
    description: 'Failing task',
    options: {
        message: {
            default: 'bleh'
        },
        filter: {
            default: false
        },
        immediate: {
            default: false
        }
    },
    filter: function (opt, ctx, next) {
        var err = opt.filter ? new Error(opt.message) : null;

        if (err && opt.immediate) {
            throw err;
        }

        next(err);
    },
    tasks: [
        {
            task: function (opt, ctx, next) {
                var err = !opt.filter ? new Error(opt.message) : null;

                if (err && opt.immediate) {
                    throw err;
                }

                next(err);
            }
        }
    ]
};