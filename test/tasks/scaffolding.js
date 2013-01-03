var expect = require('expect.js'),
    fs     = require('fs')
;

module.exports = function (automaton) {
    describe('scaffolding', function () {
        describe('append', function () {
            beforeEach(function () {
                // Copy assets to the tmp
                var file1 = fs.readFileSync(__dirname + '/../helpers/assets/file1.json');
                fs.writeFileSync(__dirname + '/../tmp/file1.json', file1);
                fs.writeFileSync(__dirname + '/../tmp/file1_copy.json', file1);
            });

            it('should append string to placeholder', function (done) {
                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-append',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1.json', '{{__dirname}}/../tmp/file1_copy.json'],
                                data: {
                                    placeholder: 'awesome ',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('André{{name}}');
                    expect(contents.email).to.equal('andre@indigounited.com{{email}}');
                    expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

                    contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1_copy.json'));
                    expect(contents.name).to.equal('André{{name}}');
                    expect(contents.email).to.equal('andre@indigounited.com{{email}}');
                    expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

                    done();
                });
            });

            it('should append file to placeholder', function (done) {
                // Create dummy files
                fs.writeFileSync(__dirname + '/../tmp/dummy', 'foo');
                fs.writeFileSync(__dirname + '/../tmp/dummy2', 'bar');

                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-append',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1.json', '{{__dirname}}/../tmp/file1_copy.json'],
                                data: {
                                    placeholder: '{{__dirname}}/../tmp/dummy',
                                    name: '{{__dirname}}/../tmp/dummy2',
                                    email: '{{__dirname}}/../tmp/dummy'
                                },
                                type: 'file'
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('bar{{name}}');
                    expect(contents.email).to.equal('foo{{email}}');
                    expect(contents.some_field).to.equal('This has an foo{{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the foo{{placeholder}} again just in case..');

                    expect(contents.name).to.equal('bar{{name}}');
                    expect(contents.email).to.equal('foo{{email}}');
                    expect(contents.some_field).to.equal('This has an foo{{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the foo{{placeholder}} again just in case..');

                    done();
                });
            });

            it('should accept minimatch patterns', function (done) {
                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-append',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1*.json'],
                                data: {
                                    placeholder: 'awesome ',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('André{{name}}');
                    expect(contents.email).to.equal('andre@indigounited.com{{email}}');
                    expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

                    contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1_copy.json'));
                    expect(contents.name).to.equal('André{{name}}');
                    expect(contents.email).to.equal('andre@indigounited.com{{email}}');
                    expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

                    done();
                });
            });

            it('should pass over the glob options', function (done) {
                // Rename to .file1 and tell glob to not match files starting with dot
                fs.renameSync(__dirname + '/../tmp/file1.json', __dirname + '/../tmp/.file1.json');

                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-append',
                            options: {
                                files: ['{{__dirname}}/../tmp/*file1.json'],
                                data: {
                                    placeholder: 'awesome ',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                },
                                glob: {
                                    dot: false
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/.file1.json'));
                    expect(contents.name).to.equal('{{name}}');
                    expect(contents.email).to.equal('{{email}}');
                    expect(contents.some_field).to.equal('This has an {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the {{placeholder}} again just in case..');

                    done();
                });
            });
        });

        describe('replace', function () {
            beforeEach(function () {
                // Copy assets to the tmp
                var file1 = fs.readFileSync(__dirname + '/../helpers/assets/file1.json');
                fs.writeFileSync(__dirname + '/../tmp/file1.json', file1);
                fs.writeFileSync(__dirname + '/../tmp/file1_copy.json', file1);
            });

            it('should replace placeholder with string', function (done) {
                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-replace',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1.json', '{{__dirname}}/../tmp/file1_copy.json'],
                                data: {
                                    placeholder: 'awesome',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('André');
                    expect(contents.email).to.equal('andre@indigounited.com');
                    expect(contents.some_field).to.equal('This has an awesome, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome again just in case..');

                    contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1_copy.json'));
                    expect(contents.name).to.equal('André');
                    expect(contents.email).to.equal('andre@indigounited.com');
                    expect(contents.some_field).to.equal('This has an awesome, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome again just in case..');

                    done();
                });
            });

            it('should replace placeholder with string', function (done) {
                // Create dummy files
                fs.writeFileSync(__dirname + '/../tmp/dummy', 'foo');
                fs.writeFileSync(__dirname + '/../tmp/dummy2', 'bar');

                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-replace',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1.json', '{{__dirname}}/../tmp/file1_copy.json'],
                                data: {
                                    placeholder: '{{__dirname}}/../tmp/dummy',
                                    name: '{{__dirname}}/../tmp/dummy2',
                                    email: '{{__dirname}}/../tmp/dummy'
                                },
                                type: 'file'
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('bar');
                    expect(contents.email).to.equal('foo');
                    expect(contents.some_field).to.equal('This has an foo, you see?');
                    expect(contents.other_field).to.equal('Here\'s the foo again just in case..');

                    expect(contents.name).to.equal('bar');
                    expect(contents.email).to.equal('foo');
                    expect(contents.some_field).to.equal('This has an foo, you see?');
                    expect(contents.other_field).to.equal('Here\'s the foo again just in case..');

                    done();
                });
            });

            it('should accept minimatch patterns', function (done) {
                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-replace',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1*.json'],
                                data: {
                                    placeholder: 'awesome',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('André');
                    expect(contents.email).to.equal('andre@indigounited.com');
                    expect(contents.some_field).to.equal('This has an awesome, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome again just in case..');

                    contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1_copy.json'));
                    expect(contents.name).to.equal('André');
                    expect(contents.email).to.equal('andre@indigounited.com');
                    expect(contents.some_field).to.equal('This has an awesome, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome again just in case..');

                    done();
                });
            });

            it('should pass over the glob options', function (done) {
                // Rename to .file1 and tell glob to not match files starting with dot
                fs.renameSync(__dirname + '/../tmp/file1.json', __dirname + '/../tmp/.file1.json');

                automaton.run({
                    filter: function (opts, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-replace',
                            options: {
                                files: ['{{__dirname}}/../tmp/*file1.json'],
                                data: {
                                    placeholder: 'awesome ',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                },
                                glob: {
                                    dot: false
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/.file1.json'));
                    expect(contents.name).to.equal('{{name}}');
                    expect(contents.email).to.equal('{{email}}');
                    expect(contents.some_field).to.equal('This has an {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the {{placeholder}} again just in case..');

                    done();
                });
            });
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