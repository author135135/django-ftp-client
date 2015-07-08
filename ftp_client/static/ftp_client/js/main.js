(function($){
    $(document).ready(function(){
        //Connection form handler
        $('#connection-form').submit(function(e){
            e.preventDefault();
            var form = $(this);
            $('.has-error', form).removeClass('has-error');
            $.post(form.attr('action'), form.serialize(), function(response){
                if(response['errors']){
                    $.each(response['errors'], function(k, obj){
                        $('#id_' + k, form).parent().addClass('has-error');
                    });
                }

                if(response['success']){
                    form.parent().parent().removeClass('panel-primary').addClass('panel-success');
                    $('button', form).text('Disconnect').removeClass('btn-default').addClass('btn-danger');
                    $('#id_connect_type', form).val('disconnect');
                }else if(response['disconnect']){
                    form.parent().parent().removeClass('panel-success').addClass('panel-primary');
                    $('button', form).text('Connect').removeClass('btn-danger').addClass('btn-default');
                    $('#id_connect_type', form).val('connect');
                    form.trigger('reset');
                }
            }, 'json');
        });

        //Files table handlers
        $(document).on('click', '.dirs-column table tr:not(:first)', function(e){
            $(this).toggleClass('info');
        });

        $(document).on('dblclick', '.dirs-column table tr:not(:first)', function(e){
            var table = $(this).parents('table');
            if($(this).attr('data-type') == 'file'){
                return false;
            }

            $.post('/ftp-client/change-dir/', {'dir': $(this).attr('data-full-path')}, function(response){
                var html = '';
                $.each(response['dir_content'], function(k, item){
                    html += '<tr data-type="' + item.type + '" data-full-path="' + item.full_path + '">';
                    html += '<td>';
                    if(item.type == 'catalog'){
                        html += '<span class="glyphicon glyphicon-folder-open"></span>';
                    }else{
                        html += '<span class="glyphicon glyphicon-file"></span>';
                    }
                    html += '&nbsp;' + item.name;
                    html += '</td>';
                    html += '<td>' + item.size + '</td>';
                    html += '<td>' + item.info + '</td>';
                    html += '</tr>';
                });

                $('tr:not(:first)', table).remove();
                table.append(html);
                $('.dirs-column.local .panel-heading span').text(response['cur_dir']);
            }, 'json');
        });
    });
})(jQuery)