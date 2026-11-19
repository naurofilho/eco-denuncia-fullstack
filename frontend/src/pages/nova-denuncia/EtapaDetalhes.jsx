import Campo from '../../components/Campo';
import SeletorFotos from '../../components/SeletorFotos';
import { hojeISO } from '../../utils/formato';

const MAX_DESCRICAO = 2000;

export default function EtapaDetalhes({ dados, erros, atualizar, titulo, minimo }) {
  const tamanho = dados.descricao.trim().length;

  return (
    <div className="etapa">
      <h1 ref={titulo} tabIndex={-1} className="etapa-titulo">
        Conte o que você viu
      </h1>

      <Campo
        id="descricao"
        rotulo="Descrição"
        ajuda="O que está acontecendo, desde quando e se há pessoas ou animais em risco."
        erro={erros.descricao}
      >
        <textarea
          className="input"
          rows={6}
          maxLength={MAX_DESCRICAO}
          value={dados.descricao}
          onChange={(e) => atualizar('descricao', e.target.value)}
        />
      </Campo>
      <p className={`contador ${tamanho < minimo ? 'contador-curto' : ''}`}>
        {tamanho < minimo ? `Faltam ${minimo - tamanho} caracteres` : `${tamanho} de ${MAX_DESCRICAO} caracteres`}
      </p>

      <Campo id="data_ocorrencia" rotulo="Quando aconteceu?" erro={erros.data_ocorrencia}>
        <input
          type="date"
          className="input input-data"
          max={hojeISO()}
          value={dados.data_ocorrencia}
          onChange={(e) => atualizar('data_ocorrencia', e.target.value)}
        />
      </Campo>

      <SeletorFotos fotos={dados.fotos} aoMudar={(fotos) => atualizar('fotos', fotos)} />
    </div>
  );
}
