import { Document, HookNextFunction, UpdateQuery } from 'mongoose'

export function handlePreFindOneAndUpdateVersionIncrement(
	this: UpdateQuery<Document>,
	versionKey: string
) {
	return (next: HookNextFunction) => {
		const update = this.getUpdate()
		if (update[versionKey] !== null) {
			delete update[versionKey]
		}

		const keys = ['$set', '$setOnInsert']
		for (const key of keys) {
			if (update[key] !== null && update[key][versionKey] !== null) {
				delete update[key][versionKey]
				if (Object.keys(update[key]).length === 0) {
					delete update[key]
				}
			}
		}

		update.$inc = update.$inc || {}
		update.$inc[versionKey] = 1
		next()
	}
}
