import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { CAMADA_OSM, CENTRO_BRASIL, iconePino } from './iconesMapa';
import { COR_STATUS, statusPorId } from '../data/status';
import { tipoPorId } from '../data/tipos';

function AjustarLimites({ pontos }) {
  const mapa = useMap();
  const chave = pontos.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (!pontos.length) return;
    mapa.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, mapa]);
  return null;
}

export default function MapaDenuncias({ denuncias, comLinks = true, className = '' }) {
  const comLocal = denuncias.filter((d) => d.latitude != null && d.longitude != null);
  const pontos = comLocal.map((d) => [Number(d.latitude), Number(d.longitude)]);
  const icones = useMemo(
    () => Object.fromEntries(Object.entries(COR_STATUS).map(([status, cor]) => [status, iconePino(cor)])),
    [],
  );

  return (
    <div className={`mapa ${className}`}>
      <MapContainer center={pontos[0] ?? CENTRO_BRASIL} zoom={pontos.length ? 13 : 4} scrollWheelZoom={false}>
        <TileLayer url={CAMADA_OSM.url} attribution={CAMADA_OSM.attribution} />
        <AjustarLimites pontos={pontos} />
        {comLocal.map((d) => (
          <Marker
            key={d.id}
            position={[Number(d.latitude), Number(d.longitude)]}
            icon={icones[d.status] ?? icones.recebida}
          >
            {comLinks && (
              <Popup>
                <strong className="popup-titulo">{tipoPorId(d.tipo).nome}</strong>
                <span className="popup-linha">{statusPorId(d.status).nome}</span>
                <span className="popup-linha">{d.protocolo}</span>
                <Link to={`/denuncias/${d.id}`}>Ver denúncia</Link>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
