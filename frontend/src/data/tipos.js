import { Axe, CircleHelp, Droplets, Factory, Flame, PawPrint, Trash2, Volume2 } from 'lucide-react';

// Tipos de ocorrência. O `id` é o valor salvo no campo `tipo` do backend.
export const TIPOS = [
  { id: 'queimada', nome: 'Queimada', exemplo: 'Fogo em mata, terreno ou lixo', Icone: Flame },
  { id: 'desmatamento', nome: 'Desmatamento', exemplo: 'Corte de árvores ou limpeza de área verde', Icone: Axe },
  { id: 'lixo', nome: 'Descarte irregular', exemplo: 'Entulho, lixo ou móveis em local proibido', Icone: Trash2 },
  { id: 'agua', nome: 'Poluição da água', exemplo: 'Esgoto ou resíduos em rio, lago ou nascente', Icone: Droplets },
  { id: 'ar', nome: 'Poluição do ar', exemplo: 'Fumaça ou cheiro forte vindo de fábrica ou obra', Icone: Factory },
  { id: 'animais', nome: 'Maus-tratos a animais', exemplo: 'Abandono, caça ou venda de animais silvestres', Icone: PawPrint },
  { id: 'ruido', nome: 'Poluição sonora', exemplo: 'Barulho excessivo e frequente', Icone: Volume2 },
  { id: 'outro', nome: 'Outro', exemplo: 'Algo que não está nesta lista', Icone: CircleHelp },
];

export function tipoPorId(id) {
  return TIPOS.find((t) => t.id === id) ?? { id, nome: id || 'Sem tipo', exemplo: '', Icone: CircleHelp };
}
