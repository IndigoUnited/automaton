var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file')
;

module.exports = function (automaton) {
    describe('cp', function () {
        it('should copy a file', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/file1.json'] = __dirname + '/../tmp/cp/file1.json';
            files[__dirname + '/../helpers/assets/file2'] = __dirname + '/../tmp/cp/';

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(__dirname + '/../tmp/cp/file1.json')).to.be(true);
                expect(isFile(__dirname + '/../tmp/cp/file2')).to.be(true);
                done();
            });
        });

        it.skip('should copy a folder', function () {
            // TODO: test a lot of possibilities!
        });

        // TODO: add more tests when copying files that do not exists, etc!

        it.skip('should work with sources as symlinks (directly or deep)');
        it.skip('should work with destinations as symlinks');
        it.skip('should copy file and folders permissions');
        it('should pass over the glob options', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/.file'] = __dirname + '/../tmp/cp/';

            automaton.run('cp', {
                files: files,
                glob: {
                    dot: false
                }
            }, function (err) {
                if (err) {
                    throw err;
                }

                //expect(isFile(__dirname + '/../tmp/cp/.file')).to.be(false);
                done();
            });
        });
    });
};