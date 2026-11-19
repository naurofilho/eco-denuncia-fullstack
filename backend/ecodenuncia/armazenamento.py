"""Onde ficam as fotos das denúncias: disco local ou um bucket compatível com S3."""
import os

from django.core.exceptions import ImproperlyConfigured

VARIAVEIS_BUCKET = ('FOTOS_BUCKET', 'FOTOS_ENDPOINT', 'FOTOS_ACCESS_KEY_ID', 'FOTOS_SECRET_ACCESS_KEY')
VALIDADE_LINK_SEGUNDOS = 3600


def armazenamento_fotos(env=os.environ):
    """Configuração do armazenamento padrão (STORAGES['default']).

    Sem FOTOS_BUCKET, as fotos vão para MEDIA_ROOT, no disco do servidor. Com FOTOS_BUCKET, vão
    para o bucket (Cloudflare R2, AWS S3 ou outro compatível). O bucket fica privado e cada foto
    sai da API com um link assinado que vale 1 hora.
    """
    if not env.get('FOTOS_BUCKET'):
        return {'BACKEND': 'django.core.files.storage.FileSystemStorage'}

    faltando = [nome for nome in VARIAVEIS_BUCKET if not env.get(nome)]
    if faltando:
        raise ImproperlyConfigured(f'Para guardar as fotos no bucket, defina também: {", ".join(faltando)}.')

    from botocore.config import Config

    return {
        'BACKEND': 'storages.backends.s3.S3Storage',
        'OPTIONS': {
            'bucket_name': env['FOTOS_BUCKET'],
            'endpoint_url': env['FOTOS_ENDPOINT'],
            'access_key': env['FOTOS_ACCESS_KEY_ID'],
            'secret_key': env['FOTOS_SECRET_ACCESS_KEY'],
            'region_name': env.get('FOTOS_REGIAO', 'auto'),
            'querystring_auth': True,
            'querystring_expire': VALIDADE_LINK_SEGUNDOS,
            'client_config': Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'},
                # O boto3 manda checksums extras por padrão, e nem todo serviço compatível com S3
                # aceita. Assim eles só vão quando a operação exige.
                request_checksum_calculation='when_required',
                response_checksum_validation='when_required',
            ),
        },
    }
