# Install

1.  Copy folder **ftp_client** to your project
2.  Modify project settings.py. Add to INSTALLED_APPS ftp_client application like this:

        INSTALLED_APPS = (
            ..., 
            'ftp_client'
        )

3.  Include to project urlconf `url(r'^ftp-client/', include('ftp_client.urls', namespace='ftp_client'))`