from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.contas.serializers import nome_de

from .imagens import preparar_foto
from .models import Denuncia, FotoDenuncia, HistoricoStatus

MIN_DESCRICAO = 20
MAX_DESCRICAO = 2000


class HistoricoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoStatus
        fields = ['status', 'data', 'nota']


class DenunciaSerializer(serializers.ModelSerializer):
    """Leitura. Formato descrito no README do frontend."""

    user = serializers.SerializerMethodField()
    autor = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()
    historico = HistoricoSerializer(many=True, read_only=True)

    class Meta:
        model = Denuncia
        fields = [
            'id', 'protocolo', 'user', 'autor', 'anonima', 'tipo', 'descricao',
            'latitude', 'longitude', 'endereco', 'data_ocorrencia', 'fotos',
            'status', 'created_at', 'historico',
        ]
        read_only_fields = fields

    def _do_proprio_usuario(self, denuncia):
        request = self.context.get('request')
        return request is not None and denuncia.user_id == request.user.id

    def get_user(self, denuncia):
        # Denúncia anônima: só o próprio autor recebe o id dele.
        if denuncia.anonima and not self._do_proprio_usuario(denuncia):
            return None
        return denuncia.user_id

    def get_autor(self, denuncia):
        if denuncia.anonima or denuncia.user is None:
            return None
        return nome_de(denuncia.user)

    def get_fotos(self, denuncia):
        request = self.context.get('request')
        urls = [foto.imagem.url for foto in denuncia.fotos.all()]
        return [request.build_absolute_uri(url) for url in urls] if request else urls


class DenunciaCriacaoSerializer(serializers.ModelSerializer):
    """Entrada do cidadão. `user`, `status` e `protocolo` nunca vêm do cliente."""

    fotos = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
        max_length=settings.ECO_FOTOS_POR_DENUNCIA,
        error_messages={'max_length': f'Envie no máximo {settings.ECO_FOTOS_POR_DENUNCIA} fotos.'},
    )

    class Meta:
        model = Denuncia
        fields = ['tipo', 'descricao', 'latitude', 'longitude', 'endereco', 'data_ocorrencia', 'anonima', 'fotos']
        extra_kwargs = {
            'descricao': {'max_length': MAX_DESCRICAO},
            'endereco': {'required': False},
            'data_ocorrencia': {'required': False},
            'anonima': {'required': False},
        }

    def validate_descricao(self, descricao):
        descricao = descricao.strip()
        if len(descricao) < MIN_DESCRICAO:
            raise serializers.ValidationError(
                f'Descreva o que aconteceu com pelo menos {MIN_DESCRICAO} caracteres.'
            )
        return descricao

    def validate_endereco(self, endereco):
        return endereco.strip()

    def validate_data_ocorrencia(self, data):
        if data and data > timezone.localdate():
            raise serializers.ValidationError('A data não pode ser no futuro.')
        return data

    def validate_fotos(self, fotos):
        limite = settings.ECO_FOTO_TAMANHO_MAX_MB
        for foto in fotos:
            if foto.size > limite * 1024 * 1024:
                raise serializers.ValidationError(f'Cada foto pode ter no máximo {limite} MB.')
        return fotos

    def create(self, dados):
        # Prepara as fotos antes de gravar qualquer coisa: se uma falhar, nada é salvo.
        fotos = [preparar_foto(foto) for foto in dados.pop('fotos', [])]
        with transaction.atomic():
            denuncia = Denuncia.objects.create(**dados)
            HistoricoStatus.objects.create(
                denuncia=denuncia,
                status=Denuncia.Status.RECEBIDA,
                nota='Denúncia registrada pelo site.',
                autor=denuncia.user,
            )
            for foto in fotos:
                FotoDenuncia.objects.create(denuncia=denuncia, imagem=foto)
        return denuncia


class AtualizarStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Denuncia.Status.choices)
    nota = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=500)

    def validate(self, dados):
        denuncia = self.context['denuncia']
        nota = (dados.get('nota') or '').strip()
        if dados['status'] == denuncia.status and not nota:
            raise serializers.ValidationError(
                'Escolha um status diferente ou escreva uma mensagem para o cidadão.'
            )
        dados['nota'] = nota
        return dados
