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
    filter: function (opt) {
        opt.filterCallback(opt);
    },
    tasks: [
        {
            task: function (opt, next) {
                opt.callback(opt);
                next();
            }
        }
    ]
};