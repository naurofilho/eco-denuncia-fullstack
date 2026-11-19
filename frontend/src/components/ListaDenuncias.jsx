import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { tipoPorId } from '../data/tipos';
import { formatarCoordenadas, formatarData } from '../utils/formato';

export default function ListaDenuncias({ denuncias }) {
  return (
    <ul className="lista-denuncias">
      {denuncias.map((d) => {
        const tipo = tipoPorId(d.tipo);
        return (
          <li key={d.id}>
            <Link to={`/denuncias/${d.id}`} className="denuncia-linha">
              <span className="denuncia-icone" aria-hidden="true">
                <tipo.Icone size={22} />
              </span>
              <span className="denuncia-info">
                <span className="denuncia-tipo">{tipo.nome}</span>
                <span className="denuncia-local">{d.endereco || formatarCoordenadas(d.latitude, d.longitude)}</span>
                <span className="denuncia-meta">
                  <span>{d.protocolo}</span>
                  <span>{formatarData(d.created_at)}</span>
                </span>
              </span>
              <StatusBadge status={d.status} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
