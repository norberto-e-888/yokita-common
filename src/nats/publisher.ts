import { Stan } from 'node-nats-streaming'
import { Inject, Service } from 'typedi'
import { STANToken } from './constants'
import { Event } from './types'

@Service()
export default abstract class Publisher<T extends Event<T['subject'], any>> {
	@Inject(STANToken)
	private readonly stan: Stan
	abstract subject: T['subject']

	publish(data: T['data']): Promise<void> {
		return new Promise((resolve, reject) => {
			this.stan.publish(this.subject as string, JSON.stringify(data), (err) => {
				if (err) {
					return reject(err)
				}

				resolve()
			})
		})
	}
}
