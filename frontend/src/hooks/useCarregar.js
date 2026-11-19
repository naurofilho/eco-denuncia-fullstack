import { useCallback, useEffect, useState } from 'react';

// Executa uma busca assíncrona e expõe carregando / erro / dados.
export function useCarregar(buscar, dependencias) {
  const [estado, setEstado] = useState({ carregando: true, erro: '', dados: null });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado((e) => ({ ...e, carregando: true, erro: '' }));
    buscar()
      .then((dados) => ativo && setEstado({ carregando: false, erro: '', dados }))
      .catch((erro) => ativo && setEstado({ carregando: false, erro: erro.message, dados: null }));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  const definirDados = useCallback((dados) => setEstado((e) => ({ ...e, dados })), []);

  return { ...estado, recarregar, definirDados };
}
