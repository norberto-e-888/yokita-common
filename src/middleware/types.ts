import { Request } from 'express'

export interface AuthenticatedRequest<T> extends Request {
	user?: T
}
