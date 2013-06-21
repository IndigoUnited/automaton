/*global describe, it, before, beforeEach, after*/

'use strict';

var expect       = require('expect.js');
var mkdirp       = require('mkdirp');
var rimraf       = require('rimraf');
var fs           = require('fs');
var isDir        = require('./helpers/util/isDir');
var isFile       = require('./helpers/util/isFile');
var removeColors = require('../lib/Logger').removeColors;
var Runner       = require('../lib/grunt/Runner');

module.exports = function (automaton) {
    var target = __dirname + '/tmp/grunt/';

    describe('Grunt', function () {
        describe('Runner', function () {
            var runner;

            before(function () {
                runner = new Runner();
            });

            beforeEach(function () {
                mkdirp.sync(target, '0777');
                if (fs.existsSync(__dirname + '/../node_modules/grunt/_package.json')) {
                    fs.renameSync(__dirname + '/../node_modules/grunt/_package.json', __dirname + '/../node_modules/grunt/package.json');
                }
            });

            it('should run grunt tasks (multi task)', function (done) {
                var opts = {};
                var stack = [];

                opts[target + 'file2'] = __dirname + '/helpers/assets/file2';

                runner.run('copy', {
                    files: opts
                })
                .on('error', function () {})
                .on('end', function () {
                    stack.push(1);
                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'file2')).to.be(true);
                });

                opts = {};
                opts[target + 'file1.json'] = __dirname + '/helpers/assets/file1.json';
                runner.run('copy', {
                    files: opts
                })
                .on('error', function (err) {
                    throw err;
                })
                .on('end', function () {
                    stack.push(2);
                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'file1.json')).to.be(true);
                    expect(stack).to.eql([1, 2]);

                    done();
                });
            });

            it('should run grunt task (not multi task)', function (done) {
                var stack = [];

                runner.run('dummy-single', {
                    file: target + 'dummy'
                }, {
                    tasks: [__dirname + '/helpers/tasks']
                })
                .on('error', function () {})
                .on('end', function () {
                    stack.push(1);
                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'dummy')).to.be(true);
                });

                runner.run('dummy-single', {
                    file: target + 'dummy2'
                }, {
                    tasks: [__dirname + '/helpers/tasks']
                })
                .on('error', function (err) {
                    throw err;
                })
                .on('end', function () {
                    stack.push(2);
                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'dummy2')).to.be(true);
                    expect(stack).to.eql([1, 2]);
                    done();
                });
            });

            it('should emit "start", "data", "error" and "end" events', function (done) {
                var emitter;
                var opts = {};
                var stack = [];
                var stack2 = [];

                opts[target + 'file2'] = __dirname + '/helpers/assets/file2';

                emitter = runner.run('copy', {
                    files: opts
                })
                .on('error', function () {})
                .on('end', function () {
                    expect(stack[0]).to.equal('start');
                    expect(stack[1]).to.equal('data');
                });

                emitter
                .on('start', function () { stack.push('start'); })
                .on('data', function () { stack.push('data'); });

                emitter = runner.run('not_loaded_task').on('error', function (err) {
                    expect(err).to.be.an(Error);
                    expect(stack2[0]).to.equal('start');

                    done();
                });

                emitter
                .on('start', function () { stack2.push('start'); })
                .on('data', function () { stack2.push('data'); });
            });

            it('should emit "error" if task failed', function (done) {
                runner.run('jshint', {
                    src: [__dirname + '/helpers/assets/invalid.js']
                }).on('error', function (err) {
                    expect(err).to.be.an(Error);
                    expect(err.message).to.contain('grunt');

                    done();
                });
            });

            it('should pass the grunt config (and not inherit from others)', function (done) {
                runner.run('jshint', {
                    src: [__dirname + '/helpers/assets/invalid.js']
                }, { force: true }).on('error', function (err) {
                    throw err;
                });

                runner.run('jshint', {
                    src: [__dirname + '/helpers/assets/invalid.js']
                }).on('error', function (err) {
                    expect(err).to.be.an(Error);
                    expect(err.message).to.contain('grunt');

                    done();
                });
            });

            it('should kill the worker', function (done) {
                this.timeout(5000);

                var opts = {};
                var timeout;

                opts[target] = __dirname + '/helpers/assets/file2';

                runner.run('copy', {
                    files: opts
                })
                .on('error', function (err) {
                    clearTimeout(timeout);
                    throw err;
                })
                .on('end', function () {
                    clearTimeout(timeout);
                    throw new Error('Should have killed!');
                });

                runner.kill();

                timeout = setTimeout(function () {
                    opts = {};
                    opts[target + 'file1.json'] = __dirname + '/helpers/assets/file1.json';

                    runner.run('copy', {
                        files: opts
                    })
                    .on('error', function (err) {
                        clearTimeout(timeout);
                        throw err;
                    })
                    .on('end', function () {
                        expect(isDir(target)).to.be(true);
                        expect(isFile(target + 'file1.json')).to.be(true);

                        done();
                    });
                }, 4000);
            });
        });

        describe('Integration', function () {
            before(function () {
                mkdirp.sync(process.cwd() + '/tasks');
            });
            after(function (done) {
                rimraf(process.cwd() + '/tasks', done);
            });

            beforeEach(function () {
                if (fs.existsSync(__dirname + '/../node_modules/grunt/_package.json')) {
                    fs.renameSync(__dirname + '/../node_modules/grunt/_package.json', __dirname + '/../node_modules/grunt/package.json');
                }
            });

            it('should respect task order', function (done) {
                var opts = {};
                var opts2 = {};
                var stack = [];

                opts[target + 'file2'] = __dirname + '/helpers/assets/file2';
                opts2[target + 'file1.json'] = __dirname + '/helpers/assets/file1.json';

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
                            task: 'copy',
                            grunt: true,
                            options: {
                                files: opts
                            }
                        },
                        // Test if the worker correctly works after an error
                        {
                            task: 'taskthatwillneverexist',
                            grunt: true,
                            fatal: false
                        },
                        {
                            task: 'copy',
                            grunt: true,
                            options: {
                                files: opts2
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
                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'file2')).to.be(true);
                    expect(isFile(target + 'file1.json')).to.be(true);

                    done();
                });
            });

            it('should log indented output', function (done) {
                var opts = {};
                var log = '';

                opts[target + 'file2'] = __dirname + '/helpers/assets/file2';

                automaton.run({
                    tasks: [
                        {
                            task: 'copy',
                            grunt: true,
                            options: {
                                files: opts
                            }
                        }
                    ]
                }, null, function (err) {
                    var x;
                    var lines;

                    if (err) {
                        throw err;
                    }

                    lines = removeColors(log).split('\n');
                    for (x = 1; x < lines.length; ++x) {
                        if (lines[x] && lines[x].charAt(0) !== ' ') {
                            throw new Error('Indentation not respected.');
                        }
                    }

                    done();
                })
                .on('data', function (data) { log += data; });
            });

            it('should pass grunt config', function (done) {
                automaton.run({
                    tasks: [
                        {
                            task: 'jshint',
                            grunt: {
                                force: true
                            },
                            options: {
                                src: [__dirname + '/helpers/assets/invalid.js']
                            }
                        }
                    ]
                }, null, function (err) {
                    // the file does not exist but we use force: true,
                    // so grunt should not complain about it
                    if (err) {
                        throw err;
                    }

                    done();
                });
            });

            it('should not inherit previous grunt config', function (done) {
                var opts = {
                    src: [__dirname + '/helpers/assets/invalid.js']
                };

                automaton.run({
                    tasks: [
                        {
                            task: 'jshint',
                            grunt: {
                                force: true
                            },
                            options: opts
                        },
                        {
                            task: 'jshint',
                            grunt: true,
                            options: opts
                        }
                    ]
                }, null, function (err) {
                    expect(err).to.be.an(Error);
                    expect(err.message).to.contain('grunt');

                    done();
                });
            });

            it('should integrate well with options replacement', function (done) {
                var opts = {};

                opts[target + 'file2'] = __dirname + '/helpers/assets/{{file}}';

                automaton.run({
                    tasks: [
                        {
                            task: 'copy',
                            grunt: true,
                            options: {
                                files: opts
                            }
                        }
                    ]
                }, { file: 'file2' }, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'file2')).to.be(true);

                    done();
                });
            });

            it('should integrate well with fatal', function (done) {
                var opts = {
                    src: [__dirname + '/helpers/assets/invalid.js']
                };

                automaton.run({
                    tasks: [
                        {
                            task: 'jshint',
                            grunt: true,
                            fatal: false,
                            options: opts
                        }
                    ]
                }, null, function (err) {
                    // the file does not exist but we pass fatal: false
                    // so autoamton should not complain about it
                    if (err) {
                        throw err;
                    }

                    // test without fatal
                    automaton.run({
                        tasks: [
                            {
                                task: 'jshint',
                                grunt: true,
                                options: opts
                            }
                        ]
                    }, null, function (err) {
                        expect(err).to.be.an(Error);
                        done();
                    });
                });
            });

            it('should integrate well with mute', function (done) {
                var opts = {};
                var log = '';

                opts[target + 'file2'] = __dirname + '/helpers/assets/file2';

                automaton.run({
                    tasks: [
                        {
                            task: 'copy',
                            grunt: true,
                            mute: true,
                            options: {
                                files: opts
                            }
                        }
                    ]
                }, null, function (err) {
                    var lines;

                    if (err) {
                        throw err;
                    }

                    lines = removeColors(log).split('\n');
                    expect(lines.length <= 2).to.equal(true);

                    done();
                })
                .on('data', function (data) { log += data; });
            });

            it('should integrate well with on', function (done) {
                var opts = {};

                opts[target + 'file2'] = __dirname + '/helpers/assets/file2';

                automaton.run({
                    tasks: [
                        {
                            task: 'copy',
                            grunt: true,
                            on: false,
                            options: {
                                files: opts
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isDir(target)).to.be(false);
                    done();
                });
            });

            it('should load tasks specified in the grunt config', function (done) {
                var log = '';

                automaton.run({
                    tasks: [
                        {
                            task: 'dummy',
                            grunt: {
                                tasks: __dirname + '/helpers/tasks'
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(log).to.contain('dummy');
                    done();
                })
                .on('data', function (data) { log += data; });
            });

            it('should autoload npm tasks and tasks located in tasks/', function (done) {
                var log = '';
                var dummyTask = process.cwd() + '/tasks/grunt-dummy.js';

                // the autoload npm tasks is not necessary to test because the tests above ensure it (copy task)
                // so this test must only assert the autoload of tasks/

                // copy the dummy grunt task to tasks/
                fs.writeFileSync(dummyTask, fs.readFileSync(__dirname + '/helpers/tasks/grunt-dummy.js'));

                automaton.run({
                    tasks: [
                        {
                            task: 'dummy',
                            grunt: true
                        }
                    ]
                }, null, function (err) {
                    fs.unlinkSync(dummyTask);

                    if (err) {
                        throw err;
                    }

                    expect(log).to.contain('dummy');
                    done();
                })
                .on('data', function (data) { log += data; });
            });

            it('should error when task is not loaded', function (done) {
                var log = '';

                automaton.run({
                    tasks: [
                        {
                            task: 'taskthatwillneverexist',
                            grunt: true
                        }
                    ]
                }, null, function (err) {
                    expect(err).to.be.an(Error);
                    expect(err.message).to.contain('not loaded');

                    done();
                })
                .on('data', function (data) { log += data; });
            });

            it('should error when grunt is not loaded', function (done) {
                var log = '';

                fs.renameSync(__dirname + '/../node_modules/grunt/package.json', __dirname + '/../node_modules/grunt/_package.json');

                automaton.run({
                    tasks: [
                        {
                            task: 'taskthatwillneverexist',
                            grunt: true
                        }
                    ]
                }, null, function (err) {
                    fs.renameSync(__dirname + '/../node_modules/grunt/_package.json', __dirname + '/../node_modules/grunt/package.json');

                    expect(err).to.be.an(Error);
                    expect(log).to.contain('find grunt');

                    done();
                })
                .on('data', function (data) { log += data; });
            });
        });
    });
};