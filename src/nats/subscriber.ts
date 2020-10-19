import { Message, Stan } from 'node-nats-streaming'
import { Inject, Service } from 'typedi'
import { NatsContainerTokens } from './constants'
import { Event, Subject } from './types'

@Service()
export default abstract class Subscriber<T extends Event<Subject, any>> {
	@Inject(NatsContainerTokens.Client)
	private readonly stan: Stan
	readonly subject: T['subject']
	abstract queueGroupName: string
	abstract onMessage(data: T['data'], msg: Message): void
	protected ackWait = 5 * 1000

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
			this.subject,
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
