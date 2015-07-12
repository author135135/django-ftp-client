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
            $('.dirs-column.remote .progress').show();
            $.post(form.attr('action'), form.serialize(), function (response) {
                $('.dirs-column.remote .progress').hide();
                if (response['errors']) {
                    $.each(response['errors'], function (k, obj) {
                        $('#id_' + k, form).parent().addClass('has-error');
                    });
                }

                if (response['success']) {
                    form.parent().parent().removeClass('panel-primary').addClass('panel-success');
                    $('button', form).text('Disconnect').removeClass('btn-default').addClass('btn-danger');
                    $('#id_connect_type', form).val('disconnect');
                    $('.dirs-column .tasks').show();

                    fill_table('remote', response['remote_dir_content'], response['remote_dir_path']);

                } else if (response['disconnect']) {
                    form.parent().parent().removeClass('panel-success').addClass('panel-primary');
                    $('button', form).text('Connect').removeClass('btn-danger').addClass('btn-default');
                    $('#id_connect_type', form).val('connect');
                    form.trigger('reset');
                    $('.dirs-column.remote table tr:not(:first)').remove();
                    $('.dirs-column.remote .panel-heading span').text('');
                    $('.dirs-column.remote .tasks').hide();
                }
            }, 'json');
        });

        //Files table handlers
        $(document).on('click', '.dirs-column table tr:not(:nth-child(1), :nth-child(2))', function (e) {
            $(this).toggleClass('info');
        });

        $(document).on('dblclick', '.dirs-column table tr:not(:nth-child(1))', function (e) {
            var table = $(this).parents('table'),
                type = $(this).parents('.dirs-column').attr('class').replace(/.+[^(local|remote)]/g, '');

            if ($(this).attr('data-type') == 'file') {
                return false;
            }

            $.post('/ftp-client/change-dir/', {
                'dir': $(this).attr('data-full-path'),
                'type': type
            }, function (response) {
                fill_table(type, response['dir_content'], response['cur_dir']);
            }, 'json');
        });

        $('.dirs-column.remote .tasks a').click(function (e) {
            e.preventDefault();

            switch ($(this).attr('id')) {
                case 'mkdir':
                    //console.log('mkdir');
                    break;
                default :
                    //console.log('undefined command');
            }
        });

        //Tasks: upload to server
        $('.local .tasks #upload').click(function(e){
            e.preventDefault();

            var items = $('.local table tr.info');

            if(!items.length){
                $('.local .alerts .alert strong').text('Select items before upload');
                $('.local .alerts').show();
                return false;
            }

            var path = [];

            items.each(function(k, obj){
                path.push($(this).attr('data-full-path'));
            });

            var request_data = {
                'task': 'upload',
                'items[]': path
            };

            $.post('/ftp-client/tasks/', request_data, function(response){
                if(response['upload']){
                    fill_table('remote', response['upload']);
                }
            }, 'json');
        });

        //Tasks: make directory
        $('#tasks-mkdir').submit(function (e) {
            e.preventDefault();
            $('.has-error', $(this)).removeClass('has-error');

            if (!$('#tasks-mkdir-name', $(this)).val()) {
                $('#tasks-mkdir-name', $(this)).parent().addClass('has-error');
                return false;
            }

            var request_data = {
                'task': 'mkdir',
                'dirname': $('#tasks-mkdir-name', $(this)).val()
            };

            $.post('/ftp-client/tasks/', request_data, function (response) {
                if(response['mkdir']){
                    $('#modal-mkdir').modal('hide');
                    fill_table('remote', response['mkdir']);
                }
            }, 'json');
        });

        //Tasks: rename items
        $('.remote .tasks #rename').click(function(e){
            e.preventDefault();
            $('.remote .alerts').hide();
            $('.remote .alerts .alert strong').text('');

            var item = $('.remote table tr.info');

            if(!item.length){
                $('.remote .alerts .alert strong').text('Select item before rename');
                $('.remote .alerts').show();
                return false;
            }else if(item.length > 1){
                $('.remote .alerts .alert strong').text('Select ONLY one item before rename');
                $('.remote .alerts').show();
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

                var request_data = {
                    'task': 'rename',
                    'item': item.attr('data-full-path'),
                    'new_item_name': $('#tasks-rename-name', $(this)).val()
                };

                $.post('/ftp-client/tasks/', request_data, function (response) {
                    if(response['rename']){
                        $('#modal-rename').modal('hide');
                        fill_table('remote', response['rename']);
                    }
                }, 'json');
            });
        });

        //Tasks: change permissions
        $('.remote .tasks #chmod').click(function(e){
            e.preventDefault();
            $('.remote .alerts').hide();
            $('.remote .alerts .alert strong').text('');

            var items = $('.remote table tr.info');

            if(!items.length){
                $('.remote .alerts .alert strong').text('Select items before change permissions');
                $('.remote .alerts').show();
                return false;
            }

            var path = [];

            items.each(function(k, obj){
                path.push($(this).attr('data-type') + '@' + $(this).attr('data-full-path'));
            });

            var request_data = {
                'task': 'chmod',
                'items[]': path,
                'permission': ''
            };

            $('#modal-chmod').modal();

            $('#tasks-chmod').off('submit').on('submit', '', function (e) {
                e.preventDefault();
                $('.has-error', $(this)).removeClass('has-error');

                var form = $(this);

                if(!$('input[type="checkbox"]:checked', form).length){
                    return false;
                }

                var owner = 0,
                    group = 0,
                    other = 0;

                $('input[name="owner"]:checked', form).each(function(){
                    owner += parseInt($(this).val());
                });

                $('input[name="group"]:checked', form).each(function(){
                    group += parseInt($(this).val());
                });

                $('input[name="other"]:checked', form).each(function(){
                    other += parseInt($(this).val());
                });

                request_data['permission'] = String(owner) + String(group) + String(other);

                $.post('/ftp-client/tasks/', request_data, function (response) {
                    if(response['chmod']){
                        $('#modal-chmod').modal('hide');
                        fill_table('remote', response['chmod']);
                    }
                }, 'json');
            });
        });

        //Tasks: download from server
        $('.remote .tasks #download').click(function(e){
            e.preventDefault();
            $('.remote .alerts').hide();
            $('.remote .alerts .alert strong').text('');

            var items = $('.remote table tr.info');

            if(!items.length){
                $('.remote .alerts .alert strong').text('Select items before download');
                $('.remote .alerts').show();
                return false;
            }

            var path = [];

            items.each(function(k, obj){
                path.push($(this).attr('data-type') + '@' + $(this).attr('data-full-path'));
            });

            var request_data = {
                'task': 'download',
                'cur_dir': $('.dirs-column.local .panel-heading .directory').text(),
                'items[]': path
            };


            $.post('/ftp-client/tasks/', request_data, function (response) {
                if(response['download']) {
                    fill_table('local', response['download']);
                }
            }, 'json');
        })

        //Tasks: remove directory/file
        $('.remote .tasks #remove').click(function(e){
            e.preventDefault();
            $('.remote .alerts').hide();
            $('.remote .alerts .alert strong').text('');

            var items = $('.remote table tr.info');

            if(!items.length){
                $('.remote .alerts .alert strong').text('Select items before delete');
                $('.remote .alerts').show();
                return false;
            }

            var path = [];

            items.each(function(k, obj){
                path.push($(this).attr('data-type') + '@' + $(this).attr('data-full-path'));
            });

            var request_data = {
                'task': 'remove',
                'items[]': path
            };


            $.post('/ftp-client/tasks/', request_data, function (response) {
                if(response['remove']) {
                    fill_table('remote', response['remove']);
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

                if (type == 'remote') {
                    html += '<td>' + item.perms + '</td>';
                }

                html += '</tr>';
            });

            $('.dirs-column.' + type + ' table tr:not(:first)').remove();
            $('.dirs-column.' + type + ' table').append(html);

            if(cur_path !== undefined) {
                $('.dirs-column.' + type + ' .panel-heading .directory').text(cur_path);
            }
        }
    });
})(jQuery)