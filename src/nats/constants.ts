import { Stan } from 'node-nats-streaming'
import { Token } from 'typedi'

export const STANToken = new Token<Stan>('STAN')
