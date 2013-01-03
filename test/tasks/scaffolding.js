var expect = require('expect.js'),
    fs     = require('fs')
;

module.exports = function (automaton) {
    describe('scaffolding', function () {
        describe('append', function () {
            beforeEach(function () {
                // Copy assets to the tmp
                fs.writeFileSync(__dirname + '/../tmp/file1.json', fs.readFileSync(__dirname + '/../helpers/assets/file1.json'));
            });

            it.skip('should append string to placeholder', function () {
                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-append',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1.json'],
                                data: {
                                    placeholder: 'awesome '
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    // TODO validate file
                });
            });

            it.skip('should append file to placeholder');
            it.skip('should accept minimatch patterns');
            it.skip('should pass over the glob options');
        });

        describe('replace', function () {
            it.skip('should replace placeholder with string');
            it.skip('should replace placeholder with file');
            it.skip('should accept minimatch patterns');
            it.skip('should pass over the glob options');
        });

        describe('close', function () {
            it.skip('should close placeholder');
            it.skip('should close placeholder, trimming empty lines before or after it');
            it.skip('should accept minimatch patterns');
            it.skip('should pass over the glob options');
        });

        describe('file-rename', function () {
            it.skip('should replace filename placeholders with string');
            it.skip('should accept minimatch patterns');
            it.skip('should pass over the glob options');
        });
    });
};