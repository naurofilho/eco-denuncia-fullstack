# EcoDenúncia: frontend

Interface em React + Vite para registrar denúncias ambientais e acompanhar o andamento.

## Como rodar

Requer Node.js 18 ou mais recente.

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173.

### Modo de demonstração

Sem a variável `VITE_API_URL`, o site funciona sozinho, sem backend. Os dados ficam salvos no
`localStorage` do navegador. Contas de teste:

| Perfil | E-mail | Senha |
|---|---|---|
| Cidadã | maria@eco.br | maria123 |
| Fiscalização (painel) | admin@eco.br | admin123 |

Para apagar os dados de teste, limpe o armazenamento do site no navegador.

### Ligar ao backend Django

Com o backend rodando (veja `../backend/README.md`), crie um arquivo `.env` aqui
(veja `.env.example`) e reinicie o `npm run dev`:

```
VITE_API_URL=http://localhost:8000/api
```

O backend já libera `http://localhost:5173` no CORS.

### Site de demonstração publicado

Com `VITE_SITE_DEMO=1`, o site ligado ao Django mostra as contas de teste na tela de login, avisa
que o primeiro acesso pode demorar e pede no rodapé que ninguém envie dados reais. O passo a passo
da publicação está em `../DEPLOY.md`.

## Telas

| Rota | Tela |
|---|---|
| `/` | Início: como funciona, tipos de denúncia, privacidade |
| `/entrar`, `/cadastro` | Login e criação de conta |
| `/denunciar` | Formulário em 4 etapas: tipo, local no mapa, detalhes e fotos, revisão |
| `/denuncias/:id/enviada` | Confirmação com número de protocolo |
| `/minhas-denuncias` | Lista do cidadão com filtro por status |
| `/denuncias/:id` | Detalhe com linha do tempo; a equipe também muda o status aqui |
| `/painel` | Painel da fiscalização: mapa, busca, filtros e tabela (só `is_staff`) |

## API usada

Endpoints, formato dos dados e regras de acesso estão em `../backend/README.md`. O cliente fica
em `src/services/httpApi.js`. Quando o token de acesso vence, ele troca pelo token de renovação
(`/token/refresh/`) e repete a chamada. Se a renovação também falhar, pede login de novo.

## Estrutura

```
src/
  components/   peças reutilizáveis (layout, campos, mapa, linha do tempo…)
  pages/        uma pasta/arquivo por tela; nova-denuncia/ tem as 4 etapas
  services/     api.js escolhe entre mockApi.js (demonstração) e httpApi.js (Django)
  data/         tipos de ocorrência e status
  styles/       base.css (cores e tipografia), componentes.css, paginas.css
```

## Observações

- Mapas: Leaflet com OpenStreetMap. Para produção com muito acesso, use um provedor de mapas
  próprio (a política de uso do OSM limita o uso intenso).
- As fotos são redimensionadas e regravadas em JPEG no navegador antes do envio. Isso reduz o
  tamanho e remove os metadados do arquivo original.
