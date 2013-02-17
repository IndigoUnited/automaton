'use strict';

module.exports = function (task) {
    task
    .id('callback-builder')
    .description('Callback task')

    .option('setupCallback', null, function () {})
    .option('teardownCallback', null, function () {})
    .option('callback', null, function () {})
    .option('someOption', null, 'default')

    .setup(function (opt, ctx, next) {
        opt.setupCallback.call(this, opt, ctx);
        next();
    })
    .teardown(function (opt, ctx, next) {
        opt.teardownCallback.call(this, opt, ctx);
        next();
    })
    .do(function (opt, ctx, next) {
        opt.callback.call(this, opt, ctx);
        next();
    });
};