from django.shortcuts import render
from django.http import HttpResponse
from ftp_client.forms import ConnectionForm


def index(request):
    connection_form = ConnectionForm()
    return render(request, template_name='ftp_client/index.html', context={
        'connection_form': connection_form,
    })

def connect(request):
    connection_form = ConnectionForm(request.POST)

    if connection_form.is_valid():
        return HttpResponse('VALID')
    return HttpResponse(connection_form.errors.as_json())
