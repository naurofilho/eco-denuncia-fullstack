from django.urls import path

from .views import CadastroView, EntrarView, MeView, RenovarTokenView

urlpatterns = [
    path('token/', EntrarView.as_view(), name='token'),
    path('token/refresh/', RenovarTokenView.as_view(), name='token-refresh'),
    path('usuarios/', CadastroView.as_view(), name='cadastro'),
    path('me/', MeView.as_view(), name='me'),
]
