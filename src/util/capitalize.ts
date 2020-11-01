export default (s: string) =>
	`${s.charAt(0).toLocaleUpperCase()} ${s.slice(1).toLocaleLowerCase()}`
