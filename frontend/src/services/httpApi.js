// Cliente do backend Django REST Framework (usado quando VITE_API_URL está definida).
// Endpoints esperados estão descritos no README do frontend.
import { lerSessao, limparSessao, salvarSessao } from './sessao';
import { comprimirImagem } from '../utils/imagem';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function mensagemDeErro(dados, status) {
  if (dados?.detail) return dados.detail;
  if (dados && typeof dados === 'object') {
    const primeira = Object.values(dados).flat()[0];
    if (typeof primeira === 'string') return primeira;
  }
  return `O servidor respondeu com erro ${status}. Tente de novo em instantes.`;
}

// O token de acesso dura 30 minutos. Quando vence, troca pelo refresh (7 dias) uma vez
// e repete a requisição; várias chamadas simultâneas compartilham a mesma renovação.
let renovacaoEmAndamento = null;

function renovarToken() {
  const sessao = lerSessao();
  if (!sessao?.refresh) return Promise.resolve(false);
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = fetch(`${BASE}/token/refresh/`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: sessao.refresh }),
    })
      .then(async (resposta) => {
        if (!resposta.ok) return false;
        const { access, refresh } = await resposta.json();
        salvarSessao({ ...lerSessao(), token: access, refresh: refresh ?? sessao.refresh });
        return true;
      })
      .catch(() => false)
      .finally(() => {
        renovacaoEmAndamento = null;
      });
  }
  return renovacaoEmAndamento;
}

async function requisicao(caminho, { metodo = 'GET', corpo, autenticar = true, repetida = false } = {}) {
  const headers = { Accept: 'application/json' };
  const sessao = lerSessao();
  if (autenticar && sessao?.token) headers.Authorization = `Bearer ${sessao.token}`;

  let body;
  if (corpo instanceof FormData) {
    body = corpo;
  } else if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(corpo);
  }

  let resposta;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { method: metodo, headers, body });
  } catch {
    throw new Error('Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.');
  }

  if (resposta.status === 401 && autenticar) {
    if (!repetida && (await renovarToken())) {
      return requisicao(caminho, { metodo, corpo, autenticar, repetida: true });
    }
    limparSessao();
    window.dispatchEvent(new Event('eco:sessao-expirada'));
    throw new Error('Sua sessão terminou. Entre de novo para continuar.');
  }

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = new Error(mensagemDeErro(dados, resposta.status));
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

export function sessaoAtual() {
  return lerSessao();
}

export async function entrar(email, senha) {
  let tokens;
  try {
    tokens = await requisicao('/token/', {
      metodo: 'POST',
      corpo: { username: email.trim().toLowerCase(), password: senha },
      autenticar: false,
    });
  } catch (erro) {
    if (erro.status === 401) throw new Error('E-mail ou senha incorretos. Confira e tente de novo.');
    throw erro;
  }
  salvarSessao({ token: tokens.access, refresh: tokens.refresh, usuario: null });
  const usuario = await requisicao('/me/');
  const sessao = { token: tokens.access, refresh: tokens.refresh, usuario };
  salvarSessao(sessao);
  return sessao;
}

export async function cadastrar({ nome, email, senha }) {
  await requisicao('/usuarios/', {
    metodo: 'POST',
    corpo: { nome: nome.trim(), email: email.trim().toLowerCase(), senha },
    autenticar: false,
  });
  return entrar(email, senha);
}

export function sair() {
  limparSessao();
}

export async function listarDenuncias() {
  const dados = await requisicao('/denuncias/');
  return Array.isArray(dados) ? dados : dados?.results ?? [];
}

export function obterDenuncia(id) {
  return requisicao(`/denuncias/${id}/`);
}

export async function criarDenuncia(dados) {
  const form = new FormData();
  form.append('tipo', dados.tipo);
  form.append('descricao', dados.descricao.trim());
  form.append('latitude', dados.latitude.toFixed(6));
  form.append('longitude', dados.longitude.toFixed(6));
  form.append('endereco', dados.endereco.trim());
  if (dados.data_ocorrencia) form.append('data_ocorrencia', dados.data_ocorrencia);
  form.append('anonima', dados.anonima ? 'true' : 'false');
  for (const foto of dados.fotos) {
    const blob = await comprimirImagem(foto.arquivo);
    form.append('fotos', blob, `${foto.id}.jpg`);
  }
  return requisicao('/denuncias/', { metodo: 'POST', corpo: form });
}

export function atualizarStatus(id, status, nota) {
  return requisicao(`/denuncias/${id}/status/`, { metodo: 'POST', corpo: { status, nota } });
}
