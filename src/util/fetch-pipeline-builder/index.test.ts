import { Types } from 'mongoose'
import { LookupOption, LookupStage, UnwindStage } from '.'
import { FetchPipelineBuilder } from '..'

describe('FetchPipelineBuilder', () => {
	it('Builds a match object parseable by Mongo and uses it to create a $match stage as the first stage of the pipeline', () => {
		const builder = new FetchPipelineBuilder({
			match: {
				a: 1,
				'b.c': { gte: 100 },
				c: 'test',
				d: { ne: 'hello' },
				f: { nin: [1, 2, 3] }
			}
		})

		const [{ $match }] = builder.pipeline
		expect($match.a).toBe(1)
		expect($match['b.c']).toEqual({ $gte: 100 })
		expect($match.c).toBe('test')
		expect($match.d).toEqual({ $ne: 'hello' })
		expect($match.f).toEqual({ $nin: [1, 2, 3] })
	})

	it('Adds a $text: {$search} operation to $match when the textSearch option is passed', () => {
		const builder = new FetchPipelineBuilder({
			textSearch: 'someText'
		})

		const [{ $match }] = builder.pipeline
		expect($match.$text).toEqual({ $search: 'someText' })
	})

	it('Adds a key to $match using the time option', () => {
		const from = new Date(Date.now() - 500000)
		const to = new Date(Date.now() + 500000)
		const builder = new FetchPipelineBuilder({
			time: { from, to, field: 'dateField' }
		})

		const [{ $match }] = builder.pipeline
		expect($match.dateField.$gte).toEqual(from)
		expect($match.dateField.$lte).toEqual(to)
	})

	it('Builds a sort object parseable by Mongo and uses it as first stage of the "data" sub-pipeline of the $facet stage', () => {
		const builder = new FetchPipelineBuilder({
			sort: '-a,b,-c,d.e'
		})

		const [
			,
			{
				$facet: {
					data: [{ $sort }]
				}
			}
		] = builder.pipeline

		expect($sort['a']).toBe(-1)
		expect($sort['b']).toBe(1)
		expect($sort['c']).toBe(-1)
		expect($sort['d.e']).toBe(1)
	})

	it('Derives $skip and $limit stages from the paginate option as second and third stages, respectively, of the "data" sub-pipeline of the $facet stage "data" field', () => {
		const builder = new FetchPipelineBuilder({
			paginate: {
				page: '3',
				pageSize: '25'
			}
		})

		const [
			,
			{
				$facet: {
					data: [, { $skip }, { $limit }]
				}
			}
		] = builder.pipeline

		expect($skip).toBe(50)
		expect($limit).toBe(25)
	})

	it('Adds a $lookup stage per lookup option at the beginning of the pipeline when the performLookupsPreMatch option is true, with an adjacent subsequent $unwind stage when the justOne option is true', () => {
		const lookupOption1: LookupOption = {
			localField: 'local',
			foreignField: 'foreign',
			as: 'localAlias',
			from: 'collection',
			justOne: true
		}

		const lookupOption2: LookupOption = {
			localField: 'local2',
			foreignField: 'foreign2',
			as: 'localAlias2',
			from: 'collection2',
			justOne: true
		}

		const lookupOption3: LookupOption = {
			localField: 'local3',
			foreignField: 'foreign3',
			as: 'localAlias3',
			from: 'collection3',
			justOne: true
		}

		const builder = new FetchPipelineBuilder(
			{},
			{
				lookup: [lookupOption1, lookupOption2, lookupOption3],
				performLookupsPreMatch: true
			}
		)

		const [
			lookup1,
			unwind1,
			lookup2,
			unwind2,
			lookup3,
			unwind3
		] = builder.pipeline

		expect((lookup1 as LookupStage).$lookup).toEqual({
			...lookupOption1,
			justOne: undefined
		})

		expect((lookup2 as LookupStage).$lookup).toEqual({
			...lookupOption2,
			justOne: undefined
		})

		expect((lookup3 as LookupStage).$lookup).toEqual({
			...lookupOption3,
			justOne: undefined
		})

		expect((unwind1 as UnwindStage).$unwind.path).toBe('$' + lookupOption1.as)
		expect((unwind2 as UnwindStage).$unwind.path).toBe('$' + lookupOption2.as)
		expect((unwind3 as UnwindStage).$unwind.path).toBe('$' + lookupOption3.as)
	})

	it('Adds a $lookup stage per lookup option at the beginning of the pipeline when the performLookupsPreMatch option is true, without an $unwind stage when the justOne option is false', () => {
		const lookupOption1: LookupOption = {
			localField: 'local',
			foreignField: 'foreign',
			as: 'localAlias',
			from: 'collection',
			justOne: false
		}

		const lookupOption2: LookupOption = {
			localField: 'local2',
			foreignField: 'foreign2',
			as: 'localAlias2',
			from: 'collection2',
			justOne: false
		}

		const lookupOption3: LookupOption = {
			localField: 'local3',
			foreignField: 'foreign3',
			as: 'localAlias3',
			from: 'collection3',
			justOne: false
		}

		const builder = new FetchPipelineBuilder(
			{},
			{
				lookup: [lookupOption1, lookupOption2, lookupOption3],
				performLookupsPreMatch: true
			}
		)

		const [lookup1, lookup2, lookup3] = builder.pipeline
		expect((lookup1 as LookupStage).$lookup).toEqual({
			...lookupOption1,
			justOne: undefined
		})

		expect((lookup2 as LookupStage).$lookup).toEqual({
			...lookupOption2,
			justOne: undefined
		})

		expect((lookup3 as LookupStage).$lookup).toEqual({
			...lookupOption3,
			justOne: undefined
		})
	})

	it('Converts values of $match according to the convert options', () => {
		const builder = new FetchPipelineBuilder(
			{
				match: {
					a: 1,
					b: '200',
					c: new Types.ObjectId().toHexString(),
					d: new Types.ObjectId().toHexString(),
					e: '500',
					f: 2,
					g: '',
					h: 'true',
					i: 'all-non-empty-strings-will-be-converted-to-true',
					hello: {
						nested: '10',
						preserved: 'preserved',
						world: {
							sonested: '25'
						}
					}
				}
			},
			{
				convert: [
					{ keys: 'a,f', to: 'string' },
					{ keys: 'b,e', to: 'number' },
					{ keys: 'c,d', to: 'objectId' },
					{ keys: 'g,h,i', to: 'boolean' },
					{ keys: 'hello.nested,hello.world.sonested', to: 'number' }
				]
			}
		)

		const [{ $match }] = builder.pipeline
		expect(typeof $match.a).toBe('string')
		expect(typeof $match.b).toBe('number')
		expect(Types.ObjectId.isValid($match.c.toHexString())).toBeTruthy()
		expect(Types.ObjectId.isValid($match.d.toHexString())).toBeTruthy()
		expect(typeof $match.e).toBe('number')
		expect(typeof $match.f).toBe('string')
		expect($match.g).toBe(false)
		expect($match.h).toBe(true)
		expect($match.i).toBe(true)
		expect(typeof $match.hello.nested).toBe('number')
		expect(typeof $match.hello.world.sonested).toBe('number')
		expect($match.hello.preserved).toBe('preserved')
	})

	it('Adds a final $unwind stage to unwind $count', () => {
		const builder = new FetchPipelineBuilder()
		const [, , { $unwind }] = builder.pipeline
		expect($unwind).toBe('$count')
	})
})
