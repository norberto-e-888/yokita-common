interface IOptions {
	data?: any
	message?: string
	isError?: boolean
	isValidationError?: boolean
	errors?: { [key: string]: string }
}

export default ({
	data,
	message = 'Ok.',
	isError = false,
	isValidationError = false,
	errors,
}: IOptions) => ({
	data,
	message,
	isError: isValidationError ? true : isError,
	isValidationError: isError ? isValidationError : undefined,
	errors,
})
