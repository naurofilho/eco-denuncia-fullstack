import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle, Send } from 'lucide-react';
import Etapas from '../../components/Etapas';
import EtapaTipo from './EtapaTipo';
import EtapaLocal from './EtapaLocal';
import EtapaDetalhes from './EtapaDetalhes';
import EtapaRevisao from './EtapaRevisao';
import { TIPOS } from '../../data/tipos';
import { api } from '../../services/api';
import { hojeISO } from '../../utils/formato';
import { useTitulo } from '../../hooks/useTitulo';

const ETAPAS = ['Tipo', 'Local', 'Detalhes', 'Revisão'];
const MIN_DESCRICAO = 20;

export default function NovaDenuncia() {
  useTitulo('Nova denúncia');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tipoInicial = TIPOS.some((t) => t.id === params.get('tipo')) ? params.get('tipo') : '';

  const [etapa, setEtapa] = useState(tipoInicial ? 1 : 0);
  const [dados, setDados] = useState({
    tipo: tipoInicial,
    latitude: null,
    longitude: null,
    endereco: '',
    descricao: '',
    data_ocorrencia: hojeISO(),
    fotos: [],
    anonima: false,
  });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

  const titulo = useRef(null);
  const primeiraVez = useRef(true);
  const fotosAtuais = useRef(dados.fotos);
  fotosAtuais.current = dados.fotos;

  // Ao trocar de etapa, leva o foco ao título (leitores de tela anunciam a nova etapa).
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    window.scrollTo(0, 0);
    titulo.current?.focus();
  }, [etapa]);

  // Libera as prévias das fotos ao sair da página.
  useEffect(() => () => fotosAtuais.current.forEach((f) => URL.revokeObjectURL(f.previa)), []);

  function atualizar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function definirLocal(latitude, longitude) {
    setDados((d) => ({ ...d, latitude, longitude }));
    setErros((e) => ({ ...e, local: undefined }));
  }

  function validar(n) {
    const novos = {};
    if (n === 0 && !dados.tipo) novos.tipo = 'Escolha o tipo de ocorrência para continuar.';
    if (n === 1 && dados.latitude == null) novos.local = 'Marque o local no mapa ou use sua localização.';
    if (n === 2) {
      if (dados.descricao.trim().length < MIN_DESCRICAO) {
        novos.descricao = `Descreva o que aconteceu com pelo menos ${MIN_DESCRICAO} caracteres.`;
      }
      if (dados.data_ocorrencia && dados.data_ocorrencia > hojeISO()) {
        novos.data_ocorrencia = 'A data não pode ser no futuro.';
      }
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar() {
    setEnviando(true);
    setErroEnvio('');
    try {
      const nova = await api.criarDenuncia(dados);
      navigate(`/denuncias/${nova.id}/enviada`, { replace: true });
    } catch (falha) {
      setErroEnvio(falha.message);
      setEnviando(false);
    }
  }

  function aoEnviar(e) {
    e.preventDefault();
    if (etapa < ETAPAS.length - 1) {
      if (validar(etapa)) setEtapa(etapa + 1);
    } else {
      enviar();
    }
  }

  function irPara(n) {
    setErros({});
    setEtapa(n);
  }

  const props = { dados, erros, atualizar, titulo };

  return (
    <div className="container pagina pagina-formulario">
      <Etapas etapas={ETAPAS} atual={etapa} />

      <form onSubmit={aoEnviar} noValidate className="formulario-denuncia">
        {etapa === 0 && <EtapaTipo {...props} />}
        {etapa === 1 && <EtapaLocal {...props} definirLocal={definirLocal} />}
        {etapa === 2 && <EtapaDetalhes {...props} minimo={MIN_DESCRICAO} />}
        {etapa === 3 && <EtapaRevisao {...props} irPara={irPara} erroEnvio={erroEnvio} />}

        <div className="formulario-acoes">
          {etapa > 0 && (
            <button type="button" className="btn btn-secundario" onClick={() => irPara(etapa - 1)} disabled={enviando}>
              Voltar
            </button>
          )}
          {etapa < ETAPAS.length - 1 ? (
            <button type="submit" className="btn btn-primario">
              Continuar
            </button>
          ) : (
            <button type="submit" className="btn btn-denunciar" disabled={enviando}>
              {enviando ? (
                <LoaderCircle size={20} className="girando" aria-hidden="true" />
              ) : (
                <Send size={20} aria-hidden="true" />
              )}
              {enviando ? 'Enviando…' : 'Enviar denúncia'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
