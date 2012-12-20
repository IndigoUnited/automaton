var expect    = require('expect.js'),
    fs        = require('fs'),
    isDir     = require('./helpers/util/is-dir')
;


module.exports = function (automaton) {
    describe('tasks', function () {
        it.skip('should throw if they have an invalid definition');

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

        // test "automaton.run" by providing the task id
        it('should be able to run by id', function (done) {
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

        // test if options are shared
        it('should be run in an isolated way', function (done) {
            var counter = 0;

            automaton.run({
                tasks: [
                    {
                        task: 'callback',
                        options: {
                            callback: function () {
                                ++counter;
                            }
                        }
                    }
                ]
            }, null, function (err) {
                if (err) {
                    return done(err);
                }

                automaton.run({
                    tasks: [
                        {
                            task: 'callback'  // same task but with no options!
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    expect(counter).to.equal(1);
                    done();
                });
            });
        });

        // test inline subtask
        it('should be able to run inline subtasks', function (done) {
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

        // test "on" field
        it('should skip a subtask when its "on" attribute has a falsy placeholder', function (done) {
            var stack = [];

            // TODO: test infered on filter
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

        it.skip('show fail if all required options have not been passed');
        it.skip('should assume default options if absent');

        it.skip('should have placeholders replaced in its description');

        it('should have placeholders replaced in their options', function (done) {
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

        it.skip('should ignore escaped placeholders');
    });

    // test filter
    describe('filter', function () {
        it('should execute before the task itself', function (done) {
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

        it('should be able to modify options and infer new ones', function (done) {
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
};