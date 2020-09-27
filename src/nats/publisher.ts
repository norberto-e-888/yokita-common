import { Stan } from 'node-nats-streaming'
import { Event } from './types'

export default abstract class Publisher<T extends Event> {
	abstract readonly stan: Stan
	abstract subject: T['subject']

	publish(data: T['data']): Promise<void> {
		return new Promise((resolve, reject) => {
			this.stan.publish(this.subject, JSON.stringify(data), (err) => {
				if (err) {
					return reject(err)
				}

				console.log('Event published to subject', this.subject)
				resolve()
			})
		})
	}
}
