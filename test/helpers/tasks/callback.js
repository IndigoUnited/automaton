module.exports = {
    id: 'callback',
    options: {
        filterCallback: {
            'default': function () {}
        },
        callback: {
            'default': function () {}
        },
        someOption: {
            'default': 'default'
        }
    },
    filter: function (opt, ctx, next) {
        opt.filterCallback.call(this, opt);
        next();
    },
    tasks: [
        {
            task: function (opt, ctx, next) {
                opt.callback.call(this, opt);
                next();
            }
        }
    ]
};