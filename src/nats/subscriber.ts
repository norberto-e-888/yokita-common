import { Message, Stan } from 'node-nats-streaming'
import { Inject, Service } from 'typedi'
import { STANToken } from './constants'
import { Event } from './types'

@Service()
export default abstract class Subscriber<
	T extends Event<T['subject'], T['data']>
> {
	@Inject(STANToken)
	private readonly stan: Stan
	abstract subject: T['subject']
	abstract queueGroupName: string
	protected ackWait = 5 * 1000
	abstract onMessage(data: T['data'], msg: Message): void

	subscriptionOptions() {
		return this.stan
			.subscriptionOptions()
			.setDeliverAllAvailable()
			.setManualAckMode(true)
			.setAckWait(this.ackWait)
			.setDurableName(this.queueGroupName)
	}

	listen() {
		const subscription = this.stan.subscribe(
			this.subject as string,
			this.queueGroupName,
			this.subscriptionOptions()
		)

		subscription.on('message', (msg: Message) => {
			const parsedData = this.parseMessage(msg)
			this.onMessage(parsedData, msg)
		})
	}

	parseMessage(msg: Message) {
		const data = msg.getData()
		return typeof data === 'string'
			? JSON.parse(data)
			: JSON.parse(data.toString('utf8'))
	}
}
