import { NextFunction, Request, Response } from 'express'
import { Document } from 'mongoose'
import { Service } from 'typedi'
import { GenericRepository } from '.'

@Service()
export default class GenericController<
	Repository extends GenericRepository<Document, unknown & { id: string }>
> {
	readonly repository: Repository
	constructor(repository: Repository) {
		this.repository = repository
		this.handleTest = this.handleTest.bind(this)
	}

	async handleTest(_: Request, res: Response, next: NextFunction) {
		try {
			const a = await this.repository.create<any>(
				{
					name: { first: 'name', last: 'last', middle: 'middle' },
					email: 'test@test.com',
					password: 'test1234',
				},
				{ returnPlainObject: false }
			)

			const t = await this.repository.findById(a.id)
			return res.json({ t, a })
		} catch (error) {
			return next(error)
		}
	}
}
