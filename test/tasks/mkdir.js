'use strict';

var expect = require('expect.js'),
    fs     = require('fs'),
    isDir  = require('../helpers/util/is-dir')
;

module.exports = function (automaton) {
    describe('mkdir', function () {
        var mode755_dir;

        before(function () {
            var target = __dirname + '/../tmp/mkdir_dummy/';

            // get the OS modes for dir
            fs.mkdirSync(target, '0755');
            mode755_dir = fs.statSync(target).mode;
        });

        beforeEach(function () {
            fs.mkdirSync(__dirname + '/../tmp/mkdir/', '0755');
        });

        it('should create directory - single depth folder', function (done) {

            var dir = __dirname + '/../tmp/mkdir/single_dir';

            automaton.run('mkdir', {
                dirs: dir
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dir)).to.be(true);
                done();
            });
        });

        it('should create directory - multiple depth folder', function (done) {

            var dir = __dirname + '/../tmp/mkdir/multiple_dir/dir1/dir2';

            automaton.run('mkdir', {
                dirs: dir
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dir)).to.be(true);
                done();
            });
        });

        it('should accept a directory or an array of directories', function (done) {

            var dirs = [];
            dirs.push(__dirname + '/../tmp/mkdir/dirs/dir1');
            dirs.push(__dirname + '/../tmp/mkdir/dirs/dir2');
            dirs.push(__dirname + '/../tmp/mkdir/dirs/dir3/dir4');

            automaton.run('mkdir', {
                dirs: dirs
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dirs[0])).to.be(true);
                expect(isDir(dirs[1])).to.be(true);
                expect(isDir(dirs[2])).to.be(true);
                done();
            });
        });

        it('should create directories with desired mode', function (done) {
            var dirs = [];

            dirs.push(__dirname + '/../tmp/mkdir/mode/dir1');
            dirs.push(__dirname + '/../tmp/mkdir/mode/dir2');
            dirs.push(__dirname + '/../tmp/mkdir/mode/dir3');
            dirs.push(__dirname + '/../tmp/mkdir/mode/dir3/dir4');

            automaton.run('mkdir', {
                dirs: dirs,
                mode: '0755'
            }, function (err) {
                if (err) {
                    throw err;
                }

                // verify if is dir
                expect(isDir(dirs[0])).to.be(true);
                expect(isDir(dirs[1])).to.be(true);
                expect(isDir(dirs[2])).to.be(true);
                expect(isDir(dirs[3])).to.be(true);

                // verify mode
                expect(fs.statSync(dirs[0]).mode).to.equal(mode755_dir);
                expect(fs.statSync(dirs[1]).mode).to.equal(mode755_dir);
                expect(fs.statSync(dirs[2]).mode).to.equal(mode755_dir);
                expect(fs.statSync(dirs[3]).mode).to.equal(mode755_dir);

                done();
            });
        });

        it('should error if target already exists', function (done) {
            var dir   = __dirname + '/../tmp/mkdir/';

            automaton.run('mkdir', {
                dirs: dir,
                mode: '0755'
            }, function (err) {

                expect(err).to.be.an(Error);
                expect(err.message).to.match(/already exists/);

                done();
            });
        });
    });
};