'use strict';

var expect  = require('expect.js'),
    fs      = require('fs'),
    rimraf  = require('rimraf'),
    fstream = require('fstream'),
    isFile  = require('../helpers/util/is-file')
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
                    filter: function (opts, ctx, next) {
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
                    filter: function (opts, ctx, next) {
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
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-append',
                            options: {
                                files: '{{__dirname}}/../tmp/file1*.json',
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
                // Rename to .file1 and tell glob to match files starting with dot
                fs.renameSync(__dirname + '/../tmp/file1.json', __dirname + '/../tmp/.file1.json');

                automaton.run({
                    filter: function (opts, ctx, next) {
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
                                    dot: true
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/.file1.json'));
                    expect(contents.name).to.equal('André{{name}}');
                    expect(contents.email).to.equal('andre@indigounited.com{{email}}');
                    expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

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
                    filter: function (opts, ctx, next) {
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
                    filter: function (opts, ctx, next) {
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
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-replace',
                            options: {
                                files: '{{__dirname}}/../tmp/file1*.json',
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
                // Rename to .file1 and tell glob to match files starting with dot
                fs.renameSync(__dirname + '/../tmp/file1.json', __dirname + '/../tmp/.file1.json');

                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-replace',
                            options: {
                                files: ['{{__dirname}}/../tmp/*file1.json'],
                                data: {
                                    placeholder: 'awesome',
                                    name: 'André',
                                    email: 'andre@indigounited.com'
                                },
                                glob: {
                                    dot: true
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/.file1.json'));
                    expect(contents.name).to.equal('André');
                    expect(contents.email).to.equal('andre@indigounited.com');
                    expect(contents.some_field).to.equal('This has an awesome, you see?');
                    expect(contents.other_field).to.equal('Here\'s the awesome again just in case..');

                    done();
                });
            });
        });

        describe('close', function () {
            beforeEach(function () {
                // Copy assets to the tmp
                var file1 = fs.readFileSync(__dirname + '/../helpers/assets/file1.json');
                fs.writeFileSync(__dirname + '/../tmp/file1.json', file1);
                fs.writeFileSync(__dirname + '/../tmp/file1_copy.json', file1);

                var file2 = fs.readFileSync(__dirname + '/../helpers/assets/file2');
                fs.writeFileSync(__dirname + '/../tmp/file2', file2);
            });

            it('should close placeholder', function (done) {
                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-close',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1.json', '{{__dirname}}/../tmp/file1_copy.json'],
                                placeholders: 'placeholder'
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('{{name}}');
                    expect(contents.email).to.equal('{{email}}');
                    expect(contents.some_field).to.equal('This has an , you see?');
                    expect(contents.other_field).to.equal('Here\'s the  again just in case..');

                    contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1_copy.json'));
                    expect(contents.name).to.equal('{{name}}');
                    expect(contents.email).to.equal('{{email}}');
                    expect(contents.some_field).to.equal('This has an , you see?');
                    expect(contents.other_field).to.equal('Here\'s the  again just in case..');

                    done();
                });
            });

            it('should close placeholder, trimming empty lines before or after it', function (done) {
                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-close',
                            options: {
                                files: '{{__dirname}}/../tmp/file2',
                                placeholders: ['name', 'body', 'signature']
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = fs.readFileSync(__dirname + '/../tmp/file2').toString();
                    expect(contents).to.equal('Hi there, ');

                    done();
                });
            });

            it('should close placeholder, not trimming empty lines if trim option is false', function (done) {
                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-close',
                            options: {
                                files: '{{__dirname}}/../tmp/file2',
                                placeholders: ['name', 'body', 'signature'],
                                trim: false
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = fs.readFileSync(__dirname + '/../tmp/file2').toString();
                    expect(contents).to.equal('Hi there, \n\n\n\n');

                    done();
                });
            });

            it('should accept minimatch patterns', function (done) {
                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-close',
                            options: {
                                files: ['{{__dirname}}/../tmp/file1*.json'],
                                placeholders: ['placeholder']
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    var contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1.json'));
                    expect(contents.name).to.equal('{{name}}');
                    expect(contents.email).to.equal('{{email}}');
                    expect(contents.some_field).to.equal('This has an , you see?');
                    expect(contents.other_field).to.equal('Here\'s the  again just in case..');

                    contents = JSON.parse(fs.readFileSync(__dirname + '/../tmp/file1_copy.json'));
                    expect(contents.name).to.equal('{{name}}');
                    expect(contents.email).to.equal('{{email}}');
                    expect(contents.some_field).to.equal('This has an , you see?');
                    expect(contents.other_field).to.equal('Here\'s the  again just in case..');

                    done();
                });
            });

            it('should pass over the glob options', function (done) {
                // Rename to .file1.json and tell glob to match files starting with dot
                fs.renameSync(__dirname + '/../tmp/file1.json', __dirname + '/../tmp/.file1.json');

                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-close',
                            options: {
                                files: ['{{__dirname}}/../tmp/*file1.json'],
                                placeholders: ['placeholder'],
                                glob: {
                                    dot: true
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
                    expect(contents.some_field).to.equal('This has an , you see?');
                    expect(contents.other_field).to.equal('Here\'s the  again just in case..');

                    done();
                });
            });
        });

        describe('file-rename', function () {
            beforeEach(function (done) {
                rimraf(__dirname + '/../tmp/file-rename', function (err) {
                    if (err) {
                        throw err;
                    }

                    fs.mkdirSync(__dirname + '/../tmp/file-rename');
                    fs.mkdirSync(__dirname + '/../tmp/file-rename/dummy');

                    // Create some assets in tmp/file-rename
                    fs.writeFileSync(__dirname + '/../tmp/file-rename/file1_{{placeholder1}}_{{placeholder2}}.json', '');
                    fs.writeFileSync(__dirname + '/../tmp/file-rename/dummy/file1_{{placeholder1}}_{{placeholder2}}.json', '');

                    done();
                });

            });

            it('should replace filename placeholders with string', function (done) {
                // Copy file-rename to file-rename-copy to test multiple dirs
                var reader = fstream.Reader(__dirname + '/../tmp/file-rename').pipe(
                    fstream.Writer({
                        type: 'Directory',
                        path: __dirname + '/../tmp/file-rename-copy'
                    })
                );

                reader.on('error', function (err) {
                    throw err;
                });

                reader.on('end', function () {
                    automaton.run({
                        filter: function (opts, ctx, next) {
                            opts.__dirname = __dirname;
                            next();
                        },
                        tasks: [
                            {
                                task: 'scaffolding-file-rename',
                                options: {
                                    dirs: ['{{__dirname}}/../tmp/file-rename', '{{__dirname}}/../tmp/file-rename-copy'],
                                    data: {
                                        placeholder1: 'foo',
                                        placeholder2: 'bar'
                                    }
                                }
                            }
                        ]
                    }, null, function (err) {
                        if (err) {
                            throw err;
                        }

                        expect(isFile(__dirname + '/../tmp/file-rename/file1_foo_bar.json')).to.equal(true);
                        expect(isFile(__dirname + '/../tmp/file-rename/dummy/file1_foo_bar.json')).to.equal(true);
                        expect(isFile(__dirname + '/../tmp/file-rename-copy/file1_foo_bar.json')).to.equal(true);
                        expect(isFile(__dirname + '/../tmp/file-rename-copy/dummy/file1_foo_bar.json')).to.equal(true);

                        done();
                    });
                });
            });

            it('should not read dirs recursively if the recursive option is false', function (done) {
                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-file-rename',
                            options: {
                                dirs: '{{__dirname}}/../tmp/file-rename',
                                data: {
                                    placeholder1: 'foo',
                                    placeholder2: 'bar'
                                },
                                recursive: false
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isFile(__dirname + '/../tmp/file-rename/file1_foo_bar.json')).to.equal(true);
                    expect(isFile(__dirname + '/../tmp/file-rename/dummy/file1_{{placeholder1}}_{{placeholder2}}.json')).to.equal(true);

                    done();
                });
            });

            it('should accept minimatch patterns', function (done) {
                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-file-rename',
                            options: {
                                dirs: ['{{__dirname}}/../tmp/file*rename'],
                                data: {
                                    placeholder1: 'foo',
                                    placeholder2: 'bar'
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isFile(__dirname + '/../tmp/file-rename/file1_foo_bar.json')).to.equal(true);
                    expect(isFile(__dirname + '/../tmp/file-rename/dummy/file1_foo_bar.json')).to.equal(true);

                    done();
                });
            });

            it('should pass over the glob options', function (done) {
                // Rename to .file-rename and tell glob to match files starting with dot
                fs.renameSync(__dirname + '/../tmp/file-rename', __dirname + '/../tmp/.file-rename');

                automaton.run({
                    filter: function (opts, ctx, next) {
                        opts.__dirname = __dirname;
                        next();
                    },
                    tasks: [
                        {
                            task: 'scaffolding-file-rename',
                            options: {
                                dirs: ['{{__dirname}}/../tmp/*file-rename'],
                                data: {
                                    placeholder1: 'foo',
                                    placeholder2: 'bar'
                                },
                                glob: {
                                    dot: true
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(isFile(__dirname + '/../tmp/.file-rename/file1_{{placeholder1}}_{{placeholder2}}.json')).to.equal(false);
                    expect(isFile(__dirname + '/../tmp/.file-rename/dummy/file1_{{placeholder1}}_{{placeholder2}}.json')).to.equal(false);

                    done();
                });
            });
        });
    });
};