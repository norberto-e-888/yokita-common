import { NextFunction, Request, Response } from 'express'
import { Document } from 'mongoose'
import Container, { Service } from 'typedi'
import { GenericRepository } from '.'

@Service()
export default class GenericController<
	D extends Document,
	O extends { id: string },
	Repository extends GenericRepository<D, O>
> {
	readonly repository: Repository
	constructor(Repository: Repository) {
		this.repository = Container.get({ service: Repository })
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

			console.log('A', a)
			const t = await this.repository.findById(a.id)
			console.log('T', t)
			return res.json({ t, a })
		} catch (error) {
			return next(error)
		}
	}
}
