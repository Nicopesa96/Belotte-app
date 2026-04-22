import type { Game } from '../types'
import { computeRoundScores } from './scoring'

export interface PlayerStats {
  playerId: string
  totalGames: number
  wins: number
  losses: number
  winRate: number
  totalPoints: number
  avgPointsPerGame: number
  contractsTaken: number
  contractsSucceeded: number
  contractsFailed: number
  contractSuccessRate: number
  avgContractsPerGame: number
  partnerStats: PartnerStat[]
  bestPartner: string | null
  worstPartner: string | null
  beloteScore: number
}

export interface PartnerStat {
  partnerId: string
  games: number
  wins: number
  winRate: number
}

export function computePlayerStats(playerId: string, games: Game[]): PlayerStats {
  const playerGames = games.filter(
    (g) => g.finished && (g.team1.includes(playerId) || g.team2.includes(playerId))
  )

  let wins = 0
  let totalPoints = 0
  let contractsTaken = 0
  let contractsSucceeded = 0
  let contractsFailed = 0
  const partnerMap = new Map<string, { games: number; wins: number }>()

  for (const game of playerGames) {
    const isTeam1 = game.team1.includes(playerId)
    const myTeamWon = isTeam1 ? game.winner === 1 : game.winner === 2
    if (myTeamWon) wins++

    const totals = game.rounds.reduce(
      (acc, r) => {
        const s = computeRoundScores(r)
        return { t1: acc.t1 + s.team1, t2: acc.t2 + s.team2 }
      },
      { t1: 0, t2: 0 }
    )
    totalPoints += isTeam1 ? totals.t1 : totals.t2

    for (const round of game.rounds) {
      if (round.contractTeam !== null) {
        const myTeamTookContract = isTeam1 ? round.contractTeam === 1 : round.contractTeam === 2
        if (myTeamTookContract) {
          contractsTaken++
          if (round.contractFailed) contractsFailed++
          else contractsSucceeded++
        }
      }
    }

    const partner = isTeam1
      ? game.team1.find((p) => p !== playerId)!
      : game.team2.find((p) => p !== playerId)!

    const existing = partnerMap.get(partner) ?? { games: 0, wins: 0 }
    partnerMap.set(partner, {
      games: existing.games + 1,
      wins: existing.wins + (myTeamWon ? 1 : 0),
    })
  }

  const partnerStats: PartnerStat[] = Array.from(partnerMap.entries()).map(([partnerId, s]) => ({
    partnerId,
    games: s.games,
    wins: s.wins,
    winRate: s.games > 0 ? (s.wins / s.games) * 100 : 0,
  }))

  const sorted = [...partnerStats].sort((a, b) => b.winRate - a.winRate)
  const bestPartner = sorted[0]?.partnerId ?? null
  const worstPartner = sorted[sorted.length - 1]?.partnerId ?? null

  const winRate = playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0
  const contractSuccessRate = contractsTaken > 0 ? (contractsSucceeded / contractsTaken) * 100 : 0
  const avgContractsPerGame = playerGames.length > 0 ? contractsTaken / playerGames.length : 0

  // Belote Score: composite 0-100
  const fiabilite = Math.min(100, contractSuccessRate)
  const audace = Math.min(100, avgContractsPerGame * 10)
  const regularite = Math.min(100, winRate)
  const beloteScore = Math.round((fiabilite * 0.4 + audace * 0.3 + regularite * 0.3))

  return {
    playerId,
    totalGames: playerGames.length,
    wins,
    losses: playerGames.length - wins,
    winRate,
    totalPoints,
    avgPointsPerGame: playerGames.length > 0 ? totalPoints / playerGames.length : 0,
    contractsTaken,
    contractsSucceeded,
    contractsFailed,
    contractSuccessRate,
    avgContractsPerGame,
    partnerStats,
    bestPartner,
    worstPartner,
    beloteScore,
  }
}
