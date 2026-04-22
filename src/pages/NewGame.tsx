import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { db } from '../db'
import type { Player } from '../types'

export default function NewGame() {
  const navigate = useNavigate()
  const players = useLiveQuery(() => db.players.orderBy('name').toArray()) ?? []
  const [selected, setSelected] = useState<string[]>([])
  const [dealerIndex, setDealerIndex] = useState<number>(0)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showAddPlayer, setShowAddPlayer] = useState(false)

  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const addPlayer = async () => {
    const name = newPlayerName.trim()
    if (!name) return
    const player: Player = { id: uuidv4(), name, createdAt: Date.now() }
    await db.players.add(player)
    setSelected((prev) => (prev.length < 4 ? [...prev, player.id] : prev))
    setNewPlayerName('')
    setShowAddPlayer(false)
  }

  const startGame = async () => {
    if (selected.length !== 4) return
    const id = uuidv4()
    await db.games.add({
      id,
      date: Date.now(),
      team1: [selected[0], selected[2]],
      team2: [selected[1], selected[3]],
      dealerPlayerId: selected[dealerIndex],
      rounds: [],
      team1Total: 0,
      team2Total: 0,
      winner: null,
      finished: false,
      targetScore: 1000,
    })
    navigate(`/partie/${id}`)
  }

  const getPlayer = (id: string) => players.find((p) => p.id === id)

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold">Nouvelle partie</h2>
      </div>

      <p className="text-mint/60 text-sm mb-3">Sélectionne 4 joueurs <span className="text-mint/40">(équipes: 1&3 vs 2&4)</span></p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {players.map((player) => {
          const idx = selected.indexOf(player.id)
          const isSelected = idx !== -1
          return (
            <button
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'bg-mint/20 border-mint text-mint'
                  : 'bg-green-table/30 border-green-card/40 text-cream/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-mint text-green-dark' : 'bg-green-card/50 text-cream/50'}`}>
                  {isSelected ? idx + 1 : player.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-sm">{player.name}</span>
              </div>
            </button>
          )
        })}

        <button
          onClick={() => setShowAddPlayer(true)}
          className="p-3 rounded-xl border-2 border-dashed border-green-card/40 text-cream/40 flex items-center justify-center gap-2 hover:border-mint/50 hover:text-mint/50 transition-all"
        >
          <span className="text-xl">+</span>
          <span className="text-sm">Nouveau joueur</span>
        </button>
      </div>

      {showAddPlayer && (
        <div className="bg-green-table/50 rounded-xl p-4 mb-4 border border-green-card/40">
          <p className="text-mint text-sm mb-2">Nom du joueur</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Prénom..."
              className="flex-1 bg-green-dark border border-green-card/50 text-cream rounded-lg px-3 py-2 text-sm outline-none focus:border-mint"
            />
            <button onClick={addPlayer} className="bg-mint text-green-dark px-4 rounded-lg font-bold text-sm">OK</button>
            <button onClick={() => setShowAddPlayer(false)} className="text-cream/50 px-2">✕</button>
          </div>
        </div>
      )}

      {selected.length === 4 && (
        <div className="bg-green-table/30 rounded-xl p-4 mb-6 border border-green-card/30">
          <p className="text-mint/60 text-xs mb-3 uppercase tracking-wider">Équipes</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-mint/10 rounded-lg p-3">
              <p className="text-red-belote text-xs font-bold mb-1">Équipe 1</p>
              <p className="text-cream text-sm">{getPlayer(selected[0])?.name}</p>
              <p className="text-cream text-sm">{getPlayer(selected[2])?.name}</p>
            </div>
            <div className="bg-mint/10 rounded-lg p-3">
              <p className="text-red-belote text-xs font-bold mb-1">Équipe 2</p>
              <p className="text-cream text-sm">{getPlayer(selected[1])?.name}</p>
              <p className="text-cream text-sm">{getPlayer(selected[3])?.name}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-mint/60 text-xs mb-2 uppercase tracking-wider">Distributeur premier tour</p>
            <div className="flex gap-2 flex-wrap">
              {selected.map((id, i) => (
                <button
                  key={id}
                  onClick={() => setDealerIndex(i)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${dealerIndex === i ? 'bg-red-belote text-white' : 'bg-green-card/30 text-cream/70'}`}
                >
                  {getPlayer(id)?.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button size="lg" onClick={startGame} disabled={selected.length !== 4}>
        Commencer la partie
      </Button>
    </Layout>
  )
}
