from django.conf.urls import url
from ftp_client import views
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^connect/$', views.connect, name='connect'),
    url(r'^tasks/$', csrf_exempt(views.tasks), name='tasks')
]
