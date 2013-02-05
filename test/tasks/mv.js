'use strict';

var expect      = require('expect.js'),
    isFile      = require('../helpers/util/is-file'),
    isDir       = require('../helpers/util/is-dir'),
    fs          = require('fs')
;

module.exports = function (automaton) {
    describe('mv', function () {

        var target      = __dirname + '/../tmp/mv/',
            assetsDir   = target + 'assets/';

        beforeEach(function () {

            // create target dir
            fs.mkdirSync(target, '0777');

            // create assets dir in target
            fs.mkdirSync(assetsDir, '0777');

            // copy assets
            fs.createReadStream(__dirname + '/../helpers/assets/file1.json').pipe(fs.createWriteStream(assetsDir + 'file1.json'));
            fs.createReadStream(__dirname + '/../helpers/assets/file2').pipe(fs.createWriteStream(assetsDir + 'file2'));
            fs.createReadStream(__dirname + '/../helpers/assets/.file').pipe(fs.createWriteStream(assetsDir + '.file'));


        });

        it('should move file to file', function (done) {
            var files    = {},
                filename = 'file1.json';

            files[assetsDir + filename] = target + filename;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + filename)).to.be(true);
                expect(isFile(assetsDir + filename)).to.be(false);
                done();
            });
        });

        it('should move file to new file', function (done) {
            var files       = {},
                filename    = 'file1.json',
                newFilename = 'other_file1.json';

            files[assetsDir + filename] = target + newFilename;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + newFilename)).to.be(true);
                expect(isFile(assetsDir + filename)).to.be(false);
                done();
            });
        });

        it('should move file to folder', function (done) {
            var files    = {},
                filename = 'file1.json';

            files[assetsDir + filename] = target;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + filename)).to.be(true);
                expect(isFile(assetsDir + filename)).to.be(false);
                done();
            });
        });

        it('should move folder - destination folder already exist', function (done) {
            var files       = {},
                testTarget  = target + 'test/';

            // create dir
            fs.mkdirSync(testTarget, '0777');

            files[assetsDir] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isDir(testTarget + 'assets/')).to.be(true);
                expect(isDir(assetsDir)).to.be(false);

                expect(isFile(testTarget + 'assets/file1.json')).to.be(true);
                expect(isFile(testTarget + 'assets/file2')).to.be(true);
                expect(isFile(testTarget + 'assets/.file')).to.be(true);

                done();
            });
        });

        it('should move folder - destination folder does not exist (should create)', function (done) {
            var files       = {},
                testTarget  = target + 'test/';

            files[assetsDir] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isDir(testTarget + 'assets/')).to.be(true);
                expect(isDir(assetsDir)).to.be(false);

                expect(isFile(testTarget + 'assets/file1.json')).to.be(true);
                expect(isFile(testTarget + 'assets/file2')).to.be(true);
                expect(isFile(testTarget + 'assets/.file')).to.be(true);

                done();
            });
        });

        it('should move folder - destination folder does not exist (should return error)', function (done) {
            var files       = {},
                testTarget  = target + 'not/not/';

            files[assetsDir] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should move files', function (done) {
            var files          = {},
                file1          = 'file1.json',
                file2          = 'file2',
                anotherTarget  = __dirname + '/../tmp/mv/another_target/';

            files[assetsDir + file1] = target;
            files[assetsDir + file2] = anotherTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + file1)).to.be(true);
                expect(isFile(assetsDir + file1)).to.be(false);

                expect(isFile(anotherTarget + file2)).to.be(true);
                expect(isFile(assetsDir + file2)).to.be(false);
                done();
            });
        });

        it('should move folders', function (done) {
            var files            = {},
                file1            = 'file1.json',
                file2            = 'file2',
                file3            = '.file',
                anotherAssetsDir = target + 'another_assets/',
                anotherTarget    = __dirname + '/../tmp/mv/another_target/';


            // create assets dir in target
            fs.mkdirSync(anotherAssetsDir, '0777');

            // copy assets
            fs.createReadStream(__dirname + '/../helpers/assets/file1.json').pipe(fs.createWriteStream(anotherAssetsDir + file1));
            fs.createReadStream(__dirname + '/../helpers/assets/file2').pipe(fs.createWriteStream(anotherAssetsDir + file2));
            fs.createReadStream(__dirname + '/../helpers/assets/.file').pipe(fs.createWriteStream(anotherAssetsDir + file3));

            files[assetsDir]        = target + 'one_target/';
            files[anotherAssetsDir] = anotherTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + 'one_target/assets/' + file1)).to.be(true);
                expect(isFile(target + 'one_target/assets/' + file2)).to.be(true);
                expect(isFile(target + 'one_target/assets/' + file3)).to.be(true);

                expect(isDir(assetsDir)).to.be(false);
                expect(isFile(assetsDir + file1)).to.be(false);
                expect(isFile(assetsDir + file2)).to.be(false);
                expect(isFile(assetsDir + file3)).to.be(false);

                expect(isFile(anotherTarget + 'another_assets/' + file1)).to.be(true);
                expect(isFile(anotherTarget + 'another_assets/' + file2)).to.be(true);
                expect(isFile(anotherTarget + 'another_assets/' + file3)).to.be(true);

                expect(isFile(anotherAssetsDir + file2)).to.be(false);
                expect(isFile(anotherAssetsDir + file2)).to.be(false);
                expect(isFile(anotherAssetsDir + file2)).to.be(false);

                done();
            });
        });

        it('should move files - first an invalid file and then a valid file after', function (done) {
            var files       = {},
                filename    = 'file1.json',
                invalidFile = 'invalid_file';

            files[assetsDir + invalidFile] = target;
            files[assetsDir + filename]    = target + filename;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);

                expect(isFile(target + invalidFile)).to.be(false);
                expect(isFile(target + filename)).to.be(false);

                expect(isFile(assetsDir + invalidFile)).to.be(false);
                expect(isFile(assetsDir + filename)).to.be(true);
                done();
            });
        });

        it('should move files - first a valid file and then an invalid file after', function (done) {
            var files       = {},
                filename    = 'file1.json',
                invalidFile = 'invalid_file';

            files[assetsDir + filename]    = target + filename;
            files[assetsDir + invalidFile] = target;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);

                expect(isFile(target + filename)).to.be(true);
                expect(isFile(target + invalidFile)).to.be(false);

                expect(isFile(assetsDir + filename)).to.be(false);
                expect(isFile(assetsDir + invalidFile)).to.be(false);

                done();
            });
        });

        it('should move files with single star pattern - source/*', function (done) {
            var files       = {},
                testTarget  = target + 'test/';

            files[assetsDir + '*'] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isFile(testTarget + 'file1.json')).to.be(true);
                expect(isFile(testTarget + 'file2')).to.be(true);
                expect(isFile(testTarget + '.file')).to.be(false);

                expect(isDir(assetsDir)).to.be(true);
                expect(isFile(assetsDir + 'file1.json')).to.be(false);
                expect(isFile(assetsDir + 'file2')).to.be(false);
                expect(isFile(assetsDir + '.file')).to.be(true);
                done();
            });
        });

        it('should move files and folders recursivelly - source/**/*', function (done) {
            var files            = {},
                file1            = 'file1.json',
                file2            = 'file2',
                file3            = '.file',
                testTarget       = target + 'test/',
                anotherAssetsDir = assetsDir + 'another/';

            // create assets dir in target
            fs.mkdirSync(anotherAssetsDir, '0777');

            // copy assets
            fs.createReadStream(__dirname + '/../helpers/assets/file1.json').pipe(fs.createWriteStream(anotherAssetsDir + file1));
            fs.createReadStream(__dirname + '/../helpers/assets/file2').pipe(fs.createWriteStream(anotherAssetsDir + file2));
            fs.createReadStream(__dirname + '/../helpers/assets/.file').pipe(fs.createWriteStream(anotherAssetsDir + file3));

            files[assetsDir + '**/*'] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isDir(assetsDir)).to.be(true);
                expect(isDir(anotherAssetsDir)).to.be(false);
                expect(isDir(testTarget + 'another/')).to.be(true);

                expect(isFile(testTarget + 'file1.json')).to.be(true);
                expect(isFile(testTarget + 'file2')).to.be(true);
                expect(isFile(testTarget + '.file')).to.be(false);

                expect(isFile(assetsDir + 'file1.json')).to.be(false);
                expect(isFile(assetsDir + 'file2')).to.be(false);
                expect(isFile(assetsDir + '.file')).to.be(true);

                expect(isFile(testTarget + 'another/' + 'file1.json')).to.be(true);
                expect(isFile(testTarget + 'another/' + 'file2')).to.be(true);
                expect(isFile(testTarget + 'another/' + '.file')).to.be(true);

                done();
            });
        });

        it('should give error moving from invalid file', function (done) {
            var files = {};

            files[assetsDir + 'not.not'] = target;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error moving from invalid folder', function (done) {
            var files = {};

            files[assetsDir + 'not/'] = target;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error moving from invalid sources', function (done) {
            var files = {};

            files[assetsDir + 'not.not'] = target;
            files[assetsDir + 'not/'] = target;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should give error moving from invalid sources to invalid sources', function (done) {
            var files         = {},
                invalidTarget = target + 'invalid/';

            files[assetsDir + 'not.not'] = invalidTarget;
            files[assetsDir + 'not/'] = invalidTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {

                expect(err).to.be.ok();
                expect(err.message).to.match(/ENOENT/);
                done();
            });
        });

        it('should work with sources as symlinks', function (done) {
            var files       = {},
                symlink     = target + 'file1_symlink',
                testTarget  = target + 'test/';

            // create symlink to assets dir
            fs.symlinkSync(assetsDir + 'file1.json', symlink, 'file');

            files[symlink] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isFile(testTarget + 'file1_symlink')).to.be(true);

                done();
            });
        });

        it('should work with sources containing symlinks deeply inside them', function (done) {
            var files       = {},
                symlink     = target + '../symlink',
                testTarget  = target + 'test/';

            // create symlink to assets dir
            fs.symlinkSync(assetsDir, symlink, 'dir');

            files[symlink + '/*'] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isFile(testTarget + 'file1.json')).to.be(true);
                expect(isFile(testTarget + 'file2')).to.be(true);
                expect(isFile(testTarget + '.file')).to.be(false);

                expect(isDir(symlink)).to.be(true);
                expect(isFile(symlink + '/file1.json')).to.be(false);
                expect(isFile(symlink + '/file2')).to.be(false);
                expect(isFile(symlink + '/.file')).to.be(true);
                done();
            });
        });

        it('should work with sources containing symlinks deeply inside them - with source/**/*', function (done) {
            var files            = {},
                file1            = 'file1.json',
                file2            = 'file2',
                file3            = '.file',
                symlink          = target + '../symlink',
                testTarget       = target + 'test/',
                anotherAssetsDir = assetsDir + 'another/';

            // create symlink to assets dir
            fs.symlinkSync(assetsDir, symlink, 'dir');

            // create assets dir in target
            fs.mkdirSync(anotherAssetsDir, '0777');

            // copy assets
            fs.createReadStream(__dirname + '/../helpers/assets/' + file1).pipe(fs.createWriteStream(anotherAssetsDir + file1));
            fs.createReadStream(__dirname + '/../helpers/assets/' + file2).pipe(fs.createWriteStream(anotherAssetsDir + file2));
            fs.createReadStream(__dirname + '/../helpers/assets/' + file3).pipe(fs.createWriteStream(anotherAssetsDir + file3));

            files[symlink + '/**/*'] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isFile(testTarget + file1)).to.be(true);
                expect(isFile(testTarget + file2)).to.be(true);
                expect(isFile(testTarget + file3)).to.be(false);

                expect(isDir(testTarget + '/another')).to.be(true);
                expect(isFile(testTarget + '/another/' + file1)).to.be(true);
                expect(isFile(testTarget + '/another/' + file2)).to.be(true);
                expect(isFile(testTarget + '/another/' + file3)).to.be(true);

                expect(isDir(symlink)).to.be(true);
                expect(isFile(symlink + '/' + file1)).to.be(false);
                expect(isFile(symlink + '/' + file2)).to.be(false);
                expect(isFile(symlink + '/' + file3)).to.be(true);

                expect(isDir(symlink + '/another/')).to.be(false);
                expect(isFile(symlink + '/another/' + file1)).to.be(false);
                expect(isFile(symlink + '/antoher/' + file2)).to.be(false);
                expect(isFile(symlink + '/another/' + file3)).to.be(false);
                done();
            });
        });

        it('should work with destinations as symlinks', function (done) {
            var files       = {},
                file1       = 'file1.json',
                file2       = 'file2',
                file3       = '.file',
                symlink     = target + '../symlink',
                testTarget  = target + 'test/';

            // create test target dir
            fs.mkdirSync(testTarget, '0777');

            // create symlink to assets dir
            fs.symlinkSync(testTarget, symlink, 'dir');

            files[assetsDir + file1] = symlink;
            files[assetsDir + file2] = symlink;
            files[assetsDir + file3] = symlink;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isDir(symlink + '/')).to.be(true);
                expect(isFile(symlink + '/' + file1)).to.be(true);
                expect(isFile(symlink + '/' + file2)).to.be(true);
                expect(isFile(symlink + '/' + file3)).to.be(true);

                expect(isFile(assetsDir + file1)).to.be(false);
                expect(isFile(assetsDir + file2)).to.be(false);
                expect(isFile(assetsDir + file3)).to.be(false);

                done();
            });
        });

        it('should move file to folder with default permissions', function (done) {
            var files       = {},
                file        = 'file1.json',
                testTarget  = target + 'test/',
                modeDir,
                modeFile;

            // create test target dir
            fs.mkdirSync(testTarget, '0777');

            // get file mode
            modeFile = fs.statSync(assetsDir + file).mode;

            // get default dir mode
            modeDir = fs.statSync(assetsDir).mode;

            files[assetsDir] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(assetsDir)).to.be(false);
                expect(isDir(testTarget + 'assets/')).to.be(true);

                expect(isFile(assetsDir + file)).to.be(false);
                expect(isFile(testTarget + 'assets/' + file)).to.be(true);

                expect(fs.statSync(testTarget + 'assets/' + file).mode).to.equal(modeFile);
                expect(fs.statSync(testTarget + 'assets/').mode).to.equal(modeDir);
                done();
            });
        });

        it('should move empty folders', function (done) {
            var files       = {},
                file1       = 'file1.json',
                file2       = 'file2',
                file3       = '.file',
                testTarget  = target + 'test/',
                emptyDir    = assetsDir + 'empty/';

            // create test target dir
            fs.mkdirSync(emptyDir, '0777');

            files[assetsDir + '**/*'] = testTarget;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(testTarget)).to.be(true);
                expect(isFile(testTarget + file1)).to.be(true);
                expect(isFile(testTarget + file2)).to.be(true);
                expect(isFile(testTarget + file3)).to.be(false);

                expect(isDir(emptyDir)).to.be(false);
                expect(isDir(testTarget + 'empty/')).to.be(true);

                expect(isFile(assetsDir + file1)).to.be(false);
                expect(isFile(assetsDir + file2)).to.be(false);
                expect(isFile(assetsDir + file3)).to.be(true);

                done();
            });
        });

        it('should pass over the glob options - should not move the .file', function (done) {
            var files    = {},
                filename = '.file';

            files[assetsDir + '/*'] = target;

            automaton.run('mv', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + filename)).to.be(false);
                expect(isFile(assetsDir + filename)).to.be(true);
                done();
            });
        });

        it('should pass over the glob options - should move the .file', function (done) {
            var files    = {},
                filename = '.file';

            files[assetsDir + '/*'] = target;

            automaton.run('mv', {
                files: files,
                glob: {
                    dot: true
                }
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(target + filename)).to.be(true);
                expect(isFile(assetsDir + filename)).to.be(false);
                done();
            });
        });
    });
};
