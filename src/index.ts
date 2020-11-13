import { Token } from 'typedi'
export * from './generics'
export * from './handlers'
export * from './middleware'
export * from './mongo'
export * from './nats'
export * from './util'
export const natsQueueGroupNameToken = new Token<string>('QueueGroupName')
