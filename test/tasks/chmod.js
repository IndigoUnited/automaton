var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file'),
    isDir  = require('../helpers/util/is-dir'),
    fs     = require('fs')
;

module.exports = function (automaton) {
    describe('chmod', function () {
        it('should change mode of files', function (done) {

            var dir          = __dirname + '/../tmp/chmod/',
                file         = 'file.js',
                expectedMode = process.platform === 'win32' ? 16822 : 16877;

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


            automaton.run('chmod', {
                files: dir + file,
                mode: '0755'
            }, function (err) {
                if (err) {
                    done(err);
                }

                expect(fs.statSync(dir + file).mode === expectedMode).to.be(true);
                done();
            });
        });

        it('should accept a file or an array of files', function (done) {
            var dir          = __dirname + '/../tmp/chmod/',
                file1        = 'file1.js',
                file2        = 'file2.js',
                files        = [],
                expectedMode = process.platform === 'win32' ? 16822 : 16877;

            files.push(dir + file1);
            files.push(dir + file2);

            // create dir
            fs.mkdirSync(dir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir)).to.be(true);
            });

            // create file1
            fs.writeFileSync(files[0], 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(files[0])).to.be(true);
            });

            // create file2
            fs.writeFileSync(files[1], 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(files[1])).to.be(true);
            });


            automaton.run('chmod', {
                files: files,
                mode: '0755'
            }, function (err) {
                if (err) {
                    done(err);
                }

                expect(fs.statSync(files[0]).mode === expectedMode).to.be(true);
                expect(fs.statSync(files[1]).mode === expectedMode).to.be(true);

                done();
            });
        });

        it('should accept minimatch patterns', function (done) {
            var dir          = __dirname + '/../tmp/chmod/',
                file1        = 'file1.js',
                file2        = 'file2.js',
                files        = [],
                expectedMode = process.platform === 'win32' ? 16822 : 16877;

            files.push(dir + file1);
            files.push(dir + file2);

            // create dir
            fs.mkdirSync(dir, parseInt('0777', 8), function (err) {
                if (err) {
                    return done(err);
                }
                expect(isDir(dir)).to.be(true);
            });

            // create file1
            fs.writeFileSync(files[0], 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(files[0])).to.be(true);
            });

            // create file2
            fs.writeFileSync(files[1], 'dummy', 'utf8', function (err) {
                if (err) {
                    return done(err);
                }
                expect(isFile(files[1])).to.be(true);
            });


            automaton.run('chmod', {
                files: dir + '*.js',
                mode: '0755'
            }, function (err) {
                if (err) {
                    done(err);
                }

                expect(fs.statSync(files[0]).mode === expectedMode).to.be(true);
                expect(fs.statSync(files[1]).mode === expectedMode).to.be(true);

                done();
            });
        });

        it('should pass over the glob options', function (done) {
            var dir          = __dirname + '/../tmp/chmod/',
                file         = '.file.js',
                expectedMode = process.platform === 33188;

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

            automaton.run('chmod', {
                files: dir + '*.js',
                mode: '0755',
                glob: {
                    dot: false
                }
            }, function (err) {
                console.log(err);


                expect(fs.statSync(dir + file).mode === expectedMode).to.be(true);
                done();
            });
        });
    });
};