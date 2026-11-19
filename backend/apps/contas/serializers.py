from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers

Usuario = get_user_model()


def nome_de(usuario):
    return usuario.get_full_name() or usuario.username


class UsuarioSerializer(serializers.ModelSerializer):
    """Formato que o frontend espera em /api/me/: {id, nome, email, is_staff}."""

    nome = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'is_staff']

    def get_nome(self, usuario):
        return nome_de(usuario)


class CadastroSerializer(serializers.Serializer):
    nome = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField(max_length=150)
    senha = serializers.CharField(write_only=True, min_length=8, max_length=128, trim_whitespace=False)

    def validate_email(self, email):
        email = email.strip().lower()
        if Usuario.objects.filter(Q(username__iexact=email) | Q(email__iexact=email)).exists():
            raise serializers.ValidationError('Já existe uma conta com este e-mail. Entre com ela ou use outro e-mail.')
        return email

    def validate(self, dados):
        provisorio = Usuario(username=dados['email'], email=dados['email'], first_name=dados['nome'])
        try:
            validate_password(dados['senha'], user=provisorio)
        except DjangoValidationError as erro:
            raise serializers.ValidationError({'senha': list(erro.messages)})
        return dados

    def create(self, dados):
        return Usuario.objects.create_user(
            username=dados['email'],
            email=dados['email'],
            password=dados['senha'],
            first_name=dados['nome'].strip(),
        )

    def to_representation(self, usuario):
        return UsuarioSerializer(usuario).data
