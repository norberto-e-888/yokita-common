import {
	CreateQuery,
	Document,
	Model,
	QueryFindOneAndUpdateOptions,
	SaveOptions
} from 'mongoose'
import { FetchingResult } from '../generics/repository'
import { AppError, FetchPipelineBuilder, PipelineOptions } from '../util'

export const genericRepositoryFactory = <D extends Document, O = any>(
	deps: GenericFunctionalRepositoryDependencies<D>,
	opts: GenericFunctionalRepositoryOptions
) => {
	const create = async <DTO>(
		dto: CreateQuery<DTO>,
		{ returnPlainObject = false, nativeMongooseOptions }: CreateOptions
	): Promise<D | O> => {
		const doc = await deps.model.create<DTO>(dto, nativeMongooseOptions)
		return returnPlainObject ? (doc.toObject() as O) : doc
	}

	const fetch = async (
		query: any,
		opts?: PipelineOptions
	): Promise<FetchingResult<D>> => {
		const fetchPipelineBuilder = new FetchPipelineBuilder(query, opts)
		const [data] = ((await deps.model.aggregate(
			fetchPipelineBuilder.pipeline
		)) as unknown) as [FetchingResult<D>]

		return data
	}

	const findById = async (
		id: string,
		{
			failIfNotFound = true,
			limitToOwner = true,
			returnPlainObject = false,
			ownerProperty = 'user',
			ownerId
		}: FindByIdOptions = {
			failIfNotFound: true,
			limitToOwner: true,
			ownerProperty: 'user',
			returnPlainObject: false
		}
	): Promise<D | O | null> => {
		const doc =
			limitToOwner && ownerProperty && ownerId
				? await deps.model.findOne({ _id: id, [ownerProperty]: ownerId } as any)
				: await deps.model.findById(id)

		if (failIfNotFound && !doc) {
			throw new AppError(`No ${opts.documentNamePlular} was found`, 404)
		}

		return returnPlainObject && doc ? (doc.toObject() as O) : doc
	}

	const updateById = async (
		id: string,
		update: Partial<D>,
		{
			failIfNotFound = true,
			limitToOwner = true,
			returnPlainObject = false,
			nativeMongooseOptions = { new: true },
			ownerProperty = 'user',
			ownerId
		}: UpdateByIdOptions = {
			failIfNotFound: true,
			limitToOwner: true,
			ownerProperty: 'user',
			returnPlainObject: false,
			nativeMongooseOptions: { new: true }
		}
	) => {
		const doc =
			limitToOwner && ownerProperty && ownerId
				? await deps.model.findOneAndUpdate(
						{ _id: id, [ownerProperty]: ownerId } as any,
						update
				  )
				: await deps.model.findByIdAndUpdate(id, update, nativeMongooseOptions)

		if (failIfNotFound && !doc) {
			throw new AppError(`No ${opts.documentNameSingular} was found.`, 404)
		}

		return returnPlainObject ? (doc ? (doc.toObject() as O) : null) : doc
	}

	const deleteById = async (
		id: string,
		{
			failIfNotFound = true,
			limitToOwner = true,
			returnPlainObject = false,
			ownerProperty = 'user',
			ownerId
		}: DeleteByIdOptions = {
			failIfNotFound: true,
			limitToOwner: true,
			ownerProperty: 'user',
			returnPlainObject: false
		}
	) => {
		const doc =
			limitToOwner && ownerProperty && ownerId
				? await deps.model.findOneAndDelete({
						_id: id,
						[ownerProperty]: ownerId
				  } as any)
				: await deps.model.findByIdAndDelete(id)

		if (failIfNotFound && !doc) {
			throw new AppError(`No ${opts.documentNameSingular} was found.`, 404)
		}

		return returnPlainObject && doc ? (doc.toObject() as O) : doc
	}

	return { create, fetch, findById, updateById, deleteById }
}

export interface GenericFunctionalRepositoryDependencies<D extends Document> {
	model: Model<D>
}

export interface GenericFunctionalRepositoryOptions {
	documentNameSingular: string
	documentNamePlular?: string
}

export type CreateOptions = {
	returnPlainObject?: boolean
	nativeMongooseOptions?: SaveOptions
}

export type FindByIdOptions = CommonActionByIdOptions
export type UpdateByIdOptions = CommonActionByIdOptions & {
	nativeMongooseOptions: QueryFindOneAndUpdateOptions
}

export type DeleteByIdOptions = CommonActionByIdOptions
interface CommonActionByIdOptions {
	failIfNotFound?: boolean
	limitToOwner?: boolean
	ownerProperty?: string | number | symbol
	ownerId?: string
	returnPlainObject?: boolean
}

export type GenericFunctionalRepository = ReturnType<
	typeof genericRepositoryFactory
>
