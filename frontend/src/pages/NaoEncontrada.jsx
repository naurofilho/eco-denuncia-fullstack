import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { Vazio } from '../components/Estados';
import { useTitulo } from '../hooks/useTitulo';

export default function NaoEncontrada() {
  useTitulo('Página não encontrada');
  return (
    <div className="container pagina">
      <Vazio
        Icone={MapPinOff}
        titulo="Página não encontrada"
        texto="O endereço pode estar errado ou a página foi removida."
      >
        <Link to="/" className="btn btn-primario">
          Ir para o início
        </Link>
      </Vazio>
    </div>
  );
}
