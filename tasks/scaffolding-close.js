var fs         = require('fs'),
    stringLib  = require('../lib/string'),
    path       = require('path')
;

var task = {
    'id'      : 'scaffolding-close',
    'author'  : 'Indigo United',
    'name'    : 'Scaffolding: close placeholder',
    'options' : {
        'placeholder': {
            'description': 'What placeholder you want to close, in the format filename:placeholder'
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                // check if a placeholder was specified
                var placeholder = path.basename(opt.placeholder);
                if (placeholder.indexOf(':') > -1) {
                    // close placeholder
                    var tmp = opt.placeholder.lastIndexOf(':');
                    var filename     = opt.placeholder.substr(0, tmp),
                        _placeholder = opt.placeholder.substr(tmp + 1),
                        processedData,
                        placeholderData = {}
                    ;

                    // generate the placeholder data
                    placeholderData[_placeholder] = '';

                    processedData = stringLib.interpolate(fs.readFileSync(filename, 'utf8'), placeholderData);

                    fs.writeFileSync(filename, processedData, 'utf8');
                }
                else {
                    return next(new Error('Invalid placeholder specified'));
                }

                next();
            }
        }
    ]
};

module.exports = task;