import { Token } from 'typedi'

export const NatsContainerTokens = {
	Client: new Token('NATS-Client'),
	Publisher: new Token('NATS-Publisher'),
	Subscriber: new Token('NATS-Subscriber'),
}
