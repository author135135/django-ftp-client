from django.conf.urls import url
from ftp_client import views
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^connect/$', views.connect, name='connect'),
    url(r'^change-dir/$', csrf_exempt(views.change_dir), name='change_dir'),
]
