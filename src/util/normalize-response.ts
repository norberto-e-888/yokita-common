interface IOptions {
	data?: any
	status?: number
	message?: string
	isError?: boolean
	isValidationError?: boolean
	errors?: { [key: string]: string }
}

export default ({
	data,
	status = 200,
	message = 'Ok.',
	isError = false,
	isValidationError = false,
	errors,
}: IOptions) => ({
	data,
	status:
		(isError || isValidationError) &&
		(status.toString().charAt(0) !== '4' ||
			status.toString().charAt(0) !== '5') &&
		status.toString().length !== 3
			? 500
			: isValidationError
			? 400
			: status,
	message,
	isError: isValidationError ? true : isError,
	isValidationError: isError ? isValidationError : undefined,
	errors,
})
