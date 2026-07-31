import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { supabase } from '../db/supabase'
import { usePlayers, useSessions } from '../hooks/useSupabase'
import type { Player } from '../types'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function autoSessionName() {
  const d = new Date()
  return `Belote du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

function isToday(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default function NewGame() {
  const navigate = useNavigate()
  const players = usePlayers()
  const sessions = useSessions()

  const [step, setStep] = useState<'session' | 'players'>('session')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [newSessionName, setNewSessionName] = useState(autoSessionName())
  const [showNewSession, setShowNewSession] = useState(false)

  const [selected, setSelected] = useState<string[]>([])
  const [dealerIndex, setDealerIndex] = useState<number>(0)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showAddPlayer, setShowAddPlayer] = useState(false)

  const todaySessions = sessions.filter((s) => isToday(s.date))
  const olderSessions = sessions.filter((s) => !isToday(s.date)).slice(0, 5)

  const selectSession = (id: string) => {
    setSessionId(id)
    setStep('players')
  }

  const createAndSelectSession = async () => {
    const name = newSessionName.trim() || autoSessionName()
    const id = uuidv4()
    await supabase.from('sessions').insert({ id, date: Date.now(), name, note: null })
    setSessionId(id)
    setStep('players')
  }

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
    await supabase.from('players').insert({ id: player.id, name: player.name, created_at: player.createdAt })
    setSelected((prev) => (prev.length < 4 ? [...prev, player.id] : prev))
    setNewPlayerName('')
    setShowAddPlayer(false)
  }

  const startGame = async () => {
    if (selected.length !== 4) return
    const id = uuidv4()
    await supabase.from('games').insert({
      id,
      date: Date.now(),
      team1: [selected[0], selected[2]],
      team2: [selected[1], selected[3]],
      dealer_player_id: selected[dealerIndex],
      rounds: [],
      team1_total: 0,
      team2_total: 0,
      winner: null,
      finished: false,
      target_score: 1000,
      session_id: sessionId,
    })
    navigate(`/partie/${id}`)
  }

  const getPlayer = (id: string) => players.find((p) => p.id === id)

  if (step === 'session') {
    return (
      <Layout className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-mint text-2xl">‹</button>
          <h2 className="font-belote text-2xl text-red-belote font-bold">Quelle soirée ?</h2>
        </div>

        {todaySessions.length > 0 && (
          <div className="mb-5">
            <p className="text-mint/60 text-xs uppercase tracking-wider mb-2">Ce soir</p>
            <div className="flex flex-col gap-2">
              {todaySessions.map((s) => (
                <button key={s.id} onClick={() => selectSession(s.id)}
                  className="bg-mint/10 border-2 border-mint/40 rounded-xl p-4 text-left hover:bg-mint/20 transition-all">
                  <p className="font-belote text-mint font-bold">{s.name}</p>
                  {s.note && <p className="text-cream/50 text-xs mt-1">{s.note}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {olderSessions.length > 0 && (
          <div className="mb-5">
            <p className="text-mint/60 text-xs uppercase tracking-wider mb-2">Soirées récentes</p>
            <div className="flex flex-col gap-2">
              {olderSessions.map((s) => (
                <button key={s.id} onClick={() => selectSession(s.id)}
                  className="bg-green-table/40 border border-green-card/30 rounded-xl p-3 text-left hover:bg-green-table/60 transition-all">
                  <p className="text-cream font-medium text-sm">{s.name}</p>
                  <p className="text-cream/40 text-xs">{formatDate(s.date)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-mint/60 text-xs uppercase tracking-wider mb-2">Nouvelle soirée</p>
          {!showNewSession ? (
            <button onClick={() => setShowNewSession(true)}
              className="w-full bg-green-table/30 border-2 border-dashed border-green-card/40 rounded-xl p-4 text-cream/50 hover:border-mint/50 hover:text-mint/50 transition-all flex items-center justify-center gap-2">
              <span className="text-xl">+</span>
              <span>Créer une nouvelle soirée</span>
            </button>
          ) : (
            <div className="bg-green-table/50 border border-green-card/30 rounded-xl p-4">
              <p className="text-mint/60 text-xs mb-2">Nom de la soirée</p>
              <input
                autoFocus
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full bg-green-dark border border-green-card/50 text-cream rounded-lg px-3 py-2 text-sm outline-none focus:border-mint mb-3"
              />
              <Button size="md" className="w-full" onClick={createAndSelectSession}>
                Créer et continuer
              </Button>
            </div>
          )}
        </div>

        <button onClick={() => { setSessionId(null); setStep('players') }}
          className="w-full text-cream/30 text-xs text-center py-2 hover:text-cream/50 transition-colors">
          Continuer sans soirée
        </button>
      </Layout>
    )
  }

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('session')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold">Nouvelle partie</h2>
      </div>

      <p className="text-mint/60 text-sm mb-3">Sélectionne 4 joueurs <span className="text-mint/40">(équipes: 1&3 vs 2&4)</span></p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {players.map((player) => {
          const idx = selected.indexOf(player.id)
          const isSelected = idx !== -1
          return (
            <button key={player.id} onClick={() => togglePlayer(player.id)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                isSelected ? 'bg-mint/20 border-mint text-mint' : 'bg-green-table/30 border-green-card/40 text-cream/70'
              }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-mint text-green-dark' : 'bg-green-card/50 text-cream/50'}`}>
                  {isSelected ? idx + 1 : player.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-sm">{player.name}</span>
              </div>
            </button>
          )
        })}

        <button onClick={() => setShowAddPlayer(true)}
          className="p-3 rounded-xl border-2 border-dashed border-green-card/40 text-cream/40 flex items-center justify-center gap-2 hover:border-mint/50 hover:text-mint/50 transition-all">
          <span className="text-xl">+</span>
          <span className="text-sm">Nouveau joueur</span>
        </button>
      </div>

      {showAddPlayer && (
        <div className="bg-green-table/50 rounded-xl p-4 mb-4 border border-green-card/40">
          <p className="text-mint text-sm mb-2">Nom du joueur</p>
          <div className="flex gap-2">
            <input autoFocus value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder="Prénom..."
              className="flex-1 bg-green-dark border border-green-card/50 text-cream rounded-lg px-3 py-2 text-sm outline-none focus:border-mint" />
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
                <button key={id} onClick={() => setDealerIndex(i)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${dealerIndex === i ? 'bg-red-belote text-white' : 'bg-green-card/30 text-cream/70'}`}>
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
