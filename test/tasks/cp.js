'use strict';

var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file'),
    isDir  = require('../helpers/util/is-dir'),
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

        it('should copy file to folder', function (done) {
            // test with a folder that exists
            // and with a folder that do not exists
            var files         = {},
                folder        = 'file_to_folder/',
                folder_exists = 'file_to_folder_exists/';

            files[__dirname + '/../helpers/assets/file1.json'] = target + folder;
            files[__dirname + '/../helpers/assets/file2'] = target + folder_exists;

            // create dir
            fs.mkdirSync(target + folder_exists);

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + folder + 'file1.json')).to.be(true);
                expect(isFile(target + folder_exists + 'file2')).to.be(true);
                done();
            });
        });

        it('should copy folder to folder', function (done) {
            var files  = {},
                src    = 'src/',
                dst    = 'dst/',
                file   = 'file.js';

            // create dir
            fs.mkdirSync(target + src);
            fs.mkdirSync(target + dst);

            // create file
            fs.writeFileSync(target + src + file, 'dummy');

            files[target + src + file] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + dst + file)).to.be(true);
                done();
            });
        });

        it('should copy folder to folder - destination folder does not exist', function (done) {
            // test folder to folder/
            // test folder to folder where folder does not exist
            var files  = {},
                src    = 'src/',
                dst    = 'dst/',
                dst2   = 'dst2',
                file   = 'file.js';

            // create dir
            fs.mkdirSync(target + src);

            // create file
            fs.writeFileSync(target + src + file, 'dummy');

            files[target + src] = [target + dst, target + dst2];

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(target + dst)).to.be(true);
                expect(isDir(target + dst + src)).to.be(true);
                expect(isFile(target + dst + src + file)).to.be(true);
                expect(isDir(target + dst2)).to.be(true);
                expect(isFile(target + dst2 + '/' + file)).to.be(true);
                done();
            });
        });

        it('should copy folder to folder - destination folder already exist', function (done) {
            // test folder to folder where folder already exists
            var files  = {},
                src    = 'src/',
                dst    = 'dst/',
                folder = 'folder',
                file   = 'file.js';

            // create dir
            fs.mkdirSync(target + src);
            fs.mkdirSync(target + src + folder);
            fs.mkdirSync(target + dst);
            fs.mkdirSync(target + dst + folder);

            // create file
            fs.writeFileSync(target + src + folder + '/' + file, 'dummy');

            files[target + src + folder] = target + dst + folder;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(target + dst + folder + '/' + folder)).to.be(true);
                expect(isFile(target + dst + folder + '/' + folder + '/' + file)).to.be(true);
                done();
            });
        });

        it('should copy files with single star pattern - source/*', function (done) {
            // test if ONLY files are copied with source/*
            var files  = {},
                src    = '../cp_single_star/',
                dst    = 'dst/',
                folder = 'folder',
                file   = 'file.js'
            ;
            // create dir
            fs.mkdirSync(target + src);
            fs.mkdirSync(target + src + folder);
            fs.mkdirSync(target + dst);

            // create file
            fs.writeFileSync(target + src + file, 'dummy');

            files[target + src + '*'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + dst + file)).to.be(true);
                expect(isDir(target + dst + folder)).to.be(false);
                done();
            });
        });

        it('should copy files and folders recursivelly - source/**/*', function (done) {
            // test if files and folders are recursivelly copied with source/**/*
            var files  = {},
                src    = '../cp_double_star/',
                dst    = 'dst/',
                folder = 'folder',
                file   = 'file.js'
            ;
            // create dir
            fs.mkdirSync(target + src);
            fs.mkdirSync(target + src + folder);
            fs.mkdirSync(target + dst);

            // create file
            fs.writeFileSync(target + src + file, 'dummy');

            files[target + src + '**/*'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + dst + file)).to.be(true);
                expect(isDir(target + dst + folder)).to.be(true);
                done();
            });
        });

        it('should give error if source file does not exist', function (done) {
            var files  = {},
                dst    = 'dst/';

            // create dir
            fs.mkdirSync(target + dst);

            files[target + 'file.js'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error if source folder does not exist', function (done) {
            var files  = {},
                dst    = 'dst/';

            // create dir
            fs.mkdirSync(target + dst);

            files[target + 'folder'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error if sources do not exist - simple', function (done) {
            var files  = {},
                dst    = 'dst/';

            // create dir
            fs.mkdirSync(target + dst);

            files[target + 'folder'] = target + dst;
            files[target + 'file.js'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error if sources do not exist - source/*', function (done) {
            var files  = {},
                dst    = 'dst/';

            // create dir
            fs.mkdirSync(target + dst);

            files[target + 'folder/*'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error if sources do not exist - source/**/*', function (done) {
            var files  = {},
                dst    = 'dst/';

            // create dir
            fs.mkdirSync(target + dst);

            files[target + 'folder/**/*'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
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

            // create symlink to file
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

        it('should work sources containing symlinks deeply inside them', function (done) {
            var files     = {},
                cp_folder = '../cp_folder_to_symlink/',
                src       = 'src_with_symlink/',
                dst       = 'dst_with_symlink/',
                symlink   = 'symlink',
                file      = 'file.js';

            fs.mkdirSync(target + cp_folder);
            fs.mkdirSync(target + src);

            // create file
            fs.writeFileSync(target + cp_folder + file, 'dummy');

            // create symlink to folder
            fs.symlinkSync(target + cp_folder, target + src + symlink, 'dir');

            files[target + src] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(target + dst + src)).to.be(true);
                expect(isDir(target + dst + src + symlink)).to.be(true);
                expect(isFile(target + dst + src + symlink + '/' + file)).to.be(true);
                done();
            });

        });

        it('should work sources containing symlinks deeply inside them - with source/**/* ', function (done) {
            var files     = {},
                cp_folder = '../cp_folder_to_symlink/',
                src       = 'src_with_symlink/',
                dst       = 'dst_with_symlink/',
                symlink   = 'symlink',
                file      = 'file.js';

            fs.mkdirSync(target + cp_folder);
            fs.mkdirSync(target + src);

            // create file
            fs.writeFileSync(target + cp_folder + file, 'dummy');

            // create symlink to folder
            fs.symlinkSync(target + cp_folder, target + src + symlink, 'dir');

            files[target + src + '/**/*'] = target + dst;

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(target + dst)).to.be(true);
                expect(isDir(target + dst + symlink)).to.be(true);
                expect(isFile(target + dst + symlink + '/' + file)).to.be(true);
                done();
            });

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

        it('should copy empty folders', function (done) {
            var files         = {},
                destination   = 'empty_folders/',
                folder1       = 'not_empty_folder/',
                folder2       = 'folder2/',
                folder3       = 'folder3/',
                file          = 'file.js';

            files[target + folder1] = target + destination;

            // create folders
            fs.mkdirSync(target + folder1);
            fs.mkdirSync(target + folder1 + folder2);
            fs.mkdirSync(target + folder1 + folder2 + folder3);

            // create file
            fs.writeFileSync(target + folder1 + folder2 + file, 'dummy');

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(target + destination + folder1)).to.be(true);
                expect(isDir(target + destination + folder1 + folder2)).to.be(true);
                expect(isDir(target + destination + folder1 + folder2 + folder3)).to.be(true);
                expect(isFile(target + destination + folder1 + folder2 + file)).to.be(true);
                done();
            });
        });

        it('should pass over the glob options - should not copy the .file', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/*'] = target;

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
            files[__dirname + '/../helpers/assets/*'] = target;

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
