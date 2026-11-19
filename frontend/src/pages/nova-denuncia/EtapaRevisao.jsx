import { tipoPorId } from '../../data/tipos';
import { formatarCoordenadas, formatarDia } from '../../utils/formato';

function Linha({ termo, children, aoAlterar, rotuloAlterar }) {
  return (
    <div className="revisao-linha">
      <dt>{termo}</dt>
      <dd>{children}</dd>
      <button type="button" className="btn-link" onClick={aoAlterar} aria-label={rotuloAlterar}>
        Alterar
      </button>
    </div>
  );
}

export default function EtapaRevisao({ dados, atualizar, titulo, irPara, erroEnvio }) {
  const tipo = tipoPorId(dados.tipo);

  return (
    <div className="etapa">
      <h1 ref={titulo} tabIndex={-1} className="etapa-titulo">
        Confira antes de enviar
      </h1>

      <dl className="revisao">
        <Linha termo="Tipo" aoAlterar={() => irPara(0)} rotuloAlterar="Alterar tipo">
          <span className="revisao-tipo">
            <tipo.Icone size={20} aria-hidden="true" />
            {tipo.nome}
          </span>
        </Linha>
        <Linha termo="Local" aoAlterar={() => irPara(1)} rotuloAlterar="Alterar local">
          {dados.endereco || 'Sem ponto de referência'}
          <span className="revisao-secundario">{formatarCoordenadas(dados.latitude, dados.longitude)}</span>
        </Linha>
        <Linha termo="Quando" aoAlterar={() => irPara(2)} rotuloAlterar="Alterar data">
          {dados.data_ocorrencia ? formatarDia(dados.data_ocorrencia) : 'Não informado'}
        </Linha>
        <Linha termo="Descrição" aoAlterar={() => irPara(2)} rotuloAlterar="Alterar descrição">
          <span className="revisao-descricao">{dados.descricao.trim()}</span>
        </Linha>
        <Linha termo="Fotos" aoAlterar={() => irPara(2)} rotuloAlterar="Alterar fotos">
          {dados.fotos.length ? (
            <span className="revisao-fotos">
              {dados.fotos.map((f, i) => (
                <img key={f.id} src={f.previa} alt={`Foto ${i + 1}`} />
              ))}
            </span>
          ) : (
            'Nenhuma foto'
          )}
        </Linha>
      </dl>

      <label className="caixa-marcar caixa-anonima">
        <input type="checkbox" checked={dados.anonima} onChange={(e) => atualizar('anonima', e.target.checked)} />
        <span>
          <strong>Não compartilhar meu nome com o órgão responsável</strong>
          <span className="ajuda">A denúncia continua ligada à sua conta só para você acompanhar o andamento.</span>
        </span>
      </label>

      {erroEnvio && (
        <div className="alerta alerta-erro" role="alert">
          {erroEnvio}
        </div>
      )}
    </div>
  );
}
