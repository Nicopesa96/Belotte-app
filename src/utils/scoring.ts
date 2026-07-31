import type { Round, Game } from '../types'

export const TOTAL_POINTS = 162

export function computeRoundScores(round: Round): { team1: number; team2: number } {
  const { team1Points, team2Points, team1Announcements, team2Announcements, contractTeam, contractFailed, dix_de_der } = round

  let t1 = team1Points + team1Announcements
  let t2 = team2Points + team2Announcements

  if (dix_de_der === 1) t1 += 10
  else if (dix_de_der === 2) t2 += 10

  if (contractFailed && contractTeam === 1) {
    return { team1: 0, team2: TOTAL_POINTS + team2Announcements + team1Announcements + (dix_de_der ? 10 : 0) }
  }
  if (contractFailed && contractTeam === 2) {
    return { team1: TOTAL_POINTS + team1Announcements + team2Announcements + (dix_de_der ? 10 : 0), team2: 0 }
  }

  // Round to nearest 10
  return {
    team1: Math.round(t1 / 10) * 10,
    team2: Math.round(t2 / 10) * 10,
  }
}

export function computeGameTotals(game: Pick<Game, 'rounds'>): { team1: number; team2: number } {
  return game.rounds.reduce(
    (acc, round) => {
      const scores = computeRoundScores(round)
      return { team1: acc.team1 + scores.team1, team2: acc.team2 + scores.team2 }
    },
    { team1: 0, team2: 0 }
  )
}
