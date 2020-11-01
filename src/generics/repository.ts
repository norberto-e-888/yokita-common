import { Document, Model } from 'mongoose'
import Container, { Service, Token } from 'typedi'
import { AppError } from '../util'

@Service()
export default class GenericRepository<D extends Document> {
	private model: Model<D>
	readonly documentNameSingular: string
	readonly documentNamePlular: string
	constructor(
		ModelToken: Token<any>,
		{
			documentNameSingular,
			documentNamePlular,
		}: GenericRepositoryConstructorOptions
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
		{ failIfNotFound = true }: FindByIdOptions = { failIfNotFound: true }
	): Promise<D | null> {
		const document = await this.model.findById(id)
		if (failIfNotFound && !document) {
			throw new AppError(
				`No ${this.documentNameSingular} was found of ID ${id}`,
				404
			)
		}

		return document
	}
}

export type GenericRepositoryConstructorOptions = {
	documentNameSingular: string
	documentNamePlular: string
}

export type FindByIdOptions = {
	failIfNotFound?: boolean
}
