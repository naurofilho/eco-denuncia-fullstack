import { Children, cloneElement } from 'react';
import { CircleAlert } from 'lucide-react';

// Rótulo + campo + ajuda + erro, já ligados por id/aria para leitores de tela.
export default function Campo({ id, rotulo, ajuda, erro, opcional = false, children }) {
  const idAjuda = ajuda ? `${id}-ajuda` : null;
  const idErro = erro ? `${id}-erro` : null;
  const descritores = [idAjuda, idErro].filter(Boolean).join(' ') || undefined;
  const campo = Children.only(children);

  return (
    <div className="campo">
      <label htmlFor={id}>
        {rotulo}
        {opcional && <span className="opcional"> (opcional)</span>}
      </label>
      {ajuda && (
        <p id={idAjuda} className="ajuda">
          {ajuda}
        </p>
      )}
      {cloneElement(campo, { id, 'aria-invalid': erro ? true : undefined, 'aria-describedby': descritores })}
      {erro && <MensagemErro id={idErro}>{erro}</MensagemErro>}
    </div>
  );
}

export function MensagemErro({ id, children }) {
  return (
    <p id={id} className="erro-campo">
      <CircleAlert size={16} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
