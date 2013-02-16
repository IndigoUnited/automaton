'use strict';

module.exports = {
    id: 'failing-task',
    description: 'Failing task',
    options: {
        message: {
            default: 'bleh'
        },
        setup: {
            default: false
        },
        teardown: {
            default: false
        },
        immediate: {
            default: false
        }
    },
    setup: function (opt, ctx, next) {
        var err = opt.setup ? new Error(opt.message) : null;

        if (err && opt.immediate) {
            throw err;
        }

        next(err);
    },
    teardown: function (opt, ctx, next) {
        var err = opt.teardown ? new Error(opt.message) : null;

        if (err && opt.immediate) {
            throw err;
        }

        next(err);
    },
    tasks: [
        {
            task: function (opt, ctx, next) {
                var err = !opt.setup && !opt.teardown ? new Error(opt.message) : null;

                if (err && opt.immediate) {
                    throw err;
                }

                next(err);
            }
        }
    ]
};