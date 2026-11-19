import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Campo, { MensagemErro } from './Campo';
import { STATUS, statusPorId } from '../data/status';
import { api } from '../services/api';

// Formulário da equipe de fiscalização para mudar o status e avisar o cidadão.
export default function AtualizarStatus({ denuncia, aoAtualizar }) {
  const [status, setStatus] = useState(denuncia.status);
  const [nota, setNota] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');

  async function aoEnviar(e) {
    e.preventDefault();
    setAviso('');
    if (status === denuncia.status && !nota.trim()) {
      setErro('Escolha um status diferente ou escreva uma mensagem para o cidadão.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const atualizada = await api.atualizarStatus(denuncia.id, status, nota);
      aoAtualizar(atualizada);
      setNota('');
      setAviso(`Status salvo como ${statusPorId(status).nome}.`);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="bloco atualizar-status" onSubmit={aoEnviar} noValidate>
      <h2 className="bloco-titulo">Atualizar status</h2>
      <fieldset className="opcoes-status">
        <legend className="rotulo">Novo status</legend>
        {STATUS.map((s) => (
          <label key={s.id} className={`opcao-status opcao-${s.id}`}>
            <input type="radio" name="status" value={s.id} checked={status === s.id} onChange={() => setStatus(s.id)} />
            <span>{s.nome}</span>
          </label>
        ))}
      </fieldset>
      <Campo id="nota" rotulo="Mensagem para o cidadão" ajuda="Aparece no andamento da denúncia. Ex.: Equipe enviada ao local.">
        <textarea className="input" rows={3} maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} />
      </Campo>
      {erro && <MensagemErro>{erro}</MensagemErro>}
      <button type="submit" className="btn btn-primario btn-bloco" disabled={salvando}>
        {salvando ? <LoaderCircle size={18} className="girando" aria-hidden="true" /> : null}
        {salvando ? 'Salvando…' : 'Salvar status'}
      </button>
      <p className="aviso-sucesso" role="status">
        {aviso}
      </p>
    </form>
  );
}
