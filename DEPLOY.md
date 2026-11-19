# Publicar o EcoDenúncia (demonstração gratuita)

O site fica em três serviços, todos com plano gratuito:

| Parte | Serviço | O que guarda |
|---|---|---|
| Site React e API Django | [Render](https://render.com) | O código, a partir deste repositório |
| Banco PostgreSQL | [Neon](https://neon.com) | Contas, denúncias e histórico |
| Fotos | [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) | As fotos enviadas com as denúncias |

O arquivo [`render.yaml`](render.yaml) descreve os dois serviços do Render. Você só preenche os
endereços e as chaves do banco e do R2.

**Limites do plano gratuito**
- A API desliga depois de 15 minutos sem acesso. O primeiro acesso depois disso leva cerca de
  1 minuto. O site em si abre na hora, porque é feito de arquivos estáticos.
- O Neon guarda até 1 GB por projeto e o R2 até 10 GB de fotos por mês.
- Não conte com backup do banco. É um site de demonstração: não use para denúncias reais.

## 1. Banco no Neon

1. Crie uma conta em neon.com. Dá para entrar com o GitHub.
2. Crie um projeto chamado `eco-denuncia`. Na região, escolha **AWS US East (N. Virginia)**, a
   mais perto do servidor do Render.
3. Clique em **Connect**, desligue **Connection pooling** e copie o endereço de conexão. Ele
   começa com `postgresql://` e termina com `?sslmode=require...`. Esse é o `DATABASE_URL`.

## 2. Fotos no Cloudflare R2

1. Crie uma conta em cloudflare.com e abra **R2 Object Storage** no painel. Para ativar o R2,
   a Cloudflare pede um cartão, mas não cobra nada enquanto o uso ficar dentro do plano gratuito.
2. Crie um bucket chamado `eco-denuncia-fotos`. **Não** ative o acesso público: o site entrega
   cada foto com um link assinado que vale 1 hora.
3. Nas configurações do bucket, copie o endereço da **S3 API**, sem o nome do bucket no fim:
   `https://<id-da-conta>.r2.cloudflarestorage.com`. Esse é o `FOTOS_ENDPOINT`.
4. Em **Manage API tokens**, crie um token com a permissão **Object Read & Write**, só para
   o bucket `eco-denuncia-fotos`. Copie o **Access Key ID** e o **Secret Access Key**. O segredo
   aparece uma vez só.

## 3. Site e API no Render

1. Envie as últimas mudanças para o GitHub (`git push`). O Render lê o `render.yaml` de lá.
2. Crie uma conta em render.com entrando com o GitHub e libere o acesso ao repositório
   `eco-denuncia-fullstack`.
3. Clique em **New > Blueprint** e escolha o repositório. O Render mostra dois serviços:
   `eco-denuncia-api` (Django) e `eco-denuncia` (site).
4. Preencha os valores que ele pedir:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | O endereço do Neon (passo 1) |
   | `FOTOS_BUCKET` | `eco-denuncia-fotos` |
   | `FOTOS_ENDPOINT` | O endereço da S3 API do R2 (passo 2) |
   | `FOTOS_ACCESS_KEY_ID` | O Access Key ID do token do R2 |
   | `FOTOS_SECRET_ACCESS_KEY` | O Secret Access Key do token do R2 |
   | `CORS_ALLOWED_ORIGINS` | `https://eco-denuncia.onrender.com` |
   | `DJANGO_SUPERUSER_EMAIL` | O seu e-mail, que vira o login do admin do Django |
   | `DJANGO_SUPERUSER_PASSWORD` | Uma senha forte só sua, com pelo menos 8 caracteres e que não seja comum |
   | `VITE_API_URL` | `https://eco-denuncia-api.onrender.com/api` |

   A chave secreta do Django (`DJANGO_SECRET_KEY`) o Render gera sozinho.
5. Clique em **Deploy Blueprint**. Na primeira vez, leva alguns minutos.
6. Confira os endereços que o Render deu aos dois serviços. Se algum nome já existia, o Render
   acrescenta letras, como `eco-denuncia-x1y2.onrender.com`. Nesse caso, corrija:
   - `CORS_ALLOWED_ORIGINS` na API, com o endereço real do site, sem `/` no fim;
   - `VITE_API_URL` no site, com o endereço real da API mais `/api`.

   Salve e faça um novo deploy dos dois. O site só lê o `VITE_API_URL` no build.

## 4. Contas de teste e administrador

O deploy da API cria as contas sozinho. Você não precisa rodar nada no computador, e o
servidor gratuito do Render nem abre terminal. Em todo deploy, depois das migrações:

- `popular_demo` cria as contas de teste que aparecem na tela de login (`maria@eco.br` e
  `admin@eco.br`) e 6 denúncias de exemplo. Nos deploys seguintes, ele não duplica nada nem troca
  senhas. A conta `admin@eco.br` usa o painel do site, mas não tem permissão nenhuma no admin do
  Django.
- `criar_admin` cria a **sua** conta do admin, em `https://eco-denuncia-api.onrender.com/admin/`,
  com o e-mail e a senha de `DJANGO_SUPERUSER_EMAIL` e `DJANGO_SUPERUSER_PASSWORD`. Se a conta já
  existe, ele não muda nada. Depois do primeiro deploy, você pode apagar a variável da senha no
  Render: a conta continua lá. Para trocar a senha depois, use o próprio admin.

Rodar comandos do seu computador direto no banco do Neon também funciona, mas só em redes que
liberam a porta 5432 do PostgreSQL. Redes de empresa costumam bloquear essa porta.

## 5. Conferir

1. Abra `https://eco-denuncia.onrender.com` e clique em **Entrar**.
2. Use a conta de cidadã e envie uma denúncia com foto. Se a API estava parada, espere até
   1 minuto.
3. Abra a denúncia e veja se a foto aparece.
4. Saia, entre com a conta da fiscalização e mude o status da denúncia no painel.

## Atualizar o site

Cada `git push` na `main` publica de novo sozinho. A API só refaz o deploy quando algo muda em
`backend/`, e o site quando algo muda em `frontend/`. As migrações do banco e a criação das
contas rodam no deploy da API.

## Se algo der errado

| O que aparece | Causa provável |
|---|---|
| O deploy da API falha com "No Render o disco é apagado a cada deploy" | Falta `DATABASE_URL` ou alguma variável `FOTOS_*` na API |
| O deploy da API falha com "Para guardar as fotos no bucket, defina também..." | Alguma variável `FOTOS_*` ficou em branco |
| O login mostra "Não foi possível falar com o servidor" | A API está acordando (espere 1 minuto), ou o `VITE_API_URL` ou o `CORS_ALLOWED_ORIGINS` está errado |
| A denúncia é enviada, mas a foto não aparece | O `FOTOS_ENDPOINT` tem o nome do bucket no fim, ou o token do R2 não tem acesso ao bucket |
| O admin abre sem cores nem estilo | O comando `collectstatic` falhou no build. Veja o log do deploy da API |
| O deploy da API falha com "Senha do administrador recusada" | A senha em `DJANGO_SUPERUSER_PASSWORD` é curta ou comum demais. Troque por uma mais forte |
| O deploy da API falha com "Defina DJANGO_SUPERUSER_EMAIL e DJANGO_SUPERUSER_PASSWORD juntos" | Só uma das duas variáveis foi preenchida. Preencha as duas, ou apague as duas para não criar administrador |
| `UnknownSchemeError: Scheme 'https://' is unknown` | O `DATABASE_URL` recebeu outro endereço. Copie no Neon, em **Connect**, o endereço que começa com `postgresql://` |
| Um comando do Django fica parado no seu computador ao usar o banco do Neon | A rede bloqueia a porta 5432. Deixe o deploy criar as contas (passo 4) ou use outra rede |
