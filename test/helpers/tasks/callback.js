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
    filter: function (opt, next) {
        opt.filterCallback.call(this, opt);
        next();
    },
    tasks: [
        {
            task: function (opt, next) {
                opt.callback.call(this, opt);
                next();
            }
        }
    ]
};