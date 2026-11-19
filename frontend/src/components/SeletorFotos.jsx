import { useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { MensagemErro } from './Campo';

export const MAX_FOTOS = 5;
const MAX_MB = 15;

function novoId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function SeletorFotos({ fotos, aoMudar }) {
  const [erro, setErro] = useState('');
  const camera = useRef(null);
  const galeria = useRef(null);
  const cheio = fotos.length >= MAX_FOTOS;

  function adicionar(lista) {
    setErro('');
    const novas = [];
    for (const arquivo of Array.from(lista ?? [])) {
      if (!arquivo.type.startsWith('image/')) {
        setErro(`"${arquivo.name}" não é uma imagem. Envie fotos em JPG ou PNG.`);
        continue;
      }
      if (arquivo.size > MAX_MB * 1024 * 1024) {
        setErro(`"${arquivo.name}" tem mais de ${MAX_MB} MB. Escolha uma foto menor.`);
        continue;
      }
      novas.push({ id: novoId(), arquivo, previa: URL.createObjectURL(arquivo) });
    }
    const espaco = MAX_FOTOS - fotos.length;
    if (novas.length > espaco) {
      novas.slice(espaco).forEach((f) => URL.revokeObjectURL(f.previa));
      setErro(`Você pode enviar até ${MAX_FOTOS} fotos. As primeiras foram mantidas.`);
    }
    if (novas.length) aoMudar([...fotos, ...novas.slice(0, espaco)]);
  }

  function remover(id) {
    const foto = fotos.find((f) => f.id === id);
    if (foto) URL.revokeObjectURL(foto.previa);
    setErro('');
    aoMudar(fotos.filter((f) => f.id !== id));
  }

  function aoEscolher(e) {
    adicionar(e.target.files);
    e.target.value = '';
  }

  return (
    <fieldset className="fotos">
      <legend className="rotulo">
        Fotos <span className="opcional">(opcional, até {MAX_FOTOS})</span>
      </legend>
      <p className="ajuda">Fotos ajudam a equipe a confirmar a ocorrência. Não se coloque em risco para tirá-las.</p>

      <div className="fotos-botoes">
        <button type="button" className="btn btn-secundario so-toque" onClick={() => camera.current.click()} disabled={cheio}>
          <Camera size={20} aria-hidden="true" />
          Tirar foto
        </button>
        <button type="button" className="btn btn-secundario" onClick={() => galeria.current.click()} disabled={cheio}>
          <ImagePlus size={20} aria-hidden="true" />
          Escolher fotos
        </button>
      </div>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={aoEscolher} />
      <input ref={galeria} type="file" accept="image/*" multiple hidden onChange={aoEscolher} />

      {erro && <MensagemErro>{erro}</MensagemErro>}

      {fotos.length > 0 && (
        <ul className="fotos-grade">
          {fotos.map((f, i) => (
            <li key={f.id}>
              <img src={f.previa} alt={`Foto ${i + 1} anexada`} />
              <button type="button" className="fotos-remover" onClick={() => remover(f.id)} aria-label={`Remover foto ${i + 1}`}>
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
