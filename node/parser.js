var fs = require('fs');

exports.parse = function(content, cursor) {
    if (cursor === undefined) {
        console.log('skipping parse of undefined cursor');
        return content;
    }

    if (content.indexOf('$INCLUDE$', cursor) >= 0) {
        cursor = content.indexOf('$INCLUDE$', cursor);

        var start_point = cursor;
        var end_point = content.indexOf('$', cursor + 9) + 1;
        var mid_point = content.indexOf('$', cursor + 8);

        var filename = content.substring((start_point + 9), (end_point - 1));
        console.log('Including template \'' + filename + '\' for parsing.');
        
        var buffer = fs.readFileSync(filename);
        var included_content = module.exports.parse(buffer.toString('utf8', 0, buffer.length),0);
        content = content.substring(0, start_point) + included_content + content.substring(end_point);
        return module.exports.parse(content, 0);
    } 
    console.log('Passed includes parsing, now starting on the rest of the directives.');

    console.log('Starting variable parsing.');
    cursor = 0;
    while (content.indexOf('$VAR$', cursor) >= 0) {
        cursor = content.indexOf('$VAR$', cursor);

        var source_start_divider = cursor + 4;
        var source_end_divider = content.indexOf('$', cursor + 5);

        var source_file_name = content.substr(source_start_divider + 1, (source_end_divider-source_start_divider-1));

        var var_start_divider = source_end_divider;
        var var_end_divider = content.indexOf('$', var_start_divider + 1);

        var var_name = content.substr(var_start_divider + 1, (var_end_divider - var_start_divider - 1));

        var data = JSON.parse(fs.readFileSync('data/' + source_file_name + '.json', 'utf8'));
        console.log('Replacing \'' + content.substring(cursor, var_end_divider + 1) + '\' with \'' +  data[var_name] + '\'.');

        content = content.substring(0, cursor) + data[var_name] + content.substring(var_end_divider + 1);
        cursor = (content.substring(0, cursor) + data[var_name]).length;
    }

    /*
    if (content.indexOf('$FOREACH$', cursor) >= 0) {
        cursor = content.indexOf('$FOREACH$', cursor);
        console.log('matched foreach at cursor: ' + cursor);

        var before = content.indexOf('$BEFORE$', cursor);
        var parsed_before = module.exports.parse(content, before + 1);
        console.log('parsed_before: ' + parsed_before);
        return content;
    }
    */

    console.log('Matched nothing on this parse attempt, leaving');
    return content;
}
