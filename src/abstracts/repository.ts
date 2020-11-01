import { Document, Model } from 'mongoose'
import Container, { Inject, Service, Token } from 'typedi'
import { AppError, capitalize } from '../util'

@Service()
export default abstract class AbstractRepository<D extends Document> {
	private model: Model<D>
	readonly documentNameSingular: string
	readonly documentNamePlular: string
	constructor(
		ModelToken: Token<any>,
		documentNameSingular: string,
		documentNamePlular?: string
	) {
		this.model = Container.get(ModelToken) as Model<D>
		this.documentNameSingular = documentNameSingular.toLocaleLowerCase()
		this.documentNamePlular = documentNamePlular
			? documentNamePlular
			: `${documentNameSingular.toLocaleLowerCase()}s`
	}

	test() {
		console.log(this.documentNameSingular, 'am I defined?')
	}

	async findById(
		id: string,
		{ failIfNotFound = true }: FindByIdOptions
	): Promise<D | null> {
		const document = await this.model.findById(id)
		if (failIfNotFound && !document) {
			throw new AppError(
				`No ${capitalize(this.documentNameSingular)} was found of ID ${id}`,
				404
			)
		}

		return document
	}
}

export interface FindByIdOptions {
	failIfNotFound?: boolean
}
