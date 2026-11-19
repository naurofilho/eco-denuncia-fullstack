# EcoDenúncia

Sistema web para registrar e acompanhar denúncias ambientais.

## Descrição

O cidadão marca o local no mapa, descreve o que viu, envia fotos e recebe um número de
protocolo. A partir daí, acompanha cada etapa da denúncia (recebida, em análise, resolvida),
com as mensagens da equipe de fiscalização. A equipe tem um painel com mapa, busca e filtros
para analisar as denúncias e atualizar o status.

## Arquitetura

| Camada | Tecnologia | Pasta |
|---|---|---|
| Frontend | React 18 + Vite, React Router, Leaflet (OpenStreetMap) | [`frontend/`](frontend/) |
| Backend | Django 5.2 + Django REST Framework, JWT (SimpleJWT) | [`backend/`](backend/) |
| Banco de dados | PostgreSQL (SQLite em desenvolvimento) | |

## Funcionalidades

- Cadastro e login com e-mail.
- Denúncia em 4 etapas: tipo, local no mapa (GPS do celular, toque no mapa ou coordenadas
  digitadas), descrição com até 5 fotos e revisão.
- Opção de não compartilhar o nome com o órgão responsável.
- Protocolo único e linha do tempo do andamento.
- Painel da fiscalização com mapa, busca, filtros e mudança de status com mensagem ao cidadão.
- Admin do Django para gestão interna.

## Segurança

- Autenticação JWT, com renovação automática do token.
- Cada cidadão só vê as próprias denúncias, e só a equipe muda o status.
- Ninguém edita nem apaga denúncias pela API.
- Validação dos dados no frontend e no backend.
- Fotos regravadas no servidor, sem os metadados do arquivo original.
- Limite de tentativas no login, no cadastro e no envio de denúncias.

## Como rodar

São dois terminais.

**1. Backend** (Python 3.10+):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # Linux/macOS: cp .env.example .env
python manage.py migrate
python manage.py popular_demo   # contas e denúncias de teste
python manage.py runserver
```

**2. Frontend** (Node.js 18+). Crie o arquivo `frontend/.env` com esta linha:

```
VITE_API_URL=http://localhost:8000/api
```

Depois:

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. Contas de teste: `maria@eco.br` / `maria123` (cidadã) e
`admin@eco.br` / `admin123` (fiscalização).

Para ver só o visual, sem o backend, rode o frontend sem o arquivo `.env`: ele entra em modo de
demonstração, com os dados guardados no navegador.

## Testes

```bash
cd backend
python manage.py test
```

Mais detalhes em [`backend/README.md`](backend/README.md) (endpoints, regras de acesso, publicação)
e em [`frontend/README.md`](frontend/README.md) (telas e estrutura).
