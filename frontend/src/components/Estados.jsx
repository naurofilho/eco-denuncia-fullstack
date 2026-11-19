import { LoaderCircle, TriangleAlert } from 'lucide-react';

export function Carregando({ texto = 'Carregando' }) {
  return (
    <div className="estado" role="status">
      <LoaderCircle size={28} className="girando" aria-hidden="true" />
      <p>{texto}…</p>
    </div>
  );
}

export function ErroAoCarregar({ mensagem, aoTentar }) {
  return (
    <div className="estado estado-erro" role="alert">
      <TriangleAlert size={28} aria-hidden="true" />
      <p>{mensagem}</p>
      {aoTentar && (
        <button type="button" className="btn btn-secundario" onClick={aoTentar}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Vazio({ Icone, titulo, texto, children }) {
  return (
    <div className="estado estado-vazio">
      {Icone && <Icone size={32} aria-hidden="true" />}
      <h2 className="estado-titulo">{titulo}</h2>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}
