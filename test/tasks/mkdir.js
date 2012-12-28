var expect = require('expect.js'),
    fs     = require('fs'),
    isDir  = require('../helpers/util/is-dir')
;

module.exports = function (automaton) {
    describe('mkdir', function () {
        it('should create directory - single depth folder', function (done) {

            var dir = __dirname + '/../tmp/mkdir/single_dir';

            automaton.run('mkdir', {
                dirs: dir
            }, function (err) {
                if (err) {
                    return done(err);
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
                    return done(err);
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
                    return done(err);
                }

                expect(isDir(dirs[0])).to.be(true);
                expect(isDir(dirs[1])).to.be(true);
                expect(isDir(dirs[2])).to.be(true);
                done();
            });
        });

        it('should create directories with desired mode', function (done) {
            var dirs = [],
                expectedMode = process.platform === 'win32' ? 16822 : 16877,
                dir3 = __dirname + '/../tmp/mkdir/mode/dir3',
                dir4 = dir3 + '/dir4';

            dirs.push(__dirname + '/../tmp/mkdir/mode/dir1');
            dirs.push(__dirname + '/../tmp/mkdir/mode/dir2');
            dirs.push(dir4);



            automaton.run('mkdir', {
                dirs: dirs,
                mode: '0755'
            }, function (err) {
                if (err) {
                    return done(err);
                }

                // verify if is dir
                expect(isDir(dirs[0])).to.be(true);
                expect(isDir(dirs[1])).to.be(true);
                expect(isDir(dir3)).to.be(true);
                expect(isDir(dir4)).to.be(true);

                // verify mode
                expect(fs.statSync(dirs[0]).mode === expectedMode).to.be(true);
                expect(fs.statSync(dirs[1]).mode === expectedMode).to.be(true);
                expect(fs.statSync(dir3).mode === expectedMode).to.be(true);
                expect(fs.statSync(dir4).mode === expectedMode).to.be(true);

                done();
            });
        });
    });
};