import { Stan } from 'node-nats-streaming'
import { Inject, Service } from 'typedi'
import { STANToken } from './constants'
import { Event } from './types'

@Service()
export default abstract class Publisher<D> {
	@Inject(STANToken)
	private readonly stan: Stan

	publish(subject: string, data: D): Promise<void> {
		return new Promise((resolve, reject) => {
			this.stan.publish(subject as string, JSON.stringify(data), (err) => {
				if (err) {
					return reject(err)
				}

				resolve()
			})
		})
	}
}
