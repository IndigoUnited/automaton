var expect = require('expect.js'),
    fs     = require('fs'),
    isFile = require('../helpers/util/is-file'),
    isDir  = require('../helpers/util/is-dir')
;

module.exports = function (automaton) {
    describe('rm', function () {
        it('should remove files', function (done) {
            var dir  = __dirname + '/../tmp/rm/',
                file = 'file.js';

            // create dir
            fs.mkdirSync(dir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir)).to.be(true);
            });

            // create file
            fs.writeFileSync(dir + file, 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(dir + file)).to.be(true);
            });


            automaton.run('rm', {
                files: dir + file
            }, function (err) {
                if (err) {
                    done(err);
                }

                expect(isFile(dir + file)).to.be(false);
                expect(isDir(dir)).to.be(true);
                done();
            });
        });
        it('should remove folders', function (done) {
            var dir1 = __dirname + '/../tmp/rm/',
                dir2 = __dirname + '/../tmp/rm/dir1',
                dir3 = __dirname + '/../tmp/rm/dir2';

            // create dir1
            fs.mkdirSync(dir1, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir1)).to.be(true);
            });

            // create dir2
            fs.mkdirSync(dir2, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir2)).to.be(true);
            });

            // create dir3
            fs.mkdirSync(dir3, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir3)).to.be(true);
            });


            automaton.run('rm', {
                files: [dir2, dir3]
            }, function (err) {
                if (err) {
                    done(err);
                }
                expect(isDir(dir1)).to.be(true);
                expect(isDir(dir2)).to.be(false);
                expect(isDir(dir3)).to.be(false);
                done();
            });
        });
        it('should accept minimatch patterns', function (done) {
            var baseDir = __dirname + '/../tmp/rm/',
                dir     = __dirname + '/../tmp/rm/dir',
                file    = 'file.js';

            // create baseDir
            fs.mkdirSync(baseDir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(baseDir)).to.be(true);
            });

            // create dir
            fs.mkdirSync(dir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir)).to.be(true);
            });

            // create file
            fs.writeFileSync(dir + file, 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(dir + file)).to.be(true);
            });


            automaton.run('rm', {
                files: baseDir + '*'
            }, function (err) {
                if (err) {
                    done(err);
                }
                expect(isDir(baseDir)).to.be(true);
                expect(isDir(dir)).to.be(false);
                expect(isFile(dir + file)).to.be(false);
                done();
            });
        });
        it('should pass over the glob options', function (done) {
            var baseDir = __dirname + '/../tmp/rm/',
                dir     = __dirname + '/../tmp/rm/dir',
                file    = '.file.js';

            // create baseDir
            fs.mkdirSync(baseDir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(baseDir)).to.be(true);
            });

            // create dir
            fs.mkdirSync(dir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir)).to.be(true);
            });

            // create file
            fs.writeFileSync(baseDir + file, 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(baseDir + file)).to.be(true);
            });

            automaton.run('rm', {
                files: baseDir + '*',
                glob: {
                    dot: false
                }
            }, function (err) {
                if (err) {
                    done(err);
                }

                expect(isDir(baseDir)).to.be(true);
                expect(isDir(dir)).to.be(false);
                expect(isFile(baseDir + file)).to.be(true);
                done();
            });
        });
    });
};