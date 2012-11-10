var fs     = require('fs'),
    utils  = require('amd-utils')
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
                if (opt.placeholder.indexOf(':') > -1) {
                    // append to placeholder
                    var tmp = opt.placeholder.split(':', 2);
                    var filename    = tmp[0],
                        placeholder = tmp[1],
                        processedData,
                        placeholderData = {}
                    ;

                    // generate the placeholder data
                    placeholderData[placeholder] = '';

                    processedData = utils.string.interpolate(fs.readFileSync(filename, 'utf8'), placeholderData);

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