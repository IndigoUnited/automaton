'use strict';

var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file'),
    fs     = require('fs')
;

module.exports = function (automaton) {
    describe('cp', function () {
        var target = __dirname + '/../tmp/cp/';

        beforeEach(function () {
            fs.mkdirSync(target, '0777');
        });

        it('should copy file to file', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/file1.json'] = target + 'file1.json';
            files[__dirname + '/../helpers/assets/file2'] = target;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + 'file1.json')).to.be(true);
                expect(isFile(target + 'file2')).to.be(true);
                done();
            });
        });

        it.skip('should copy file to folder', function () {
            // test file to folder/
            // test file to folder where folder already exists
            // please confirm this behavior in the command line
        });

        it.skip('should copy folder to folder', function () {
            // test folder to folder/
            // test folder to folder where folder does not exist
            //  - it should copy folder to folder
            // test folder to folder where folder alredy exist
            //  - it should copy folder to folder/folder
        });

        it.skip('should copy files with single star pattern', function () {
            // test if ONLY files are copied with source/*
        });

        it.skip('should copy files and folders recursivelly', function () {
            // test if files and folders are recursivelly with with source/**/*
        });

        it.skip('should give error if source file does not exist');
        it.skip('should give error if source folder does not exist');
        it.skip('should give error if sources do not exist', function () {
            // test with source/* and source/**/*
        });

        it('should work with sources as symlinks', function (done) {
            var dir     = 'cp_dst/',
                file    = 'file.js',
                symlink = target + '../file.js',
                files   = {};

            // create file
            fs.writeFileSync(target + file, 'dummy');

            // create dir
            fs.mkdirSync(target + '../' + dir);

            // create symlink to folder in tmp
            fs.symlinkSync(target + file, symlink, 'file');

            // copy file
            files[symlink] = target + '../' + dir;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + '../' + dir + file)).to.be(true);
                done();
            });
        });

        it.skip('should work sources containing symlinks deeply inside them', function () {
            // test with a symlink inside the folder being copied
            // also test with source/**/* with a symlink deeply inside the source
            // it's important to make those separate tests because they have different piecies of code handling it
            //
            // check what is the unix behavior here.. to copy it as a symlink or follow the symlink
            // still an ISSUE should be created to add an option to the cp in order to change this behavior
        });

        it('should work with destinations as symlinks', function (done) {
            var folder  = target + 'folder/',
                file    = 'file.js',
                symlink = target + '../symlink_to_folder',
                files   = {};

            // create file
            fs.writeFileSync(target + file, 'dummy');

            // create dir
            fs.mkdirSync(folder);

            // create symlink to folder in tmp
            fs.symlinkSync(folder, symlink, 'dir');

            // copy file in /tmp/cp/file.js to /tmp/symlink/file.js
            // where symlink = cp/folder
            files[target + file] = symlink + '/';

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(symlink + '/' + file)).to.be(true);
                fs.unlinkSync(symlink);

                // copy file in /tmp/cp/file.js to /tmp/symlink
                // where symlink = cp/folder
                files[target + file] = symlink;

                automaton.run('cp', {
                    files: files
                }, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isFile(symlink)).to.be(true);
                    done();
                });

            });
        });

        it('should copy with default permissions', function (done) {
            var dir         = target + 'permissions/',
                folder      = 'folder/',
                file        = 'file.js',
                toCopy      = {},
                mode_dir,
                mode_file;

            // create dirs
            fs.mkdirSync(dir);
            fs.mkdirSync(target + folder);

            // get default dir mode
            mode_dir = fs.statSync(target + folder).mode;

            // change it to something else
            fs.chmodSync(target + folder, '0777');

            // create file
            fs.writeFileSync(target + file, 'dummy');

            // get file mode
            mode_file = fs.statSync(target + file).mode;

            // change it to something else
            fs.chmodSync(target + file, '0777');

            // file to copy
            toCopy[target + file]   = dir;
            toCopy[target + folder] = dir + 'folder/';

            automaton.run('cp', {
                files: toCopy
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(fs.statSync(toCopy[target + file] + file).mode).to.equal(mode_file);
                expect(fs.statSync(toCopy[target + folder]).mode).to.equal(mode_dir);
                done();
            });
        });

        it('should pass over the glob options - should not copy the file', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/*file'] = target;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + '.file')).to.be(false);
                done();
            });
        });

        it('should pass over the glob options - should copy the file', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/.file'] = target;

            automaton.run('cp', {
                files: files,
                glob: {
                    dot: true
                }
            }, function (err) {
                if (err) {
                    throw err;
                }
                expect(isFile(target + '.file')).to.be(true);
                done();
            });
        });
    });
};
