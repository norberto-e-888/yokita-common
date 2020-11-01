import { Request, Response } from 'express'
import { normalizeResponse } from '../util'

export default (req: Request, res: Response) =>
	res.status(404).json(
		normalizeResponse({
			message: `${req.method.toUpperCase()} "${
				req.originalUrl
			}" does not exist on this server.`,
			isError: true,
		})
	)
