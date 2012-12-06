/*jshint strict:false, node:true, onevar:false*/
/*global describe:true, it:true, beforeEach:true, after:true, before:true, afterEach:true*/
var expect    = require('expect.js'),
    automaton = require('../index'),
    fs        = require('fs'),
    rimraf    = require('rimraf')
;

// disable output
automaton.setVerbosity(0);

function cleanUpTmp(done) {
    rimraf(__dirname + '/tmp', done);
}

function prepareTmp(done) {
    cleanUpTmp(function (err) {
        if (err) {
            return done(err);
        }

        fs.mkdir(__dirname + '/tmp', 0777, done);
    });
}

describe('Automaton', function () {
    beforeEach(prepareTmp);
    after(cleanUpTmp);

    describe('subtasks', function () {
        it('should run a task with a single subtask', function (done) {
            var dirname = __dirname + '/tmp/dir';

            automaton.run({
                tasks: [
                    {
                        task: 'mkdir',
                        options: {
                            dir: dirname
                        }
                    }
                ]
            }, {}, function (err) {
                if (err) {
                    return done(err);
                }

                expect(fs.existsSync(dirname)).to.be(true);
                done();
            });
        });

        it('should run a task with multiple subtasks, and different options', function (done) {
            var dirname = __dirname + '/tmp/dir';
            
            automaton.run({
                tasks: [
                    {
                        task: 'mkdir',
                        options: {
                            dir: dirname + 0
                        }
                    },
                    {
                        task: 'mkdir',
                        options: {
                            dir: dirname + 1
                        }
                    },
                    {
                        task: 'mkdir',
                        options: {
                            dir: dirname + 2
                        }
                    }
                ]
            }, {}, function (err) {
                if (err) {
                    return done(err);
                }

                expect(fs.existsSync(dirname + 0)).to.be(true);
                expect(fs.existsSync(dirname + 1)).to.be(true);
                expect(fs.existsSync(dirname + 2)).to.be(true);
                done();
            });
        });

        // test inline subtask
        it('should run a task with inline subtasks', function (done) {
            var dirname = __dirname + '/tmp/dir';

            automaton.run({
                tasks: [
                    {
                        task: function (opt, next) {
                            fs.mkdir(dirname, 0777, next);
                        }
                    }
                ]
            }, {}, function (err) {
                if (err) {
                    return done(err);
                }

                expect(fs.existsSync(dirname)).to.be(true);
                done();
            });
        });

        // test "automaton.run" by providing the task id
        it('should run a task by its id', function (done) {
            var dirname = __dirname + '/tmp/dir';

            automaton.run('mkdir', {
                dir: dirname
            }, function (err) {
                if (err) {
                    return done(err);
                }

                expect(fs.existsSync(dirname)).to.be(true);
                done();
            });
        });

        // test "on" field

        // test placeholder on descriptions

        // test placeholder on options

        // test placeholder on "on"
    });

    // test filter
    describe('filter', function () {

    });
});

describe('Tasks', function () {
    beforeEach(prepareTmp);
    after(cleanUpTmp);

    describe('cp', function () {
        it('should copy a file', function (done) {
            automaton.run('cp', {
                src: __dirname + '/assets/file1.json',
                // TODO: add support for only specifying the dest folder, and filename is kept
                dst: __dirname + '/tmp/file1.json'
            }, function (err) {
                if (err) {
                    return done(err);
                }

                expect(fs.existsSync(__dirname + '/tmp/file1.json')).to.be(true);
                done();
            });
        });

        it.skip('should copy a folder', function () {

        });

        it.skip('should throw error because source does not exist', function () {
            
        });
    });

    describe('mkdir', function () {
        it.skip('should create folder', function () {
            // single level folder

            // multiple depth folder
        });
    });

    describe('rm', function () {
        it.skip('should remove folder', function () {

        });

        it.skip('should remove file', function () {

        });
    });

    describe('run', function () {
        it.skip('should run command', function () {

        });

        it.skip('should run command in a different cwd', function () {

        });
    });

    describe('scaffolding', function () {
        it.skip('should append string to placeholder', function () {

        });

        it.skip('should append file to placeholder', function () {

        });

        it.skip('should replace placeholder with string', function () {

        });

        it.skip('should replace placeholder with file', function () {

        });

        it.skip('should close placeholder', function () {

        });
    });

    describe('symlink', function () {
        it.skip('should create symlink', function () {

        });
    });

    describe('init-task', function () {
        it.skip('should initialize an empty task', function () {

        });
    });
});