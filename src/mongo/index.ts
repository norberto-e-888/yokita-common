import {
	Document,
	DocumentQuery,
	HookNextFunction,
	Model,
	SchemaDefinition,
	SchemaOptions,
	SchemaTypeOpts,
	Types,
	UpdateQuery
} from 'mongoose'

export function handlePreFindOneAndUpdateVersionIncrement(versionKey: string) {
	return function (this: UpdateQuery<Document>, next: HookNextFunction) {
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

export const modelCommonSchemaOptions: SchemaOptions = {
	id: true,
	toObject: {
		virtuals: true,
		getters: true
	},
	timestamps: {
		createdAt: 'timestamps.createdAt',
		updatedAt: 'timestamps.updatedAt'
	}
}

export type MongooseInstanceHook<D extends Document> = (
	this: D,
	next: HookNextFunction
) => Promise<void>

export type MongooseStaticHook<D extends Document> = (
	this: Model<D>,
	next: HookNextFunction
) => Promise<void>

export type MongooseQueryHook<D extends Document> = (
	this: DocumentQuery<any, D>,
	next: HookNextFunction
) => Promise<void>

export interface Timestamps {
	createdAt: Date
	updatedAt: Date
}

export type DocumentReference = Types.ObjectId | string

export interface CommonProperties {
	_id: DocumentReference
	id: string
	__v: number
	timestamps: Timestamps
}

export type MongooseSchemaDefinition<T> = {
	[K in keyof Required<Omit<T, keyof CommonProperties>>]:
		| SchemaDefinition
		| SchemaTypeOpts<any>
}

export type MongooseSchemaIndex<T> = {
	[K in keyof Partial<Omit<T, keyof CommonProperties>>]: string | number
}
