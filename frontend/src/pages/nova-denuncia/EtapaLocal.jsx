import { useState } from 'react';
import { LoaderCircle, LocateFixed, MapPin } from 'lucide-react';
import Campo, { MensagemErro } from '../../components/Campo';
import MapaSelecao from '../../components/MapaSelecao';
import { formatarCoordenadas } from '../../utils/formato';

export default function EtapaLocal({ dados, erros, atualizar, definirLocal, titulo }) {
  const [localizando, setLocalizando] = useState(false);
  const [erroGps, setErroGps] = useState('');
  const [foco, setFoco] = useState(null);
  const [manual, setManual] = useState({ lat: '', lng: '' });
  const [erroManual, setErroManual] = useState('');

  function usarLocalizacao() {
    setErroGps('');
    if (!('geolocation' in navigator)) {
      setErroGps('Este navegador não informa a localização. Toque no mapa para marcar o local.');
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        definirLocal(latitude, longitude);
        setFoco({ lat: latitude, lng: longitude });
        setLocalizando(false);
      },
      (falha) => {
        setLocalizando(false);
        setErroGps(
          falha.code === falha.PERMISSION_DENIED
            ? 'O acesso à localização está bloqueado. Libere nas configurações do navegador ou toque no mapa.'
            : 'Não foi possível obter sua localização agora. Toque no mapa para marcar o local.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  function aplicarCoordenadas() {
    const lat = Number(manual.lat.replace(',', '.'));
    const lng = Number(manual.lng.replace(',', '.'));
    if (!manual.lat || !manual.lng || Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setErroManual('Digite latitude entre -90 e 90 e longitude entre -180 e 180. Ex.: -15.79342 e -47.88271.');
      return;
    }
    setErroManual('');
    definirLocal(lat, lng);
    setFoco({ lat, lng });
  }

  const marcado = dados.latitude != null;

  return (
    <div className="etapa">
      <h1 ref={titulo} tabIndex={-1} className="etapa-titulo">
        Onde aconteceu?
      </h1>
      <p className="ajuda">Toque no mapa para marcar o local. Depois, arraste o marcador para ajustar.</p>

      <div className="local-acoes">
        <button type="button" className="btn btn-secundario" onClick={usarLocalizacao} disabled={localizando}>
          {localizando ? (
            <LoaderCircle size={20} className="girando" aria-hidden="true" />
          ) : (
            <LocateFixed size={20} aria-hidden="true" />
          )}
          {localizando ? 'Buscando sua localização…' : 'Usar minha localização'}
        </button>
      </div>
      {erroGps && <MensagemErro>{erroGps}</MensagemErro>}

      <MapaSelecao latitude={dados.latitude} longitude={dados.longitude} foco={foco} aoMudar={definirLocal} />

      <p className={`local-situacao ${marcado ? 'local-marcado' : ''}`} aria-live="polite">
        <MapPin size={18} aria-hidden="true" />
        {marcado ? `Local marcado: ${formatarCoordenadas(dados.latitude, dados.longitude)}` : 'Nenhum local marcado ainda.'}
      </p>
      {erros.local && <MensagemErro>{erros.local}</MensagemErro>}

      <details className="coordenadas-manuais">
        <summary>Prefiro digitar as coordenadas</summary>
        <div className="coordenadas-campos">
          <div className="campo">
            <label htmlFor="lat-manual">Latitude</label>
            <input
              id="lat-manual"
              className="input"
              inputMode="decimal"
              value={manual.lat}
              onChange={(e) => setManual((m) => ({ ...m, lat: e.target.value }))}
            />
          </div>
          <div className="campo">
            <label htmlFor="lng-manual">Longitude</label>
            <input
              id="lng-manual"
              className="input"
              inputMode="decimal"
              value={manual.lng}
              onChange={(e) => setManual((m) => ({ ...m, lng: e.target.value }))}
            />
          </div>
          <button type="button" className="btn btn-secundario" onClick={aplicarCoordenadas}>
            Marcar no mapa
          </button>
        </div>
        {erroManual && <MensagemErro>{erroManual}</MensagemErro>}
      </details>

      <Campo
        id="endereco"
        rotulo="Endereço ou ponto de referência"
        opcional
        ajuda="Ex.: Rua das Palmeiras, em frente à escola municipal."
      >
        <input
          className="input"
          autoComplete="street-address"
          maxLength={200}
          value={dados.endereco}
          onChange={(e) => atualizar('endereco', e.target.value)}
        />
      </Campo>
    </div>
  );
}
