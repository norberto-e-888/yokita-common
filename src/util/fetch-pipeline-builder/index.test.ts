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
				f: { nin: [1, 2, 3] },
			},
		})

		const [{ $match }] = builder.get()
		expect($match.a).toBe(1)
		expect($match['b.c']).toEqual({ $gte: 100 })
		expect($match.c).toBe('test')
		expect($match.d).toEqual({ $ne: 'hello' })
		expect($match.f).toEqual({ $nin: [1, 2, 3] })
	})

	it('Adds a $text operation to $match when "textSearch" is in the raw query', () => {
		const builder = new FetchPipelineBuilder({
			textSearch: 'someText',
		})

		const [{ $match }] = builder.get()
		expect($match.$text).toEqual({ $search: 'someText' })
	})

	it('Adds a key to $match using the time option', () => {
		const from = new Date(Date.now() - 500000)
		const to = new Date(Date.now() + 500000)
		const builder = new FetchPipelineBuilder({
			time: { from, to, field: 'dateField' },
		})

		const [{ $match }] = builder.get()
		expect($match.dateField.$gte).toEqual(from)
		expect($match.dateField.$lte).toEqual(to)
	})

	it('Builds a sort object parseable by Mongo and uses it as first stage of the "data" sub-pipeline of the $facet stage', () => {
		const builder = new FetchPipelineBuilder({
			sort: '-a,b,-c,d.e',
		})

		const [
			,
			{
				$facet: {
					data: [{ $sort }],
				},
			},
		] = builder.get()

		expect($sort['a']).toBe(-1)
		expect($sort['b']).toBe(1)
		expect($sort['c']).toBe(-1)
		expect($sort['d.e']).toBe(1)
	})

	it('Derives $skip and $limit stages from the "paginate" option as second and third stages, respectively, of the "data" sub-pipeline of the $facet stage "data" field', () => {
		const builder = new FetchPipelineBuilder({
			paginate: {
				page: '3',
				pageSize: '25',
			},
		})

		const [
			,
			{
				$facet: {
					data: [, { $skip }, { $limit }],
				},
			},
		] = builder.get()

		expect($skip).toBe(50)
		expect($limit).toBe(25)
	})

	it('Adds a $lookup stage per lookup option after the first 3 hard-coded stages of the $facet, data sub-pipeline, with a $unwind stage when the justOne option is true', () => {
		const builder = new FetchPipelineBuilder()
		const lookupOption1: LookupOption = {
			localField: 'local',
			foreignField: 'foreign',
			as: 'localAlias',
			from: 'collection',
			justOne: true,
		}

		const lookupOption2: LookupOption = {
			localField: 'local2',
			foreignField: 'foreign2',
			as: 'localAlias2',
			from: 'collection2',
			justOne: true,
		}

		const lookupOption3: LookupOption = {
			localField: 'local3',
			foreignField: 'foreign3',
			as: 'localAlias3',
			from: 'collection3',
			justOne: true,
		}

		const [
			,
			{
				$facet: {
					data: [, , , lookup1, unwind1, lookup2, unwind2, lookup3, unwind3],
				},
			},
		] = builder.get({
			lookup: [lookupOption1, lookupOption2, lookupOption3],
		})

		expect((lookup1 as LookupStage).$lookup).toEqual({
			...lookupOption1,
			justOne: undefined,
		})

		expect((lookup2 as LookupStage).$lookup).toEqual({
			...lookupOption2,
			justOne: undefined,
		})

		expect((lookup3 as LookupStage).$lookup).toEqual({
			...lookupOption3,
			justOne: undefined,
		})

		expect((unwind1 as UnwindStage).$unwind.path).toBe('$' + lookupOption1.as)
		expect((unwind2 as UnwindStage).$unwind.path).toBe('$' + lookupOption2.as)
		expect((unwind3 as UnwindStage).$unwind.path).toBe('$' + lookupOption3.as)
	})

	it('Adds a $lookup stage per lookup option after the first 3 hard-coded stages of the $facet, data sub-pipeline, without a $unwind stage when the justOne option is false', () => {
		const builder = new FetchPipelineBuilder()
		const lookupOption1: LookupOption = {
			localField: 'local',
			foreignField: 'foreign',
			as: 'localAlias',
			from: 'collection',
			justOne: false,
		}

		const lookupOption2: LookupOption = {
			localField: 'local2',
			foreignField: 'foreign2',
			as: 'localAlias2',
			from: 'collection2',
			justOne: false,
		}

		const lookupOption3: LookupOption = {
			localField: 'local3',
			foreignField: 'foreign3',
			as: 'localAlias3',
			from: 'collection3',
			justOne: false,
		}

		const [
			,
			{
				$facet: {
					data: [, , , lookup1, lookup2, lookup3],
				},
			},
		] = builder.get({
			lookup: [lookupOption1, lookupOption2, lookupOption3],
		})

		expect((lookup1 as LookupStage).$lookup).toEqual({
			...lookupOption1,
			justOne: undefined,
		})

		expect((lookup2 as LookupStage).$lookup).toEqual({
			...lookupOption2,
			justOne: undefined,
		})

		expect((lookup3 as LookupStage).$lookup).toEqual({
			...lookupOption3,
			justOne: undefined,
		})
	})

	it('Converts values of $match according to the passed options', () => {
		const builder = new FetchPipelineBuilder({
			match: {
				a: 1,
				b: '200',
				c: new Types.ObjectId().toHexString(),
				d: new Types.ObjectId().toHexString(),
				e: '500',
				f: 2,
			},
		})

		const [{ $match }] = builder.get({
			convert: [
				{ keys: 'a,f', to: 'string' },
				{ keys: 'b,e', to: 'number' },
				{ keys: 'c,d', to: 'objectID' },
			],
		})

		expect(typeof $match.a).toBe('string')
		expect(typeof $match.b).toBe('number')
		expect(Types.ObjectId.isValid($match.c.toHexString())).toBeTruthy()
		expect(Types.ObjectId.isValid($match.d.toHexString())).toBeTruthy()
		expect(typeof $match.e).toBe('number')
		expect(typeof $match.f).toBe('string')
	})

	it('Adds a third and final $unwind stage to unwind $count', () => {
		const builder = new FetchPipelineBuilder()
		const [, , { $unwind }] = builder.get()
		expect($unwind).toBe('$count')
	})
})
