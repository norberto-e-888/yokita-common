export default (s: string) =>
	s
		.split(' ')
		.filter((c) => !!c)
		.map((c) => c.charAt(0).toLocaleUpperCase())
		.join('')
