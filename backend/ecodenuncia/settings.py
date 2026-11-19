"""Configurações do EcoDenúncia. Valores sensíveis vêm de variáveis de ambiente (.env)."""
import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

from .armazenamento import armazenamento_fotos

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def lista_env(nome, padrao=''):
    return [valor.strip() for valor in os.environ.get(nome, padrao).split(',') if valor.strip()]


DEBUG = os.environ.get('DJANGO_DEBUG', '0') == '1'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured('Defina DJANGO_SECRET_KEY no .env (veja .env.example).')
    SECRET_KEY = 'somente-para-desenvolvimento-local-nao-use-em-producao'

ALLOWED_HOSTS = lista_env('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')

# No Render, o endereço público do serviço (algo.onrender.com) vem nesta variável.
RENDER_HOST = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.contas',
    'apps.denuncias',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
if not DEBUG:
    # Em produção, o WhiteNoise serve os arquivos do admin (CSS e JS) gerados pelo collectstatic.
    # Em desenvolvimento, quem serve é o próprio runserver.
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

ROOT_URLCONF = 'ecodenuncia.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ecodenuncia.wsgi.application'

# Banco, nesta ordem:
# 1. DATABASE_URL, o endereço completo que serviços como o Neon fornecem;
# 2. POSTGRES_DB e as demais variáveis POSTGRES_*;
# 3. SQLite, para desenvolvimento.
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.parse(
            os.environ['DATABASE_URL'], conn_max_age=60, conn_health_checks=True
        )
    }
elif os.environ.get('POSTGRES_DB'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ['POSTGRES_DB'],
            'USER': os.environ.get('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
            'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.environ.get('SQLITE_PATH', BASE_DIR / 'db.sqlite3'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Permite entrar com o e-mail (o frontend envia o e-mail no campo "username").
AUTHENTICATION_BACKENDS = ['apps.contas.backends.EmailOuUsuarioBackend']

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = Path(os.environ.get('MEDIA_ROOT', BASE_DIR / 'media'))

STORAGES = {
    # Fotos: disco local ou bucket privado (veja armazenamento.py).
    'default': armazenamento_fotos(),
    # Em produção, os arquivos do admin saem comprimidos e com nome versionado.
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'
        if DEBUG
        else 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer']
    + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),
    'DEFAULT_THROTTLE_RATES': {
        'autenticacao': os.environ.get('LIMITE_AUTENTICACAO', '20/min'),
        'criar_denuncia': os.environ.get('LIMITE_DENUNCIAS', '30/hour'),
    },
    # Latitude/longitude saem como número no JSON, não como texto.
    'COERCE_DECIMAL_TO_STRING': False,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'UPDATE_LAST_LOGIN': True,
}

CORS_ALLOWED_ORIGINS = lista_env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')

# Limites das fotos enviadas com cada denúncia.
ECO_FOTOS_POR_DENUNCIA = 5
ECO_FOTO_TAMANHO_MAX_MB = 10
ECO_FOTO_LADO_MAX_PX = 1600

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# O Render recebe o HTTPS e repassa a requisição ao Django por HTTP. Este cabeçalho diz ao Django
# que a conexão original era segura. Só vale atrás de um proxy que sempre o define.
if RENDER_HOST or os.environ.get('DJANGO_ATRAS_DE_PROXY') == '1':
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# No Render o disco do servidor é apagado a cada deploy ou reinício. Sem banco e bucket externos,
# o site pareceria funcionar e perderia denúncias e fotos.
if os.environ.get('RENDER') and not DEBUG:
    faltando = []
    if DATABASES['default']['ENGINE'].endswith('sqlite3'):
        faltando.append('DATABASE_URL (banco)')
    if STORAGES['default']['BACKEND'].endswith('FileSystemStorage'):
        faltando.append('FOTOS_BUCKET e as outras variáveis FOTOS_* (fotos)')
    if faltando:
        raise ImproperlyConfigured(
            'No Render o disco é apagado a cada deploy. Defina ' + ' e '.join(faltando) + '. Veja o DEPLOY.md.'
        )
