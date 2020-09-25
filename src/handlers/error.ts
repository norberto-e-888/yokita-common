import { Request, Response, NextFunction } from 'express'
import { normalizeResponse } from '../util'

export default (error: any, _: Request, res: Response, __: NextFunction) => {
	console.error(error)
	return res.status(error.statusCode || 500).json(
		normalizeResponse({
			status: error.statusCode || 500,
			isError: true,
			isValidationError: !!error.isValidationError,
			message: error.error || error.message || 'Something went wrong.',
		})
	)
}
