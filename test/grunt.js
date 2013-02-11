'use strict';

var expect       = require('expect.js'),
    fs           = require('fs'),
    isDir        = require('./helpers/util/is-dir'),
    isFile       = require('./helpers/util/is-file'),
    removeColors = require('../lib/Logger').removeColors,
    Runner       = require('../lib/grunt/Runner')
;

module.exports = function (automaton) {
    var target = __dirname + '/tmp/grunt/';

    describe('Grunt Runner', function () {
        var runner;

        before(function () {
            runner = new Runner();
        });

        beforeEach(function () {
            fs.mkdirSync(target, '0777');
        });

        it('should run grunt tasks', function (done) {
            var opts = {},
                stack = [];

            opts[target] = __dirname + '/helpers/assets/file2';

            runner.run('copy', {
                files: opts
            }, null).on('end', function (err) {
                if (err) {
                    throw err;
                }

                stack.push(1);
                expect(isDir(target)).to.be(true);
                expect(isFile(target + 'file2')).to.be(true);
            });

            opts = {};
            opts[target] = __dirname + '/helpers/assets/file1.json';
            runner.run('copy', {
                files: opts
            }, null).on('end', function (err) {
                if (err) {
                    throw err;
                }

                stack.push(2);
                expect(isDir(target)).to.be(true);
                expect(isFile(target + 'file1.json')).to.be(true);
                expect(stack).to.eql([1, 2]);

                done();
            });
        });

        it('should emit "start", "data", and "end" events', function (done) {
            var opts = {},
                stack = [],
                stack2 = [],
                emitter;

            opts[target] = __dirname + '/helpers/assets/file2';

            emitter = runner.run('copy', {
                files: opts
            }, null).on('end', function (err) {
                if (err) {
                    throw err;
                }

                expect(stack[0]).to.equal('start');
                expect(stack[1]).to.equal('data');
            });

            emitter
                .on('start', function () { stack.push('start'); })
                .on('data', function () { stack.push('data'); });

            opts = {};
            opts[target] = __dirname + '/helpers/assets/filethatwillneverexist';

            emitter = runner.run('not_loaded_task', {
                files: opts
            }, null).on('end', function (err) {
                expect(err).to.be.an(Error);
                expect(stack2[0]).to.equal('start');

                done();
            });

            emitter
                .on('start', function () { stack2.push('start'); })
                .on('data', function () { stack2.push('data'); });
        });

        it('should emit "error" event', function (done) {
            var runner = new Runner(),
                error;

            fs.renameSync(__dirname + '/../node_modules/grunt', __dirname + '/../node_modules/grunt_');

            // when grunt is not found, an error is emitted
            runner.run('bleh', {}, null)
            .on('error', function (err) {
                error = err.message;
            })
            .on('end', function (err) {
                fs.renameSync(__dirname + '/../node_modules/grunt_', __dirname + '/../node_modules/grunt');

                expect(err).to.be.an(Error);
                expect(error).to.be.a('string');
                expect(error).to.contain('find grunt');

                done();
            });
        });

        it('should emit "end" with error if task failed', function (done) {
            runner.run('copy', {
                files: {
                    'wtv': 'filethatwillneverexist'
                }
            }, null).on('end', function (err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.contain('grunt');

                done();
            });
        });

        it('should pass the grunt config (and not inherit from others)', function (done) {
            runner.run('copy', {
                files: {
                    'wtv': 'filethatwillneverexist'
                }
            }, { force: true }).on('end', function (err) {
                if (err) {
                    throw err;
                }
            });

            runner.run('copy', {
                files: {
                    'wtv': 'filethatwillneverexist'
                }
            }, null).on('end', function (err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.contain('grunt');

                done();
            });
        });

        it('should kill the worker', function (done) {
            this.timeout(5000);

            var opts = {};
            opts[target] = __dirname + '/helpers/assets/file2';

            runner.run('copy', {
                files: opts
            }, null).on('end', function () {
                throw new Error('Should have killed!');
            });

            runner.kill();
            setTimeout(function () {
                opts = {};
                opts[target] = __dirname + '/helpers/assets/file1.json';

                runner.run('copy', {
                    files: opts
                }, null).on('end', function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isDir(target)).to.be(true);
                    expect(isFile(target + 'file1.json')).to.be(true);

                    done();
                });
            }, 4000);
        });
    });

    describe('Grunt integration', function () {
        it('should respect task order', function (done) {
            var opts = {},
                opts2 = {},
                stack = [];

            opts[target] = __dirname + '/helpers/assets/file2';
            opts2[target] = __dirname + '/helpers/assets/file1.json';

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
            var opts = {},
                log = '';

            opts[target] = __dirname + '/helpers/assets/file2';

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
                var x,
                    lines;

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
            var opts = {};

            opts[target] = __dirname + '/helpers/assets/filethatwillneverexist';

            automaton.run({
                tasks: [
                    {
                        task: 'copy',
                        grunt: {
                            force: true
                        },
                        options: {
                            files: opts
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
            var opts = {};

            opts[target] = __dirname + '/helpers/assets/filethatwillneverexist';

            automaton.run({
                tasks: [
                    {
                        task: 'copy',
                        grunt: {
                            force: true
                        },
                        options: {
                            files: opts
                        }
                    },
                    {
                        task: 'copy',
                        grunt: true,
                        options: {
                            files: opts
                        }
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

            opts[target] = __dirname + '/helpers/assets/{{file}}';

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
            var opts = {};

            opts[target] = __dirname + '/helpers/assets/filethatwillneverexist';

            automaton.run({
                tasks: [
                    {
                        task: 'copy',
                        grunt: true,
                        fatal: false,
                        options: {
                            files: opts
                        }
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
                            task: 'copy',
                            grunt: true,
                            options: {
                                files: opts
                            }
                        }
                    ]
                }, null, function (err) {
                    expect(err).to.be.an(Error);
                    done();
                });
            });
        });

        it('should integrate well with mute', function (done) {
            var opts = {},
                log = '';

            opts[target] = __dirname + '/helpers/assets/file2';

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

            opts[target] = __dirname + '/helpers/assets/file2}';

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
            var log = '',
                dummyTask = process.cwd() + '/tasks/grunt-dummy.js';

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

            fs.renameSync(__dirname + '/../node_modules/grunt', __dirname + '/../node_modules/grunt_');

            automaton.run({
                tasks: [
                    {
                        task: 'taskthatwillneverexist',
                        grunt: true
                    }
                ]
            }, null, function (err) {
                fs.renameSync(__dirname + '/../node_modules/grunt_', __dirname + '/../node_modules/grunt');

                expect(err).to.be.an(Error);
                expect(log).to.contain('find grunt');

                done();
            })
            .on('data', function (data) { log += data; });
        });
    });
};