import Container from 'typedi'
import { NATSSubscriber } from '../nats'

export default (subscribers: ListenAllIterable) => {
	Object.values(subscribers).forEach((x) => {
		// @ts-ignore
		Container.get(x).listen()
	})
}

export type ListenAllIterable =
	| {
			[key: string]: NATSSubscriber<any>
	  }
	| ArrayLike<NATSSubscriber<any>>
