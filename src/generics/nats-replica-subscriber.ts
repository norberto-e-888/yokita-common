import { Document, Model } from 'mongoose'
import { Message } from 'node-nats-streaming'
import Container, { Service, Token } from 'typedi'
import { Event, NATSSubscriber } from '../nats'

@Service()
export class GenericReplicaNATSSubscriber<
	S,
	D extends Document,
	M extends Model<D>
> extends NATSSubscriber<Event<S, D>> {
	readonly subject: S
	readonly type: GenericReplicaNATSSubscriberType
	readonly queueGroupName: string
	readonly model: M

	constructor(options: GenericReplicaNATSSubscriberOptions<S, D, M>) {
		super()
		this.subject = options.subject
		this.type = options.type
		this.queueGroupName = options.queueGroupName
		this.model = Container.get(options.modelToken)
	}

	async onMessage(data: D, msg: Message): Promise<void> {
		try {
			console.log('EVENT RECEIVED', this.subject)
			console.log('DATA', data)
			if (this.type === 'create') {
				console.log('REPLICATING DATA')
				await this.model.create<any>(data)
				return msg.ack()
			}

			if (this.type === 'update') {
				const docToUpdate = await this.model.findById(data.id)
				if (!docToUpdate) {
					throw Error(
						`Corrupt service model replica, no document found with id ${data.id}`
					)
				}

				await docToUpdate.set(data).save()
				return msg.ack()
			}

			if (this.type === 'delete') {
				const deletedDoc = await this.model.findByIdAndDelete(data.id)
				if (!deletedDoc) {
					throw Error(
						`Corrupt service model replica, no document found with id ${data.id}`
					)
				}

				return msg.ack()
			}

			throw Error(`Invalid GenericReplicaNATSSubscriber type: ${this.type}`)
		} catch (error) {
			console.error(error)
		}
	}
}

export interface GenericReplicaNATSSubscriberOptions<
	S,
	D extends Document,
	M extends Model<D>
> {
	subject: S
	type: GenericReplicaNATSSubscriberType
	modelToken: Token<M>
	queueGroupName: string
}

export type GenericReplicaNATSSubscriberType = 'create' | 'update' | 'delete'
