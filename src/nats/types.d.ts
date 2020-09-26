export enum Subject {
	TicketCreated = 'ticket:created',
	TicketUpdated = 'ticket:updated',
}

export interface Event {
	subject: Subject
	data: any
}

export interface TicketCreatedEvent {
	subject: Subject.TicketCreated
	data: {
		id: string
		title: string
		price: number
		userId: string
	}
}

export interface TicketUpdatedEvent {
	subject: Subject.TicketUpdated
	data: {
		id: string
		title: string
		price: number
		userId: string
	}
}
