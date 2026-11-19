import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import Campo from '../components/Campo';
import CampoSenha from '../components/CampoSenha';
import { useAuth } from '../context/AuthContext';
import { MODO_DEMO, SITE_DEMO } from '../services/api';
import { useTitulo } from '../hooks/useTitulo';

const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

const CONTAS_DEMO = [
  { rotulo: 'Usar conta de cidadã', email: 'maria@eco.br', senha: 'maria123' },
  { rotulo: 'Usar conta da fiscalização', email: 'admin@eco.br', senha: 'admin123' },
];

export default function Entrar() {
  useTitulo('Entrar');
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const destino = useLocation().state?.de;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario && !enviando) return <Navigate to="/" replace />;

  async function aoEnviar(e) {
    e.preventDefault();
    const novos = {};
    if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (!senha) novos.senha = 'Digite sua senha.';
    setErros(novos);
    setErroGeral('');
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const logado = await entrar(email, senha);
      const para = destino
        ? `${destino.pathname}${destino.search ?? ''}`
        : logado.is_staff
          ? '/painel'
          : '/minhas-denuncias';
      navigate(para, { replace: true });
    } catch (falha) {
      setErroGeral(falha.message);
      setEnviando(false);
    }
  }

  const contexto =
    destino?.pathname === '/denunciar'
      ? 'Entre para registrar sua denúncia. Assim você acompanha o andamento por aqui.'
      : destino
        ? 'Entre para continuar.'
        : 'Entre para registrar e acompanhar suas denúncias.';

  return (
    <div className="container pagina pagina-auth">
      <div className="auth-caixa">
        <h1 className="titulo-pagina">Entrar</h1>
        <p className="auth-contexto">{contexto}</p>

        {erroGeral && (
          <div className="alerta alerta-erro" role="alert">
            {erroGeral}
          </div>
        )}

        <form onSubmit={aoEnviar} noValidate>
          <Campo id="email" rotulo="E-mail" erro={erros.email}>
            <input
              type="email"
              className="input"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Campo>
          <Campo id="senha" rotulo="Senha" erro={erros.senha}>
            <CampoSenha autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </Campo>
          <button type="submit" className="btn btn-primario btn-bloco btn-grande" disabled={enviando}>
            {enviando && <LoaderCircle size={20} className="girando" aria-hidden="true" />}
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="auth-troca">
          Ainda não tem conta? <Link to="/cadastro" state={destino ? { de: destino } : undefined}>Criar conta</Link>
        </p>

        {(MODO_DEMO || SITE_DEMO) && (
          <div className="alerta alerta-info demo">
            <p>
              <strong>{MODO_DEMO ? 'Modo de demonstração.' : 'Site de demonstração.'}</strong> Use uma conta
              de teste para ver o site funcionando:
            </p>
            <div className="demo-botoes">
              {CONTAS_DEMO.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => {
                    setEmail(c.email);
                    setSenha(c.senha);
                    setErros({});
                  }}
                >
                  {c.rotulo}
                </button>
              ))}
            </div>
            {SITE_DEMO && (
              <p className="demo-nota">
                O servidor desliga quando fica sem uso. Se ele estiver parado, a primeira entrada pode levar até 1
                minuto.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
