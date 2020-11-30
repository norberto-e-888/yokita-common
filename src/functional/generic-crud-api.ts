import { Router } from 'express'
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
		createOptions = { returnPlainObject: true },
		fetchOptions,
		findByIdOptions = { returnPlainObject: true },
		updateByIdOptions = {
			returnPlainObject: true,
			nativeMongooseOptions: { new: true }
		},
		deleteByIdOptions = { returnPlainObject: true }
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
		.post(deps.controller.handleCreate(createOptions))
		.get(deps.controller.handleFetch(fetchOptions))

	router
		.route('/id')
		.get(deps.controller.handleFindById(findByIdOptions))
		.patch(deps.controller.handleUpdateById(updateByIdOptions))
		.delete(deps.controller.handleDeleteById(deleteByIdOptions))

	return router
}

export interface GenericCrudApiDependencies {
	controller: GenericFunctionalController
}

export interface GenericCrudApiOptions {
	createOptions: CreateOptions
	fetchOptions?: PipelineOptions
	findByIdOptions: FindByIdOptions
	updateByIdOptions: UpdateByIdOptions
	deleteByIdOptions: DeleteByIdOptions
}
