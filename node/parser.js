var fs = require('fs');
var logger = require('./logger');

var stack = [];

exports.parse = function(content, cursor) {

    if (cursor === undefined) {
        logger.log().logDebug('skipping parse of undefined cursor');
        return content;
    }

    logger.log().logInfo('Starting parse at cursor \'' + cursor + '\'');

    if (content.indexOf('$INCLUDE$', cursor) >= 0) {
        cursor = content.indexOf('$INCLUDE$', cursor);

        var start_point = cursor;
        var end_point = content.indexOf('$', cursor + 9) + 1;
        var mid_point = content.indexOf('$', cursor + 8);

        var filename = content.substring((start_point + 9), (end_point - 1));
        logger.log().logDebug('Including template \'' + filename + '\' for parsing.');
        
        var buffer = fs.readFileSync(filename);
        var included_content = module.exports.parse(buffer.toString('utf8', 0, buffer.length),0);
        content = content.substring(0, start_point) + included_content + content.substring(end_point);
        logger.log().logDebug('Passed includes parsing, now starting on the rest of the directives.');
        return module.exports.parse(content, 0);
    } 

    // TODO -- FOREACH directive
    if (content.indexOf('$FOREACH$', cursor) >= 0) {
        cursor = content.indexOf('$FOREACH$', cursor);
        logger.log().logDebug('Matched $FORACH$ at cursor: ' + cursor + '.');

        var foreach_header_start = cursor;

        var data_array_start = content.indexOf('$', cursor + 1) + 1;
        var data_array_end = content.indexOf('$', data_array_start);
        var data_array = content.substring(data_array_start, data_array_end);

        logger.log().logTrace('data_array: \'' + data_array + '\', ' + 
                    'data_array_start: ' + data_array_start, ', ' +
                    'data_array_end: ' + data_array_end);

        var data_source_start = data_array_end + 1;
        var data_source_end = content.indexOf('$', data_source_start + 1);
        var data_source_filename = content.substring(data_source_start, 
                                                     data_source_end);

        logger.log().logTrace('data_source_filename: \'' + data_source_filename + '\', ' + 
                    'data_source_start: ' + data_source_start + ', ' +
                    'data_source_end: ' + data_source_end);

        var foreach_header_end = data_source_end + 1;

        logger.log().logTrace('foreach_header_start: ' + foreach_header_start + ', ' +
                    'foreach_header_end: ' + foreach_header_end);

        var before_start = content.indexOf('$BEFORE$', 
                                           foreach_header_end + 1);
        var before_end = content.indexOf('$', before_start + 1);

        logger.log().logTrace('before_start: ' + before_start + ', ' +
                    'before_end: ' + before_end);

        content = module.exports.parse(
                content.substring(0,foreach_header_start) + content.substring(before_end + 1, content.length),
                before_start);

        var begin_start = content.indexOf('$BEGIN$');
        var begin_end = content.indexOf('$', begin_start + 1) + 1;
        var begin = content.substring(begin_start, begin_end);

        logger.log().logTrace('begin_start: ' + begin_start + ', ' + 
                    'begin_end: ' + begin_end + ', ' + 
                    'begin: \'' + begin + '\' ');

        content = module.exports.parse(
                content.substring(0, begin_start) + content.substring(begin_end, content.length),
                begin_start);

        cursor = begin_end;
        var after_start = content.indexOf('$AFTER$', cursor);
        var after_end = content.indexOf('$', after_start + 1) + 1;
        var after = content.substring(after_start, after_end);

        logger.log().logTrace('after_start: ' + after_start + ', ' + 
                    'after_end: ' + after_end + ', ' +
                    'after: \'' + after + '\' ');

        // loop goes here
        var data_source = ('data/' + data_source_filename + '.json').toString();
        var data = JSON.parse(fs.readFileSync(data_source, 'utf8'));

        var repeated_string = content.substring(begin_start, after_start);
        var invariant = data[data_array];

        var before_loop_contents = content.substring(0);
        var loop_cursor = 0;

        logger.log().logTrace('invariant size: ' + invariant.length);
        for (var i = 0; i < invariant.length; i++) {
            var element = invariant[i];
            logger.log().logTrace('element: ' + element);

            stack.push(element);

            if ((i+1) == invariant.length) {
                logger.log().logTrace('=====\thit on element number \'' + i + '\'.');
                repeated_string = '';
            }
            
            content = 
                module.exports.parse(
                    content.substring(0, after_start), begin_end) +
                repeated_string + 
                content.substring(after_start, content.length);

            stack.pop();

            after_start = content.indexOf('$AFTER$', cursor);
            after_end = content.indexOf('$', after_start + 1) + 1;
            after = content.substring(after_start, after_end);
            logger.log().logTrace('content for \'' + element + '\':' + content);
        }

        content = module.exports.parse(
                content.substring(0, after_start) + content.substring(after_end, content.length),
                after_end);


        var end_start = content.indexOf('$ENDFOREACH$');
        var end_end = content.indexOf('$', end_start + 1) + 1;
        var end = content.substring(end_start, end_end);

        logger.log().logTrace('end_start: ' + end_start + ', ' + 
                    'end_end: ' + end_end + ', ' +
                    'end: \'' + end + '\' ');

        content = content.substring(0, end_start), content.substring(end_end, content.length);

        logger.log().logDebug('Finished parsing $FOREACH$ loop.');
        return content;
    }

    // TODO -- IF-ELSE-DIRECTIVES 

    // TODO -- Needs to read from stack as well as data file
    logger.log().logDebug('Starting variable parsing.');
    cursor = 0;
    while (content.indexOf('$VAR$', cursor) >= 0) {
        cursor = content.indexOf('$VAR$', cursor);

        var source_start_divider = cursor + 4;
        var source_end_divider = content.indexOf('$', cursor + 5);

        var source_name = content.substr(source_start_divider + 1, (source_end_divider-source_start_divider-1));

        var var_start_divider = source_end_divider;
        var var_end_divider = content.indexOf('$', var_start_divider + 1);

        var var_name = content.substr(var_start_divider + 1, (var_end_divider - var_start_divider - 1));
        var value = undefined;

        if ((stack[stack.length - 1] !== undefined) && (stack[stack.length - 1][var_name] !== undefined)) {
            value = stack[stack.length - 1][var_name];
        } else {
            var source_file = 'data/' + source_name + '.json';
            logger.log().logTrace('reading from file: ' + source_file);
            var data = JSON.parse(fs.readFileSync(source_file, 'utf8'));

            if (data[var_name] === undefined) {
                logger.log().logTrace('Skipping undefined variable \'' + var_name + '\'.');
                cursor =  var_end_divider;
            } else {
                logger.log().logTrace('Replacing \'' + content.substring(cursor, var_end_divider + 1) + '\' with \'' +  data[var_name] + '\'.');
                value = data[var_name];
            }
        }

        logger.log().logTrace('value: ' + value);

        if (value === undefined) {
            logger.log().logTrace('Skipping undefined variable \'' + var_name + '\'.');
            cursor =  var_end_divider;
        } else {
            content = content.substring(0, cursor) + value + content.substring(var_end_divider + 1);
            cursor = (content.substring(0, cursor) + value).length;
        }
    }

    logger.log().logInfo('Matched nothing on this parse attempt, leaving');
    return content;
}
