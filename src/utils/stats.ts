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
  avgPointsPerRound: number
  bestRoundScore: number
  contractsTaken: number
  contractsSucceeded: number
  contractsFailed: number
  contractSuccessRate: number
  avgContractsPerGame: number
  dixDeDerRate: number
  avgAnnouncementsPerGame: number
  longestWinStreak: number
  partnerStats: PartnerStat[]
  bestPartner: string | null
  worstPartner: string | null
  opponentStats: OpponentStat[]
  bestOpponent: string | null
  worstOpponent: string | null
  beloteScore: number
}

export interface PartnerStat {
  partnerId: string
  games: number
  wins: number
  winRate: number
}

export interface OpponentStat {
  opponentId: string
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
  let totalRoundPoints = 0
  let totalRounds = 0
  let bestRoundScore = 0
  let contractsTaken = 0
  let contractsSucceeded = 0
  let contractsFailed = 0
  let dixDeDerCount = 0
  let totalAnnouncements = 0
  const partnerMap = new Map<string, { games: number; wins: number }>()
  const opponentMap = new Map<string, { games: number; wins: number }>()

  for (const game of playerGames) {
    const isTeam1 = game.team1.includes(playerId)
    const myTeamWon = isTeam1 ? game.winner === 1 : game.winner === 2
    if (myTeamWon) wins++

    for (const round of game.rounds) {
      const scores = computeRoundScores(round)
      const myRoundScore = isTeam1 ? scores.team1 : scores.team2
      totalPoints += myRoundScore
      totalRoundPoints += myRoundScore
      totalRounds++

      if (myRoundScore > bestRoundScore) bestRoundScore = myRoundScore

      if (round.contractTeam !== null) {
        const myTeamTookContract = isTeam1 ? round.contractTeam === 1 : round.contractTeam === 2
        if (myTeamTookContract) {
          contractsTaken++
          if (round.contractFailed) contractsFailed++
          else contractsSucceeded++
        }
      }

      if ((isTeam1 && round.dix_de_der === 1) || (!isTeam1 && round.dix_de_der === 2)) {
        dixDeDerCount++
      }

      totalAnnouncements += isTeam1 ? round.team1Announcements : round.team2Announcements
    }

    const partner = isTeam1
      ? game.team1.find((p) => p !== playerId)!
      : game.team2.find((p) => p !== playerId)!
    const ep = partnerMap.get(partner) ?? { games: 0, wins: 0 }
    partnerMap.set(partner, { games: ep.games + 1, wins: ep.wins + (myTeamWon ? 1 : 0) })

    const opponents = isTeam1 ? game.team2 : game.team1
    for (const opponentId of opponents) {
      const eo = opponentMap.get(opponentId) ?? { games: 0, wins: 0 }
      opponentMap.set(opponentId, { games: eo.games + 1, wins: eo.wins + (myTeamWon ? 1 : 0) })
    }
  }

  const sortedByDate = [...playerGames].sort((a, b) => a.date - b.date)
  let longestWinStreak = 0
  let currentStreak = 0
  for (const game of sortedByDate) {
    const isTeam1 = game.team1.includes(playerId)
    const won = isTeam1 ? game.winner === 1 : game.winner === 2
    if (won) {
      currentStreak++
      if (currentStreak > longestWinStreak) longestWinStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }

  const partnerStats: PartnerStat[] = Array.from(partnerMap.entries()).map(([partnerId, s]) => ({
    partnerId,
    games: s.games,
    wins: s.wins,
    winRate: s.games > 0 ? (s.wins / s.games) * 100 : 0,
  }))

  const opponentStats: OpponentStat[] = Array.from(opponentMap.entries()).map(([opponentId, s]) => ({
    opponentId,
    games: s.games,
    wins: s.wins,
    winRate: s.games > 0 ? (s.wins / s.games) * 100 : 0,
  }))

  const sortedPartners = [...partnerStats].sort((a, b) => b.winRate - a.winRate)
  const bestPartner = sortedPartners[0]?.partnerId ?? null
  const worstPartner = sortedPartners[sortedPartners.length - 1]?.partnerId ?? null

  const sortedOpponents = [...opponentStats].sort((a, b) => b.winRate - a.winRate)
  const bestOpponent = sortedOpponents[0]?.opponentId ?? null
  const worstOpponent = sortedOpponents[sortedOpponents.length - 1]?.opponentId ?? null

  const winRate = playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0
  const contractSuccessRate = contractsTaken > 0 ? (contractsSucceeded / contractsTaken) * 100 : 0
  const avgContractsPerGame = playerGames.length > 0 ? contractsTaken / playerGames.length : 0

  const fiabilite = Math.min(100, contractSuccessRate)
  const audace = Math.min(100, avgContractsPerGame * 10)
  const regularite = Math.min(100, winRate)
  const beloteScore = Math.round(fiabilite * 0.4 + audace * 0.3 + regularite * 0.3)

  return {
    playerId,
    totalGames: playerGames.length,
    wins,
    losses: playerGames.length - wins,
    winRate,
    totalPoints,
    avgPointsPerGame: playerGames.length > 0 ? totalPoints / playerGames.length : 0,
    avgPointsPerRound: totalRounds > 0 ? totalRoundPoints / totalRounds : 0,
    bestRoundScore,
    contractsTaken,
    contractsSucceeded,
    contractsFailed,
    contractSuccessRate,
    avgContractsPerGame,
    dixDeDerRate: totalRounds > 0 ? (dixDeDerCount / totalRounds) * 100 : 0,
    avgAnnouncementsPerGame: playerGames.length > 0 ? totalAnnouncements / playerGames.length : 0,
    longestWinStreak,
    partnerStats,
    bestPartner,
    worstPartner,
    opponentStats,
    bestOpponent,
    worstOpponent,
    beloteScore,
  }
}
