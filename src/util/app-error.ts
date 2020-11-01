export default class AppError extends Error {
	error: string
	statusCode: number
	validationErrors?: IValidationErrors
	constructor(
		error: string,
		statusCode: number,
		validationErrors?: IValidationErrors
	) {
		super(error)
		this.statusCode = statusCode
		this.error = error
		this.validationErrors = validationErrors
		Error.captureStackTrace(this, this.constructor)
	}
}

export interface IValidationErrors {
	[key: string]: string
}
