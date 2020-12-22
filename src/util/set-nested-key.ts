export default (obj: any, path: string[], val: any) => {
	const lastKey = path.pop() as string
	const lastObj = path.reduce((obj, key) => (obj[key] = obj[key] || {}), obj)
	lastObj[lastKey] = val
	return obj
}
