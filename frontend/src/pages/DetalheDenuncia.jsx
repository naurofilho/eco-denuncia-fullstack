import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LinhaDoTempo from '../components/LinhaDoTempo';
import MapaDenuncias from '../components/MapaDenuncias';
import Galeria from '../components/Galeria';
import AtualizarStatus from '../components/AtualizarStatus';
import { Carregando, ErroAoCarregar } from '../components/Estados';
import { useAuth } from '../context/AuthContext';
import { tipoPorId } from '../data/tipos';
import { api } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { useTitulo } from '../hooks/useTitulo';
import { formatarCoordenadas, formatarDataHora, formatarDia } from '../utils/formato';

export default function DetalheDenuncia() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { dados: d, carregando, erro, recarregar, definirDados } = useCarregar(() => api.obterDenuncia(id), [id]);
  useTitulo(d ? `${tipoPorId(d.tipo).nome} ${d.protocolo}` : 'Denúncia');

  const equipe = usuario.is_staff;
  const voltar = equipe ? { para: '/painel', rotulo: 'Painel' } : { para: '/minhas-denuncias', rotulo: 'Minhas denúncias' };

  if (carregando) return <div className="container pagina"><Carregando texto="Carregando a denúncia" /></div>;
  if (erro) {
    return (
      <div className="container pagina">
        <ErroAoCarregar mensagem={erro} aoTentar={recarregar} />
      </div>
    );
  }

  const tipo = tipoPorId(d.tipo);
  const lat = Number(d.latitude);
  const lng = Number(d.longitude);

  return (
    <div className="container pagina">
      <Link to={voltar.para} className="voltar">
        <ChevronLeft size={18} aria-hidden="true" />
        {voltar.rotulo}
      </Link>

      <header className="detalhe-topo">
        <span className="detalhe-icone" aria-hidden="true">
          <tipo.Icone size={28} />
        </span>
        <div className="detalhe-titulos">
          <h1 className="titulo-pagina">{tipo.nome}</h1>
          <p className="detalhe-protocolo">Protocolo {d.protocolo}</p>
        </div>
        <StatusBadge status={d.status} />
      </header>

      <div className="detalhe-grade">
        <div className="detalhe-principal">
          <section className="bloco" aria-labelledby="desc-titulo">
            <h2 id="desc-titulo" className="bloco-titulo">
              O que aconteceu
            </h2>
            <p className="detalhe-descricao">{d.descricao}</p>
            <dl className="dados">
              <div>
                <dt>Data da ocorrência</dt>
                <dd>{d.data_ocorrencia ? formatarDia(d.data_ocorrencia) : 'Não informada'}</dd>
              </div>
              <div>
                <dt>Registrada em</dt>
                <dd>{formatarDataHora(d.created_at)}</dd>
              </div>
              {equipe && (
                <div>
                  <dt>Quem denunciou</dt>
                  <dd>{d.anonima ? 'Pediu para não ser identificado' : d.autor || 'Não informado'}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bloco" aria-labelledby="local-titulo">
            <h2 id="local-titulo" className="bloco-titulo">
              Local
            </h2>
            <MapaDenuncias denuncias={[d]} comLinks={false} className="mapa-detalhe" />
            {d.endereco && <p className="detalhe-endereco">{d.endereco}</p>}
            <p className="ajuda">
              {formatarCoordenadas(lat, lng)}{' '}
              <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noreferrer">
                Abrir no mapa
              </a>
            </p>
          </section>

          <section className="bloco" aria-labelledby="fotos-titulo">
            <h2 id="fotos-titulo" className="bloco-titulo">
              Fotos
            </h2>
            <Galeria fotos={d.fotos} />
          </section>
        </div>

        <aside className="detalhe-lateral">
          <section className="bloco" aria-labelledby="andamento-titulo">
            <h2 id="andamento-titulo" className="bloco-titulo">
              Andamento
            </h2>
            <LinhaDoTempo denuncia={d} />
          </section>
          {equipe && <AtualizarStatus denuncia={d} aoAtualizar={definirDados} />}
        </aside>
      </div>
    </div>
  );
}
