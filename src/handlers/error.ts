import { Request, Response, NextFunction } from 'express'
import { AppError, normalizeResponse } from '../util'

export default (error: AppError, _: Request, res: Response, __: NextFunction) =>
	res.status(error.statusCode || 500).json(
		normalizeResponse({
			message: error.error || error.message || 'Something went wrong.',
			isError: true,
			isValidationError: !!error.validationErrors,
			errors: error.validationErrors,
		})
	)
