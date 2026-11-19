from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import CadastroSerializer, UsuarioSerializer


class EntrarView(TokenObtainPairView):
    """POST {username, password} -> {access, refresh}. O username pode ser o e-mail."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'autenticacao'


class RenovarTokenView(TokenRefreshView):
    """POST {refresh} -> {access}."""


class CadastroView(generics.CreateAPIView):
    """POST {nome, email, senha} -> {id, nome, email, is_staff}."""

    serializer_class = CadastroSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'autenticacao'


class MeView(APIView):
    """GET -> dados do usuário logado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)
