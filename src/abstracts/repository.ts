import { Document, Model } from 'mongoose'
import Container, { Inject, Service, Token } from 'typedi'

@Service()
export default class AbstractRepository<D extends Document> {
	private model: Model<D>
	constructor(ModelToken: Token<any>) {
		this.model = Container.get(ModelToken) as Model<D>
	}

	test() {
		console.log(this.model.name, 'am I defined?')
	}
}
