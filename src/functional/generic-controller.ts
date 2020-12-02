import { NextFunction, Request, Response } from 'express'
import {
	CreateOptions,
	DeleteByIdOptions,
	FindByIdOptions,
	UpdateByIdOptions,
	CommonActionByIdOptions
} from '../generics/repository'
import { PipelineOptions } from '../util'
import { GenericFunctionalRepository } from './generic-repository'

export const genericControllerFactory = (
	deps: GenericFunctionalControllerDependencies,
	{ userProperty = 'user' }: GenericFunctionalControllerOptions = {
		userProperty: 'user'
	}
) => {
	const handleCreate = (opts: CreateOptions) => async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const doc = await deps.repository.create(req.body, opts)
			return res.status(201).json(doc)
		} catch (error) {
			return next(error)
		}
	}

	const handleFetch = (opts?: PipelineOptions) => async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const data = await deps.repository.fetch(req.query, opts)
			return res.json(data)
		} catch (error) {
			return next(error)
		}
	}

	const handleFindById = (opts: FindByIdOptions) => async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const optionsExtension: Pick<CommonActionByIdOptions, 'ownerId'> = {
				ownerId: req[userProperty].id
			}

			const document = await deps.repository.findById(
				req.params.id,
				Object.assign(opts, optionsExtension)
			)
			return res.json(document)
		} catch (error) {
			return next(error)
		}
	}

	const handleUpdateById = (opts: UpdateByIdOptions) => async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const optionsExtension: Pick<CommonActionByIdOptions, 'ownerId'> = {
				ownerId: req[userProperty].id
			}

			const document = await deps.repository.updateById(
				req.params.id,
				req.body,
				Object.assign(opts, optionsExtension)
			)

			return res.json(document)
		} catch (error) {
			return next(error)
		}
	}

	const handleDeleteById = (opts: DeleteByIdOptions) => async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const optionsExtension: Pick<CommonActionByIdOptions, 'ownerId'> = {
				ownerId: req[userProperty].id
			}

			const document = await deps.repository.deleteById(
				req.params.id,
				Object.assign(opts, optionsExtension)
			)
			return res.json(document)
		} catch (error) {
			return next(error)
		}
	}

	return {
		handleCreate,
		handleFetch,
		handleFindById,
		handleUpdateById,
		handleDeleteById
	}
}

export interface GenericFunctionalControllerDependencies {
	repository: GenericFunctionalRepository
}

export interface GenericFunctionalControllerOptions {
	userProperty?: string
}

export type GenericFunctionalController = ReturnType<
	typeof genericControllerFactory
>
