import { NextFunction, Request, Response } from 'express'
import { Document } from 'mongoose'
import { Service } from 'typedi'
import { GenericRepository } from '.'
import {
	CreateOptions,
	DeleteByIdOptions,
	FindByIdOptions,
	UpdateByIdOptions,
} from './repository'

@Service()
export default class GenericController<
	Repository extends GenericRepository<Document, unknown & { id: string }>
> {
	readonly repository: Repository
	constructor(repository: Repository) {
		this.repository = repository
	}

	async handleCreate(options: CreateOptions) {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const document = await this.repository.create(req.body, options)
				return res.status(201).json(document)
			} catch (error) {
				return next(error)
			}
		}
	}

	async handleFindById(options: FindByIdOptions) {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const document = await this.repository.findById(req.params.id, options)
				return res.json(document)
			} catch (error) {
				return next(error)
			}
		}
	}

	async handleUpdateById(options: UpdateByIdOptions) {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const document = await this.repository.updateById(
					req.params.id,
					req.body,
					options
				)

				return res.json(document)
			} catch (error) {
				return next(error)
			}
		}
	}

	async handleDeleteById(options: DeleteByIdOptions) {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const document = await this.repository.deleteById(
					req.params.id,
					options
				)

				return res.json(document)
			} catch (error) {
				return next(error)
			}
		}
	}
}
