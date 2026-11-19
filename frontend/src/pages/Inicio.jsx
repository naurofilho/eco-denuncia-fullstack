import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck } from 'lucide-react';
import Topografia from '../components/Topografia';
import { TIPOS } from '../data/tipos';
import { useTitulo } from '../hooks/useTitulo';

const PINOS = [
  { x: 880, y: 215, rotulo: 'Queimada', atraso: 250 },
  { x: 1020, y: 330, rotulo: 'Desmatamento', atraso: 550 },
  { x: 940, y: 440, rotulo: 'Esgoto no córrego', atraso: 850 },
];

function PinoHero({ x, y, rotulo, atraso }) {
  const largura = rotulo.length * 8.6 + 24;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="pino-hero" style={{ animationDelay: `${atraso}ms` }}>
        <path d="M0 0c-9-12-16-19-16-28a16 16 0 0 1 32 0c0 9-7 16-16 28z" className="pino-hero-corpo" />
        <circle cx="0" cy="-28" r="6" className="pino-hero-miolo" />
        <g className="pino-hero-rotulo">
          <rect x="22" y="-46" width={largura} height="30" rx="6" />
          <text x="34" y="-26">
            {rotulo}
          </text>
        </g>
      </g>
    </g>
  );
}

const PASSOS = [
  { titulo: 'Escolha o que aconteceu', texto: 'Queimada, lixo, desmatamento, poluição de rio e outros.' },
  { titulo: 'Marque o local', texto: 'Use a localização do celular ou toque no mapa.' },
  { titulo: 'Envie e acompanhe', texto: 'Anexe fotos e receba um protocolo para ver cada mudança de status.' },
];

export default function Inicio() {
  useTitulo(null);

  return (
    <>
      <section className="hero" aria-labelledby="hero-titulo">
        <Topografia className="hero-mapa" alinhamento="xMaxYMid">
          {PINOS.map((p) => (
            <PinoHero key={p.rotulo} {...p} />
          ))}
        </Topografia>
        <div className="container hero-conteudo">
          <h1 id="hero-titulo">Viu um crime ambiental? Registre aqui.</h1>
          <p className="hero-texto">
            Marque o local no mapa, envie fotos e acompanhe cada etapa até a solução. A equipe de fiscalização
            analisa todas as denúncias.
          </p>
          <div className="hero-acoes">
            <Link to="/denunciar" className="btn btn-denunciar btn-grande">
              <MapPin size={20} aria-hidden="true" />
              Fazer denúncia
            </Link>
            <Link to="/minhas-denuncias" className="btn btn-claro btn-grande">
              Acompanhar minhas denúncias
            </Link>
          </div>
        </div>
      </section>

      <section className="secao" aria-labelledby="como-titulo">
        <div className="container">
          <h2 id="como-titulo">Como funciona</h2>
          <ol className="passos">
            {PASSOS.map((p, i) => (
              <li key={p.titulo}>
                <span className="passo-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="secao secao-tipos" aria-labelledby="tipos-titulo">
        <div className="container">
          <h2 id="tipos-titulo">O que você pode denunciar</h2>
          <p className="secao-intro">Escolha um tipo para começar a denúncia com ele já marcado.</p>
          <ul className="tipos-lista">
            {TIPOS.map((t) => (
              <li key={t.id}>
                <Link to={`/denunciar?tipo=${t.id}`} className="tipo-link">
                  <span className="tipo-link-icone" aria-hidden="true">
                    <t.Icone size={24} />
                  </span>
                  <span className="tipo-link-texto">
                    <strong>{t.nome}</strong>
                    <span>{t.exemplo}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="secao secao-privacidade" aria-labelledby="privacidade-titulo">
        <div className="container privacidade">
          <div>
            <ShieldCheck size={36} className="privacidade-icone" aria-hidden="true" />
            <h2 id="privacidade-titulo">Sua identidade fica protegida</h2>
            <p>Quem denuncia não deve correr risco. Por isso, você decide o que é compartilhado.</p>
          </div>
          <ul className="privacidade-lista">
            <li>Você pode pedir que seu nome não seja enviado ao órgão responsável.</li>
            <li>As fotos são regravadas antes do envio, sem os dados do arquivo original.</li>
            <li>Seus dados servem só para registrar e acompanhar a denúncia, conforme a LGPD.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
