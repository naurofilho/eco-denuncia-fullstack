import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import Topografia from '../components/Topografia';
import LinhaDoTempo from '../components/LinhaDoTempo';
import { Carregando, ErroAoCarregar } from '../components/Estados';
import { api } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { useTitulo } from '../hooks/useTitulo';

export default function DenunciaEnviada() {
  useTitulo('Denúncia enviada');
  const { id } = useParams();
  const { dados: denuncia, carregando, erro, recarregar } = useCarregar(() => api.obterDenuncia(id), [id]);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(denuncia.protocolo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  if (carregando) return <div className="container pagina"><Carregando texto="Carregando o protocolo" /></div>;
  if (erro) return <div className="container pagina"><ErroAoCarregar mensagem={erro} aoTentar={recarregar} /></div>;

  return (
    <div className="container pagina pagina-formulario">
      <section className="enviada" aria-labelledby="enviada-titulo">
        <Topografia className="enviada-fundo" />
        <div className="enviada-conteudo">
          <span className="enviada-selo" aria-hidden="true">
            <Check size={28} strokeWidth={3} />
          </span>
          <h1 id="enviada-titulo">Denúncia enviada</h1>
          <p>Guarde o número do protocolo. Ele identifica sua denúncia em qualquer contato com a fiscalização.</p>
          <p className="protocolo">{denuncia.protocolo}</p>
          <button type="button" className="btn btn-claro" onClick={copiar}>
            {copiado ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            {copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
          </button>
          <span className="visualmente-oculto" role="status">
            {copiado ? 'Protocolo copiado' : ''}
          </span>
        </div>
      </section>

      <section className="bloco" aria-labelledby="proximos-titulo">
        <h2 id="proximos-titulo" className="bloco-titulo">
          O que acontece agora
        </h2>
        <LinhaDoTempo denuncia={denuncia} />
      </section>

      <div className="acoes-finais">
        <Link to={`/denuncias/${denuncia.id}`} className="btn btn-primario">
          Ver minha denúncia
        </Link>
        <Link to="/denunciar" className="btn btn-secundario">
          Fazer outra denúncia
        </Link>
      </div>
    </div>
  );
}
