import { useEffect } from 'react';

export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} | EcoDenúncia` : 'EcoDenúncia: denúncias ambientais';
  }, [titulo]);
}
