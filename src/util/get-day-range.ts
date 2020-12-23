export default (date: Date) => {
	const from = new Date(date.setUTCHours(0, 0, 0, 0))
	const to = new Date(date.setUTCHours(23, 59, 59, 999))
	return {
		from,
		to
	}
}
