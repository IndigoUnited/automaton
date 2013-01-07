var Automaton    = require('../index'),
    removeColors = require('../lib/Logger').removeColors,
    utils        = require('amd-utils'),
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
                    filter: function (opt, next) {
                        this.log.infoln('Level 1 task info');
                        this.log.warnln('Level 1 task warn');
                        this.log.successln('Level 1 task success');
                        this.log.errorln('Level 1 task error');
                        next();
                    },
                    description: 'Level 1 task',
                    tasks: [
                        {
                            task: function (opt, next) {
                                next();
                            },
                            description: 'Level 2 task'
                        },
                        {
                            task: {
                                description: 'This should not appear',
                                tasks: [
                                    {
                                        task: function (opt, next) {
                                            this.log.infoln('Level 3 task info');
                                            this.log.warnln('Level 3 task warn');
                                            this.log.successln('Level 3 task success');
                                            this.log.errorln('Level 3 task error');
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
                                        task: function (opt, next) { next(); },
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
                                        task: function (opt, next) { next(); }
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

        it('should not throw error when logging types other than strings', function (done) {
            var log = '';

            automaton
                .run({
                    description: '',
                    tasks: [
                        {
                            task: function (opt, next) {
                                this.log.infoln({});
                                this.log.infoln(['foo', 'bar']);
                                this.log.infoln(null);
                                this.log.infoln(undefined);
                                this.log.infoln(1);
                                this.log.infoln(true);

                                this.log.warnln({});
                                this.log.warnln(['foo', 'bar']);
                                this.log.warnln(null);
                                this.log.warnln(undefined);
                                this.log.warnln(1);
                                this.log.warnln(true);

                                this.log.successln({});
                                this.log.successln(['foo', 'bar']);
                                this.log.successln(null);
                                this.log.successln(undefined);
                                this.log.successln(1);
                                this.log.successln(true);

                                this.log.errorln({});
                                this.log.errorln(['foo', 'bar']);
                                this.log.errorln(null);
                                this.log.errorln(undefined);
                                this.log.errorln(1);
                                this.log.errorln(true);

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
                        indent('true\n', 2)
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
                            task: function (opt, next) {
                                this.log.infoln('foo');
                                this.log.info('bar');
                                this.log.info('baz');
                                this.log.ln();
                                this.log.infoln('faa');

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
                        indent('bar', 2) +
                        'baz' +
                        '\n' +
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
                            task: function (opt, next) {
                                this.log.infoln('foo\nbar\nbaz');
                                this.log.infoln('foo\r\nbar\r\nbaz');
                                this.log.infoln('\r\nbar\r\nbaz');

                                this.log.info('foo');
                                this.log.info('\r\nbar\r\nbaz');
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
                            task: function (opt, next) {
                                this.log.info('foo', true);
                                this.log.infoln('foo', true);
                                this.log.warn('foo', true);
                                this.log.warnln('foo', true);
                                this.log.error('foo', true);
                                this.log.errorln('foo', true);
                                this.log.success('foo', true);
                                this.log.successln('foo', true);

                                this.log.info('bar');
                                this.log.infoln('bar');
                                this.log.warn('bar');
                                this.log.warnln('bar');
                                this.log.error('bar');
                                this.log.errorln('bar');
                                this.log.success('bar');
                                this.log.successln('bar');

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
                        indent('bar\n', 2) +
                        indent('bar', 2) +
                        indent('bar\n', 2) +
                        indent('bar', 2) +
                        indent('bar\n', 2) +
                        indent('bar', 2) +
                        indent('bar\n', 2)
                    );

                    log = '';
                    var automaton = new Automaton({ debug: true });

                    automaton
                        .run({
                            tasks: [
                                {
                                    task: function (opt, next) {
                                        this.log.info('foo', true);
                                        this.log.infoln('foo', true);
                                        this.log.warn('foo', true);
                                        this.log.warnln('foo', true);
                                        this.log.error('foo', true);
                                        this.log.errorln('foo', true);
                                        this.log.success('foo', true);
                                        this.log.successln('foo', true);

                                        this.log.info('bar');
                                        this.log.infoln('bar');
                                        this.log.warn('bar');
                                        this.log.warnln('bar');
                                        this.log.error('bar');
                                        this.log.errorln('bar');
                                        this.log.success('bar');
                                        this.log.successln('bar');

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
                                indent('foo', 2) +
                                indent('foo\n', 2) +
                                indent('foo', 2) +
                                indent('foo\n', 2) +
                                indent('foo', 2) +
                                indent('foo\n', 2) +

                                indent('bar', 2) +
                                indent('bar\n', 2) +
                                indent('bar', 2) +
                                indent('bar\n', 2) +
                                indent('bar', 2) +
                                indent('bar\n', 2) +
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
                    filter: function (opt, next) {
                        this.log.infoln('Level 1 task info');
                        this.log.warnln('Level 1 task warn');
                        this.log.successln('Level 1 task success');
                        this.log.errorln('Level 1 task error');
                        next();
                    },
                    description: 'Level 1 task',
                    tasks: [
                        {
                            task: function (opt, next) {
                                next();
                            },
                            description: 'Level 2 task'
                        },
                        {
                            task: {
                                description: 'This should not appear',
                                tasks: [
                                    {
                                        task: function (opt, next) {
                                            this.log.infoln('Level 3 task info');
                                            this.log.warnln('Level 3 task warn');
                                            this.log.successln('Level 3 task success');
                                            this.log.errorln('Level 3 task error');
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
                                        task: function (opt, next) { next(); },
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
                                        task: function (opt, next) { next(); }
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
                            task: function (opt, next) {
                                this.log.info('foo');
                                this.log.infoln('foo'.green);
                                this.log.warn('foo');
                                this.log.warnln('foo');
                                this.log.error('foo'.blue);
                                this.log.errorln('foo');
                                this.log.success('foo');
                                this.log.successln('foo'.yellow);

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
    });
};