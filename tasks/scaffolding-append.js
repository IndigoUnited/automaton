var fs     = require('fs'),
    utils  = require('amd-utils')
;

var task = {
    'id'      : 'scaffolding-append',
    'author'  : 'Indigo United',
    'name'    : 'Scaffolding: append',
    'options' : {
        'what': {
            'description': 'What you want to append'
        },
        'type': {
            'description': 'What you are trying to append. Accepts "file" (default) and "string"',
            'default': 'file'
        },
        'where': {
            'description': 'Where you want to append. Note that you can specify a file in the form filename:placeholder, or just ommit the placeholder'
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                var what;

                // if type is file, then read its contents first
                if (opt.type === 'file') {
                    // TODO: check if file exists

                    what = fs.readFileSync(opt.what, 'utf8');
                }
                else {
                    what = opt.what;
                }

                // check if a placeholder was specified
                if (opt.where.indexOf(':') > -1) {
                    // append to placeholder
                    var tmp = opt.where.split(':', 2);
                    var filename    = tmp[0],
                        placeholder = tmp[1],
                        processedData,
                        placeholderData = {}
                    ;

                    // generate the placeholder data
                    placeholderData[placeholder] = what + '{{' + placeholder + '}}';

                    processedData = utils.string.interpolate(fs.readFileSync(filename, 'utf8'), placeholderData);

                    fs.writeFileSync(filename, processedData, 'utf8');
                }
                else {
                    // just append the file
                    fs.appendFileSync(opt.where, what, 'utf8');
                }

                next();
            }
        }
    ]
};

module.exports = task;