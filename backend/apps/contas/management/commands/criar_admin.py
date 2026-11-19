import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q


class Command(BaseCommand):
    help = (
        'Cria o administrador do Django com DJANGO_SUPERUSER_EMAIL e DJANGO_SUPERUSER_PASSWORD. '
        'Se já existe uma conta com o e-mail, não muda nada. Sem as variáveis, não faz nada. '
        'Pensado para rodar a cada deploy, onde não dá para usar o createsuperuser interativo.'
    )

    def handle(self, *args, **options):
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '').strip().lower()
        senha = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')

        if not email and not senha:
            self.stdout.write('DJANGO_SUPERUSER_EMAIL não definido: nenhum administrador criado.')
            return
        if not email or not senha:
            raise CommandError('Defina DJANGO_SUPERUSER_EMAIL e DJANGO_SUPERUSER_PASSWORD juntos.')

        Usuario = get_user_model()
        existente = Usuario.objects.filter(Q(username__iexact=email) | Q(email__iexact=email)).first()
        if existente:
            if existente.is_superuser:
                self.stdout.write(f'Administrador {email}: já existe, nada foi alterado.')
            else:
                self.stdout.write(self.style.WARNING(
                    f'Já existe uma conta comum com {email}. Ela não foi transformada em administrador: '
                    'use outro e-mail em DJANGO_SUPERUSER_EMAIL.'
                ))
            return

        try:
            validate_password(senha, user=Usuario(username=email, email=email))
        except ValidationError as erro:
            raise CommandError('Senha do administrador recusada: ' + ' '.join(erro.messages)) from erro

        Usuario.objects.create_superuser(username=email, email=email, password=senha, first_name='Administração')
        self.stdout.write(self.style.SUCCESS(f'Administrador {email} criado.'))
