import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Denuncia(models.Model):
    class Tipo(models.TextChoices):
        QUEIMADA = 'queimada', 'Queimada'
        DESMATAMENTO = 'desmatamento', 'Desmatamento'
        LIXO = 'lixo', 'Descarte irregular'
        AGUA = 'agua', 'Poluição da água'
        AR = 'ar', 'Poluição do ar'
        ANIMAIS = 'animais', 'Maus-tratos a animais'
        RUIDO = 'ruido', 'Poluição sonora'
        OUTRO = 'outro', 'Outro'

    class Status(models.TextChoices):
        RECEBIDA = 'recebida', 'Recebida'
        ANALISE = 'analise', 'Em análise'
        RESOLVIDA = 'resolvida', 'Resolvida'

    protocolo = models.CharField(max_length=20, unique=True, null=True, editable=False)
    # SET_NULL: se a conta for apagada, o registro ambiental continua existindo.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='denuncias',
        verbose_name='usuário',
    )
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    descricao = models.TextField('descrição')
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    endereco = models.CharField('endereço ou referência', max_length=200, blank=True)
    data_ocorrencia = models.DateField('data da ocorrência', null=True, blank=True)
    anonima = models.BooleanField(
        'não compartilhar o nome', default=False,
        help_text='O nome de quem denunciou não é mostrado à equipe de fiscalização.',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEBIDA)
    created_at = models.DateTimeField('registrada em', auto_now_add=True)
    updated_at = models.DateTimeField('atualizada em', auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = 'denúncia'
        verbose_name_plural = 'denúncias'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.protocolo or "Nova denúncia"} ({self.get_tipo_display()})'

    def save(self, *args, **kwargs):
        nova = self.pk is None
        super().save(*args, **kwargs)
        # O protocolo usa o id, que só existe depois do primeiro save.
        if nova and not self.protocolo:
            self.protocolo = f'ECO-{self.created_at.year}-{self.pk:06d}'
            super().save(update_fields=['protocolo'])


def caminho_da_foto(foto, _nome_original):
    # Nome aleatório: não expõe o nome original do arquivo nem permite adivinhar o endereço.
    return f'denuncias/{foto.denuncia_id}/{uuid.uuid4().hex}.jpg'


class FotoDenuncia(models.Model):
    denuncia = models.ForeignKey(Denuncia, on_delete=models.CASCADE, related_name='fotos')
    imagem = models.ImageField(upload_to=caminho_da_foto)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'foto'
        verbose_name_plural = 'fotos'

    def __str__(self):
        return f'Foto {self.pk} de {self.denuncia.protocolo}'


class HistoricoStatus(models.Model):
    """Cada mudança de status, com a mensagem mostrada ao cidadão na linha do tempo."""

    denuncia = models.ForeignKey(Denuncia, on_delete=models.CASCADE, related_name='historico')
    status = models.CharField(max_length=20, choices=Denuncia.Status.choices)
    nota = models.TextField('mensagem', blank=True)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    data = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['data', 'id']
        verbose_name = 'mudança de status'
        verbose_name_plural = 'histórico de status'

    def __str__(self):
        return f'{self.get_status_display()} em {self.data:%d/%m/%Y %H:%M}'
