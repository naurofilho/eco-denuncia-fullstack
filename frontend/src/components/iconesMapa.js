import L from 'leaflet';

// Pino desenhado em CSS (evita o problema das imagens padrão do Leaflet com o Vite).
export function iconePino(cor = '#F4C430') {
  return L.divIcon({
    className: 'pino-mapa',
    html: `<span class="pino-mapa-forma" style="--cor:${cor}"></span>`,
    iconSize: [30, 36],
    iconAnchor: [15, 33],
    popupAnchor: [0, -30],
  });
}

export const CENTRO_BRASIL = [-14.235, -51.925];

export const CAMADA_OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};
