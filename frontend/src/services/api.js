import * as demo from './mockApi';
import * as django from './httpApi';

// Sem VITE_API_URL o site usa dados de demonstração salvos no navegador.
export const MODO_DEMO = !import.meta.env.VITE_API_URL;

// Site publicado para demonstração, ligado ao Django: mostra as contas de teste e um aviso
// para ninguém enviar dados reais. Liga com VITE_SITE_DEMO=1.
export const SITE_DEMO = !MODO_DEMO && import.meta.env.VITE_SITE_DEMO === '1';

export const api = MODO_DEMO ? demo : django;
