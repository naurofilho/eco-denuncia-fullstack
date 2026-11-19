import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RotaProtegida from './components/RotaProtegida';
import Inicio from './pages/Inicio';
import Entrar from './pages/Entrar';
import Cadastro from './pages/Cadastro';
import NovaDenuncia from './pages/nova-denuncia/NovaDenuncia';
import DenunciaEnviada from './pages/DenunciaEnviada';
import MinhasDenuncias from './pages/MinhasDenuncias';
import DetalheDenuncia from './pages/DetalheDenuncia';
import Painel from './pages/Painel';
import NaoEncontrada from './pages/NaoEncontrada';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="entrar" element={<Entrar />} />
        <Route path="cadastro" element={<Cadastro />} />

        <Route element={<RotaProtegida />}>
          <Route path="denunciar" element={<NovaDenuncia />} />
          <Route path="minhas-denuncias" element={<MinhasDenuncias />} />
          <Route path="denuncias/:id" element={<DetalheDenuncia />} />
          <Route path="denuncias/:id/enviada" element={<DenunciaEnviada />} />
        </Route>

        <Route element={<RotaProtegida somenteEquipe />}>
          <Route path="painel" element={<Painel />} />
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
