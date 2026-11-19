import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, House, LayoutDashboard, LogIn, LogOut, Phone, Plus } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { MODO_DEMO, SITE_DEMO } from '../services/api';

export default function Layout() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const noFormulario = pathname.startsWith('/denunciar');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Em páginas protegidas, a RotaProtegida leva ao início; nas públicas, a pessoa fica onde está.
  function aoSair() {
    sair();
  }

  const primeiroNome = usuario?.nome?.split(' ')[0];

  return (
    <div className={`app ${noFormulario ? '' : 'com-nav-inferior'}`}>
      <a href="#conteudo" className="pular">
        Pular para o conteúdo
      </a>

      <div className="faixa-emergencia">
        <Phone size={15} aria-hidden="true" />
        <span>Fogo acontecendo agora?</span>
        <a href="tel:193">Ligue 193</a>
      </div>

      <header className="topo">
        <div className="container topo-interno">
          <Link to="/" className="marca">
            <Logo />
            <span>EcoDenúncia</span>
          </Link>

          <nav className="nav-principal" aria-label="Principal">
            <NavLink to="/" end>
              Início
            </NavLink>
            <NavLink to="/minhas-denuncias">Minhas denúncias</NavLink>
            {usuario?.is_staff && <NavLink to="/painel">Painel</NavLink>}
          </nav>

          <div className="topo-acoes">
            <Link to="/denunciar" className="btn btn-denunciar so-desktop">
              <Plus size={18} aria-hidden="true" />
              Fazer denúncia
            </Link>
            {usuario ? (
              <>
                <span className="topo-usuario so-desktop">Olá, {primeiroNome}</span>
                <button type="button" className="btn btn-texto" onClick={aoSair}>
                  <LogOut size={18} aria-hidden="true" />
                  Sair
                </button>
              </>
            ) : (
              <Link to="/entrar" className="btn btn-texto">
                <LogIn size={18} aria-hidden="true" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="container rodape-interno">
          <div className="rodape-marca">
            <Logo tamanho={24} />
            <span>EcoDenúncia</span>
          </div>
          <p>
            Em emergência, ligue <a href="tel:193">193</a> (Bombeiros) ou <a href="tel:190">190</a> (Polícia
            Militar). Este site não faz atendimento de emergência.
          </p>
          {MODO_DEMO && (
            <p className="rodape-demo">Modo de demonstração: os dados ficam salvos só neste navegador.</p>
          )}
          {SITE_DEMO && (
            <p className="rodape-demo">
              Site de demonstração: não envie denúncias reais nem dados pessoais. Os dados podem ser apagados.
            </p>
          )}
        </div>
      </footer>

      {!noFormulario && (
        <nav className="nav-inferior" aria-label="Atalhos">
          <NavLink to="/" end>
            <House size={22} aria-hidden="true" />
            Início
          </NavLink>
          <NavLink to="/denunciar" className="nav-inferior-denunciar">
            <span className="nav-inferior-botao">
              <Plus size={26} aria-hidden="true" />
            </span>
            Denunciar
          </NavLink>
          <NavLink to="/minhas-denuncias">
            <ClipboardList size={22} aria-hidden="true" />
            Minhas
          </NavLink>
          {usuario?.is_staff && (
            <NavLink to="/painel">
              <LayoutDashboard size={22} aria-hidden="true" />
              Painel
            </NavLink>
          )}
        </nav>
      )}
    </div>
  );
}
