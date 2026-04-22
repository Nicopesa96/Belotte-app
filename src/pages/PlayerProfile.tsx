import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import { db } from '../db'
import { computePlayerStats } from '../utils/stats'

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-green-card/10">
      <span className="text-cream/60 text-sm">{label}</span>
      <span className="text-mint font-semibold text-sm">{value}</span>
    </div>
  )
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-red-belote text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-green-table/20 rounded-xl px-3 border border-green-card/20">
        {children}
      </div>
    </div>
  )
}

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const player = useLiveQuery(() => db.players.get(id!), [id])
  const games = useLiveQuery(() => db.games.toArray()) ?? []
  const players = useLiveQuery(() => db.players.toArray()) ?? []

  if (!player) return <Layout className="items-center justify-center"><p className="text-mint">Chargement...</p></Layout>

  const stats = computePlayerStats(id!, games)
  const getName = (pid: string) => players.find((p) => p.id === pid)?.name ?? '?'

  const scoreData = [
    { name: 'Score', value: stats.beloteScore, fill: '#b2f0c8' },
  ]

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Expert'
    if (score >= 70) return 'Solide'
    if (score >= 55) return 'Régulier'
    if (score >= 40) return 'Débutant'
    return 'Apprenti'
  }

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/joueurs')} className="text-mint text-2xl">‹</button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-red-belote/20 border-2 border-red-belote/50 flex items-center justify-center">
          <span className="text-red-belote font-belote text-3xl font-black">
            {player.name[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="font-belote text-2xl text-red-belote font-black">{player.name}</h2>
          <p className="text-cream/50 text-sm">{stats.totalGames} parties jouées</p>
        </div>
      </div>

      {stats.totalGames === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <span className="text-6xl opacity-30">🃏</span>
          <p className="text-cream/40">Aucune partie jouée</p>
        </div>
      ) : (
        <>
          {/* Belote Score */}
          <div className="bg-green-dark/80 border border-green-card/30 rounded-2xl p-4 mb-5 flex items-center gap-4">
            <div className="w-24 h-24 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="60%" outerRadius="90%"
                  startAngle={90} endAngle={-270}
                  data={scoreData}
                >
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#2d5a2d' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-belote text-xl font-black text-mint">{stats.beloteScore}</span>
              </div>
            </div>
            <div>
              <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Score Belote Global</p>
              <p className="font-belote text-2xl text-mint font-black">{getScoreLabel(stats.beloteScore)}</p>
              <div className="flex gap-3 mt-2">
                <div className="text-center">
                  <p className="text-cream/40 text-xs">Fiabilité</p>
                  <p className="text-cream text-sm font-bold">{Math.round(stats.contractSuccessRate)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-cream/40 text-xs">Audace</p>
                  <p className="text-cream text-sm font-bold">{Math.round(Math.min(100, stats.avgContractsPerGame * 10))}</p>
                </div>
                <div className="text-center">
                  <p className="text-cream/40 text-xs">Régularité</p>
                  <p className="text-cream text-sm font-bold">{Math.round(stats.winRate)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé global */}
          <StatSection title="Résumé global">
            <StatRow label="Victoires" value={`${stats.wins} (${Math.round(stats.winRate)}%)`} />
            <StatRow label="Défaites" value={stats.losses} />
            <StatRow label="Points moy. / partie" value={Math.round(stats.avgPointsPerGame)} />
          </StatSection>

          {/* Enchères */}
          <StatSection title="Enchères">
            <StatRow label="Prises tentées / partie" value={stats.avgContractsPerGame.toFixed(1)} />
            <StatRow label="% de prises réussies" value={`${Math.round(stats.contractSuccessRate)}%`} />
            <StatRow label="% de chutes" value={`${stats.contractsTaken > 0 ? Math.round((stats.contractsFailed / stats.contractsTaken) * 100) : 0}%`} />
            <StatRow label="Indice d'audace" value={`${Math.round(Math.min(100, stats.avgContractsPerGame * 10))}/100`} />
          </StatSection>

          {/* Partenariats */}
          {stats.partnerStats.length > 0 && (
            <StatSection title="Partenariats">
              {stats.partnerStats.map((ps) => (
                <StatRow
                  key={ps.partnerId}
                  label={`Avec ${getName(ps.partnerId)}`}
                  value={`${ps.wins}/${ps.games} (${Math.round(ps.winRate)}%)`}
                />
              ))}
              {stats.bestPartner && (
                <StatRow label="Meilleur partenaire" value={getName(stats.bestPartner)} />
              )}
              {stats.worstPartner && stats.worstPartner !== stats.bestPartner && (
                <StatRow label="Pire partenaire" value={getName(stats.worstPartner)} />
              )}
            </StatSection>
          )}
        </>
      )}
    </Layout>
  )
}
