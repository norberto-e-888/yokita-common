import { Request } from 'express'
import { Document } from 'mongoose'

export interface AuthenticatedRequest<T extends Document> extends Request {
	user?: T
}
