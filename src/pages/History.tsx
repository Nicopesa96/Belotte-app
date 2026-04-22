import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import Layout from '../components/Layout'
import { db } from '../db'

export default function History() {
  const navigate = useNavigate()
  const games = useLiveQuery(() => db.games.orderBy('date').reverse().toArray()) ?? []
  const players = useLiveQuery(() => db.players.toArray()) ?? []

  const getName = (id: string) => players.find((p) => p.id === id)?.name ?? '?'

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/statistiques')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold">Historique</h2>
      </div>

      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <span className="text-6xl opacity-30">🃏</span>
          <p className="text-cream/40 text-center">Aucune partie jouée pour l'instant</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((game) => {
            const team1 = `${getName(game.team1[0])} – ${getName(game.team1[1])}`
            const team2 = `${getName(game.team2[0])} – ${getName(game.team2[1])}`
            return (
              <button
                key={game.id}
                onClick={() => navigate(`/recap/${game.id}`)}
                className="bg-green-light/10 border border-green-card/20 rounded-2xl p-4 text-left hover:bg-green-light/20 transition-all"
              >
                <p className="text-cream/50 text-xs mb-2">{formatDate(game.date)}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium text-sm ${game.winner === 1 ? 'text-mint font-bold' : 'text-cream/70'}`}>
                      {team1}
                    </p>
                    <p className={`font-medium text-sm ${game.winner === 2 ? 'text-mint font-bold' : 'text-cream/70'}`}>
                      {team2}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-belote text-xl font-bold ${game.winner === 1 ? 'text-mint' : 'text-cream/60'}`}>
                      {game.team1Total}
                    </p>
                    <p className={`font-belote text-xl font-bold ${game.winner === 2 ? 'text-mint' : 'text-cream/60'}`}>
                      {game.team2Total}
                    </p>
                  </div>
                </div>
                {!game.finished && (
                  <span className="mt-2 inline-block bg-red-belote/20 text-red-belote text-xs px-2 py-0.5 rounded-full">
                    En cours
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
