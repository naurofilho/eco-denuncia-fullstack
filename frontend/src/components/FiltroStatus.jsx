import { STATUS } from '../data/status';

const OPCOES = [{ id: 'todas', nome: 'Todas' }, ...STATUS];

export function contarPorStatus(denuncias) {
  const contagem = { todas: denuncias.length };
  for (const s of STATUS) contagem[s.id] = denuncias.filter((d) => d.status === s.id).length;
  return contagem;
}

export default function FiltroStatus({ valor, contagem, aoMudar }) {
  return (
    <div className="filtros" role="group" aria-label="Filtrar por status">
      {OPCOES.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`filtro filtro-${o.id}`}
          aria-pressed={valor === o.id}
          onClick={() => aoMudar(o.id)}
        >
          {o.nome}
          <span className="filtro-n">{contagem[o.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
