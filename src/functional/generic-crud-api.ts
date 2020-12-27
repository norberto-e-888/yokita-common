import { Router, Handler } from 'express'
import {
	CreateOptions,
	DeleteByIdOptions,
	FindByIdOptions,
	UpdateByIdOptions
} from '../generics/repository'
import { PipelineOptions } from '../util'
import { GenericFunctionalController } from './generic-controller'

export const genericCrudApiFactory = (
	deps: GenericCrudApiDependencies,
	{
		createOptions: { middleware: createMiddleware = [], ...createOptions } = {
			returnPlainObject: true
		},
		fetchOptions: { middleware: fetchMiddleware = [], ...fetchOptions } = {
			middleware: []
		},
		findByIdOptions: {
			middleware: findByIdMiddleware = [],
			...findByIdOptions
		} = { returnPlainObject: true },
		updateByIdOptions: {
			middleware: updateByIdMiddleware = [],
			...updateByIdOptions
		} = {
			returnPlainObject: true,
			nativeMongooseOptions: { new: true }
		},
		deleteByIdOptions: {
			middleware: deleteMiddleware = [],
			...deleteByIdOptions
		} = {
			returnPlainObject: true
		}
	}: GenericCrudApiOptions = {
		createOptions: { returnPlainObject: true },
		findByIdOptions: { returnPlainObject: true },
		updateByIdOptions: {
			returnPlainObject: true,
			nativeMongooseOptions: { new: true }
		},
		deleteByIdOptions: { returnPlainObject: true }
	}
): Router => {
	const router = Router()
	router
		.route('/')
		.post(createMiddleware, deps.controller.handleCreate(createOptions))
		.get(fetchMiddleware, deps.controller.handleFetch(fetchOptions))

	router
		.route('/:id')
		.get(findByIdMiddleware, deps.controller.handleFindById(findByIdOptions))
		.patch(
			updateByIdMiddleware,
			deps.controller.handleUpdateById(updateByIdOptions)
		)
		.delete(
			deleteMiddleware,
			deps.controller.handleDeleteById(deleteByIdOptions)
		)

	return router
}

export interface GenericCrudApiDependencies {
	controller: GenericFunctionalController
}

export interface GenericCrudApiOptions {
	createOptions?: CreateOptions & MiddlewareOption
	fetchOptions?: PipelineOptions & MiddlewareOption
	findByIdOptions?: FindByIdOptions & MiddlewareOption
	updateByIdOptions?: UpdateByIdOptions & MiddlewareOption
	deleteByIdOptions?: DeleteByIdOptions & MiddlewareOption
}

export type GenericCrudApi = ReturnType<typeof genericCrudApiFactory>
type MiddlewareOption = { middleware?: Handler[] }
