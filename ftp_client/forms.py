from django import forms


class ConnectionForm(forms.Form):
    host = forms.CharField(label='Host:', widget=forms.TextInput(attrs={'class': 'form-control'}))
    login = forms.CharField(label='Login:', widget=forms.TextInput(attrs={'class': 'form-control'}))
    password = forms.CharField(label='Password:', widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    connect_type = forms.CharField(widget=forms.HiddenInput(), initial="connect")
