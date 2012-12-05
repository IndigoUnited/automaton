var fs     = require('fs'),
    utils  = require('amd-utils'),
    path   = require('path')
;

var task = {
    'id'      : 'scaffolding-replace',
    'author'  : 'Indigo United',
    'name'    : 'Scaffolding: replace',
    'options' : {
        'what': {
            'description': 'What you want to replace. Note that you can specify a file in the form filename:placeholder, or just ommit the placeholder'
        },
        'with': {
            'description': 'What you want to replace it with'
        },
        'type': {
            'description': 'Accepts "file" (default) and "string"',
            'default': 'file'
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                var _with;

                // if type is file, then read its contents first
                if (opt.type === 'file') {
                    // TODO: check if file exists
                    _with = fs.readFileSync(opt['with'], 'utf8');
                }
                else {
                    _with = opt['with'];
                }

                // check if a placeholder was specified
                var what = path.basename(opt.what);
                if (what.indexOf(':') > -1) {
                    // replace placeholder
                    var tmp = opt.what.lastIndexOf(':');
                    var filename    = opt.what.substr(0, tmp),
                        placeholder = opt.what.substr(tmp + 1),
                        processedData,
                        placeholderData = {}
                    ;

                    // generate the placeholder data
                    placeholderData[placeholder] = _with;
                    processedData = utils.string.interpolate(fs.readFileSync(filename, 'utf8'), placeholderData);

                    fs.writeFileSync(filename, processedData, 'utf8');
                }
                else {
                    // just replace the file, if it exists
                    fs.writeFileSync(opt.what, _with, 'utf8');
                }

                next();
            }
        }
    ]
};

module.exports = task;