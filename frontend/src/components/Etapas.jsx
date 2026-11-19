import { Check } from 'lucide-react';

export default function Etapas({ etapas, atual }) {
  return (
    <nav className="etapas" aria-label="Etapas da denúncia">
      <p className="etapas-resumo">
        Etapa {atual + 1} de {etapas.length}
      </p>
      <ol>
        {etapas.map((nome, i) => {
          const estado = i < atual ? 'feita' : i === atual ? 'atual' : 'futura';
          return (
            <li key={nome} className={`etapa-item etapa-${estado}`} aria-current={i === atual ? 'step' : undefined}>
              <span className="etapa-num" aria-hidden="true">
                {i < atual ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="etapa-nome">{nome}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
