// Mesmos valores de STATUS_CHOICES em models.py.
export const STATUS = [
  { id: 'recebida', nome: 'Recebida', descricao: 'A denúncia chega à equipe de fiscalização.' },
  { id: 'analise', nome: 'Em análise', descricao: 'A equipe verifica as informações e pode ir até o local.' },
  { id: 'resolvida', nome: 'Resolvida', descricao: 'Você vê aqui o que foi feito.' },
];

// Cores dos pinos no mapa (precisam ser valores literais para o Leaflet).
export const COR_STATUS = {
  recebida: '#2E6A88',
  analise: '#E0A21B',
  resolvida: '#1F7A47',
};

export function statusPorId(id) {
  return STATUS.find((s) => s.id === id) ?? { id, nome: id, descricao: '' };
}
