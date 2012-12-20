var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file')
;

module.exports = function (automaton) {
    describe('cp', function () {
        it('should copy a file', function (done) {
            var files = {};
            files[__dirname + '/../helpers/assets/file1.json'] = __dirname + '/../tmp/file1.json';
            files[__dirname + '/../helpers/assets/file2'] = __dirname + '/../tmp/';

            automaton.run('cp', {
                files: files
            }, function (err) {
                if (err) {
                    return done(err);
                }

                // TODO: test a lot of possibilities!
                expect(isFile(__dirname + '/../tmp/file1.json')).to.be(true);
                expect(isFile(__dirname + '/../tmp/file2')).to.be(true);
                done();
            });
        });

        it.skip('should copy a folder', function () {
            // TODO: test a lot of possibilities!
        });

        it.skip('should work with sources as symlinks (directly or deep)');
        it.skip('should work with destinations as symlinks');
        it.skip('should copy file and folders permissions');
        it.skip('should pass over the glob options', function () {
            // There is a special case handled inside for the dot option
            // It needs to be tested with special care
        });
    });
};