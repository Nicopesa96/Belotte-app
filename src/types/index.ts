export interface Player {
  id: string
  name: string
  avatar?: string
  createdAt: number
}

export interface Round {
  id: number
  team1Points: number
  team2Points: number
  team1Announcements: number
  team2Announcements: number
  contractTeam: 1 | 2 | null
  contractFailed: boolean
  dix_de_der: 1 | 2 | null
}

export interface Game {
  id: string
  date: number
  team1: [string, string]
  team2: [string, string]
  dealerPlayerId: string
  rounds: Round[]
  team1Total: number
  team2Total: number
  winner: 1 | 2 | null
  finished: boolean
  targetScore: number
}
