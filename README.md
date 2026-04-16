# EcoDenúncia

Sistema web fullstack para registro e acompanhamento de denúncias ambientais.

## Descrição

O EcoDenúncia é uma plataforma que permite que cidadãos registrem ocorrências ambientais com geolocalização e evidências, possibilitando acompanhamento por administradores e órgãos responsáveis.

## Arquitetura

O sistema segue arquitetura em três camadas:

- Frontend: React.js
- Backend: Django REST Framework
- Banco de Dados: PostgreSQL

## Funcionalidades

- Cadastro e autenticação de usuários
- Registro de denúncias
- Upload de mídias
- Acompanhamento de status
- Painel administrativo

## Segurança

- Autenticação JWT
- Validação de dados
- Controle de acesso por perfil

## Documentação

Diagramas disponíveis na pasta `/docs`:

- Arquitetura
- DER
- Fluxo do usuário

## Execução

### Backend

```bash
pip install -r requirements.txt
python manage.py runserver
