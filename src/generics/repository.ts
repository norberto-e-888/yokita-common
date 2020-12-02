import {
	CreateQuery,
	Document,
	Model,
	QueryFindOneAndUpdateOptions,
	SaveOptions
} from 'mongoose'
import { Inject, Service } from 'typedi'
import Publisher from '../nats/publisher'
import { AppError, FetchPipelineBuilder } from '../util'
import { PipelineOptions } from '../util'

@Service()
export default class GenericRepository<D extends Document, O = any> {
	readonly model: Model<D>
	readonly documentNameSingular: string
	readonly documentNamePlular: string
	readonly natsSubjects: GenericRepositoryNatsSubject

	@Inject()
	private readonly publisher: Publisher<O>

	constructor(
		model: Model<D>,
		{
			documentNameSingular,
			documentNamePlular,
			natsSubjects = {}
		}: GenericRepositoryConstructorOptions
	) {
		this.model = model
		this.documentNameSingular = documentNameSingular.toLocaleLowerCase()
		this.documentNamePlular = documentNamePlular
			? documentNamePlular
			: `${documentNameSingular.toLocaleLowerCase()}s`

		this.natsSubjects = natsSubjects
	}

	async create<DTO>(
		dto: CreateQuery<DTO>,
		{ returnPlainObject = false, nativeMongooseOptions }: CreateOptions
	): Promise<D | O> {
		const document = await this.model.create<DTO>(dto, nativeMongooseOptions)
		if (this.natsSubjects.create) {
			await this.publisher.publish(
				this.natsSubjects.create,
				document.toObject()
			)
		}

		return returnPlainObject ? (document.toObject() as O) : document
	}

	async fetch(
		query: any,
		options?: PipelineOptions
	): Promise<FetchingResult<D>> {
		const fetchPipelineBuilder = new FetchPipelineBuilder(query, options)
		const [data] = ((await this.model.aggregate(
			fetchPipelineBuilder.pipeline
		)) as unknown) as [FetchingResult<D>]

		return data
	}

	async findById(
		id: string,
		{
			failIfNotFound = true,
			limitToOwner = false,
			ownerProperty,
			ownerId,
			returnPlainObject = false
		}: FindByIdOptions = {
			failIfNotFound: true,
			limitToOwner: false,
			returnPlainObject: false
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
			nativeMongooseOptions = { new: true }
		}: UpdateByIdOptions = {
			failIfNotFound: true,
			limitToOwner: false,
			returnPlainObject: false,
			nativeMongooseOptions: { new: true }
		}
	): Promise<D | O | null> {
		const document =
			limitToOwner && ownerProperty && ownerId
				? await this.model.findOneAndUpdate(
						{ _id: id, [ownerProperty]: ownerId } as any,
						update
				  )
				: await this.model.findByIdAndUpdate(id, update, nativeMongooseOptions)

		if (failIfNotFound && !document) {
			throw new AppError(`No ${this.documentNameSingular} was found.`, 404)
		}

		if (this.natsSubjects.update && document) {
			await this.publisher.publish(
				this.natsSubjects.update,
				document.toObject()
			)
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
			returnPlainObject = false
		}: DeleteByIdOptions = {
			failIfNotFound: true,
			limitToOwner: false,
			returnPlainObject: false
		}
	): Promise<D | O | null> {
		const document =
			limitToOwner && ownerProperty && ownerId
				? await this.model.findOneAndDelete({
						_id: id,
						[ownerProperty]: ownerId
				  } as any)
				: await this.model.findByIdAndDelete(id)

		if (failIfNotFound && !document) {
			throw new AppError(`No ${this.documentNameSingular} was found.`, 404)
		}

		if (this.natsSubjects.delete && document) {
			await this.publisher.publish(
				this.natsSubjects.delete,
				document.toObject()
			)
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
	natsSubjects?: GenericRepositoryNatsSubject
}

export type CreateOptions = {
	returnPlainObject?: boolean
	nativeMongooseOptions?: SaveOptions
}

export type GenericRepositoryNatsSubject = {
	create?: string
	update?: string
	delete?: string
}

export type FindByIdOptions = CommonActionByIdOptions
export type UpdateByIdOptions = CommonActionByIdOptions & {
	nativeMongooseOptions: QueryFindOneAndUpdateOptions
}

export type DeleteByIdOptions = CommonActionByIdOptions
export type FetchingResult<D> = {
	count: number
	items: D[]
}

export interface CommonActionByIdOptions {
	failIfNotFound?: boolean
	limitToOwner?: boolean
	ownerProperty?: string | number | symbol
	ownerId?: string
	returnPlainObject?: boolean
}
