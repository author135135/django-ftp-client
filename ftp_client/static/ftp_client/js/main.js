(function ($) {
    $(document).ready(function () {
        //Bootstrap close alerts close handler
        $('.close').click(function(e){
            $(this).parents('.alerts').hide();
        });

        //Connection form handler
        $('#connection-form').submit(function (e) {
            e.preventDefault();
            var form = $(this);
            $('.has-error', form).removeClass('has-error');
            progress('remote', true);
            $.post(form.attr('action'), form.serialize(), function (response) {
                progress('remote', false);
                if (response['errors']) {
                    $.each(response['errors'], function (k, obj) {
                        $('#id_' + k, form).parent().addClass('has-error');
                    });
                }

                if (response['success']) {
                    form.parent().parent().removeClass('panel-primary').addClass('panel-success');
                    $('button', form).text('Disconnect').removeClass('btn-default').addClass('btn-danger');
                    $('#id_connect_type', form).val('disconnect');
                    $('.dirs-column').addClass('active');

                    fill_table('remote', response['remote_dir_content'], response['remote_dir_path']);

                } else if (response['disconnect']) {
                    form.parent().parent().removeClass('panel-success').addClass('panel-primary');
                    $('button', form).text('Connect').removeClass('btn-danger').addClass('btn-default');
                    $('#id_connect_type', form).val('connect');
                    form.trigger('reset');
                    $('.dirs-column.remote table tr:not(:first)').remove();
                    $('.dirs-column.remote .panel-heading span').text('');
                    $('.dirs-column.active').removeClass('active');
                }
            }, 'json');
        });

        //Files table handlers
        $(document).on('click', '.dirs-column table tr:not(:nth-child(1), :nth-child(2))', function (e) {
            $(this).toggleClass('info');
        });

        //Tasks: change directory
        $(document).on('dblclick', '.dirs-column table tr:not(:nth-child(1))', function (e) {
            var table = $(this).parents('table'),
                type = $(this).parents('.dirs-column').attr('data-type');

            if ($(this).attr('data-type') == 'file') {
                return false;
            }

            progress(type, true);
            $.post('/ftp-client/tasks/', {
                type: type,
                task: 'change_dir',
                dir: $(this).attr('data-full-path')
            }, function (response) {
                progress(type, false);
                fill_table(type, response['dir_content'], response['cur_dir']);
            }, 'json');
        });

        //Tasks: make directory
        $('.tasks .mkdir').click(function (e) {
            e.preventDefault();
            var request = {},
                type = $(this).parents('.dirs-column').attr('data-type');

            $('#modal-mkdir').modal();

            $('#tasks-mkdir').off('submit').on('submit', '', function (e) {
                e.preventDefault();
                $('.has-error', $(this)).removeClass('has-error');

                if (!$('#tasks-mkdir-name', $(this)).val()) {
                    $('#tasks-mkdir-name', $(this)).parent().addClass('has-error');
                    return false;
                }

                request = {
                    type: type,
                    task: 'mkdir',
                    dirname: $('#tasks-mkdir-name', $(this)).val()
                };

                progress(type, true);
                $.post('/ftp-client/tasks/', request, function (response) {
                    progress(type, false);
                    if (response['dir_content']) {
                        $('#modal-mkdir').modal('hide');
                        fill_table(type, response['dir_content']);
                        $('#tasks-mkdir').trigger('reset');
                    }
                }, 'json');
            });
        });

        //Tasks: rename items
        $('.tasks .rename').click(function (e) {
            e.preventDefault();
            var wrapper = $(this).parents('.dirs-column'),
                type = wrapper.attr('data-type'),
                item = $('table tr.info', wrapper);

            $('.alerts', wrapper).hide();
            $('.alerts .alert strong', wrapper).text('');

            if (!item.length) {
                $('.alerts .alert strong', wrapper).text('Select item before rename');
                $('.alerts', wrapper).show();
                return false;
            } else if (item.length > 1) {
                $('.alerts .alert strong', wrapper).text('Select ONLY one item before rename');
                $('.alerts', wrapper).show();
                return false;
            }

            $('#modal-rename').modal();

            $('#tasks-rename').off('submit').on('submit', '', function (e) {
                e.preventDefault();
                $('.has-error', $(this)).removeClass('has-error');

                if (!$('#tasks-rename-name', $(this)).val()) {
                    $('#tasks-rename-name', $(this)).parent().addClass('has-error');
                    return false;
                }

                var request = {
                    type: type,
                    task: 'rename',
                    item: item.attr('data-full-path'),
                    new_item_name: $('#tasks-rename-name', $(this)).val()
                };

                $('#modal-rename').modal('hide');
                $('#tasks-rename').trigger('reset');

                progress(type, true);
                $.post('/ftp-client/tasks/', request, function (response) {
                    progress(type, false);
                    if (response['dir_content']) {
                        fill_table(type, response['dir_content']);
                    }
                }, 'json');
            });
        });

        //Tasks: change permissions
        $('.tasks .chmod').click(function (e) {
            e.preventDefault();
            var wrapper = $(this).parents('.dirs-column'),
                type = wrapper.attr('data-type'),
                items = $('table tr.info', wrapper);

            $('.alerts', wrapper).hide();
            $('.alerts .alert strong', wrapper).text('');

            if (!items.length) {
                $('.alerts .alert strong', wrapper).text('Select items before change permissions');
                $('.alerts', wrapper).show();
                return false;
            }

            var path = [];

            items.each(function (k, obj) {
                path.push($(this).attr('data-full-path'));
            });

            $('#modal-chmod').modal();

            var request = {
                type: type,
                task: 'chmod',
                'items[]': path
            };

            $('#tasks-chmod').off('submit').on('submit', '', function (e) {
                e.preventDefault();
                $('.has-error', $(this)).removeClass('has-error');

                var form = $(this);

                if (!$('input[type="checkbox"]:checked', form).length) {
                    return false;
                }

                var owner = 0,
                    group = 0,
                    other = 0;

                $('input[name="owner"]:checked', form).each(function () {
                    owner += parseInt($(this).val());
                });

                $('input[name="group"]:checked', form).each(function () {
                    group += parseInt($(this).val());
                });

                $('input[name="other"]:checked', form).each(function () {
                    other += parseInt($(this).val());
                });

                request['permission'] = String(owner) + String(group) + String(other);

                $('#modal-chmod').modal('hide');
                $('#tasks-chmod input[type="checkbox"]').prop('checked', false);

                progress(type, true);
                $.post('/ftp-client/tasks/', request, function (response) {
                    progress(type, false);
                    if (response['dir_content']) {
                        fill_table(type, response['dir_content']);
                    }
                }, 'json');
            });
        });

        //Tasks: upload to server
        $('.tasks .upload').click(function (e) {
            e.preventDefault();
            var wrapper = $(this).parents('.dirs-column'),
                type = wrapper.attr('data-type'),
                items = $('table tr.info', wrapper);

            if(!items.length){
                if (type == 'local') {
                    $('.local .alerts .alert strong').text('Select items before upload');
                } else {
                    $('.local .alerts .alert strong').text('Select items before download');
                }
                $('.local .alerts').show();
                return false;
            }

            var path = [];

            items.each(function(k, obj){
                if (type == 'local') {
                    path.push($(this).attr('data-full-path'));
                } else {
                    path.push($(this).attr('data-type') + '@' + $(this).attr('data-full-path'));
                }
            });

            var request = {
                type: type,
                task: 'upload',
                'items[]': path
            };

            //Change `type` value
            type = (type == 'local') ? 'remote' : 'local';

            progress(type, true)
            $.post('/ftp-client/tasks/', request, function (response) {
                progress(type, false);
                if (response['dir_content']) {
                    fill_table(type, response['dir_content']);
                }
            }, 'json');
        });

        //Tasks: remove directory/file
        $('.tasks .remove').click(function (e) {
            e.preventDefault();
            var wrapper = $(this).parents('.dirs-column'),
                type = wrapper.attr('data-type'),
                items = $('table tr.info', wrapper);

            $('.alerts', wrapper).hide();
            $('.alerts .alert strong', wrapper).text('');

            if(!items.length){
                $('.alerts .alert strong', wrapper).text('Select items before delete');
                $('.alerts', wrapper).show();
                return false;
            }

            var path = [];

            items.each(function(k, obj){
                path.push($(this).attr('data-type') + '@' + $(this).attr('data-full-path'));
            });

            var request = {
                type: type,
                task: 'remove',
                'items[]': path
            };

            progress(type, true);
            $.post('/ftp-client/tasks/', request, function (response) {
                progress(type, false);
                if (response['dir_content']) {
                    fill_table(type, response['dir_content']);
                }
            }, 'json');
        });

        function fill_table(type, items, cur_path) {
            var html = '';
            $.each(items, function (k, item) {
                html += '<tr data-type="' + item.type + '" data-full-path="' + item.full_path + '">';
                html += '<td>';
                if (item.type == 'catalog') {
                    html += '<span class="glyphicon glyphicon-folder-close"></span>';
                } else {
                    html += '<span class="glyphicon glyphicon-file"></span>';
                }
                html += '&nbsp;&nbsp;' + item.name;
                html += '</td>';
                html += '<td>' + item.size + '</td>';
                html += '<td>' + item.info + '</td>';
                html += '<td>' + item.perms + '</td>';

                html += '</tr>';
            });

            $('.dirs-column.' + type + ' table tr:not(:first)').remove();
            $('.dirs-column.' + type + ' table').append(html);

            if(cur_path !== undefined) {
                $('.dirs-column.' + type + ' .panel-heading .directory').text(cur_path);
            }
        }

        function progress(type, progress){
            if(progress){
                $('.dirs-column.' + type).addClass('in-progress');
            }else{
                $('.dirs-column.' + type).removeClass('in-progress');
            }
        }
    });
})(jQuery)