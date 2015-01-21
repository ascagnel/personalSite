var fs = require('fs');

exports.parse = function(content, cursor) {
    var stack;

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
        console.log('Matched $FORACH$ at cursor: ' + cursor + '.');

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
                    'foreach_header_end: ' + foreach_header_end);

        var before_start = content.indexOf('$BEFORE$', 
                                           foreach_header_end + 1);
        var before_end = content.indexOf('$', before_start + 1);

        console.log('before_start: ' + before_start + ', ' +
                    'before_end: ' + before_end);

        content = module.exports.parse(
                content.substring(0,foreach_header_start) + content.substring(before_end + 1, content.length),
                before_start);

        var begin_start = content.indexOf('$BEGIN$');
        var begin_end = content.indexOf('$', begin_start + 1) + 1;
        var begin = content.substring(begin_start, begin_end);

        console.log('begin_start: ' + begin_start + ', ' + 
                    'begin_end: ' + begin_end + ', ' + 
                    'begin: \'' + begin + '\' ');

        content = module.exports.parse(
                content.substring(0, begin_start) + content.substring(begin_end, content.length),
                begin_start);

        // loop goes here

        var after_start = content.indexOf('$AFTER$');
        var after_end = content.indexOf('$', after_start + 1) + 1;
        var after = content.substring(after_start, after_end);

        console.log('after_start: ' + after_start + ', ' + 
                    'after_end: ' + after_end + ', ' +
                    'after: \'' + after + '\' ');

        content = module.exports.parse(
                content.substring(0, after_start) + content.substring(after_end, content.length),
                after_end);


        var end_start = content.indexOf('$END$');
        var end_end = content.indexOf('$', end_start + 1) + 1;
        var end = content.substring(end_start, end_end);

        console.log('end_start: ' + end_start + ', ' + 
                    'end_end: ' + end_end + ', ' +
                    'end: \'' + end + '\' ');

        content = content.substring(0, end_start), content.substring(end_end, content.length);

        console.log('Finished parsing $FOREACH$ loop.');
        return content;
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

        if (data[var_name] === undefined) {
            console.log('Skipping undefined variable \'' + var_name + '\'.');
            cursor =  var_end_divider;
        } else {
            console.log('Replacing \'' + content.substring(cursor, var_end_divider + 1) + '\' with \'' +  data[var_name] + '\'.');
            content = content.substring(0, cursor) + data[var_name] + content.substring(var_end_divider + 1);
            cursor = (content.substring(0, cursor) + data[var_name]).length;
        }
    }

    console.log('Matched nothing on this parse attempt, leaving');
    return content;
}
