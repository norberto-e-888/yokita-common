import { ValidationChain, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { normalizeResponse } from '../util'

export default (validationChain: ValidationChain[]) => async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<Response | void> => {
	const validationPromises = validationChain.map((v) => v.run(req))
	await Promise.all(validationPromises)
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const errorsArray = errors.array()
		return res.status(400).json(
			normalizeResponse({
				status: 400,
				message:
					errorsArray.length > 1
						? 'There were validation errors.'
						: 'There was a validation error.',
				isError: true,
				isValidationError: true,
				errors: errorsArray.reduce(
					(acc, curr) => ({
						...acc,
						[curr.param]: curr.msg,
					}),
					{}
				),
			})
		)
	}

	next()
}
