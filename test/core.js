var expect    = require('expect.js'),
    fs        = require('fs'),
    isDir     = require('./helpers/util/is-dir')
;

module.exports = function (automaton) {
    describe('Engine', function () {
        it('should throw if a task is invalid', function () {
            after(function () {
                automaton.removeTask('foo');
            });

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

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    description: 'Some task',
                    tasks: []
                });
            }).to.not.throwException();

            expect(function () { // test valid case
                automaton.addTask({
                    id: 'foo',
                    description: function () { return 'Some Task'; },
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
                    return done(err);
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
                    return done(err);
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
                    return done(err);
                }

                expect(isDir(dirname)).to.be(true);
                done();
            });
        });

        it.skip('should run deep tasks specified directly in tasks inside tasks (not by id)');

        it('should run inline subtasks', function (done) {
            var dirname = __dirname + '/tmp/dir';

            automaton.run({
                tasks: [
                    {
                        task: function (opt, next) {
                            fs.mkdir(dirname, parseInt('0777', 8), next);
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    return done(err);
                }

                expect(isDir(dirname)).to.be(true);
                done();
            });
        });

        // test callback
        it.skip('should call the callback once done running a task');
        it.skip('should pass an error (without colors) to the callback if there was an one');

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
                    return done(err);
                }

                automaton.run({
                    tasks: [shared]
                }, { test: function () { }}, function (err) {
                    if (err) {
                        return done(err);
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
                filter: function (opt, next) {
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
                    return done(err);
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
                        on: function () { return false; },
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
                    return done(err);
                }

                expect(stack).to.eql([1, 3, 4, 5]);
                done();
            });
        });

        it.skip('should throw if all required task options have not been passed');
        it.skip('should assume default task options if absent');

        it.skip('should replace placeholders in task descriptions', function () {
            // test description as string and function
        });
        it.skip('should ignore escaped placeholders in task options');

        it('should replaced placeholders in task options', function (done) {
            var someObj = {};
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
                            callback: function (opt) {
                                expect(opt.foo).to.be.equal('x-y');
                                expect(opt.bar === true).to.be.equal(true);
                                expect(opt.baz === someObj).to.be.equal(true);
                            }
                        }
                    }
                ]
            }, opts, function (err) {
                done(err);
            });

            // TODO: test if replacements is being done deeply in arrays and objects
            //       in case of objects, its keys and values should be replaced
        });
        it.skip('should ignore escaped placeholders in task options');

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
                    return done(err);
                }

                if (!filtered || wrong) {
                    return done(new Error('Filtered not called or called after task'));
                }

                done();
            });
        });

        it('should let filters modify options and infer new ones', function (done) {
            automaton.run({
                filter: function (opt, next) {
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
                done(err);
            });
        });
    });

    describe('Logger', function () {
        // TODO: add tests for the logger
    });
};