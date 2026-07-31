import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { usePlayers, useGames } from '../hooks/useSupabase'

export default function Players() {
  const navigate = useNavigate()
  const players = usePlayers()
  const games = useGames(true)

  const getGameCount = (id: string) => games.filter((g) => g.team1.includes(id) || g.team2.includes(id)).length
  const getWinCount = (id: string) => games.filter((g) => {
    const isT1 = g.team1.includes(id)
    return isT1 ? g.winner === 1 : g.winner === 2
  }).length

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/statistiques')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold">Joueurs</h2>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <span className="text-6xl opacity-30">👤</span>
          <p className="text-cream/40 text-center">Aucun joueur créé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {players.map((player) => {
            const total = getGameCount(player.id)
            const wins = getWinCount(player.id)
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
            return (
              <button key={player.id} onClick={() => navigate(`/joueur/${player.id}`)}
                className="bg-green-table/40 border border-green-card/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-green-table/60 transition-all">
                <div className="w-14 h-14 rounded-full bg-mint/20 border-2 border-mint/40 flex items-center justify-center">
                  {player.avatar
                    ? <span className="text-3xl">{player.avatar}</span>
                    : <span className="text-mint font-belote text-2xl font-black">{player.name[0].toUpperCase()}</span>
                  }
                </div>
                <p className="text-cream font-semibold text-sm">{player.name}</p>
                <p className="text-cream/50 text-xs">{total} partie{total > 1 ? 's' : ''}</p>
                {total > 0 && (
                  <>
                    <div className="w-full bg-green-dark/50 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-mint rounded-full transition-all" style={{ width: `${winRate}%` }} />
                    </div>
                    <p className="text-mint text-xs font-bold">{winRate}% victoires</p>
                  </>
                )}
              </button>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
