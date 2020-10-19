export enum Subject {
	TicketCreated = 'ticket:created',
	TicketUpdated = 'ticket:updated',
	OrderCreated = 'order:created',
	OrderCancelled = 'order:cancelled',
}

export interface Event<S, D> {
	subject: S
	data: D
}

export interface TicketCreatedEvent {
	subject: Subject.TicketCreated
	data: {
		id: string
		title: string
		price: number
		user: string
	}
}

export interface TicketUpdatedEvent {
	subject: Subject.TicketUpdated
	data: {
		id: string
		title: string
		price: number
		user: string
	}
}

export interface OrderCreatedEvent {
	subject: Subject.OrderCreated
	data: {
		id: string
		status: any
		user: string
		expiresAt: string
		ticket: {
			id: string
			price: number
		}
	}
}

export interface OrderCancelledEvent
	extends Event<
		Subject.OrderCancelled,
		{
			id: string
			status: any
			user: string
			expiresAt: string
			ticket: {
				id: string
				price: number
			}
		}
	> {}
