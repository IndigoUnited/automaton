module.exports = exports = {
    interpolate: function (str, replacements) {
        // could be optimized to replace everything in a single run
        for (var k in replacements) {
            str = str.replace('{{' + k + '}}', replacements[k]);
        }

        return str;
    }
};
