export default (object: any, ...propertiesToRemove: string[]): void => {
	propertiesToRemove.forEach((prop) => {
		Reflect.deleteProperty(object, prop)
	})
}
