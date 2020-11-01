import { NextFunction, Request, Response } from 'express'
import { ObjectSchema } from 'joi'
import { AppError } from '../util'
import { IValidationErrors } from '../util/app-error'

export default (
	schema: ObjectSchema,
	propertyToValidate: 'body' | 'query' | 'params'
) => (req: Request, _: Response, next: NextFunction) => {
	const result = schema.validate(req[propertyToValidate], { abortEarly: false })
	if (result.error) {
		const errors: IValidationErrors = {}
		result.error.details.forEach((detail) => {
			if (detail.context?.key) {
				errors[detail.context.key] = detail.message
			}
		})

		return next(
			new AppError(
				result.error.details.length > 1
					? 'There were validation errors'
					: 'There was a validation error',
				400,
				errors
			)
		)
	}

	next()
}
