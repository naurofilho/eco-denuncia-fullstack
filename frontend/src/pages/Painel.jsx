import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import FiltroStatus, { contarPorStatus } from '../components/FiltroStatus';
import MapaDenuncias from '../components/MapaDenuncias';
import StatusBadge from '../components/StatusBadge';
import { Carregando, ErroAoCarregar, Vazio } from '../components/Estados';
import { TIPOS, tipoPorId } from '../data/tipos';
import { api } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { useTitulo } from '../hooks/useTitulo';
import { formatarData } from '../utils/formato';

export default function Painel() {
  useTitulo('Painel de denúncias');
  const navigate = useNavigate();
  const { dados, carregando, erro, recarregar } = useCarregar(() => api.listarDenuncias(), []);
  const [status, setStatus] = useState('todas');
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');

  const todas = dados ?? [];
  const semStatus = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todas.filter(
      (d) =>
        (!tipo || d.tipo === tipo) &&
        (!termo || [d.protocolo, d.endereco, d.descricao].some((v) => v?.toLowerCase().includes(termo))),
    );
  }, [todas, tipo, busca]);
  const filtradas = status === 'todas' ? semStatus : semStatus.filter((d) => d.status === status);

  function limpar() {
    setStatus('todas');
    setTipo('');
    setBusca('');
  }

  return (
    <div className="container pagina pagina-larga">
      <div className="pagina-topo">
        <div>
          <h1 className="titulo-pagina">Painel de denúncias</h1>
          <p className="ajuda">Abra uma denúncia para ver os detalhes, mudar o status e responder ao cidadão.</p>
        </div>
      </div>

      {carregando && <Carregando texto="Carregando denúncias" />}
      {erro && <ErroAoCarregar mensagem={erro} aoTentar={recarregar} />}

      {!carregando && !erro && (
        <>
          <div className="painel-filtros">
            <div className="campo campo-busca">
              <label htmlFor="busca">Buscar</label>
              <div className="input-com-icone">
                <Search size={18} aria-hidden="true" />
                <input
                  id="busca"
                  type="search"
                  className="input"
                  placeholder="Protocolo, endereço ou descrição"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
            <div className="campo">
              <label htmlFor="filtro-tipo">Tipo</label>
              <select id="filtro-tipo" className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos os tipos</option>
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FiltroStatus valor={status} contagem={contarPorStatus(semStatus)} aoMudar={setStatus} />

          {filtradas.length === 0 ? (
            <Vazio titulo="Nenhuma denúncia com esses filtros" texto="Mude os filtros ou limpe a busca para ver mais.">
              <button type="button" className="btn btn-secundario" onClick={limpar}>
                Limpar filtros
              </button>
            </Vazio>
          ) : (
            <>
              <MapaDenuncias denuncias={filtradas} className="mapa-painel" />
              <div className="tabela-moldura">
                <table className="tabela">
                  <caption className="visualmente-oculto">Denúncias filtradas, da mais recente para a mais antiga</caption>
                  <thead>
                    <tr>
                      <th scope="col">Protocolo</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Local</th>
                      <th scope="col">Registrada</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((d) => {
                      const t = tipoPorId(d.tipo);
                      return (
                        <tr key={d.id} onClick={() => navigate(`/denuncias/${d.id}`)}>
                          <td data-rotulo="Protocolo">
                            <Link to={`/denuncias/${d.id}`} onClick={(e) => e.stopPropagation()}>
                              {d.protocolo}
                            </Link>
                          </td>
                          <td data-rotulo="Tipo">
                            <span className="tabela-tipo">
                              <t.Icone size={18} aria-hidden="true" />
                              {t.nome}
                            </span>
                          </td>
                          <td data-rotulo="Local" className="tabela-local">
                            {d.endereco || 'Sem referência'}
                          </td>
                          <td data-rotulo="Registrada">{formatarData(d.created_at)}</td>
                          <td data-rotulo="Status">
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
