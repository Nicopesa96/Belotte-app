import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Layout from '../components/Layout'
import { usePlayers, useGames } from '../hooks/useSupabase'
import type { Game } from '../types'

export default function Charts() {
  const navigate = useNavigate()
  const games = useGames(true)
  const players = usePlayers()

  const getName = (id: string) => players.find((p) => p.id === id)?.name ?? '?'

  const sortedGames = [...games].sort((a, b) => a.date - b.date)

  const winRateData = players.map((player) => {
    const playerGames = sortedGames.filter((g: Game) => g.team1.includes(player.id) || g.team2.includes(player.id))
    const wins = playerGames.filter((g: Game) => {
      const isT1 = g.team1.includes(player.id)
      return isT1 ? g.winner === 1 : g.winner === 2
    }).length
    return {
      name: player.name,
      victoires: playerGames.length > 0 ? Math.round((wins / playerGames.length) * 100) : 0,
      parties: playerGames.length,
    }
  })

  const last10 = sortedGames.slice(-10)
  const progressData = last10.map((g: Game, i: number) => ({
    name: `P${i + 1}`,
    [`${getName(g.team1[0])}&${getName(g.team1[1])}`]: g.team1_total,
    [`${getName(g.team2[0])}&${getName(g.team2[1])}`]: g.team2_total,
  }))

  const COLORS = ['#b2f0c8', '#e53935', '#7dd3c8', '#ffd54f']

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/statistiques')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold">Graphes</h2>
      </div>

      {games.length < 2 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <span className="text-6xl opacity-30">📊</span>
          <p className="text-cream/40 text-center">Jouez au moins 2 parties pour voir les graphes</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="font-belote text-lg text-mint mb-3">Taux de victoire</h3>
            <div className="bg-green-table/20 rounded-2xl p-3 border border-green-card/20">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={winRateData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d7a3d30" />
                  <XAxis dataKey="name" tick={{ fill: '#b2f0c8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#b2f0c8', fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1a3a1a', border: '1px solid #3d7a3d', borderRadius: 8 }} labelStyle={{ color: '#b2f0c8' }} itemStyle={{ color: '#b2f0c8' }} formatter={(v) => [`${v}%`, 'Victoires']} />
                  <Bar dataKey="victoires" fill="#b2f0c8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="font-belote text-lg text-mint mb-3">Nombre de parties</h3>
            <div className="bg-green-table/20 rounded-2xl p-3 border border-green-card/20">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={winRateData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d7a3d30" />
                  <XAxis dataKey="name" tick={{ fill: '#b2f0c8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#b2f0c8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a3a1a', border: '1px solid #3d7a3d', borderRadius: 8 }} labelStyle={{ color: '#b2f0c8' }} itemStyle={{ color: '#b2f0c8' }} />
                  <Bar dataKey="parties" fill="#7dd3c8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {last10.length >= 2 && (
            <div>
              <h3 className="font-belote text-lg text-mint mb-3">Scores (10 dernières parties)</h3>
              <div className="bg-green-table/20 rounded-2xl p-3 border border-green-card/20">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d7a3d30" />
                    <XAxis dataKey="name" tick={{ fill: '#b2f0c8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#b2f0c8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1a3a1a', border: '1px solid #3d7a3d', borderRadius: 8 }} labelStyle={{ color: '#b2f0c8' }} />
                    {Object.keys(progressData[0] || {}).filter((k) => k !== 'name').map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
