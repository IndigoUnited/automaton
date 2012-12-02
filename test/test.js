/*jshint strict:false, node:true, onevar:false*/
/*global describe:true, it:true*/
var expect    = require('expect.js'),
    automaton = require('../index'),
    fs        = require('fs'),
    rimraf    = require('rimraf')
;

function cleanUpTmp() {
    rimraf.sync(__dirname + '/tmp');
}

// start by cleaning up the "tmp" folder
cleanUpTmp();

describe('Automaton', function () {
    describe('subtasks', function () {
        // test single subtask

        // test multiple subtask

        // test "on" field

        // test placeholder on descriptions

        // test placeholder on options

        // test placeholder on "on"
    });

    describe('filter', function () {

    });
});

describe('Tasks', function () {
    describe('cp', function () {
        it('should copy a file', function (done) {
//            expect(1).to.not.be.ok();
            automaton.run('cp', {
                src: __dirname + '/assets/file1.json',
                // TODO: add support for only specifying the dest folder, and filename is kept
                dst: __dirname + '/tmp/file1.json'
            }, function (err) {
                if (err) {
                    cleanUpTmp();
                    done(err);
                }

                expect(fs.existsSync(__dirname + '/tmp/file1.json')).to.be(true);

                cleanUpTmp();
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