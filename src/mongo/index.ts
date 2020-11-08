import { Document, HookNextFunction, UpdateQuery } from 'mongoose'

export async function handlePreFindOneAndUpdateVersionIncrement(
	this: UpdateQuery<Document>,
	next: HookNextFunction
) {
	const update = this.getUpdate()
	if (update.version !== null) {
		delete update.version
	}

	const keys = ['$set', '$setOnInsert']
	for (const key of keys) {
		if (update[key] !== null && update[key].version !== null) {
			delete update[key].version
			if (Object.keys(update[key]).length === 0) {
				delete update[key]
			}
		}
	}

	update.$inc = update.$inc || {}
	update.$inc.version = 1
	next()
}
