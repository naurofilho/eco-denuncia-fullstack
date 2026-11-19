import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => api.sessaoAtual()?.usuario ?? null);
  // true quando a pessoa clicou em "Sair": as rotas protegidas mandam para o início,
  // e não para o login (que guardaria a página anterior para a próxima pessoa).
  const [saiu, setSaiu] = useState(false);

  useEffect(() => {
    const aoExpirar = () => {
      setSaiu(false);
      setUsuario(null);
    };
    window.addEventListener('eco:sessao-expirada', aoExpirar);
    return () => window.removeEventListener('eco:sessao-expirada', aoExpirar);
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const sessao = await api.entrar(email, senha);
    setSaiu(false);
    setUsuario(sessao.usuario);
    return sessao.usuario;
  }, []);

  const cadastrar = useCallback(async (dados) => {
    const sessao = await api.cadastrar(dados);
    setSaiu(false);
    setUsuario(sessao.usuario);
    return sessao.usuario;
  }, []);

  const sair = useCallback(() => {
    api.sair();
    setSaiu(true);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, saiu, entrar, cadastrar, sair }), [usuario, saiu, entrar, cadastrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return contexto;
}
