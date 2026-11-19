# EcoDenúncia: backend

API em Django 5.2 + Django REST Framework, com login JWT (SimpleJWT).

## Como rodar

Requer Python 3.10 ou mais recente.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # Linux/macOS: cp .env.example .env
python manage.py migrate
python manage.py popular_demo   # opcional: contas e denúncias de teste
python manage.py runserver
```

A API fica em http://localhost:8000/api/ e o admin em http://localhost:8000/admin/.

Para o frontend usar esta API, crie `frontend/.env` com:

```
VITE_API_URL=http://localhost:8000/api
```

### Contas de teste (`popular_demo`)

| Perfil | E-mail | Senha |
|---|---|---|
| Fiscalização (vê o painel) | admin@eco.br | admin123 |
| Cidadã | maria@eco.br | maria123 |
| Cidadão | joao@eco.br | joao1234 |

O comando só roda com `DJANGO_DEBUG=1`, porque as senhas são fracas. A exceção é o site de
demonstração do Render, que roda o comando com `--forcar` a cada deploy. Nos deploys seguintes,
ele não duplica nada nem troca senhas.

### Admin do Django

```bash
python manage.py createsuperuser
```

Use o e-mail como nome de usuário. O login do site aceita tanto o e-mail quanto o nome de usuário.
Para que alguém da fiscalização use o painel do site, marque "Membro da equipe" (`is_staff`) no
cadastro dessa pessoa no admin.

Onde não dá para responder às perguntas do `createsuperuser`, como no build do Render, use
`python manage.py criar_admin`. Ele lê o e-mail e a senha de `DJANGO_SUPERUSER_EMAIL` e
`DJANGO_SUPERUSER_PASSWORD`, confere a força da senha e não muda nada se a conta já existe.

## Endpoints

Todos ficam sob `/api/`. Com exceção do login e do cadastro, todos exigem o cabeçalho
`Authorization: Bearer <access>`.

| Método | Caminho | Quem pode | Uso |
|---|---|---|---|
| POST | `/token/` | qualquer um | `{username, password}` → `{access, refresh}`. O `username` pode ser o e-mail |
| POST | `/token/refresh/` | qualquer um | `{refresh}` → `{access}` |
| POST | `/usuarios/` | qualquer um | Cadastro: `{nome, email, senha}` |
| GET | `/me/` | logado | `{id, nome, email, is_staff}` |
| GET | `/denuncias/` | logado | Cidadão recebe só as dele; a equipe recebe todas |
| GET | `/denuncias/{id}/` | dono ou equipe | Detalhe |
| POST | `/denuncias/` | logado | `multipart/form-data`: `tipo, descricao, latitude, longitude, endereco, data_ocorrencia, anonima, fotos` (até 5) |
| POST | `/denuncias/{id}/status/` | equipe | `{status, nota}`: muda o status e registra no histórico |

Formato de uma denúncia:

```json
{
  "id": 7,
  "protocolo": "ECO-2026-000007",
  "user": 2,
  "autor": "Maria Souza",
  "anonima": false,
  "tipo": "lixo",
  "descricao": "Entulho e restos de móveis jogados na calçada perto do córrego.",
  "latitude": -15.79342,
  "longitude": -47.88271,
  "endereco": "Rua das Palmeiras, em frente à escola",
  "data_ocorrencia": "2026-11-19",
  "fotos": ["http://localhost:8000/media/denuncias/7/3f9c….jpg"],
  "status": "recebida",
  "created_at": "2026-11-19T11:20:41.512Z",
  "historico": [{ "status": "recebida", "data": "2026-11-19T11:20:41.530Z", "nota": "Denúncia registrada pelo site." }]
}
```

Valores aceitos:

- `tipo`: `queimada`, `desmatamento`, `lixo`, `agua`, `ar`, `animais`, `ruido`, `outro`
- `status`: `recebida`, `analise`, `resolvida`

## Regras de acesso e de dados

- `user`, `status` e `protocolo` nunca vêm do cliente. O usuário é o que está logado, o status
  começa em `recebida` e o protocolo é gerado pelo servidor.
- Ninguém edita nem apaga denúncias pela API (PUT, PATCH e DELETE respondem 405). O status só
  muda pelo endpoint `/status/`, que registra quem mudou, quando e a mensagem.
- Mudanças de status feitas pelo admin do Django também entram no histórico.
- **Denúncia anônima**: a API não envia `user` nem `autor` para a equipe. O vínculo com a conta
  continua no banco, porque é ele que permite ao cidadão acompanhar a denúncia. Quem tem acesso
  ao banco ou é superusuário no admin consegue ver esse vínculo.
- Se a conta for apagada, as denúncias continuam no banco (`user` fica vazio).
- **Fotos**: cada foto é regravada no servidor como JPEG de no máximo 1600 px, sem os metadados
  do arquivo original (GPS, modelo do celular). O nome do arquivo é aleatório. O limite é de
  10 MB por foto. Com um bucket configurado (`FOTOS_*` no `.env`), as fotos ficam num bucket
  privado e a API entrega cada uma com um link assinado que vale 1 hora.
- **Limite de tentativas**: 20 por minuto no login e no cadastro, e 30 denúncias por hora por
  usuário. Os dois limites podem ser ajustados no `.env` (`LIMITE_AUTENTICACAO`, `LIMITE_DENUNCIAS`).
- O token de acesso dura 30 minutos e o de renovação, 7 dias. O frontend renova o acesso
  sozinho quando ele vence.

## Testes

```bash
python manage.py test
```

São 36 testes cobrindo cadastro, login, permissões, anonimato, validações, fotos (inclusive os
links assinados do bucket), histórico de status e os comandos `popular_demo` e `criar_admin`.

## PostgreSQL

Sem configuração, o backend usa SQLite (arquivo `db.sqlite3`). Para usar PostgreSQL, defina no
`.env` o endereço completo em `DATABASE_URL` (como o que o Neon mostra) ou as variáveis
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` e `POSTGRES_PORT`. Depois
rode `python manage.py migrate` de novo.

## Publicar

O passo a passo para publicar de graça no Render, com o banco no Neon e as fotos no Cloudflare R2,
está em [`../DEPLOY.md`](../DEPLOY.md). Em qualquer hospedagem:

- `DJANGO_DEBUG=0`, uma `DJANGO_SECRET_KEY` longa e aleatória e `DJANGO_ALLOWED_HOSTS` com o
  domínio real. No Render, o endereço `.onrender.com` entra sozinho.
- `CORS_ALLOWED_ORIGINS` com o endereço real do frontend.
- Use HTTPS. Se um proxy recebe o HTTPS e repassa ao Django, defina `DJANGO_ATRAS_DE_PROXY=1`.
  No Render isso já é automático.
- Build: `pip install -r requirements.txt`, `python manage.py collectstatic --noinput` e
  `python manage.py migrate`. Para iniciar: `gunicorn ecodenuncia.wsgi:application`. Os arquivos
  do admin saem pelo WhiteNoise, sem configurar servidor web.
- Com `DEBUG=0` o Django não serve a pasta `media/`. Use um bucket (`FOTOS_*`) ou configure o
  servidor web para servir `/media/`. Sem bucket, quem tiver o link de uma foto consegue abrir.
- No Render, o servidor se recusa a subir sem banco e bucket externos, porque o disco dele é
  apagado a cada deploy.
- A lista `/denuncias/` não é paginada. Com muitos registros, vale ativar a paginação do DRF e
  ajustar o painel do frontend para carregar por páginas.
