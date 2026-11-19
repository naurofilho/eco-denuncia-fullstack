// Mapa topográfico desenhado por código: curvas de nível geradas a partir de
// "morros" (gaussianas) com marching squares. Uma a cada quatro curvas é a
// curva mestra, mais grossa, como nas cartas topográficas.
export const LARGURA = 1200;
export const ALTURA = 600;
const CELULA = 12;

const MORROS = [
  [900, 240, 210, 1],
  [690, 470, 150, 0.75],
  [1120, 520, 120, 0.55],
  [230, 110, 250, 0.5],
  [420, 560, 140, 0.35],
];

function altura(x, y) {
  let h = 0;
  for (const [mx, my, s, a] of MORROS) {
    const dx = x - mx;
    const dy = y - my;
    h += a * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
  }
  return h + 0.03 * Math.sin(x / 70) * Math.cos(y / 55);
}

// Para cada combinação de cantos acima do nível, quais arestas a curva liga.
const ARESTAS = {
  1: [['E', 'B']], 2: [['B', 'D']], 3: [['E', 'D']], 4: [['T', 'D']],
  5: [['E', 'T'], ['B', 'D']], 6: [['T', 'B']], 7: [['E', 'T']], 8: [['E', 'T']],
  9: [['T', 'B']], 10: [['T', 'D'], ['E', 'B']], 11: [['T', 'D']], 12: [['E', 'D']],
  13: [['B', 'D']], 14: [['E', 'B']],
};

let cache = null;

function gerarCurvas() {
  if (cache) return cache;
  const colunas = LARGURA / CELULA;
  const linhas = ALTURA / CELULA;
  const campo = [];
  for (let j = 0; j <= linhas; j++) {
    const linha = [];
    for (let i = 0; i <= colunas; i++) linha.push(altura(i * CELULA, j * CELULA));
    campo.push(linha);
  }

  const curvas = [];
  for (let k = 0, nivel = 0.06; nivel < 1.1; k++, nivel += 0.065) {
    let d = '';
    for (let j = 0; j < linhas; j++) {
      for (let i = 0; i < colunas; i++) {
        const v0 = campo[j][i];
        const v1 = campo[j][i + 1];
        const v2 = campo[j + 1][i + 1];
        const v3 = campo[j + 1][i];
        const caso = (v0 > nivel ? 8 : 0) | (v1 > nivel ? 4 : 0) | (v2 > nivel ? 2 : 0) | (v3 > nivel ? 1 : 0);
        const pares = ARESTAS[caso];
        if (!pares) continue;
        const x = i * CELULA;
        const y = j * CELULA;
        const t = (a, b) => (nivel - a) / (b - a);
        const ponto = {
          T: () => [x + t(v0, v1) * CELULA, y],
          D: () => [x + CELULA, y + t(v1, v2) * CELULA],
          B: () => [x + t(v3, v2) * CELULA, y + CELULA],
          E: () => [x, y + t(v0, v3) * CELULA],
        };
        for (const [a, b] of pares) {
          const [x1, y1] = ponto[a]();
          const [x2, y2] = ponto[b]();
          d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
        }
      }
    }
    curvas.push({ d, mestra: k % 4 === 0 });
  }
  cache = curvas;
  return curvas;
}

export default function Topografia({ className = '', alinhamento = 'xMidYMid', children }) {
  const curvas = gerarCurvas();
  return (
    <svg
      className={`topografia ${className}`}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      preserveAspectRatio={`${alinhamento} slice`}
      aria-hidden="true"
      focusable="false"
    >
      {curvas.map((c, i) => (
        <path key={i} d={c.d} className={c.mestra ? 'topo-curva topo-mestra' : 'topo-curva'} />
      ))}
      <path className="topo-rio" d="M500 640 C 620 610 720 560 800 520 S 930 430 1010 450 S 1150 480 1220 420" />
      {children}
    </svg>
  );
}
