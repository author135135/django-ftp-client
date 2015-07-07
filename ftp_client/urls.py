from django.conf.urls import url
from ftp_client import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^connect/$', views.connect, name='connect'),
]
