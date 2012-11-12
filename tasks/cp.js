
var fs      = require('fs');
var fstream = require('fstream');

var task = {
    'id'      : 'cp',
    'author'  : 'Indigo United',
    'name'    : 'Copy',
    'options' : {
        'src': {
            'description': 'What should be copied'
        },
        'dst': {
            'description': 'Destination of the copy'
        }
    },
    'tasks'  :
    [
        {
            'task' : function (opt, next) {
                fs.stat(opt.src, function (err, stat) {
                    if (err && err.code === 'ENOENT') {
                        next(err);
                    }

                    var reader = fstream.Reader(opt.src).pipe(
                        fstream.Writer({
                            type: stat.isDirectory() ? 'Directory' : 'File',
                            path: opt.dst
                        })
                    );

                    reader.on('end', next);
                    reader.on('error', next);
                });

            }
        }
    ]
};

module.exports = task;