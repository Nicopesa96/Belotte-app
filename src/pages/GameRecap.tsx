import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { useGame, usePlayers } from '../hooks/useSupabase'
import { computeRoundScores } from '../utils/scoring'

export default function GameRecap() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { game } = useGame(id!)
  const players = usePlayers()

  useEffect(() => {
    if (!game?.winner) return
    const end = Date.now() + 3000
    const fire = () => {
      confetti({ particleCount: 60, spread: 80, origin: { x: 0.2, y: 0.6 }, colors: ['#b2f0c8', '#c0392b', '#f5f0e0'] })
      confetti({ particleCount: 60, spread: 80, origin: { x: 0.8, y: 0.6 }, colors: ['#b2f0c8', '#c0392b', '#f5f0e0'] })
      if (Date.now() < end) requestAnimationFrame(fire)
    }
    fire()
  }, [game?.winner])

  if (!game) return <Layout className="items-center justify-center"><p className="text-mint">Chargement...</p></Layout>

  const getName = (pid: string) => players.find((p) => p.id === pid)?.name ?? '?'
  const team1Names = `${getName(game.team1[0])} & ${getName(game.team1[1])}`
  const team2Names = `${getName(game.team2[0])} & ${getName(game.team2[1])}`
  const winnerTeam = game.winner === 1 ? team1Names : team2Names

  return (
    <Layout className="p-4">
      <div className="flex flex-col items-center gap-2 mb-6 pt-4">
        <div className="flex gap-1 text-3xl mb-2">♠ ♥ ♦ ♣</div>
        {game.winner && (
          <p className="font-belote text-2xl text-yellow-300 font-black animate-bounce">🎉 Félicitations !</p>
        )}
        <h2 className="font-belote text-3xl text-red-belote font-black">Fin de partie !</h2>
        <p className="text-mint text-lg font-semibold">{winnerTeam}</p>
        <p className="text-cream/50 text-sm">a remporté la partie</p>
      </div>

      <div className="bg-green-table/40 rounded-2xl p-4 mb-4 border border-green-card/30">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-cream/60 text-xs mb-1">{team1Names}</p>
            <p className={`font-belote text-4xl font-black ${game.winner === 1 ? 'text-mint' : 'text-cream/60'}`}>{game.team1_total}</p>
          </div>
          <div>
            <p className="text-cream/60 text-xs mb-1">{team2Names}</p>
            <p className={`font-belote text-4xl font-black ${game.winner === 2 ? 'text-mint' : 'text-cream/60'}`}>{game.team2_total}</p>
          </div>
        </div>
      </div>

      <div className="bg-green-table/20 rounded-2xl border border-green-card/20 mb-6 overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-2 bg-green-card/20">
          <span className="text-mint/60 text-xs">{getName(game.team1[0])}</span>
          <span className="text-cream/40 text-xs text-center">Manche</span>
          <span className="text-mint/60 text-xs text-right">{getName(game.team2[0])}</span>
        </div>
        {game.rounds.map((round, i) => {
          const s = computeRoundScores(round)
          const contractLabel = round.contractTeam
            ? `Éq${round.contractTeam} ${round.contractFailed ? '✗' : '✓'}`
            : null
          return (
            <div key={i} className="grid grid-cols-3 px-4 py-2 border-t border-green-card/10">
              <span className={`font-belote text-lg font-bold ${s.team1 > s.team2 ? 'text-mint' : 'text-cream/50'}`}>{s.team1}</span>
              <div className="flex flex-col items-center justify-center">
                <span className="text-cream/30 text-xs">{i + 1}</span>
                {contractLabel && (
                  <span className={`text-xs font-bold ${round.contractFailed ? 'text-red-belote' : 'text-mint/60'}`}>{contractLabel}</span>
                )}
              </div>
              <span className={`font-belote text-lg font-bold text-right ${s.team2 > s.team1 ? 'text-mint' : 'text-cream/50'}`}>{s.team2}</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => navigate('/nouvelle-partie')}>Nouvelle partie</Button>
        <Button size="lg" variant="secondary" onClick={() => navigate('/')}>Accueil</Button>
      </div>
    </Layout>
  )
}
