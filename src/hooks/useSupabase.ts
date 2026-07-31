import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'
import type { Player, Game, Session } from '../types'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    supabase.from('players').select('*').order('name').then(({ data }) => {
      if (data) setPlayers(data)
    })
    const channel = supabase.channel('players').on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
      supabase.from('players').select('*').order('name').then(({ data }) => { if (data) setPlayers(data) })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return players
}

export function useGames(finishedOnly = false) {
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    let query = supabase.from('games').select('*').order('date', { ascending: false })
    if (finishedOnly) query = query.eq('finished', true)
    query.then(({ data }) => { if (data) setGames(data) })

    const channel = supabase.channel('games').on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
      let q = supabase.from('games').select('*').order('date', { ascending: false })
      if (finishedOnly) q = q.eq('finished', true)
      q.then(({ data }) => { if (data) setGames(data) })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [finishedOnly])

  return games
}

export function useGame(id: string) {
  const [game, setGame] = useState<Game | null>(null)

  const refetch = async () => {
    const { data } = await supabase.from('games').select('*').eq('id', id).single()
    if (data) setGame(data)
  }

  useEffect(() => {
    if (!id) return
    refetch()
    const channel = supabase.channel(`game-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${id}` }, ({ new: updated }) => {
      setGame(updated as Game)
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  return { game, refetch }
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    supabase.from('sessions').select('*').order('date', { ascending: false }).then(({ data }) => {
      if (data) setSessions(data)
    })
    const channel = supabase.channel('sessions').on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
      supabase.from('sessions').select('*').order('date', { ascending: false }).then(({ data }) => { if (data) setSessions(data) })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return sessions
}

export function useOngoingGame() {
  const [game, setGame] = useState<Game | null | undefined>(undefined)

  useEffect(() => {
    supabase.from('games').select('*').eq('finished', false).limit(1).then(({ data }) => {
      setGame(data?.[0] ?? null)
    })
    const channel = supabase.channel('ongoing').on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
      supabase.from('games').select('*').eq('finished', false).limit(1).then(({ data }) => {
        setGame(data?.[0] ?? null)
      })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return game
}
