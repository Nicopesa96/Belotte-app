import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { db } from '../db'

export default function Home() {
  const navigate = useNavigate()
  const ongoingGame = useLiveQuery(() => db.games.filter((g) => !g.finished).first())

  return (
    <Layout className="items-center justify-between p-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-belote text-6xl font-black text-mint tracking-wide drop-shadow-lg">
            BELOTE
          </h1>
          <div className="flex gap-1">
            {['♠', '♥', '♦', '♣'].map((s, i) => (
              <span key={i} className={`text-2xl ${i % 2 !== 0 ? 'text-red-belote' : 'text-cream'}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button size="lg" onClick={() => navigate('/nouvelle-partie')}>
            Nouvelle partie
          </Button>

          {ongoingGame && (
            <Button size="lg" variant="secondary" onClick={() => navigate(`/partie/${ongoingGame.id}`)}>
              Partie en cours
            </Button>
          )}

          <Button size="lg" variant="secondary" onClick={() => navigate('/statistiques')}>
            Statistiques
          </Button>
        </div>
      </div>

      <div className="flex justify-center opacity-30">
        <div className="flex gap-2 text-4xl rotate-12">
          <span className="text-cream">🂡</span>
          <span className="text-red-400">🂱</span>
          <span className="text-cream">🃁</span>
        </div>
      </div>
    </Layout>
  )
}
