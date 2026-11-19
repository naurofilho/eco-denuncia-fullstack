from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.denuncias.models import Denuncia, HistoricoStatus

CONTAS = [
    # e-mail, nome, senha, equipe
    ('admin@eco.br', 'Equipe de fiscalização', 'admin123', True),
    ('maria@eco.br', 'Maria Souza', 'maria123', False),
    ('joao@eco.br', 'João Lima', 'joao1234', False),
]

DENUNCIAS = [
    dict(autor='maria@eco.br', tipo='queimada', status='recebida', horas=5,
         lat='-15.736800', lng='-47.927500', endereco='Margem da DF-003, perto da entrada do Parque Nacional',
         descricao='Fogo em área de cerrado ao lado da pista. A fumaça já está chegando nas casas do outro lado da via.'),
    dict(autor='maria@eco.br', tipo='lixo', status='analise', horas=4 * 24,
         lat='-15.816200', lng='-48.106300', endereco='Terreno baldio na QNM 18, Ceilândia',
         descricao='Um caminhão despejou entulho e restos de móveis no terreno durante a noite. Já é a terceira vez neste mês.',
         nota='Vistoria no local agendada para esta semana.'),
    dict(autor='maria@eco.br', tipo='agua', status='resolvida', horas=15 * 24,
         lat='-15.820500', lng='-47.831200', endereco='Lago Paranoá, próximo à Ponte JK',
         descricao='Mancha escura e cheiro forte de esgoto saindo de uma tubulação na margem do lago.',
         nota='Ligação clandestina de esgoto identificada e lacrada. O responsável foi autuado.'),
    dict(autor='maria@eco.br', tipo='desmatamento', status='analise', horas=7 * 24, anonima=True,
         lat='-15.648900', lng='-47.788000', endereco='Estrada vicinal depois do Núcleo Rural, Sobradinho',
         descricao='Trator derrubando árvores nativas numa faixa grande de mata perto de uma nascente.',
         nota='Denúncia encaminhada ao órgão ambiental responsável pela área.'),
    dict(autor='joao@eco.br', tipo='ruido', status='recebida', horas=2 * 24,
         lat='-15.833000', lng='-48.040200', endereco='Avenida Comercial, Taguatinga Norte',
         descricao='Som muito alto todas as noites, até de madrugada, vindo de um estabelecimento comercial.'),
    dict(autor='joao@eco.br', tipo='animais', status='resolvida', horas=30 * 24,
         lat='-16.015300', lng='-48.064400', endereco='Feira do Gama, setor central',
         descricao='Venda de pássaros silvestres em gaiolas pequenas, incluindo canários-da-terra.',
         nota='Animais apreendidos e levados ao centro de triagem de animais silvestres.'),
]


class Command(BaseCommand):
    help = 'Cria as contas e denúncias de demonstração (as mesmas do modo demo do frontend).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--forcar', action='store_true',
            help='Roda mesmo com DEBUG desligado. As senhas de teste são fracas: nunca use em produção.',
        )

    @transaction.atomic
    def handle(self, *args, forcar=False, **options):
        if not settings.DEBUG and not forcar:
            raise CommandError('DEBUG está desligado. Este comando cria senhas fracas; use --forcar só em teste.')

        Usuario = get_user_model()
        usuarios = {}
        for email, nome, senha, equipe in CONTAS:
            usuario, criado = Usuario.objects.get_or_create(
                username=email, defaults={'email': email, 'first_name': nome, 'is_staff': equipe}
            )
            if criado:
                usuario.set_password(senha)
                usuario.save()
            usuarios[email] = usuario
            perfil = 'fiscalização' if equipe else 'cidadão'
            situacao = 'criada' if criado else 'já existia'
            self.stdout.write(f'  Conta {email} / {senha} ({perfil}): {situacao}')

        if Denuncia.objects.exists():
            self.stdout.write(self.style.WARNING('Já existem denúncias no banco; nenhuma denúncia de exemplo foi criada.'))
            return

        agora = timezone.now()
        for item in DENUNCIAS:
            criada = agora - timedelta(hours=item['horas'])
            denuncia = Denuncia.objects.create(
                user=usuarios[item['autor']],
                tipo=item['tipo'],
                descricao=item['descricao'],
                latitude=Decimal(item['lat']),
                longitude=Decimal(item['lng']),
                endereco=item['endereco'],
                data_ocorrencia=timezone.localtime(criada).date(),
                anonima=item.get('anonima', False),
                status=item['status'],
            )
            Denuncia.objects.filter(pk=denuncia.pk).update(created_at=criada)

            etapas = [('recebida', criada, 'Denúncia registrada pelo site.')]
            if item['status'] in ('analise', 'resolvida'):
                nota = item['nota'] if item['status'] == 'analise' else 'A equipe começou a verificar as informações.'
                etapas.append(('analise', criada + timedelta(hours=20), nota))
            if item['status'] == 'resolvida':
                etapas.append(('resolvida', criada + timedelta(days=5), item['nota']))
            for status, data, nota in etapas:
                historico = HistoricoStatus.objects.create(denuncia=denuncia, status=status, nota=nota)
                HistoricoStatus.objects.filter(pk=historico.pk).update(data=data)

        self.stdout.write(self.style.SUCCESS(f'{len(DENUNCIAS)} denúncias de exemplo criadas.'))
