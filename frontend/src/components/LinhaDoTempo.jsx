import { Check } from 'lucide-react';
import { STATUS } from '../data/status';
import { formatarDataHora } from '../utils/formato';

// Mostra as três etapas (Recebida, Em análise, Resolvida) com o histórico de cada uma.
export default function LinhaDoTempo({ denuncia }) {
  const historico = denuncia.historico?.length
    ? denuncia.historico
    : [{ status: denuncia.status, data: denuncia.created_at, nota: null }];
  const atual = STATUS.findIndex((s) => s.id === denuncia.status);

  return (
    <ol className="linha-tempo">
      {STATUS.map((s, i) => {
        const eventos = historico.filter((h) => h.status === s.id);
        const feito = i <= atual;
        const classes = ['marco', `marco-${s.id}`, feito ? 'marco-feito' : 'marco-pendente', i === atual ? 'marco-atual' : '']
          .filter(Boolean)
          .join(' ');
        return (
          <li key={s.id} className={classes} aria-current={i === atual ? 'step' : undefined}>
            <span className="marco-ponto" aria-hidden="true">
              {feito && <Check size={14} strokeWidth={3} />}
            </span>
            <div className="marco-texto">
              <p className="marco-nome">
                {s.nome}
                {!feito && <span className="visualmente-oculto"> (ainda não)</span>}
              </p>
              {feito && eventos.length > 0 ? (
                eventos.map((ev, k) => (
                  <div key={k} className="marco-evento">
                    <time dateTime={ev.data}>{formatarDataHora(ev.data)}</time>
                    {ev.nota && <p className="marco-nota">{ev.nota}</p>}
                  </div>
                ))
              ) : (
                <p className="marco-descricao">{s.descricao}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
