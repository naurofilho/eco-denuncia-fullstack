import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import Campo, { MensagemErro } from '../components/Campo';
import CampoSenha from '../components/CampoSenha';
import { useAuth } from '../context/AuthContext';
import { useTitulo } from '../hooks/useTitulo';

const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

export default function Cadastro() {
  useTitulo('Criar conta');
  const { usuario, cadastrar } = useAuth();
  const navigate = useNavigate();
  const destino = useLocation().state?.de;

  const [dados, setDados] = useState({ nome: '', email: '', senha: '', confirmacao: '', aceite: false });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario && !enviando) return <Navigate to="/" replace />;

  const atualizar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDados((d) => ({ ...d, [campo]: valor }));
  };

  async function aoEnviar(e) {
    e.preventDefault();
    const novos = {};
    if (dados.nome.trim().length < 3) novos.nome = 'Digite seu nome completo.';
    if (!EMAIL_VALIDO.test(dados.email.trim())) novos.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (dados.senha.length < 8) novos.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    if (dados.confirmacao !== dados.senha) novos.confirmacao = 'As senhas não são iguais.';
    if (!dados.aceite) novos.aceite = 'Para criar a conta, aceite o uso dos dados.';
    setErros(novos);
    setErroGeral('');
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      await cadastrar({ nome: dados.nome, email: dados.email, senha: dados.senha });
      navigate(destino ? `${destino.pathname}${destino.search ?? ''}` : '/denunciar', { replace: true });
    } catch (falha) {
      setErroGeral(falha.message);
      setEnviando(false);
    }
  }

  return (
    <div className="container pagina pagina-auth">
      <div className="auth-caixa">
        <h1 className="titulo-pagina">Criar conta</h1>
        <p className="auth-contexto">Com uma conta você acompanha cada denúncia que fizer.</p>

        {erroGeral && (
          <div className="alerta alerta-erro" role="alert">
            {erroGeral}
          </div>
        )}

        <form onSubmit={aoEnviar} noValidate>
          <Campo id="nome" rotulo="Nome completo" erro={erros.nome}>
            <input className="input" autoComplete="name" value={dados.nome} onChange={atualizar('nome')} />
          </Campo>
          <Campo id="email" rotulo="E-mail" erro={erros.email}>
            <input
              type="email"
              className="input"
              autoComplete="email"
              inputMode="email"
              value={dados.email}
              onChange={atualizar('email')}
            />
          </Campo>
          <Campo id="senha" rotulo="Senha" ajuda="Pelo menos 8 caracteres." erro={erros.senha}>
            <CampoSenha autoComplete="new-password" value={dados.senha} onChange={atualizar('senha')} />
          </Campo>
          <Campo id="confirmacao" rotulo="Repita a senha" erro={erros.confirmacao}>
            <CampoSenha autoComplete="new-password" value={dados.confirmacao} onChange={atualizar('confirmacao')} />
          </Campo>

          <div className="campo">
            <label className="caixa-marcar">
              <input
                type="checkbox"
                checked={dados.aceite}
                onChange={atualizar('aceite')}
                aria-invalid={erros.aceite ? true : undefined}
                aria-describedby={erros.aceite ? 'aceite-erro' : undefined}
              />
              <span>Concordo com o uso dos meus dados para registrar e acompanhar denúncias, conforme a LGPD.</span>
            </label>
            {erros.aceite && <MensagemErro id="aceite-erro">{erros.aceite}</MensagemErro>}
          </div>

          <button type="submit" className="btn btn-primario btn-bloco btn-grande" disabled={enviando}>
            {enviando && <LoaderCircle size={20} className="girando" aria-hidden="true" />}
            {enviando ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-troca">
          Já tem conta? <Link to="/entrar" state={destino ? { de: destino } : undefined}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
