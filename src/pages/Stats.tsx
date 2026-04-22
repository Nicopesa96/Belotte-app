import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Stats() {
  const navigate = useNavigate()

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold">Statistiques</h2>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/historique')}
          className="bg-green-table/40 border border-green-card/30 rounded-2xl p-5 flex items-center gap-4 hover:bg-green-table/60 transition-all"
        >
          <span className="text-3xl">📋</span>
          <div className="text-left">
            <p className="font-belote text-lg text-mint font-bold">Historique</p>
            <p className="text-cream/50 text-sm">Toutes les parties jouées</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/joueurs')}
          className="bg-green-table/40 border border-green-card/30 rounded-2xl p-5 flex items-center gap-4 hover:bg-green-table/60 transition-all"
        >
          <span className="text-3xl">👥</span>
          <div className="text-left">
            <p className="font-belote text-lg text-mint font-bold">Infos joueurs</p>
            <p className="text-cream/50 text-sm">Profils et statistiques détaillées</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/graphes')}
          className="bg-green-table/40 border border-green-card/30 rounded-2xl p-5 flex items-center gap-4 hover:bg-green-table/60 transition-all"
        >
          <span className="text-3xl">📈</span>
          <div className="text-left">
            <p className="font-belote text-lg text-mint font-bold">Graphes</p>
            <p className="text-cream/50 text-sm">Évolution et tendances</p>
          </div>
        </button>
      </div>
    </Layout>
  )
}
