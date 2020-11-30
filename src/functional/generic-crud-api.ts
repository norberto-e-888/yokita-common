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
	opts: GenericCrudApiOptions
): Router => {
	const router = Router()
	router
		.route('/')
		.post(deps.controller.handleCreate(opts.create))
		.get(deps.controller.handleFetch(opts.fetch))

	router
		.route('/id')
		.get(deps.controller.handleFindById(opts.findById))
		.patch(deps.controller.handleUpdateById(opts.updateById))
		.delete(deps.controller.handleDeleteById(opts.deleteById))

	return router
}

export interface GenericCrudApiDependencies {
	controller: GenericFunctionalController
}

export interface GenericCrudApiOptions {
	create: CreateOptions
	fetch: PipelineOptions
	findById: FindByIdOptions
	updateById: UpdateByIdOptions
	deleteById: DeleteByIdOptions
}
