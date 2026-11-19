from django.db import transaction
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Denuncia, HistoricoStatus
from .serializers import AtualizarStatusSerializer, DenunciaCriacaoSerializer, DenunciaSerializer


class DenunciaViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Cidadão: cria denúncias e vê só as próprias.
    Equipe de fiscalização (is_staff): vê todas e muda o status.
    Ninguém edita nem apaga denúncias pela API: o registro é preservado.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        denuncias = Denuncia.objects.select_related('user').prefetch_related('fotos', 'historico')
        if self.request.user.is_staff:
            return denuncias
        return denuncias.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return DenunciaCriacaoSerializer
        if self.action == 'mudar_status':
            return AtualizarStatusSerializer
        return DenunciaSerializer

    def get_throttles(self):
        if self.action == 'create':
            self.throttle_scope = 'criar_denuncia'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def _resposta(self, denuncia, codigo=status.HTTP_200_OK):
        atualizada = self.get_queryset().get(pk=denuncia.pk)
        return Response(DenunciaSerializer(atualizada, context=self.get_serializer_context()).data, status=codigo)

    def create(self, request, *args, **kwargs):
        entrada = self.get_serializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        denuncia = entrada.save(user=request.user)
        return self._resposta(denuncia, status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='status', permission_classes=[IsAuthenticated, IsAdminUser])
    def mudar_status(self, request, pk=None):
        """POST {status, nota} -> denúncia atualizada. Só para a equipe."""
        denuncia = self.get_object()
        contexto = {**self.get_serializer_context(), 'denuncia': denuncia}
        entrada = AtualizarStatusSerializer(data=request.data, context=contexto)
        entrada.is_valid(raise_exception=True)

        with transaction.atomic():
            denuncia.status = entrada.validated_data['status']
            denuncia.save(update_fields=['status', 'updated_at'])
            HistoricoStatus.objects.create(
                denuncia=denuncia,
                status=denuncia.status,
                nota=entrada.validated_data['nota'],
                autor=request.user,
            )
        return self._resposta(denuncia)
