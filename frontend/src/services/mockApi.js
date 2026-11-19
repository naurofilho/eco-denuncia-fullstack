// API de demonstração: imita o backend Django usando o localStorage do navegador.
// Serve para apresentar e testar o visual sem servidor. NÃO use em produção
// (as senhas de teste ficam em texto puro no navegador).
import { lerSessao, limparSessao, salvarSessao } from './sessao';
import { blobParaDataURL, comprimirImagem } from '../utils/imagem';
import { diaISO } from '../utils/formato';

const CHAVE_USUARIOS = 'eco:usuarios';
const CHAVE_DENUNCIAS = 'eco:denuncias';
const CHAVE_VERSAO = 'eco:versao-dados';
const VERSAO = '1';

const esperar = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const HORA = 3600 * 1000;

function ler(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    throw new Error('O armazenamento deste navegador está cheio. Envie menos fotos e tente de novo.');
  }
}

function gerarProtocolo(id, iso) {
  return `ECO-${new Date(iso).getFullYear()}-${String(id).padStart(6, '0')}`;
}

function criarSementes() {
  const usuarios = [
    { id: 1, nome: 'Equipe de fiscalização', email: 'admin@eco.br', senha: 'admin123', is_staff: true },
    { id: 2, nome: 'Maria Souza', email: 'maria@eco.br', senha: 'maria123', is_staff: false },
    { id: 3, nome: 'João Lima', email: 'joao@eco.br', senha: 'joao1234', is_staff: false },
  ];

  const modelos = [
    {
      user: 2, tipo: 'queimada', status: 'recebida', horasAtras: 5,
      latitude: -15.7368, longitude: -47.9275,
      endereco: 'Margem da DF-003, perto da entrada do Parque Nacional',
      descricao: 'Fogo em área de cerrado ao lado da pista. A fumaça já está chegando nas casas do outro lado da via.',
    },
    {
      user: 2, tipo: 'lixo', status: 'analise', horasAtras: 4 * 24,
      latitude: -15.8162, longitude: -48.1063,
      endereco: 'Terreno baldio na QNM 18, Ceilândia',
      descricao: 'Um caminhão despejou entulho e restos de móveis no terreno durante a noite. Já é a terceira vez neste mês.',
      nota: 'Vistoria no local agendada para esta semana.',
    },
    {
      user: 2, tipo: 'agua', status: 'resolvida', horasAtras: 15 * 24,
      latitude: -15.8205, longitude: -47.8312,
      endereco: 'Lago Paranoá, próximo à Ponte JK',
      descricao: 'Mancha escura e cheiro forte de esgoto saindo de uma tubulação na margem do lago.',
      nota: 'Ligação clandestina de esgoto identificada e lacrada. O responsável foi autuado.',
    },
    {
      user: 2, tipo: 'desmatamento', status: 'analise', horasAtras: 7 * 24, anonima: true,
      latitude: -15.6489, longitude: -47.788,
      endereco: 'Estrada vicinal depois do Núcleo Rural, Sobradinho',
      descricao: 'Trator derrubando árvores nativas numa faixa grande de mata perto de uma nascente.',
      nota: 'Denúncia encaminhada ao órgão ambiental responsável pela área.',
    },
    {
      user: 3, tipo: 'ruido', status: 'recebida', horasAtras: 2 * 24,
      latitude: -15.8330, longitude: -48.0402,
      endereco: 'Avenida Comercial, Taguatinga Norte',
      descricao: 'Som muito alto todas as noites, até de madrugada, vindo de um estabelecimento comercial.',
    },
    {
      user: 3, tipo: 'animais', status: 'resolvida', horasAtras: 30 * 24,
      latitude: -16.0153, longitude: -48.0644,
      endereco: 'Feira do Gama, setor central',
      descricao: 'Venda de pássaros silvestres em gaiolas pequenas, incluindo canários-da-terra.',
      nota: 'Animais apreendidos e levados ao centro de triagem de animais silvestres.',
    },
  ];

  const agora = Date.now();
  const denuncias = modelos.map((m, i) => {
    const id = i + 1;
    const criada = new Date(agora - m.horasAtras * HORA);
    const nivel = ['recebida', 'analise', 'resolvida'].indexOf(m.status);
    const historico = [{ status: 'recebida', data: criada.toISOString(), nota: 'Denúncia registrada pelo site.' }];
    if (nivel >= 1) {
      historico.push({
        status: 'analise',
        data: new Date(criada.getTime() + 20 * HORA).toISOString(),
        nota: nivel === 1 ? m.nota : 'A equipe começou a verificar as informações.',
      });
    }
    if (nivel >= 2) {
      historico.push({ status: 'resolvida', data: new Date(criada.getTime() + 5 * 24 * HORA).toISOString(), nota: m.nota });
    }
    const autor = usuarios.find((u) => u.id === m.user);
    return {
      id,
      protocolo: gerarProtocolo(id, criada.toISOString()),
      user: m.user,
      autor: m.anonima ? null : autor.nome,
      anonima: Boolean(m.anonima),
      tipo: m.tipo,
      descricao: m.descricao,
      latitude: m.latitude,
      longitude: m.longitude,
      endereco: m.endereco,
      data_ocorrencia: diaISO(criada),
      fotos: [],
      status: m.status,
      created_at: criada.toISOString(),
      historico,
    };
  });

  return { usuarios, denuncias };
}

function garantirDados() {
  if (ler(CHAVE_VERSAO, null) === VERSAO) return;
  const { usuarios, denuncias } = criarSementes();
  gravar(CHAVE_USUARIOS, usuarios);
  gravar(CHAVE_DENUNCIAS, denuncias);
  gravar(CHAVE_VERSAO, VERSAO);
}

function semSenha({ senha, ...usuario }) {
  return usuario;
}

function usuarioLogado() {
  const sessao = lerSessao();
  if (!sessao?.usuario) throw new Error('Sua sessão terminou. Entre de novo para continuar.');
  return sessao.usuario;
}

function iniciarSessao(usuario) {
  const sessao = { token: `demo-${usuario.id}`, usuario: semSenha(usuario) };
  salvarSessao(sessao);
  return sessao;
}

export function sessaoAtual() {
  return lerSessao();
}

export async function entrar(email, senha) {
  garantirDados();
  await esperar();
  const usuario = ler(CHAVE_USUARIOS, []).find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha,
  );
  if (!usuario) throw new Error('E-mail ou senha incorretos. Confira e tente de novo.');
  return iniciarSessao(usuario);
}

export async function cadastrar({ nome, email, senha }) {
  garantirDados();
  await esperar();
  const usuarios = ler(CHAVE_USUARIOS, []);
  const emailNormalizado = email.trim().toLowerCase();
  if (usuarios.some((u) => u.email.toLowerCase() === emailNormalizado)) {
    throw new Error('Já existe uma conta com este e-mail. Entre com ela ou use outro e-mail.');
  }
  const novo = {
    id: Math.max(0, ...usuarios.map((u) => u.id)) + 1,
    nome: nome.trim(),
    email: emailNormalizado,
    senha,
    is_staff: false,
  };
  gravar(CHAVE_USUARIOS, [...usuarios, novo]);
  return iniciarSessao(novo);
}

export function sair() {
  limparSessao();
}

export async function listarDenuncias() {
  garantirDados();
  await esperar();
  const usuario = usuarioLogado();
  const todas = ler(CHAVE_DENUNCIAS, []);
  const visiveis = usuario.is_staff ? todas : todas.filter((d) => d.user === usuario.id);
  return [...visiveis].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function obterDenuncia(id) {
  garantirDados();
  await esperar(300);
  const usuario = usuarioLogado();
  const denuncia = ler(CHAVE_DENUNCIAS, []).find((d) => d.id === Number(id));
  if (!denuncia || (!usuario.is_staff && denuncia.user !== usuario.id)) {
    throw new Error('Não encontramos esta denúncia. Confira o endereço ou volte para a sua lista.');
  }
  return denuncia;
}

export async function criarDenuncia(dados) {
  garantirDados();
  const usuario = usuarioLogado();
  const fotos = [];
  for (const foto of dados.fotos) {
    const blob = await comprimirImagem(foto.arquivo, { maxLado: 720, qualidade: 0.6 });
    fotos.push(await blobParaDataURL(blob));
  }
  await esperar(700);

  const todas = ler(CHAVE_DENUNCIAS, []);
  const id = Math.max(0, ...todas.map((d) => d.id)) + 1;
  const agora = new Date().toISOString();
  const nova = {
    id,
    protocolo: gerarProtocolo(id, agora),
    user: usuario.id,
    autor: dados.anonima ? null : usuario.nome,
    anonima: dados.anonima,
    tipo: dados.tipo,
    descricao: dados.descricao.trim(),
    latitude: dados.latitude,
    longitude: dados.longitude,
    endereco: dados.endereco.trim(),
    data_ocorrencia: dados.data_ocorrencia || null,
    fotos,
    status: 'recebida',
    created_at: agora,
    historico: [{ status: 'recebida', data: agora, nota: 'Denúncia registrada pelo site.' }],
  };
  gravar(CHAVE_DENUNCIAS, [...todas, nova]);
  return nova;
}

export async function atualizarStatus(id, status, nota) {
  garantirDados();
  await esperar();
  const usuario = usuarioLogado();
  if (!usuario.is_staff) throw new Error('Só a equipe de fiscalização pode mudar o status.');
  const todas = ler(CHAVE_DENUNCIAS, []);
  const denuncia = todas.find((d) => d.id === Number(id));
  if (!denuncia) throw new Error('Não encontramos esta denúncia.');
  denuncia.status = status;
  denuncia.historico = [
    ...(denuncia.historico ?? []),
    { status, data: new Date().toISOString(), nota: nota?.trim() || null },
  ];
  gravar(CHAVE_DENUNCIAS, todas);
  return denuncia;
}
