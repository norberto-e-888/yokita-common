import { CreateQuery, Document, Model, SaveOptions, Types } from 'mongoose'
import Container, { Service, Token } from 'typedi'
import { AppError } from '../util'

@Service()
export default class GenericRepository<D extends Document, O = any> {
	readonly model: Model<D>
	readonly documentNameSingular: string
	readonly documentNamePlular: string
	constructor(
		ModelToken: Token<Model<D>>,
		{
			documentNameSingular,
			documentNamePlular,
		}: GenericRepositoryConstructorOptions
	) {
		this.model = Container.get(ModelToken)
		this.documentNameSingular = documentNameSingular.toLocaleLowerCase()
		this.documentNamePlular = documentNamePlular
			? documentNamePlular
			: `${documentNameSingular.toLocaleLowerCase()}s`
	}

	async create<DTO extends CreateQuery<any>>(
		dto: any,
		{ returnPlainObject = false, nativeMongooseOptions }: CreateOptions
	): Promise<D | O> {
		const document = await this.model.create<DTO>(dto, nativeMongooseOptions)
		return returnPlainObject ? (document.toObject() as O) : document
	}

	async findById(
		id: string,
		{
			failIfNotFound = true,
			limitToOwner = false,
			ownerProperty,
			ownerId,
			returnPlainObject = false,
		}: FindByIdOptions = {
			failIfNotFound: true,
			limitToOwner: false,
			returnPlainObject: false,
		}
	): Promise<D | O | null> {
		const document =
			limitToOwner && ownerProperty && ownerId
				? await this.model.findOne({ _id: id, [ownerProperty]: ownerId } as any)
				: await this.model.findById(id)

		if (failIfNotFound && !document) {
			throw new AppError(`No ${this.documentNameSingular} was found.`, 404)
		}

		return returnPlainObject
			? document
				? (document.toObject() as O)
				: null
			: document
	}

	async updateById(
		id: string,
		update: Partial<D>,
		{
			failIfNotFound = true,
			limitToOwner = false,
			ownerProperty,
			ownerId,
			returnPlainObject = false,
		}: UpdateByIdOptions = {
			failIfNotFound: true,
			limitToOwner: false,
			returnPlainObject: false,
		}
	): Promise<D | O | null> {
		const document =
			limitToOwner && ownerProperty && ownerId
				? await this.model.findOneAndUpdate(
						{ _id: id, [ownerProperty]: ownerId } as any,
						update
				  )
				: await this.model.findByIdAndUpdate(id, update)

		if (failIfNotFound && !document) {
			throw new AppError(`No ${this.documentNameSingular} was found.`, 404)
		}

		return returnPlainObject
			? document
				? (document.toObject() as O)
				: null
			: document
	}

	async deleteById(
		id: string,
		{
			failIfNotFound = true,
			limitToOwner = false,
			ownerProperty,
			ownerId,
			returnPlainObject = false,
		}: DeleteByIdOptions = {
			failIfNotFound: true,
			limitToOwner: false,
			returnPlainObject: false,
		}
	): Promise<D | O | null> {
		const document =
			limitToOwner && ownerProperty && ownerId
				? await this.model.findOneAndDelete({
						_id: id,
						[ownerProperty]: ownerId,
				  } as any)
				: await this.model.findByIdAndDelete(id)

		if (failIfNotFound && !document) {
			throw new AppError(`No ${this.documentNameSingular} was found.`, 404)
		}

		return returnPlainObject
			? document
				? (document.toObject() as O)
				: null
			: document
	}
}

export type GenericRepositoryConstructorOptions = {
	documentNameSingular: string
	documentNamePlular?: string
}

export type FindByIdOptions = {
	failIfNotFound?: boolean
	limitToOwner?: boolean
	ownerProperty?: string | number | symbol
	ownerId?: string
	returnPlainObject?: boolean
}

export type CreateOptions = {
	returnPlainObject?: boolean
	nativeMongooseOptions?: SaveOptions
}

export type UpdateByIdOptions = {
	failIfNotFound?: boolean
	limitToOwner?: boolean
	ownerProperty?: string | number | symbol
	ownerId?: string
	returnPlainObject?: boolean
}

export type DeleteByIdOptions = {
	failIfNotFound?: boolean
	limitToOwner?: boolean
	ownerProperty?: string | number | symbol
	ownerId?: string
	returnPlainObject?: boolean
}
