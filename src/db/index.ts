import Dexie, { type Table } from 'dexie'
import type { Player, Game } from '../types'

class BeloteDB extends Dexie {
  players!: Table<Player>
  games!: Table<Game>

  constructor() {
    super('BeloteDB')
    this.version(1).stores({
      players: 'id, name, createdAt',
      games: 'id, date, finished, *team1, *team2',
    })
  }
}

export const db = new BeloteDB()
