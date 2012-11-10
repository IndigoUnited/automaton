var fs     = require('fs'),
    utils  = require('amd-utils')
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
console.log(opt['with'].red);
                    _with = fs.readFileSync(opt['with'], 'utf8');
                }
                else {
                    _with = opt['with'];
                }

                // check if a placeholder was specified
                if (opt.what.indexOf(':') > -1) {
                    // append to placeholder
                    var tmp = opt.what.split(':', 2);
                    var filename    = tmp[0],
                        placeholder = tmp[1],
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
                    fs.writeFileSync(opt.where, _with, 'utf8');
                }

                next();
            }
        }
    ]
};

module.exports = task;