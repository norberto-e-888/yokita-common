import { Document, Model } from 'mongoose'
import { Inject, Service } from 'typedi'
import { ModelToken } from '.'

@Service()
export default class AbstractRepository<D extends Document> {
	@Inject(ModelToken)
	private readonly model: Model<D>

	test() {
		console.log(this.model.name, 'am I defined?')
	}
}
