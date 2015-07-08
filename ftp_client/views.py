import os
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseForbidden
from ftp_client.forms import ConnectionForm
from json import JSONEncoder


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def index(request):
    connection_form = ConnectionForm()
    local_dir_path = PROJECT_ROOT
    # return HttpResponse(get_dir('/home/author2006'))

    return render(request, template_name='ftp_client/index.html', context={
        'connection_form': connection_form,
        'local_dir': get_dir(local_dir_path),
        'local_dir_path': local_dir_path,
    })


def connect(request):
    if request.META['REQUEST_METHOD'] == 'GET':
        return HttpResponseForbidden('403 Access denied')

    connection_form = ConnectionForm(request.POST)

    response = {
        'errors': None,
        'success': False,
        'disconnect': False,
    }

    if request.POST['connect_type'] == 'connect':
        if connection_form.is_valid():
            response['success'] = True
        else:
            response['errors'] = connection_form.errors
    elif request.POST['connect_type'] == 'disconnect':
        response['disconnect'] = True

    return HttpResponse(JSONEncoder().encode(response))

def change_dir(request):
    if 'dir' not in request.POST:
        return HttpResponseForbidden('403 Access denied')

    response = {
        'cur_dir': None,
        'dir_content': None,
    }

    dir_content = get_dir(request.POST['dir'])

    if len(dir_content):
        response['cur_dir'] = request.POST['dir']
        response['dir_content'] = dir_content

    return HttpResponse(JSONEncoder().encode(response))


def get_dir(path):
    dir_content = list()
    output = list()

    if os.path.exists(path) and os.path.isdir(path):
        dir_content = os.listdir(path)

    for item in dir_content:
        item_path = os.path.join(path, item)
        item_info = {
            'name': item,
            'info': '',
            'size': os.path.getsize(item_path),
            'type': '',
            'full_path': item_path,
        }

        if os.path.isdir(item_path):
            item_info['info'] = 'Catalog'
            item_info['type'] = 'catalog'
        else:
            item_ext = os.path.splitext(item_path)
            item_info['info'] = '%s-file' % item_ext[1] if len(item_ext) > 1 and item_ext[1] else 'File'
            item_info['type'] = 'file'

        output.append(item_info)

    output.sort(key=lambda i: i['name'] and i['type'])
    output.insert(0, {
        'name': '...',
        'info': '',
        'size': '',
        'type': 'catalog',
        'full_path': os.path.dirname(path),
    })

    return output
