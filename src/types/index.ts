export interface Session {
  id: string
  date: number
  name: string
  note: string | null
}

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
  dealer_player_id: string
  rounds: Round[]
  team1_total: number
  team2_total: number
  winner: 1 | 2 | null
  finished: boolean
  target_score: number
  session_id: string | null
}
