'use strict';

var expect       = require('expect.js'),
    fs           = require('fs'),
    isDir        = require('./helpers/util/is-dir'),
    callbackTask = require('./helpers/tasks/callback'),
    removeColors = require('../lib/Logger').removeColors
;

module.exports = function (automaton) {
    describe('Engine', function () {
        after(function () {
            automaton.removeTask('foo');
        });

        it('should throw if a task is invalid', function () {
            // not an object
            expect(function () {
                automaton.addTask('foo');
            }).to.throwException(/an object/);

            // no subtasks
            expect(function () {
                automaton.addTask({});
            }).to.throwException(/subtasks to be an array/);

            // no id
            expect(function () {
                automaton.addTask({
                    tasks: []
                });
            }).to.throwException(/only add tasks with an id/);

            // empty id
            expect(function () {
                automaton.addTask({
                    id: '',
                    tasks: []
                });
            }).to.throwException(/empty/);

            // invalid name/author
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    name: 1,
                    tasks: []
                });
            }).to.throwException(/name/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    author: 1,
                    tasks: []
                });
            }).to.throwException(/author/);

            // empty name/author
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    name: '',
                    tasks: []
                });
            }).to.throwException(/empty/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    author: '',
                    tasks: []
                });
            }).to.throwException(/empty/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    author: 'André',
                    tasks: []
                });
            }).to.not.throwException();

            // invalid description
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    description: 1,
                    tasks: []
                });
            }).to.throwException(/description/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    description: function () {},
                    tasks: []
                });
            }).to.throwException(/description/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    description: 'Some task',
                    tasks: []
                });
            }).to.not.throwException();

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    description: null,
                    tasks: []
                });
            }).to.not.throwException();

            // invalid options
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    options: 1,
                    tasks: []
                });
            }).to.throwException(/options/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    options: {},
                    tasks: []
                });
            }).to.not.throwException();

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    options: {
                        opt1: 1
                    },
                    tasks: []
                });
            }).to.throwException(/options/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    options: {
                        opt1: {
                            description: 1
                        }
                    },
                    tasks: []
                });
            }).to.throwException(/option description/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    options: {
                        opt1: {
                            description: function () {}
                        }
                    },
                    tasks: []
                });
            }).to.throwException(/option description/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    options: {
                        opt1: {
                            description: 'test'
                        }
                    },
                    tasks: []
                });
            }).to.not.throwException();

            // test filter
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    filter: 1,
                    tasks: []
                });
            }).to.throwException(/filter/);

            expect(function () {  // test valid case
                automaton.addTask({
                    id: 'foo',
                    filter: function () {},
                    tasks: []
                });
            }).to.not.throwException();

            // test tasks
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [1]
                });
            }).to.throwException();

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [{}]
                });
            }).to.throwException(/task/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 1
                        }
                    ]
                });
            }).to.throwException(/task/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp'
                        }
                    ]
                });
            }).to.not.throwException();

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp',
                            options: 1
                        }
                    ]
                });
            }).to.throwException(/options/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: {
                                tasks: []
                            },
                            options: 1
                        }
                    ]
                });
            }).to.throwException(/options/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp',
                            options: {}
                        }
                    ]
                });
            }).to.not.throwException();

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp',
                            description: 1
                        }
                    ]
                });
            }).to.throwException(/description/);

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp',
                            description: function () {}
                        }
                    ]
                });
            }).to.throwException(/description/);


            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: {
                                tasks: []
                            },
                            description: function () {}
                        }
                    ]
                });
            }).to.throwException(/description/);

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp',
                            description: 'copy something'
                        }
                    ]
                });
            }).to.not.throwException();

            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: 'cp',
                            description: null
                        }
                    ]
                });
            }).to.not.throwException();

            // test deep tasks validation
            expect(function () {
                automaton.addTask({
                    id: 'foo',
                    tasks: [
                        {
                            task: {
                                tasks: 1
                            },
                            description: 'copy something'
                        }
                    ]
                });
            }).to.throwException(/tasks/);

            // test that run also triggers validation for not loaded/added tasks
            automaton.run({
                tasks: [
                    {
                        task: {
                            tasks: 1
                        },
                        description: 'copy something'
                    }
                ]
            }, null, function (err) {
                expect(err).to.be.ok();
                expect(err.message).to.match(/tasks/);
            });
        });

        it('should add tasks by id', function (done) {
            var called = 0;

            automaton.addTask({
                id: 'callback',
                tasks: []
            });

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                called++;
                            }
                        }
                    }
                ]
            }, null, function (err) {
                automaton.addTask(callbackTask);

                if (err) {
                    throw err;
                }

                expect(called === 0).to.equal(true);

                automaton.run({
                    tasks: [
                        {
                            task: 'callback',
                            options: {
                                callback: function () {
                                    called++;
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(called === 1).to.equal(true);
                    done();
                });
            });
        });

        it('should remove tasks by id', function (done) {
            automaton.removeTask('callback');

            automaton.run({
                tasks: [
                    {
                        task: 'callback'
                    }
                ]
            }, null, function (err) {
                automaton.addTask(callbackTask);

                if (!err) {
                    throw new Error('Callback task was not deleted');
                }

                expect(err.message).to.match(/task handler suitable/);
                done();
            });
        });

        it('should load tasks in folder', function () {
            // for now this test does not need verifications
            // because the root test is loading the tasks folder
            // that has the callback task that is being used all over the place
            //
            // if we ever support loading nested folders, then the test must account for that
        });

        // test run
        it('should run a single subtask', function (done) {
            var called = false;

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                called = true;
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                expect(called).to.be(true);
                done();
            });
        });

        it('should run multiple subtasks, and different options, by the correct order', function (done) {
            var stack = [];

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                stack.push(1);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                stack.push(3);
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                expect(stack).to.eql([1, 2, 3]);
                done();
            });
        });

        it('should be able to run task by id', function (done) {
            var dirname = __dirname + '/tmp/dir';

            automaton.run('mkdir', {
                dirs: dirname
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dirname)).to.be(true);
                done();
            });
        });

        it('should run deep tasks specified directly in tasks inside tasks (not by id)', function (done) {
            var stack = [];

            automaton.run({
                tasks: [
                    {
                        task: {
                            tasks: [
                                {
                                    task: 'callback',
                                    options: {
                                        callback: function () {
                                            stack.push(1);
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                expect(stack).to.eql([1, 2]);
                done();
            });
        });

        it('should run inline subtasks', function (done) {
            var dirname = __dirname + '/tmp/dir';

            automaton.run({
                tasks: [
                    {
                        task: function (opt, ctx, next) {
                            fs.mkdir(dirname, parseInt('0777', 8), next);
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dirname)).to.be(true);
                done();
            });
        });

        // test callback
        it('should call the callback once done running a task', function (done) {
            automaton.run({
                tasks: [
                    {
                        task: 'callback'
                    }
                ]
            }, null, function () {
                done();
            });
        });

        it('should pass an error (without colors) to the callback if there was an one', function (done) {
            var assert = function (err) {
                expect(err).to.be.ok();
                expect(err.message).to.equal('wtf');
                expect(removeColors(err.message) === err.message).to.equal(true);
            };

            automaton.run({
                tasks: [
                    {
                        task: function (opt, ctx, next) {
                            next(new Error('wtf'));
                        }
                    }
                ]
            }, null, function (err) {
                assert(err);

                automaton.run({
                    tasks: [
                        {
                            task: function (opt, ctx, next) {
                                next('wtf');
                            }
                        }
                    ]
                }, null, function (err) {
                    assert(err);

                    done();
                });
            });
        });

        // test if options are shared
        it('should run tasks in an isolated way', function (done) {
            var counter = 0,
                shared;

            shared = {
                task: 'callback',
                options: {
                    callback: '{{test}}'
                }
            };

            automaton.run({
                tasks: [shared]
            }, { test: function () { counter++; }}, function (err) {
                if (err) {
                    throw err;
                }

                automaton.run({
                    tasks: [shared]
                }, { test: function () { }}, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(counter).to.equal(1);
                    done();
                });
            });
        });

        // test "on" field
        it('should skip a subtask when its "on" attribute has a falsy placeholder', function (done) {
            var stack = [];

            automaton.run({
                filter: function (opt, ctx, next) {
                    opt.truthy2 = true;
                    next();
                },
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                stack.push(1);
                            }
                        }
                    },
                    {
                        task: function () {
                            stack.push(2);
                        },
                        on: '{{falsy1}}'
                    },
                    {
                        task: 'callback',
                        on: '{{falsy1}}',
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: '{{falsy2}}',
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: '{{falsy3}}',
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: '{{non_existent}}',
                        options: {
                            callback: function () {
                                stack.push(4);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: '{{truthy1}}',
                        options: {
                            callback: function () {
                                stack.push(3);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: '{{truthy2}}',
                        options: {
                            callback: function () {
                                stack.push(4);
                            }
                        }
                    }
                ]
            }, { falsy1: false, falsy2: undefined, falsy3: null, truthy1: 'foo' }, function (err) {
                if (err) {
                    throw err;
                }

                expect(stack).to.eql([1, 3, 4]);
                done();
            });
        });

        it('should skip a task when its "on" attribute is falsy', function (done) {
            var stack = [];

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                stack.push(1);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: false,
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: undefined,
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: null,
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: null,
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: function (opts, ctx) {
                            expect(opts).to.be.an('object');
                            expect(ctx).to.be.an('object');
                            expect(ctx.log).to.be.an('object');
                            expect(ctx).to.equal(this);

                            return false;
                        },
                        options: {
                            callback: function () {
                                stack.push(2);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: true,
                        options: {
                            callback: function () {
                                stack.push(3);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: [],
                        options: {
                            callback: function () {
                                stack.push(4);
                            }
                        }
                    },
                    {
                        task: 'callback',
                        on: function () { return true; },
                        options: {
                            callback: function () {
                                stack.push(5);
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                expect(stack).to.eql([1, 3, 4, 5]);
                done();
            });
        });

        // test required options
        it('should throw if all required task options have not been passed', function (done) {
            automaton.run({
                tasks: [
                    {
                        task: 'mkdir'
                    }
                ]
            }, null, function (err) {
                expect(err).to.be.ok();
                expect(err.message).to.match(/missing/i);

                done();
            });
        });

        // test default options
        it('should assume default task options if absent', function (done) {
            automaton.run({
                options: {
                    foo: {
                        'default': 'bar'
                    }
                },
                filter: function (opt, ctx, next) {
                    expect(opt.foo).to.equal('bar');
                    next();
                },
                tasks: []
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                automaton.run({
                    options: {
                        foo: {
                            'default': 'bar'
                        }
                    },
                    filter: function (opt, ctx, next) {
                        expect(opt.foo).to.equal('baz');
                        next();
                    },
                    tasks: []
                }, { foo: 'baz' }, function (err) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
            });
        });

        // test options replacement
        it('should replaced placeholders in task options', function (done) {
            var someObj = { foo: 'bar' };
            var opts = {
                opt1: 'x',
                opt2: 'y',
                opt3: true,
                opt4: someObj
            };

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            foo: '{{opt1}}-{{opt2}}',
                            bar: '{{opt3}}',
                            baz: '{{opt4}}',
                            arr: ['{{opt4}}', 'foo'],
                            obj: {
                                '{{opt1}}': '{{opt4}}',
                                '{{opt2}}': '{{opt1}}-{{opt2}}'
                            },
                            callback: function (opt) {
                                expect(opt.foo).to.be.equal('x-y');
                                expect(opt.bar === true).to.be.equal(true);
                                expect(opt.baz.foo === someObj.foo).to.be.equal(true);
                                expect(opt.arr[0].foo === someObj.foo).to.be.equal(true);
                                expect(opt.obj.x.foo === someObj.foo).to.be.equal(true);
                                expect(opt.obj.y).to.be.equal('x-y');
                            }
                        }
                    },
                    {
                        task: {
                            tasks: [
                                {
                                    task: 'callback',
                                    options: {
                                        foo: '{{opt1}}-{{opt2}}',
                                        bar: '{{opt3}}',
                                        baz: '{{opt4}}',
                                        arr: ['{{opt4}}', 'foo'],
                                        obj: {
                                            '{{opt1}}': '{{opt4}}',
                                            '{{opt2}}': '{{opt1}}-{{opt2}}'
                                        },
                                        callback: function (opt) {
                                            expect(opt.foo).to.be.equal('x-y');
                                            expect(opt.bar === true).to.be.equal(true);
                                            expect(opt.baz.foo === someObj.foo).to.be.equal(true);
                                            expect(opt.arr[0].foo === someObj.foo).to.be.equal(true);
                                            expect(opt.obj.x.foo === someObj.foo).to.be.equal(true);
                                            expect(opt.obj.y).to.be.equal('x-y');
                                        }
                                    }
                                }
                            ]
                        },
                        options: opts
                    }
                ]
            }, opts, function (err) {
                if (err) {
                    throw err;
                }

                done();
            });
        });

        it('should ignore escaped placeholders in task options', function (done) {
            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            someOption: '\\{\\{foo\\}\\}',
                            filterCallback: function (opt) {
                                expect(opt.someOption).to.equal('\\{\\{foo\\}\\}');
                            },
                            callback: function (opt) {
                                expect(opt.someOption).to.equal('{{foo}}');
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                done();
            });
        });

        it('should execute filters before their respective tasks', function (done) {
            var filtered = false,
                wrong = false;

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            filterCallback: function () {
                                filtered = true;
                            },
                            callback: function () {
                                if (!filtered) {
                                    wrong = true;
                                }
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                if (!filtered || wrong) {
                    throw new Error('Filtered not called or called after task');
                }

                done();
            });
        });

        it('should let filters modify options and infer new ones', function (done) {
            automaton.run({
                filter: function (opt, ctx, next) {
                    opt.very = 'awesome';
                    opt.ultra = 'awesome';
                    next();
                },
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            ultra: '{{ultra}}',
                            very: '{{very}}',
                            filterCallback: function (opt) {
                                opt.foo = 'bar';
                                opt.someOption = 'baz';
                            },
                            callback: function (opt) {
                                expect(opt.foo).to.equal('bar');
                                expect(opt.someOption).to.equal('baz');
                                expect(opt.very).to.be.equal('awesome');
                                expect(opt.ultra).to.be.equal('awesome');
                            }
                        }
                    }
                ]
            }, { ultra: 'cool' }, function (err) {
                if (err) {
                    throw err;
                }

                done();
            });
        });

        it('should bypass tasks that fail if fatal is falsy', function (done) {
            var ok = false;

            automaton.run({
                tasks: [
                    {
                        task: 'failing-task',
                        fatal: false,
                        options: {
                            message: 'first'
                        }
                    },
                    {
                        task: 'callback',
                        fatal: false,
                        options: {
                            filter: true,
                            message: 'second'
                        }
                    },
                    {
                        task: 'failing-task',
                        fatal: '{{foo}}',
                        options: {
                            message: 'third'
                        }
                    },
                    {
                        task: 'callback',
                        fatal: function (err, opts, ctx) {
                            expect(err).to.be.an(Error);
                            expect(opts).to.be.an('object');
                            expect(ctx).to.be.an('object');
                            expect(ctx.log).to.be.an('object');
                            expect(ctx).to.equal(this);

                            return false;
                        },
                        options: {
                            message: 'forth'
                        }
                    },
                    {
                        task: function (opts, ctx, next) {
                            next(new Error('bleh'));
                        },
                        fatal: false
                    },
                    {
                        task: function (opts, ctx, next) {
                            ok = true;
                            next();
                        }
                    },
                    {
                        task: 'failing-task',
                        fatal: '{{bar}}',
                        options: {
                            message: 'third'
                        }
                    }
                ]
            }, { bar: true }, function (err) {
                expect(err).to.be.ok();
                expect(ok).to.be.ok();
                done();
            });
        });

        describe('context', function () {
            it('should offer a logging interface for tasks to report', function (done) {
                var assert = function (ctx) {
                    expect(ctx.log).to.be.ok();
                    expect(ctx.log.info).to.be.a('function');
                    expect(ctx.log.infoln).to.be.a('function');
                    expect(ctx.log.warn).to.be.a('function');
                    expect(ctx.log.warnln).to.be.a('function');
                    expect(ctx.log.error).to.be.a('function');
                    expect(ctx.log.errorln).to.be.a('function');
                    expect(ctx.log.success).to.be.a('function');
                    expect(ctx.log.successln).to.be.a('function');
                };

                automaton.run({
                    filter: function (opt, ctx, next) {
                        assert(this);
                        next();
                    },
                    tasks: [
                        {
                            task: 'callback',
                            options: {
                                filterCallback: function () {
                                    assert(this);
                                },
                                callback: function () {
                                    assert(this);
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
            });

            it('should provide a prompt interface', function () {
                automaton
                    .run({
                        tasks: [
                            {
                                task: function (opts, ctx, next) {
                                    expect(ctx.prompt).to.be.an('object');
                                    expect(ctx.prompt.prompt).to.be.a('function');
                                    expect(ctx.prompt.choose).to.be.a('function');
                                    expect(ctx.prompt.password).to.be.a('function');
                                    expect(ctx.prompt.confirm).to.be.a('function');
                                    next();
                                }
                            }
                        ]
                    });
            });
        });
    });
};