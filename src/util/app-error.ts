export default class AppError extends Error {
	error: string
	statusCode: number
	isValidationError: boolean
	constructor(error: string, statusCode: number, isValidationError = false) {
		super(error)
		this.statusCode = statusCode
		this.error = error
		this.isValidationError = isValidationError
		Error.captureStackTrace(this, this.constructor)
	}
}
