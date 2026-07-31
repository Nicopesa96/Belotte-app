import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useGames, usePlayers, useSessions } from '../hooks/useSupabase'
import { supabase } from '../db/supabase'

export default function History() {
  const navigate = useNavigate()
  const games = useGames()
  const players = usePlayers()
  const sessions = useSessions()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [deletedSessionIds, setDeletedSessionIds] = useState<Set<string>>(new Set())

  const getName = (id: string) => players.find((p) => p.id === id)?.name ?? '?'
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const visibleGames = games.filter((g) => !deletedIds.has(g.id))

  const saveNote = async (sessionId: string) => {
    await supabase.from('sessions').update({ note: noteText.trim() || null }).eq('id', sessionId)
    setEditingNoteId(null)
  }

  const deleteSession = async (sessionId: string) => {
    const sessionGameIds = games.filter((g) => g.session_id === sessionId).map((g) => g.id)
    setDeletedIds((prev) => new Set([...prev, ...sessionGameIds]))
    setDeletedSessionIds((prev) => new Set([...prev, sessionId]))
    setConfirmDeleteSessionId(null)
    if (sessionGameIds.length > 0) await supabase.from('games').delete().in('id', sessionGameIds)
    await supabase.from('sessions').delete().eq('id', sessionId)
  }

  const deleteGame = async (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]))
    setConfirmDeleteId(null)
    await supabase.from('games').delete().eq('id', id)
  }

  const deleteAll = async () => {
    setDeletedIds(new Set(games.map((g) => g.id)))
    setConfirmDeleteAll(false)
    await supabase.from('games').delete().neq('id', '')
    setConfirmDeleteAll(false)
  }

  const orphanGames = visibleGames.filter((g) => !g.session_id)

  return (
    <Layout className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/statistiques')} className="text-mint text-2xl">‹</button>
        <h2 className="font-belote text-2xl text-red-belote font-bold flex-1">Historique</h2>
        {visibleGames.length > 0 && (
          <button onClick={() => setConfirmDeleteAll(true)} className="text-cream/40 text-xs hover:text-red-belote transition-colors">
            Tout effacer
          </button>
        )}
      </div>

      {sessions.length === 0 && orphanGames.length === 0 && visibleGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <span className="text-6xl opacity-30">🃏</span>
          <p className="text-cream/40 text-center">Aucune partie jouée pour l'instant</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.filter((s) => !deletedSessionIds.has(s.id)).map((session) => {
            const sessionGames = visibleGames.filter((g) => g.session_id === session.id)
            const isExpanded = expandedId === session.id
            const isEditingNote = editingNoteId === session.id

            return (
              <div key={session.id} className="bg-green-table/30 border border-green-card/30 rounded-2xl overflow-hidden">
                <div className="flex items-center">
                  <button className="flex-1 p-4 text-left flex items-center gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}>
                    <span className="text-xl">{isExpanded ? '📂' : '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-belote text-mint font-bold truncate">{session.name}</p>
                      <p className="text-cream/40 text-xs">{formatDate(session.date)} · {sessionGames.length} partie{sessionGames.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-cream/30 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  <button onClick={() => setConfirmDeleteSessionId(session.id)} className="px-4 py-4 text-cream/20 hover:text-red-belote transition-colors">🗑</button>
                </div>

                {isExpanded && (
                  <div className="border-t border-green-card/20">
                    <div className="px-4 py-3">
                      {isEditingNote ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Lieu, repas, boissons..."
                            rows={3}
                            className="w-full bg-green-dark border border-green-card/50 text-cream rounded-lg px-3 py-2 text-sm outline-none focus:border-mint resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => saveNote(session.id)}
                              className="flex-1 bg-mint text-green-dark rounded-lg py-2 text-sm font-bold">Enregistrer</button>
                            <button onClick={() => setEditingNoteId(null)}
                              className="flex-1 border border-green-card/40 text-cream/50 rounded-lg py-2 text-sm">Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <button className="w-full text-left" onClick={() => { setEditingNoteId(session.id); setNoteText(session.note ?? '') }}>
                          {session.note
                            ? <p className="text-cream/60 text-sm italic">{session.note}</p>
                            : <p className="text-cream/25 text-xs">+ Ajouter une note (lieu, repas...)</p>
                          }
                        </button>
                      )}
                    </div>

                    {sessionGames.length > 0 && (
                      <div className="border-t border-green-card/10">
                        {sessionGames.map((game) => {
                          const t1 = `${getName(game.team1[0])} – ${getName(game.team1[1])}`
                          const t2 = `${getName(game.team2[0])} – ${getName(game.team2[1])}`
                          return (
                            <div key={game.id} className="flex items-center border-b border-green-card/10 last:border-b-0">
                              <div className="flex-1 px-4 py-3 cursor-pointer" onClick={() => navigate(`/recap/${game.id}`)}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className={`text-sm ${game.winner === 1 ? 'text-mint font-bold' : 'text-cream/70'}`}>{t1}</p>
                                    <p className={`text-sm ${game.winner === 2 ? 'text-mint font-bold' : 'text-cream/70'}`}>{t2}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-belote text-lg font-bold ${game.winner === 1 ? 'text-mint' : 'text-cream/50'}`}>{game.team1_total}</p>
                                    <p className={`font-belote text-lg font-bold ${game.winner === 2 ? 'text-mint' : 'text-cream/50'}`}>{game.team2_total}</p>
                                  </div>
                                </div>
                                {!game.finished && <span className="mt-1 inline-block bg-red-belote/20 text-red-belote text-xs px-2 py-0.5 rounded-full">En cours</span>}
                              </div>
                              <button onClick={() => setConfirmDeleteId(game.id)} className="px-3 text-cream/20 hover:text-red-belote transition-colors text-sm">🗑</button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {sessionGames.length === 0 && (
                      <p className="px-4 pb-3 text-cream/30 text-xs">Aucune partie dans cette soirée</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {orphanGames.length > 0 && (
            <div className="bg-green-table/20 border border-green-card/20 rounded-2xl overflow-hidden">
              <button className="w-full p-4 text-left flex items-center gap-3"
                onClick={() => setExpandedId(expandedId === '__orphan__' ? null : '__orphan__')}>
                <span className="text-xl">{expandedId === '__orphan__' ? '📂' : '📁'}</span>
                <div className="flex-1">
                  <p className="font-belote text-cream/60 font-bold">Parties sans soirée</p>
                  <p className="text-cream/30 text-xs">{orphanGames.length} partie{orphanGames.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-cream/30 text-sm">{expandedId === '__orphan__' ? '▲' : '▼'}</span>
              </button>
              {expandedId === '__orphan__' && (
                <div className="border-t border-green-card/10">
                  {orphanGames.map((game) => {
                    const t1 = `${getName(game.team1[0])} – ${getName(game.team1[1])}`
                    const t2 = `${getName(game.team2[0])} – ${getName(game.team2[1])}`
                    return (
                      <div key={game.id} className="flex items-center border-b border-green-card/10 last:border-b-0">
                        <div className="flex-1 px-4 py-3 cursor-pointer" onClick={() => navigate(`/recap/${game.id}`)}>
                          <p className="text-cream/40 text-xs mb-1">{formatDate(game.date)}</p>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`text-sm ${game.winner === 1 ? 'text-mint font-bold' : 'text-cream/70'}`}>{t1}</p>
                              <p className={`text-sm ${game.winner === 2 ? 'text-mint font-bold' : 'text-cream/70'}`}>{t2}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-belote text-lg font-bold ${game.winner === 1 ? 'text-mint' : 'text-cream/50'}`}>{game.team1_total}</p>
                              <p className={`font-belote text-lg font-bold ${game.winner === 2 ? 'text-mint' : 'text-cream/50'}`}>{game.team2_total}</p>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setConfirmDeleteId(game.id)} className="px-3 text-cream/20 hover:text-red-belote transition-colors text-sm">🗑</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {confirmDeleteSessionId && (() => {
        const s = sessions.find((x) => x.id === confirmDeleteSessionId)
        const count = games.filter((g) => g.session_id === confirmDeleteSessionId).length
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
            <div className="bg-green-table rounded-2xl p-6 w-full max-w-sm border border-green-card">
              <h3 className="font-belote text-xl text-red-belote font-bold mb-2">Supprimer cette soirée ?</h3>
              <p className="text-cream/70 text-sm mb-1">« {s?.name} »</p>
              <p className="text-cream/50 text-sm mb-6">{count} partie{count !== 1 ? 's' : ''} sera{count !== 1 ? 'ont' : ''} également supprimée{count !== 1 ? 's' : ''}.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteSessionId(null)} className="flex-1 border border-mint text-mint rounded-lg py-3 font-bold">Annuler</button>
                <button onClick={() => deleteSession(confirmDeleteSessionId)} className="flex-1 bg-red-belote text-white rounded-lg py-3 font-bold">Supprimer</button>
              </div>
            </div>
          </div>
        )
      })()}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-green-table rounded-2xl p-6 w-full max-w-sm border border-green-card">
            <h3 className="font-belote text-xl text-red-belote font-bold mb-2">Supprimer cette partie ?</h3>
            <p className="text-cream/70 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-mint text-mint rounded-lg py-3 font-bold">Annuler</button>
              <button onClick={() => deleteGame(confirmDeleteId)} className="flex-1 bg-red-belote text-white rounded-lg py-3 font-bold">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAll && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-green-table rounded-2xl p-6 w-full max-w-sm border border-green-card">
            <h3 className="font-belote text-xl text-red-belote font-bold mb-2">Tout effacer ?</h3>
            <p className="text-cream/70 text-sm mb-6">{visibleGames.length} partie{visibleGames.length > 1 ? 's' : ''} seront supprimées définitivement.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteAll(false)} className="flex-1 border border-mint text-mint rounded-lg py-3 font-bold">Annuler</button>
              <button onClick={deleteAll} className="flex-1 bg-red-belote text-white rounded-lg py-3 font-bold">Tout effacer</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
