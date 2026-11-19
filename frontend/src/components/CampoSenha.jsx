import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function CampoSenha(props) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="senha">
      <input {...props} type={visivel ? 'text' : 'password'} className="input" />
      <button
        type="button"
        className="senha-alternar"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
      >
        {visivel ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
