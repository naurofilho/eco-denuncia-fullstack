import re
import shutil
import tempfile
from datetime import timedelta
from io import BytesIO, StringIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APITestCase

from ecodenuncia.armazenamento import armazenamento_fotos

from .models import Denuncia, FotoDenuncia, HistoricoStatus

Usuario = get_user_model()
MIDIA_TESTE = tempfile.mkdtemp(prefix='eco-midia-')
TAG_FABRICANTE = 0x010F  # EXIF "Make"


def foto_com_exif(nome='foto.jpg', tamanho=(2400, 1200)):
    imagem = Image.new('RGB', tamanho, (31, 92, 59))
    exif = Image.Exif()
    exif[TAG_FABRICANTE] = 'Celular da Maria'
    arquivo = BytesIO()
    imagem.save(arquivo, format='JPEG', exif=exif)
    return SimpleUploadedFile(nome, arquivo.getvalue(), content_type='image/jpeg')


@override_settings(MEDIA_ROOT=MIDIA_TESTE)
class DenunciaTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MIDIA_TESTE, ignore_errors=True)

    def setUp(self):
        cache.clear()
        self.maria = Usuario.objects.create_user('maria@eco.br', 'maria@eco.br', 'x', first_name='Maria Souza')
        self.joao = Usuario.objects.create_user('joao@eco.br', 'joao@eco.br', 'x', first_name='João Lima')
        self.equipe = Usuario.objects.create_user('equipe@eco.br', 'equipe@eco.br', 'x', first_name='Fiscalização', is_staff=True)

    def dados(self, **extra):
        base = {
            'tipo': 'lixo',
            'descricao': 'Entulho jogado na calçada perto do córrego.',
            'latitude': '-15.793420',
            'longitude': '-47.882710',
            'endereco': 'Rua das Palmeiras, em frente à escola',
            'data_ocorrencia': timezone.localdate().isoformat(),
            'anonima': 'false',
        }
        base.update(extra)
        return base

    def criar(self, usuario, **extra):
        self.client.force_authenticate(usuario)
        return self.client.post('/api/denuncias/', self.dados(**extra), format='multipart')

    # ---------- Criação ----------

    def test_criar_com_foto(self):
        r = self.criar(self.maria, fotos=[foto_com_exif()])
        self.assertEqual(r.status_code, 201, r.data)
        corpo = r.json()
        self.assertRegex(corpo['protocolo'], r'^ECO-\d{4}-\d{6}$')
        self.assertEqual(corpo['status'], 'recebida')
        self.assertEqual(corpo['user'], self.maria.id)
        self.assertEqual(corpo['autor'], 'Maria Souza')
        self.assertAlmostEqual(corpo['latitude'], -15.79342)
        self.assertEqual([h['status'] for h in corpo['historico']], ['recebida'])
        self.assertEqual(len(corpo['fotos']), 1)
        self.assertTrue(corpo['fotos'][0].startswith('http://testserver/media/denuncias/'))

    def test_foto_e_regravada_sem_exif_e_reduzida(self):
        self.criar(self.maria, fotos=[foto_com_exif()])
        foto = FotoDenuncia.objects.get()
        with Image.open(foto.imagem.path) as imagem:
            self.assertEqual(imagem.format, 'JPEG')
            self.assertLessEqual(max(imagem.size), 1600)
            self.assertNotIn(TAG_FABRICANTE, imagem.getexif())
        self.assertTrue(re.fullmatch(r'denuncias/\d+/[0-9a-f]{32}\.jpg', foto.imagem.name))

    def test_cliente_nao_define_usuario_status_nem_protocolo(self):
        r = self.criar(self.maria, status='resolvida', user=self.joao.id, protocolo='ECO-FALSO')
        self.assertEqual(r.status_code, 201, r.data)
        denuncia = Denuncia.objects.get()
        self.assertEqual(denuncia.user, self.maria)
        self.assertEqual(denuncia.status, 'recebida')
        self.assertNotEqual(denuncia.protocolo, 'ECO-FALSO')

    def test_protocolos_sao_unicos(self):
        a = self.criar(self.maria).data['protocolo']
        b = self.criar(self.maria).data['protocolo']
        self.assertNotEqual(a, b)

    def test_validacoes(self):
        amanha = (timezone.localdate() + timedelta(days=1)).isoformat()
        casos = {
            'descricao': {'descricao': 'Muito lixo'},
            'data_ocorrencia': {'data_ocorrencia': amanha},
            'tipo': {'tipo': 'inexistente'},
            'latitude': {'latitude': '95'},
        }
        for campo, extra in casos.items():
            with self.subTest(campo=campo):
                r = self.criar(self.maria, **extra)
                self.assertEqual(r.status_code, 400)
                self.assertIn(campo, r.data)
        self.assertFalse(Denuncia.objects.exists())

    def test_recusa_mais_de_cinco_fotos(self):
        r = self.criar(self.maria, fotos=[foto_com_exif(f'{i}.jpg', (50, 50)) for i in range(6)])
        self.assertEqual(r.status_code, 400)
        self.assertIn('fotos', r.data)

    def test_recusa_arquivo_que_nao_e_imagem(self):
        falso = SimpleUploadedFile('foto.jpg', b'isto nao e uma imagem', content_type='image/jpeg')
        r = self.criar(self.maria, fotos=[falso])
        self.assertEqual(r.status_code, 400)
        self.assertIn('fotos', r.data)

    # ---------- Leitura e permissões ----------

    def test_exige_login(self):
        self.assertEqual(self.client.get('/api/denuncias/').status_code, 401)
        self.assertEqual(self.client.post('/api/denuncias/', self.dados()).status_code, 401)

    def test_cidadao_ve_so_as_proprias(self):
        da_maria = self.criar(self.maria).data['id']
        do_joao = self.criar(self.joao).data['id']
        self.client.force_authenticate(self.maria)
        lista = self.client.get('/api/denuncias/').data
        self.assertEqual([d['id'] for d in lista], [da_maria])
        self.assertEqual(self.client.get(f'/api/denuncias/{do_joao}/').status_code, 404)

    def test_equipe_ve_todas(self):
        self.criar(self.maria)
        self.criar(self.joao)
        self.client.force_authenticate(self.equipe)
        self.assertEqual(len(self.client.get('/api/denuncias/').data), 2)

    def test_ninguem_edita_nem_apaga(self):
        id_ = self.criar(self.maria).data['id']
        for usuario in (self.maria, self.equipe):
            self.client.force_authenticate(usuario)
            url = f'/api/denuncias/{id_}/'
            self.assertEqual(self.client.put(url, self.dados(), format='json').status_code, 405)
            self.assertEqual(self.client.patch(url, {'status': 'resolvida'}, format='json').status_code, 405)
            self.assertEqual(self.client.delete(url).status_code, 405)

    def test_anonima_esconde_identidade_da_equipe(self):
        id_ = self.criar(self.maria, anonima='true').data['id']
        self.client.force_authenticate(self.equipe)
        vista_equipe = self.client.get(f'/api/denuncias/{id_}/').data
        self.assertIsNone(vista_equipe['user'])
        self.assertIsNone(vista_equipe['autor'])
        self.assertTrue(vista_equipe['anonima'])
        self.client.force_authenticate(self.maria)
        self.assertEqual(self.client.get(f'/api/denuncias/{id_}/').data['user'], self.maria.id)

    # ---------- Fotos num bucket (Cloudflare R2, S3) ----------

    def test_fotos_no_bucket_saem_com_link_assinado(self):
        bucket = armazenamento_fotos({
            'FOTOS_BUCKET': 'fotos-teste',
            'FOTOS_ENDPOINT': 'https://conta.r2.cloudflarestorage.com',
            'FOTOS_ACCESS_KEY_ID': 'chave-de-teste',
            'FOTOS_SECRET_ACCESS_KEY': 'segredo-de-teste',
        })
        denuncia = Denuncia.objects.create(
            user=self.maria, tipo='lixo', descricao='Entulho jogado na calçada perto do córrego.',
            latitude='-15.793420', longitude='-47.882710',
        )
        # Só o nome do arquivo: gerar o link assinado não acessa o bucket.
        FotoDenuncia.objects.create(denuncia=denuncia, imagem='denuncias/1/foto.jpg')
        self.client.force_authenticate(self.maria)
        with override_settings(STORAGES={**settings.STORAGES, 'default': bucket}):
            link = self.client.get(f'/api/denuncias/{denuncia.pk}/').json()['fotos'][0]
        self.assertTrue(
            link.startswith('https://conta.r2.cloudflarestorage.com/fotos-teste/denuncias/1/foto.jpg?'), link
        )
        self.assertIn('X-Amz-Signature=', link)
        self.assertIn('X-Amz-Expires=3600', link)

    def test_bucket_incompleto_e_recusado(self):
        with self.assertRaisesMessage(ImproperlyConfigured, 'FOTOS_ENDPOINT'):
            armazenamento_fotos({'FOTOS_BUCKET': 'fotos-teste'})

    # ---------- Mudança de status ----------

    def test_cidadao_nao_muda_status(self):
        id_ = self.criar(self.maria).data['id']
        r = self.client.post(f'/api/denuncias/{id_}/status/', {'status': 'resolvida'}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertEqual(Denuncia.objects.get().status, 'recebida')

    def test_equipe_muda_status_e_registra_historico(self):
        id_ = self.criar(self.maria).data['id']
        self.client.force_authenticate(self.equipe)
        r = self.client.post(
            f'/api/denuncias/{id_}/status/', {'status': 'analise', 'nota': '  Equipe enviada ao local.  '}, format='json'
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['status'], 'analise')
        self.assertEqual([h['status'] for h in r.data['historico']], ['recebida', 'analise'])
        self.assertEqual(r.data['historico'][-1]['nota'], 'Equipe enviada ao local.')
        self.assertEqual(HistoricoStatus.objects.filter(autor=self.equipe).count(), 1)

    def test_mesmo_status_sem_mensagem_e_recusado(self):
        id_ = self.criar(self.maria).data['id']
        self.client.force_authenticate(self.equipe)
        r = self.client.post(f'/api/denuncias/{id_}/status/', {'status': 'recebida', 'nota': ''}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('Escolha um status diferente', r.data['non_field_errors'][0])

    def test_mesmo_status_com_mensagem_e_aceito(self):
        id_ = self.criar(self.maria).data['id']
        self.client.force_authenticate(self.equipe)
        r = self.client.post(f'/api/denuncias/{id_}/status/', {'status': 'recebida', 'nota': 'Aguardando vistoria.'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['historico']), 2)


class PopularDemoTests(APITestCase):
    def test_cria_contas_e_denuncias_uma_vez(self):
        call_command('popular_demo', forcar=True, stdout=StringIO())
        self.assertEqual(Usuario.objects.count(), 3)
        self.assertEqual(Denuncia.objects.count(), 6)
        self.assertTrue(Usuario.objects.get(username='admin@eco.br').is_staff)
        resolvida = Denuncia.objects.filter(status='resolvida').first()
        self.assertEqual([h.status for h in resolvida.historico.all()], ['recebida', 'analise', 'resolvida'])

        call_command('popular_demo', forcar=True, stdout=StringIO())
        self.assertEqual(Denuncia.objects.count(), 6)

    def test_recusa_sem_debug(self):
        with self.assertRaises(CommandError):
            call_command('popular_demo', stdout=StringIO())
