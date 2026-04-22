import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewGame from './pages/NewGame'
import GameScreen from './pages/GameScreen'
import GameRecap from './pages/GameRecap'
import Stats from './pages/Stats'
import History from './pages/History'
import Players from './pages/Players'
import PlayerProfile from './pages/PlayerProfile'
import Charts from './pages/Charts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nouvelle-partie" element={<NewGame />} />
        <Route path="/partie/:id" element={<GameScreen />} />
        <Route path="/recap/:id" element={<GameRecap />} />
        <Route path="/statistiques" element={<Stats />} />
        <Route path="/historique" element={<History />} />
        <Route path="/joueurs" element={<Players />} />
        <Route path="/joueur/:id" element={<PlayerProfile />} />
        <Route path="/graphes" element={<Charts />} />
      </Routes>
    </BrowserRouter>
  )
}
