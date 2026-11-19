import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function Galeria({ fotos }) {
  const [aberta, setAberta] = useState(null);
  const dialogo = useRef(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (aberta !== null && !el.open) el.showModal();
    if (aberta === null && el.open) el.close();
  }, [aberta]);

  if (!fotos?.length) return <p className="ajuda">Nenhuma foto enviada.</p>;

  return (
    <>
      <ul className="galeria">
        {fotos.map((src, i) => (
          <li key={i}>
            <button type="button" onClick={() => setAberta(i)} aria-label={`Ampliar foto ${i + 1}`}>
              <img src={src} alt="" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogo}
        className="galeria-dialogo"
        onClose={() => setAberta(null)}
        onClick={(e) => e.target === dialogo.current && setAberta(null)}
        aria-label="Foto ampliada"
      >
        {aberta !== null && (
          <>
            <img src={fotos[aberta]} alt={`Foto ${aberta + 1} da ocorrência`} />
            <button type="button" className="galeria-fechar" onClick={() => setAberta(null)}>
              <X size={20} aria-hidden="true" />
              Fechar
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
