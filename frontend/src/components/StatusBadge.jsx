import { statusPorId } from '../data/status';

export default function StatusBadge({ status }) {
  const s = statusPorId(status);
  return (
    <span className={`status status-${s.id}`}>
      <span className="status-ponto" aria-hidden="true" />
      {s.nome}
    </span>
  );
}
