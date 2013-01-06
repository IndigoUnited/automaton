var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file')
;

module.exports = function (automaton) {
    describe('symlink', function () {
        it('should create symlink for files', function (done) {
            var dst = __dirname + '/../tmp/base_autofile.js';

            automaton.run('symlink', {
                dst: dst,
                src: __dirname + '/../../base_autofile.js',
                type: 'file'
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(dst)).to.be(true);
                done();
            });
        });

        it.skip('should create symlink for directories');
    });
};