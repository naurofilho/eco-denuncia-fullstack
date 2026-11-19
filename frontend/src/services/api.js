import * as demo from './mockApi';
import * as django from './httpApi';

// Sem VITE_API_URL o site usa dados de demonstração salvos no navegador.
export const MODO_DEMO = !import.meta.env.VITE_API_URL;

export const api = MODO_DEMO ? demo : django;
