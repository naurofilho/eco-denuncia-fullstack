import { MensagemErro } from '../../components/Campo';
import { TIPOS } from '../../data/tipos';

export default function EtapaTipo({ dados, erros, atualizar, titulo }) {
  return (
    <fieldset className="etapa" aria-describedby={erros.tipo ? 'tipo-erro' : undefined}>
      <legend>
        <h1 ref={titulo} tabIndex={-1} className="etapa-titulo">
          O que aconteceu?
        </h1>
      </legend>
      <p className="ajuda">Escolha a opção mais próxima. Se não encontrar, use Outro.</p>

      <div className="tipos-grade">
        {TIPOS.map((t) => (
          <label key={t.id} className="tipo-opcao">
            <input
              type="radio"
              name="tipo"
              value={t.id}
              checked={dados.tipo === t.id}
              onChange={() => atualizar('tipo', t.id)}
            />
            <span className="tipo-opcao-icone" aria-hidden="true">
              <t.Icone size={26} />
            </span>
            <span className="tipo-opcao-nome">{t.nome}</span>
            <span className="tipo-opcao-exemplo">{t.exemplo}</span>
          </label>
        ))}
      </div>

      {erros.tipo && <MensagemErro id="tipo-erro">{erros.tipo}</MensagemErro>}
    </fieldset>
  );
}
