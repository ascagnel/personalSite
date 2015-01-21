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
        console.log('Passed includes parsing, now starting on the rest of the directives.');
        return module.exports.parse(content, 0);
    } 

    // TODO -- FOREACH directive
    if (content.indexOf('$FOREACH$', cursor) >= 0) {
        cursor = content.indexOf('$FOREACH$', cursor);
        console.log('matched foreach at cursor: ' + cursor);

        var foreach_header_start = cursor;

        var data_array_start = content.indexOf('$', cursor + 1) + 1;
        var data_array_end = content.indexOf('$', data_array_start);
        var data_array = content.substring(data_array_start, data_array_end);
        console.log('data_array: \'' + data_array + '\', ' + 
                    'data_array_start: ' + data_array_start, ', ' +
                    'data_array_end: ' + data_array_end);

        var data_source_start = data_array_end + 1;
        var data_source_end = content.indexOf('$', data_source_start + 1);
        var data_source_filename = content.substring(data_source_start, 
                                                     data_source_end);

        console.log('data_source_filename: \'' + data_source_filename + '\', ' + 
                    'data_source_start: ' + data_source_start + ', ' +
                    'data_source_end: ' + data_source_end);

        var foreach_header_end = data_source_end + 1;

        console.log('foreach_header_start: ' + foreach_header_start + ', ' +
                    'foreach_heard_end: ' + foreach_header_end);

        console.log(content[foreach_header_end-1]);

        var before_start = content.indexOf('$BEFORE$', 
                                           foreach_header_end + 1);
        var before_end = content.indexOf('$', before_start + 1);

        console.log('before_start: ' + before_start + ', ' +
                    'before_end: ' + before_end);
        var parsed_before = module.exports.parse(content, before_end + 1);
        console.log(parsed_before);

        var begin_start = parsed_before.indexOf('$BEGIN$', before_end);
        console.log('begin_start: ' + begin_start);

        console.log('Finished parsing $FOREACH$ loop.');
        return parsed_before;
    }

    // TODO -- IF-ELSE-DIRECTIVES 

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

        var source_file = 'data/' + source_file_name + '.json';
        console.log('reading from file: ' + source_file);
        var data = JSON.parse(fs.readFileSync(source_file, 'utf8'));
        console.log('Replacing \'' + content.substring(cursor, var_end_divider + 1) + '\' with \'' +  data[var_name] + '\'.');

        content = content.substring(0, cursor) + data[var_name] + content.substring(var_end_divider + 1);
        cursor = (content.substring(0, cursor) + data[var_name]).length;
    }

    console.log('Matched nothing on this parse attempt, leaving');
    return content;
}
