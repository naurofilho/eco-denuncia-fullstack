from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

Usuario = get_user_model()


class ContasTests(APITestCase):
    def setUp(self):
        cache.clear()  # zera o limite de tentativas entre os testes
        self.maria = Usuario.objects.create_user(
            username='maria@eco.br', email='maria@eco.br', password='cerrado-em-pe-2026', first_name='Maria Souza'
        )

    def entrar(self, username, senha):
        return self.client.post('/api/token/', {'username': username, 'password': senha}, format='json')

    def test_cadastro_cria_conta_e_permite_entrar(self):
        r = self.client.post(
            '/api/usuarios/', {'nome': 'João Lima', 'email': 'Joao@Eco.br', 'senha': 'ipe-amarelo-florido'}, format='json'
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data, {'id': r.data['id'], 'nome': 'João Lima', 'email': 'joao@eco.br', 'is_staff': False})
        self.assertEqual(self.entrar('joao@eco.br', 'ipe-amarelo-florido').status_code, 200)

    def test_cadastro_recusa_email_repetido(self):
        r = self.client.post(
            '/api/usuarios/', {'nome': 'Outra Maria', 'email': 'MARIA@eco.br', 'senha': 'ipe-amarelo-florido'}, format='json'
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn('Já existe uma conta', r.data['email'][0])

    def test_cadastro_recusa_senha_fraca(self):
        r = self.client.post('/api/usuarios/', {'nome': 'João', 'email': 'joao@eco.br', 'senha': '12345678'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('senha', r.data)
        self.assertFalse(Usuario.objects.filter(email='joao@eco.br').exists())

    def test_entrar_com_email_ignora_maiusculas(self):
        r = self.entrar('MARIA@ECO.BR', 'cerrado-em-pe-2026')
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)

    def test_senha_errada_retorna_401(self):
        self.assertEqual(self.entrar('maria@eco.br', 'errada').status_code, 401)

    def test_superusuario_entra_pelo_email(self):
        Usuario.objects.create_superuser('admin', 'admin@eco.br', 'chave-da-fiscalizacao')
        self.assertEqual(self.entrar('admin@eco.br', 'chave-da-fiscalizacao').status_code, 200)

    def test_me_retorna_dados_do_usuario(self):
        token = self.entrar('maria@eco.br', 'cerrado-em-pe-2026').data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        r = self.client.get('/api/me/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, {'id': self.maria.id, 'nome': 'Maria Souza', 'email': 'maria@eco.br', 'is_staff': False})

    def test_me_exige_login(self):
        self.assertEqual(self.client.get('/api/me/').status_code, 401)

    def test_renovar_token(self):
        refresh = self.entrar('maria@eco.br', 'cerrado-em-pe-2026').data['refresh']
        r = self.client.post('/api/token/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)

    def test_limite_de_tentativas_de_login(self):
        codigos = [self.entrar('maria@eco.br', 'errada').status_code for _ in range(21)]
        self.assertEqual(codigos[-1], 429)
