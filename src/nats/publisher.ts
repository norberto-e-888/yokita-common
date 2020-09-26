import { Stan } from 'node-nats-streaming'
import { Inject, Service } from 'typedi'
import { NatsContainerTokens } from './constants'
import { Event } from './types'

@Service(NatsContainerTokens.Publisher)
export default abstract class Publisher<T extends Event> {
	@Inject(NatsContainerTokens.Client)
	private readonly client: Stan

	abstract subject: T['subject']

	publish(data: T['data']): Promise<void> {
		return new Promise((resolve, reject) => {
			this.client.publish(this.subject, JSON.stringify(data), (err) => {
				if (err) {
					return reject(err)
				}

				console.log('Event published to subject', this.subject)
				resolve()
			})
		})
	}
}
