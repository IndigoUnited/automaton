'use strict';

var Automaton    = require('../index'),
    removeColors = require('../lib/Logger').removeColors,
    callbackTask = require('./helpers/tasks/callback'),
    utils        = require('mout'),
    expect       = require('expect.js'),
    Stream       = require('stream')
;

function arrow(msg, depth) {
    return utils.string.repeat('  ', depth - 1) + '> ' + msg + '\n';
}

function indent(msg, depth) {
    return utils.string.repeat('  ', depth - 1) + msg;
}

module.exports = function (automaton) {
    describe('Logging', function () {
        it('should return a stream when running tasks', function () {
            var ret = automaton
                .run({
                    tasks: []
                });

            expect(ret).to.be.a(Stream);

            ret = automaton
                .run({}); // attempt to run an invalid task on purpose

            expect(ret).to.be.a(Stream);
        });

        it('should report tasks with padding correspondent to the depth', function (done) {
            var log = '';

            automaton
                .run({
                    filter: function (opt, ctx, next) {
                        ctx.log.infoln('Level 1 task info');
                        ctx.log.warnln('Level 1 task warn');
                        ctx.log.successln('Level 1 task success');
                        ctx.log.errorln('Level 1 task error');
                        next();
                    },
                    description: 'Level 1 task',
                    tasks: [
                        {
                            task: {
                                description: 'This should not appear',
                                tasks: [
                                    {
                                        task: 'callback',
                                        description: null
                                    },
                                    {
                                        task: function (opt, ctx, next) {
                                            ctx.log.infoln('Level 3 task info');
                                            ctx.log.warnln('Level 3 task warn');
                                            ctx.log.successln('Level 3 task success');
                                            ctx.log.errorln('Level 3 task error');
                                            next();
                                        },
                                        description: 'Level 3 task'
                                    }
                                ]
                            },
                            description: null
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('Level 1 task', 1) +
                        indent('Level 1 task info\n', 1) +
                        indent('Level 1 task warn\n', 1) +
                        indent('Level 1 task success\n', 1) +
                        indent('Level 1 task error\n', 1) +
                        arrow('Level 3 task', 3) +
                        indent('Level 3 task info\n', 3) +
                        indent('Level 3 task warn\n', 3) +
                        indent('Level 3 task success\n', 3) +
                        indent('Level 3 task error\n', 3)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });


        it('should not report task descriptions if they are null', function (done) {
            var log = '';

            automaton
                .run({
                    filter: function (opt, ctx, next) {
                        ctx.log.infoln('Level 1 task info');
                        ctx.log.warnln('Level 1 task warn');
                        ctx.log.successln('Level 1 task success');
                        ctx.log.errorln('Level 1 task error');
                        next();
                    },
                    description: 'Level 1 task',
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                next();
                            },
                            description: 'Level 2 task'
                        },
                        {
                            task: {
                                description: 'This should not appear',
                                tasks: [
                                    {
                                        task: function (opt, ctx, next) {
                                            ctx.log.infoln('Level 3 task info');
                                            ctx.log.warnln('Level 3 task warn');
                                            ctx.log.successln('Level 3 task success');
                                            ctx.log.errorln('Level 3 task error');
                                            next();
                                        },
                                        description: 'Level 3 task'
                                    }
                                ]
                            },
                            description: 'Other level 2 task'
                        },
                        {
                            task: {
                                tasks: [
                                    {
                                        task: function (opt, ctx, next) { next(); },
                                        description: 'Other level 3 task'
                                    }
                                ]
                            }
                        },
                        {
                            task: {
                                name: 'Even other level 2 task',
                                tasks: [
                                    {
                                        task: function (opt, ctx, next) { next(); }
                                    }
                                ]
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('Level 1 task', 1) +
                        indent('Level 1 task info\n', 1) +
                        indent('Level 1 task warn\n', 1) +
                        indent('Level 1 task success\n', 1) +
                        indent('Level 1 task error\n', 1) +
                        arrow('Level 2 task', 2) +
                        arrow('Other level 2 task', 2) +
                        arrow('Level 3 task', 3) +
                        indent('Level 3 task info\n', 3) +
                        indent('Level 3 task warn\n', 3) +
                        indent('Level 3 task success\n', 3) +
                        indent('Level 3 task error\n', 3) +
                        arrow('??', 2) +
                        arrow('Other level 3 task', 3) +
                        arrow('Even other level 2 task', 2)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should log every arguments passed', function (done) {
            var log = '',
                automaton = new Automaton({ debug: true });

            automaton
                .run({
                    description: '',
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.info('foo', 'bar');
                                ctx.log.infoln('foo', 'bar');
                                ctx.log.warn('foo', 'bar');
                                ctx.log.warnln('foo', 'bar');
                                ctx.log.error('foo', 'bar');
                                ctx.log.errorln('foo', 'bar');
                                ctx.log.success('foo', 'bar');
                                ctx.log.successln('foo', 'bar');
                                ctx.log.debug('foo', 'bar');
                                ctx.log.debugln('foo', 'bar');

                                next();
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('foo bar', 2) +
                        indent('foo bar\n', 2) +
                        indent('foo bar', 2) +
                        indent('foo bar\n', 2) +
                        indent('foo bar', 2) +
                        indent('foo bar\n', 2) +
                        indent('foo bar', 2) +
                        indent('foo bar\n', 2) +
                        indent('foo bar', 2) +
                        indent('foo bar\n', 2)

                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should not throw error when logging types other than strings', function (done) {
            var log = '';

            automaton
                .run({
                    description: '',
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln({});
                                ctx.log.infoln(['foo', 'bar']);
                                ctx.log.infoln(null);
                                ctx.log.infoln(undefined);
                                ctx.log.infoln(1);
                                ctx.log.infoln(true);

                                ctx.log.warnln({});
                                ctx.log.warnln(['foo', 'bar']);
                                ctx.log.warnln(null);
                                ctx.log.warnln(undefined);
                                ctx.log.warnln(1);
                                ctx.log.warnln(true);

                                ctx.log.successln({});
                                ctx.log.successln(['foo', 'bar']);
                                ctx.log.successln(null);
                                ctx.log.successln(undefined);
                                ctx.log.successln(1);
                                ctx.log.successln(true);

                                ctx.log.errorln({});
                                ctx.log.errorln(['foo', 'bar']);
                                ctx.log.errorln(null);
                                ctx.log.errorln(undefined);
                                ctx.log.errorln(1);
                                ctx.log.errorln(true);

                                //////

                                ctx.log.info({});
                                ctx.log.info(['foo', 'bar']);
                                ctx.log.info(null);
                                ctx.log.info(undefined);
                                ctx.log.info(1);
                                ctx.log.info(true);

                                ctx.log.warn({});
                                ctx.log.warn(['foo', 'bar']);
                                ctx.log.warn(null);
                                ctx.log.warn(undefined);
                                ctx.log.warn(1);
                                ctx.log.warn(true);

                                ctx.log.success({});
                                ctx.log.success(['foo', 'bar']);
                                ctx.log.success(null);
                                ctx.log.success(undefined);
                                ctx.log.success(1);
                                ctx.log.success(true);

                                ctx.log.error({});
                                ctx.log.error(['foo', 'bar']);
                                ctx.log.error(null);
                                ctx.log.error(undefined);
                                ctx.log.error(1);
                                ctx.log.error(true);

                                next();
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('[object Object]\n', 2) +
                        indent('foo,bar\n', 2) +
                        indent('null\n', 2) +
                        indent('undefined\n', 2) +
                        indent('1\n', 2) +
                        indent('true\n', 2) +

                        indent('[object Object]\n', 2) +
                        indent('foo,bar\n', 2) +
                        indent('null\n', 2) +
                        indent('undefined\n', 2) +
                        indent('1\n', 2) +
                        indent('true\n', 2) +

                        indent('[object Object]\n', 2) +
                        indent('foo,bar\n', 2) +
                        indent('null\n', 2) +
                        indent('undefined\n', 2) +
                        indent('1\n', 2) +
                        indent('true\n', 2) +

                        indent('[object Object]\n', 2) +
                        indent('foo,bar\n', 2) +
                        indent('null\n', 2) +
                        indent('undefined\n', 2) +
                        indent('1\n', 2) +
                        indent('true\n', 2) +

                        ///////

                        indent('[object Object]', 2) +
                        'foo,bar' +
                        'null' +
                        'undefined' +
                        '1' +
                        'true' +

                        '[object Object]' +
                        'foo,bar' +
                        'null' +
                        'undefined' +
                        '1' +
                        'true' +

                        '[object Object]' +
                        'foo,bar' +
                        'null' +
                        'undefined' +
                        '1' +
                        'true' +

                        '[object Object]' +
                        'foo,bar' +
                        'null' +
                        'undefined' +
                        '1' +
                        'true'
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should not indent after a nonln log', function (done) {
            var log = '';

            automaton
                .run({
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('foo');
                                ctx.log.info('bar', 'ber');
                                ctx.log.info('baz');
                                ctx.log.infoln();
                                ctx.log.infoln('faa');

                                next();
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('foo\n', 2) +
                        indent('bar ber', 2) +
                        'baz' +
                        indent('\n', 2) +
                        indent('faa\n', 2)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should indent new lines in the middle of a message', function (done) {
            var log = '';

            automaton
                .run({
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('foo\nbar\nbaz');
                                ctx.log.infoln('foo\r\nbar\r\nbaz');
                                ctx.log.infoln('\r\nbar\r\nbaz');

                                ctx.log.info('foo');
                                ctx.log.info('\r\nbar\r\nbaz');
                                next();
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('foo\n', 2) +
                        indent('bar\n', 2) +
                        indent('baz\n', 2) +
                        indent('foo\r\n', 2) +
                        indent('bar\r\n', 2) +
                        indent('baz\n', 2) +
                        indent('\r\n', 2) +
                        indent('bar\r\n', 2) +
                        indent('baz\n', 2) +

                        indent('foo\r\n', 2) +
                        indent('bar\r\n', 2) +
                        indent('baz', 2)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should only log debug messages if automaton is in debug mode', function (done) {
            var log = '';

            automaton
                .run({
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.debug('foo');
                                ctx.log.debugln('foo');

                                ctx.log.info('bar');
                                ctx.log.infoln('bar');

                                next();
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('bar', 2) +
                        indent('bar\n', 2)
                    );

                    log = '';
                    var automaton = new Automaton({ debug: true });

                    automaton
                        .run({
                            tasks: [
                                {
                                    task: function (opt, ctx, next) {
                                        ctx.log.debug('foo');
                                        ctx.log.debugln('foo');

                                        ctx.log.info('bar');
                                        ctx.log.infoln('bar');

                                        next();
                                    }
                                }
                            ]
                        }, null, function (err) {
                            if (err) {
                                throw err;
                            }

                            log = removeColors(log);
                            expect(log).to.equal(
                                arrow('??', 1) +
                                indent('foo', 2) +
                                indent('foo\n', 2) +

                                indent('bar', 2) +
                                indent('bar\n', 2)
                            );

                            done();
                        })
                        .on('data', function (data) { log += data; });
                })
                .on('data', function (data) { log += data; });
        });

        it('should not log messages lower than the verbosity level', function (done) {
            var log = '',
                automaton = new Automaton({ verbosity: 1 });

            automaton
                .run({
                    filter: function (opt, ctx, next) {
                        ctx.log.infoln('Level 1 task info');
                        ctx.log.warnln('Level 1 task warn');
                        ctx.log.successln('Level 1 task success');
                        ctx.log.errorln('Level 1 task error');
                        next();
                    },
                    description: 'Level 1 task',
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                next();
                            },
                            description: 'Level 2 task'
                        },
                        {
                            task: {
                                description: 'This should not appear',
                                tasks: [
                                    {
                                        task: function (opt, ctx, next) {
                                            ctx.log.infoln('Level 3 task info');
                                            ctx.log.warnln('Level 3 task warn');
                                            ctx.log.successln('Level 3 task success');
                                            ctx.log.errorln('Level 3 task error');
                                            next();
                                        },
                                        description: 'Level 3 task'
                                    }
                                ]
                            },
                            description: 'Other level 2 task'
                        },
                        {
                            task: {
                                tasks: [
                                    {
                                        task: function (opt, ctx, next) { next(); },
                                        description: 'Other level 3 task'
                                    }
                                ]
                            }
                        },
                        {
                            task: {
                                name: 'Even other level 2 task',
                                tasks: [
                                    {
                                        task: function (opt, ctx, next) { next(); }
                                    }
                                ]
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('Level 1 task', 1) +
                        indent('Level 1 task info\n', 1) +
                        indent('Level 1 task warn\n', 1) +
                        indent('Level 1 task success\n', 1) +
                        indent('Level 1 task error\n', 1)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should remove colors if color option is set to false', function (done) {
            var log = '',
                automaton = new Automaton({ color: false });

            automaton
                .run({
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.info('foo');
                                ctx.log.infoln('foo'.green);
                                ctx.log.warn('foo');
                                ctx.log.warnln('foo');
                                ctx.log.error('foo'.blue);
                                ctx.log.errorln('foo');
                                ctx.log.success('foo');
                                ctx.log.successln('foo'.yellow);

                                next();
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('foo', 2) +
                        indent('foo\n', 2) +
                        indent('foo', 2) +
                        indent('foo\n', 2) +
                        indent('foo', 2) +
                        indent('foo\n', 2) +
                        indent('foo', 2) +
                        indent('foo\n', 2)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });

        it('should not log muted tasks', function (done) {
            var log = '';

            automaton
                .run({
                    tasks: [
                        // shold log
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('1');
                                next();
                            },
                            mute: false
                        },
                        // should NOT log
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('2');
                                next();
                            },
                            mute: true
                        },
                        // should NOT log
                        {
                            task: callbackTask,
                            options: {
                                callback: function (opt, ctx) {
                                    ctx.log.infoln('3');
                                }
                            },
                            mute: true
                        },
                        // should NOT log
                        {
                            task: {
                                tasks: [
                                    {
                                        task: callbackTask,
                                        options: {
                                            callback: function (opt, ctx) {
                                                ctx.log.infoln('4');
                                            }
                                        }
                                    },
                                    {
                                        task: callbackTask,
                                        options: {
                                            callback: function (opt, ctx) {
                                                ctx.log.infoln('5');
                                            }
                                        },
                                        mute: false
                                    }
                                ]
                            },
                            mute: true
                        },
                        // should log
                        {
                            task: callbackTask,
                            options: {
                                callback: function (opt, ctx) {
                                    ctx.log.infoln('6');
                                }
                            }
                        },
                        // should NOT log
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('7');
                                next();
                            },
                            mute: '{{foo}}'
                        },
                        // should NOT log
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('8');
                                next();
                            },
                            mute: function (opt, ctx) {
                                expect(opt).to.be.an('object');
                                expect(ctx).to.be.an('object');
                                expect(ctx.log).to.be.an('object');
                                expect(ctx).to.equal(this);

                                return true;
                            }
                        },
                        // should log
                        {
                            task: function (opt, ctx, next) {
                                ctx.log.infoln('9');
                                next();
                            },
                            mute: '{{non-existent}}'
                        }
                    ]
                }, { foo: true }, function (err) {
                    if (err) {
                        throw err;
                    }

                    log = removeColors(log);
                    expect(log).to.equal(
                        arrow('??', 1) +
                        indent('1\n', 2) +
                        arrow('Callback task', 2) +
                        arrow('??', 2) +
                        arrow('Callback task', 2) +
                        indent('6\n', 3) +
                        indent('9\n', 2)
                    );

                    done();
                })
                .on('data', function (data) { log += data; });
        });
    });
};