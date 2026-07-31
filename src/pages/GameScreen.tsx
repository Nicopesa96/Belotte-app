import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { supabase } from '../db/supabase'
import { useGame, usePlayers } from '../hooks/useSupabase'
import type { Round } from '../types'
import { computeRoundScores, computeGameTotals } from '../utils/scoring'

const ANNOUNCEMENTS = [
  { label: 'Belote / Rebelote', value: 20 },
  { label: 'Tierce', value: 20 },
  { label: 'Cinquante', value: 50 },
  { label: 'Cent', value: 100 },
  { label: 'Carré', value: 100 },
]

interface RoundFormState {
  team1Points: string
  team2Points: string
  team1Ann: number
  team2Ann: number
  contractTeam: 1 | 2 | null
  contractFailed: boolean
  dixDeDer: 1 | 2 | null
}

const emptyForm = (): RoundFormState => ({
  team1Points: '',
  team2Points: '',
  team1Ann: 0,
  team2Ann: 0,
  contractTeam: null,
  contractFailed: false,
  dixDeDer: null,
})

export default function GameScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { game, refetch } = useGame(id!)
  const players = usePlayers()
  const [form, setForm] = useState<RoundFormState>(emptyForm())
  const [showForm, setShowForm] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null)

  if (!game) return <Layout className="items-center justify-center"><p className="text-mint">Chargement...</p></Layout>

  const getPlayerName = (pid: string) => players.find((p) => p.id === pid)?.name ?? '?'

  const team1Names = `${getPlayerName(game.team1[0])} & ${getPlayerName(game.team1[1])}`
  const team2Names = `${getPlayerName(game.team2[0])} & ${getPlayerName(game.team2[1])}`

  const totals = computeGameTotals(game)

  const startEditRound = (index: number) => {
    const r = game.rounds[index]
    setForm({
      team1Points: String(r.team1Points),
      team2Points: String(r.team2Points),
      team1Ann: r.team1Announcements,
      team2Ann: r.team2Announcements,
      contractTeam: r.contractTeam,
      contractFailed: r.contractFailed,
      dixDeDer: r.dix_de_der,
    })
    setEditingRoundIndex(index)
    setShowForm(true)
  }

  const validateRound = async () => {
    const t1 = parseInt(form.team1Points || '0')
    const t2 = parseInt(form.team2Points || '0')

    const round: Round = {
      id: editingRoundIndex !== null ? game.rounds[editingRoundIndex].id : game.rounds.length + 1,
      team1Points: t1,
      team2Points: t2,
      team1Announcements: form.team1Ann,
      team2Announcements: form.team2Ann,
      contractTeam: form.contractTeam,
      contractFailed: form.contractFailed,
      dix_de_der: form.dixDeDer,
    }

    const newRounds = editingRoundIndex !== null
      ? game.rounds.map((r, i) => (i === editingRoundIndex ? round : r))
      : [...game.rounds, round]
    const newTotals = newRounds.reduce(
      (acc, r) => {
        const s = computeRoundScores(r)
        return { t1: acc.t1 + s.team1, t2: acc.t2 + s.team2 }
      },
      { t1: 0, t2: 0 }
    )

    const finished = newTotals.t1 >= game.target_score || newTotals.t2 >= game.target_score
    const winner = finished ? (newTotals.t1 >= game.target_score ? 1 : 2) : null

    await supabase.from('games').update({
      rounds: newRounds,
      team1_total: newTotals.t1,
      team2_total: newTotals.t2,
      finished,
      winner,
    }).eq('id', id!)

    await refetch()
    setForm(emptyForm())
    setShowForm(false)
    setEditingRoundIndex(null)

    if (finished) navigate(`/recap/${id}`)
  }

  const endGame = async () => {
    const winner = totals.team1 >= totals.team2 ? 1 : 2
    await supabase.from('games').update({ finished: true, winner }).eq('id', id!)
    navigate(`/recap/${id}`)
  }

  return (
    <Layout>
      <div className="bg-cyan-game px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="text-green-dark font-bold text-lg">‹</button>
          <h2 className="font-belote text-xl font-black text-green-dark">
            Manche {game.rounds.length + 1}
          </h2>
          <button onClick={() => setShowEndConfirm(true)} className="text-green-dark/60 text-sm font-medium">
            Terminer
          </button>
        </div>
        <div className="grid grid-cols-3 items-center text-center">
          <div>
            <p className="font-bold text-green-dark text-sm leading-tight">{getPlayerName(game.team1[0])}</p>
            <p className="text-green-dark/70 text-xs">{getPlayerName(game.team1[1])}</p>
          </div>
          <div className="text-green-dark/50 text-xs">VS</div>
          <div>
            <p className="font-bold text-green-dark text-sm leading-tight">{getPlayerName(game.team2[0])}</p>
            <p className="text-green-dark/70 text-xs">{getPlayerName(game.team2[1])}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 py-3 px-4 bg-green-table/40 border-b border-green-card/20">
          <span className={`font-belote text-2xl font-black text-center ${totals.team1 > totals.team2 ? 'text-mint' : 'text-cream'}`}>{totals.team1}</span>
          <span className="text-cream/40 text-xs text-center self-center">/ {game.target_score}</span>
          <span className={`font-belote text-2xl font-black text-center ${totals.team2 > totals.team1 ? 'text-mint' : 'text-cream'}`}>{totals.team2}</span>
        </div>
        {game.rounds.length > 0 && (() => {
          const n = game.rounds.length
          const avg1 = Math.round(totals.team1 / n)
          const avg2 = Math.round(totals.team2 / n)
          const lead = Math.abs(totals.team1 - totals.team2)
          const leader = totals.team1 > totals.team2 ? team1Names : totals.team2 > totals.team1 ? team2Names : null
          const contracts1 = game.rounds.filter(r => r.contractTeam === 1).length
          const contracts2 = game.rounds.filter(r => r.contractTeam === 2).length
          return (
            <div className="px-4 py-2 bg-green-table/20 border-b border-green-card/10 flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-cream/40">{n} manche{n > 1 ? 's' : ''}</span>
                {leader && <span className="text-mint/70">{leader} mène de {lead} pts</span>}
                {!leader && <span className="text-cream/40">Égalité</span>}
              </div>
              <div className="flex justify-between text-xs text-cream/30">
                <span>Moy. {avg1} pts/m · {contracts1} contrat{contracts1 !== 1 ? 's' : ''}</span>
                <span>{contracts2} contrat{contracts2 !== 1 ? 's' : ''} · Moy. {avg2} pts/m</span>
              </div>
            </div>
          )
        })()}
        {game.rounds.map((round, i) => {
          const scores = computeRoundScores(round)
          const contractLabel = round.contractTeam
            ? `Éq${round.contractTeam} ${round.contractFailed ? '✗' : '✓'}`
            : null
          return (
            <div key={i} className="grid border-b border-green-card/10" style={{ gridTemplateColumns: '1fr auto 1fr auto' }}>
              <span className={`font-belote text-xl font-bold text-center py-2 pl-4 ${scores.team1 > scores.team2 ? 'text-mint' : 'text-cream/60'}`}>{scores.team1}</span>
              <div className="flex flex-col items-center justify-center px-3">
                <span className="text-cream/30 text-xs">{i + 1}</span>
                {contractLabel && (
                  <span className={`text-xs font-bold leading-none ${round.contractFailed ? 'text-red-belote' : 'text-mint/50'}`}>{contractLabel}</span>
                )}
              </div>
              <span className={`font-belote text-xl font-bold text-center py-2 ${scores.team2 > scores.team1 ? 'text-mint' : 'text-cream/60'}`}>{scores.team2}</span>
              <button onClick={() => startEditRound(i)} className="px-3 text-cream/20 hover:text-mint transition-colors text-sm">✏️</button>
            </div>
          )
        })}
      </div>

      <div className="p-4">
        {!showForm ? (
          <Button size="lg" onClick={() => setShowForm(true)}>+ Nouvelle manche</Button>
        ) : (
          <div className="bg-green-table/50 rounded-2xl p-4 border border-green-card/30">
            <h3 className="font-belote text-lg text-red-belote font-bold mb-4 text-center">
              {editingRoundIndex !== null ? `Modifier manche ${editingRoundIndex + 1}` : `Manche ${game.rounds.length + 1}`}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-1">
              <div>
                <p className="text-mint/60 text-xs mb-1">{team1Names}</p>
                <input type="number" inputMode="numeric" value={form.team1Points}
                  onChange={(e) => setForm((f) => ({ ...f, team1Points: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-green-dark border border-green-card/50 text-cream rounded-lg px-3 py-3 text-xl font-bold text-center outline-none focus:border-mint"
                />
              </div>
              <div>
                <p className="text-mint/60 text-xs mb-1">{team2Names}</p>
                <input type="number" inputMode="numeric" value={form.team2Points}
                  onChange={(e) => setForm((f) => ({ ...f, team2Points: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-green-dark border border-green-card/50 text-cream rounded-lg px-3 py-3 text-xl font-bold text-center outline-none focus:border-mint"
                />
              </div>
            </div>
            <div className="mb-3" />

            <div className="mb-4">
              <p className="text-mint/60 text-xs mb-2">Dix de der (+10 pts)</p>
              <div className="flex gap-2">
                {([null, 1, 2] as const).map((v) => (
                  <button key={String(v)} onClick={() => setForm((f) => ({ ...f, dixDeDer: v }))}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${form.dixDeDer === v ? 'bg-mint text-green-dark font-bold' : 'bg-green-dark/60 text-cream/60'}`}>
                    {v === null ? 'Aucun' : v === 1 ? 'Équipe 1' : 'Équipe 2'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-mint/60 text-xs mb-2">Annonces</p>
              <div className="space-y-2">
                {ANNOUNCEMENTS.map((ann) => (
                  <div key={ann.label} className="flex items-center justify-between bg-green-dark/40 rounded-lg px-3 py-2">
                    <span className="text-cream/80 text-sm">{ann.label} (+{ann.value})</span>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => setForm((f) => ({ ...f, team1Ann: f.team1Ann + ann.value }))} className="bg-mint/20 text-mint text-xs px-2 py-1 rounded hover:bg-mint/40">+Éq1</button>
                      <button onClick={() => setForm((f) => ({ ...f, team2Ann: f.team2Ann + ann.value }))} className="bg-mint/20 text-mint text-xs px-2 py-1 rounded hover:bg-mint/40">+Éq2</button>
                    </div>
                  </div>
                ))}
              </div>
              {(form.team1Ann > 0 || form.team2Ann > 0) && (
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-mint">Éq1 : +{form.team1Ann} pts</span>
                  <button onClick={() => setForm((f) => ({ ...f, team1Ann: 0, team2Ann: 0 }))} className="text-cream/40 text-xs">Reset</button>
                  <span className="text-mint">Éq2 : +{form.team2Ann} pts</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-mint/60 text-xs mb-2">Contrat (qui a pris ?)</p>
              <div className="flex gap-2 mb-2">
                {([null, 1, 2] as const).map((v) => (
                  <button key={String(v)} onClick={() => setForm((f) => ({ ...f, contractTeam: v, contractFailed: false }))}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${form.contractTeam === v ? 'bg-red-belote text-white font-bold' : 'bg-green-dark/60 text-cream/60'}`}>
                    {v === null ? 'Aucun' : v === 1 ? 'Équipe 1' : 'Équipe 2'}
                  </button>
                ))}
              </div>
              {form.contractTeam && (
                <button onClick={() => setForm((f) => ({ ...f, contractFailed: !f.contractFailed }))}
                  className={`w-full py-2 rounded-lg text-sm transition-all ${form.contractFailed ? 'bg-red-belote text-white font-bold' : 'bg-green-dark/60 text-cream/60'}`}>
                  {form.contractFailed ? '✓ Chute !' : 'Chute ?'}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => { setForm(emptyForm()); setShowForm(false); setEditingRoundIndex(null) }}>Annuler</Button>
              <Button size="md" className="flex-1" onClick={validateRound}>Valider</Button>
            </div>
          </div>
        )}
      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-green-table rounded-2xl p-6 w-full max-w-sm border border-green-card">
            <h3 className="font-belote text-xl text-red-belote font-bold mb-2">Terminer la partie ?</h3>
            <p className="text-cream/70 text-sm mb-6">{totals.team1 > totals.team2 ? team1Names : team2Names} sera déclarée gagnante.</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowEndConfirm(false)}>Non</Button>
              <Button size="md" className="flex-1" onClick={endGame}>Oui, terminer</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
