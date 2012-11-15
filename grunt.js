/*jshint node:true onevar:false regexp:false*/

// Dependencies
var fs    = require('fs');
var url   = require('url');
var https = require('https');
var md    = require('marked');

module.exports = function (grunt) {

    // Download README task
    grunt.registerTask('getreadme', 'Downloads the automaton README.md', function () {
        var file = fs.createWriteStream('automaton_readme.md');
        var fileUrl = 'https://raw.github.com/IndigoUnited/automaton/master/README.md';
        var taskDone = this.async();
        var options = {
            host: url.parse(fileUrl).host,
            path: url.parse(fileUrl).pathname
        };

        https.get(options, function (res) {
            res.on('data', function (data) {
                file.write(data);
            })
            .on('end', function () {
                grunt.log.ok();
                taskDone();
            });
        });
    });

    // Markdown 2 HTML task
    grunt.registerTask('markdown2html', 'Converts the automaton README.md into HTML', function () {
        // Set default options
        md.setOptions({
            gfm: true,
            pedantic: false,
            sanitize: true
        });

        var contents = fs.readFileSync('automaton_readme.md').toString();
        var html = md(contents);

        fs.writeFileSync('tmpl/doc.tmpl', html);
        grunt.log.ok();
    });

    // Version task
    grunt.registerTask('version', 'Bumps the version and updates stuff accordingly', function () {
        var json = JSON.parse(fs.readFileSync('package.json'));
        var version = (json.siteVersion || 0) + 1;
        json.siteVersion = version;

        grunt.log.writeln('Will bump version to: ' +  version);

        // Update css url's
        var css = fs.readFileSync('dist/compiled.css').toString();
        css = css.replace(/(url\s*\(["'])(.*?)(["']\))/ig, function (match, start, url, end) {
            url = start + url.split('?', 2)[0] + '?v=' + version + end;
            return url;
        });
        fs.writeFileSync('dist/compiled.css', css);

        // Update index.html
        var index = fs.readFileSync('index.html').toString();
        index = index.replace(/(dist\/compiled(:?\.min)?\.(:?css|js)(:?\?v=(:?\d+)?)?)/ig, function (match, file) {
            return file.split('?', 2)[0] + '?v=' + version;
        });
        fs.writeFileSync('index.html', index);

        // Update package.json
        fs.writeFileSync('package.json', JSON.stringify(json, null, '  '));
        grunt.log.ok();
    });

    grunt.registerTask('forever', 'Forever task to be used along with server', function () {
        this.async();
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-mincss');
    grunt.loadNpmTasks('grunt-remove-logging');

    grunt.initConfig({
        clean: {
            dist: ['dist']
        },

        concat: {
            dist: {
                src: ['js/vendor/highlight.pack.js', 'js/main.js'],
                dest: 'dist/compiled.js'
            }
        },
        removelogging: {
            dist: {
                src: 'dist/compiled.js',
                dest: 'dist/compiled.js'
            }
        },

        min: {
            dist: {
                src: 'dist/compiled.js',
                dest: 'dist/compiled.min.js'
            }
        },

        // Requirejs is used to inline all the css's
        requirejs: {
            dist: {
                options: {
                    optimizeCss: 'standard.keepLines',
                    cssIn: 'css/main.css',
                    out: 'dist/compiled.css'
                }
            }
        },

        mincss: {
            dist: {
                src: 'dist/compiled.css',
                dest: 'dist/compiled.min.css'
            }
        }
    });

    grunt.registerTask('build', 'clean concat removelogging requirejs version min mincss');
    grunt.registerTask('doc', 'getreadme markdown2html');
    grunt.registerTask('run', 'server forever');
    grunt.registerTask('default', 'doc build');
};