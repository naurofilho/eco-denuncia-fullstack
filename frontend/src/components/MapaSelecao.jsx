import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { CAMADA_OSM, CENTRO_BRASIL, iconePino } from './iconesMapa';

function CapturarCliques({ aoMudar }) {
  useMapEvents({
    click(e) {
      aoMudar(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Só move o mapa quando o local vem do GPS ou de coordenadas digitadas.
function Centralizar({ foco }) {
  const mapa = useMap();
  useEffect(() => {
    if (foco) mapa.setView([foco.lat, foco.lng], Math.max(mapa.getZoom(), 16));
  }, [foco, mapa]);
  return null;
}

export default function MapaSelecao({ latitude, longitude, foco, aoMudar }) {
  const icone = useMemo(() => iconePino('#F4C430'), []);
  const temPonto = latitude != null && longitude != null;
  const inicio = temPonto ? [latitude, longitude] : CENTRO_BRASIL;

  return (
    <div className="mapa mapa-selecao">
      <MapContainer center={inicio} zoom={temPonto ? 16 : 4} scrollWheelZoom>
        <TileLayer url={CAMADA_OSM.url} attribution={CAMADA_OSM.attribution} />
        <CapturarCliques aoMudar={aoMudar} />
        <Centralizar foco={foco} />
        {temPonto && (
          <Marker
            position={[latitude, longitude]}
            icon={icone}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                aoMudar(lat, lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
