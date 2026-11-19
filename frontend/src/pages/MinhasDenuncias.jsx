import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import FiltroStatus, { contarPorStatus } from '../components/FiltroStatus';
import ListaDenuncias from '../components/ListaDenuncias';
import { Carregando, ErroAoCarregar, Vazio } from '../components/Estados';
import { useAuth } from '../context/AuthContext';
import { statusPorId } from '../data/status';
import { api } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { useTitulo } from '../hooks/useTitulo';

export default function MinhasDenuncias() {
  useTitulo('Minhas denúncias');
  const { usuario } = useAuth();
  const { dados, carregando, erro, recarregar } = useCarregar(() => api.listarDenuncias(), []);
  const [filtro, setFiltro] = useState('todas');

  const minhas = useMemo(() => (dados ?? []).filter((d) => d.user === usuario.id), [dados, usuario.id]);
  const visiveis = filtro === 'todas' ? minhas : minhas.filter((d) => d.status === filtro);

  function conteudo() {
    if (carregando) return <Carregando texto="Carregando suas denúncias" />;
    if (erro) return <ErroAoCarregar mensagem={erro} aoTentar={recarregar} />;
    if (!minhas.length) {
      return (
        <Vazio
          Icone={ClipboardList}
          titulo="Você ainda não fez nenhuma denúncia"
          texto="Quando você registrar uma, ela aparece aqui com o andamento."
        >
          <Link to="/denunciar" className="btn btn-denunciar">
            Fazer denúncia
          </Link>
        </Vazio>
      );
    }
    if (!visiveis.length) {
      return (
        <Vazio titulo={`Nenhuma denúncia com status ${statusPorId(filtro).nome}`}>
          <button type="button" className="btn btn-secundario" onClick={() => setFiltro('todas')}>
            Ver todas
          </button>
        </Vazio>
      );
    }
    return <ListaDenuncias denuncias={visiveis} />;
  }

  return (
    <div className="container pagina">
      <div className="pagina-topo">
        <div>
          <h1 className="titulo-pagina">Minhas denúncias</h1>
          <p className="ajuda">Abra uma denúncia para ver o andamento e as respostas da fiscalização.</p>
        </div>
        <Link to="/denunciar" className="btn btn-denunciar so-desktop">
          <Plus size={18} aria-hidden="true" />
          Fazer denúncia
        </Link>
      </div>

      {!carregando && !erro && minhas.length > 0 && (
        <FiltroStatus valor={filtro} contagem={contarPorStatus(minhas)} aoMudar={setFiltro} />
      )}
      {conteudo()}
    </div>
  );
}
