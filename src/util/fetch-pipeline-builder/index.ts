import { Types } from 'mongoose'

export default class {
	private mongoParseableQuery: MongoParseableQuery = {
		match: {},
		sort: {},
		paginate: {
			limit: 10,
			skip: 0
		}
	}

	private rawQuery: RawQuery = {}
	private convert: ConvertOption[]
	private lookup: LookUpOption[]
	private performLookupsPreMatch: boolean

	constructor(
		query?: RawQuery,
		{
			convert = [],
			lookup = [],
			performLookupsPreMatch = false
		}: PipelineOptions = {
			convert: [],
			lookup: [],
			performLookupsPreMatch: false
		}
	) {
		this.rawQuery.match = query?.match || {}
		this.rawQuery.time = query?.time
		this.rawQuery.sort = query?.sort || '-timestamps.createdAt'
		this.rawQuery.paginate = query?.paginate || { pageSize: '10', page: '1' }
		this.rawQuery.textSearch = query?.textSearch || undefined
		this.convert = convert
		this.lookup = lookup
		this.performLookupsPreMatch = performLookupsPreMatch
	}

	// ! Returning any while Pipeline type is broken
	public get pipeline(): any {
		this.buildMatch()
			.buildTime()
			.buildSort()
			.buildPaginate()
			.addTextSearchToMatch()
			.transformOperators()

		const lookups: (LookupStage | UnwindStage)[] = []
		this.lookup.forEach(({ from, localField, foreignField, as, justOne }) => {
			if (!justOne) {
				lookups.push({
					$lookup: {
						from,
						localField,
						foreignField,
						as
					}
				})
			} else {
				lookups.push(
					{
						$lookup: {
							from,
							localField,
							foreignField,
							as
						}
					},
					{
						$unwind: {
							path: `$${as}`,
							preserveNullAndEmptyArrays: true
						}
					}
				)
			}
		})

		return [
			...(this.performLookupsPreMatch ? lookups : []),
			{
				$match: this.mongoParseableQuery.match
			},
			{
				$facet: {
					count: [{ $count: 'total' }],
					data: [
						{ $sort: this.mongoParseableQuery.sort },
						{ $skip: this.mongoParseableQuery.paginate.skip },
						{ $limit: this.mongoParseableQuery.paginate.limit },
						...(!this.performLookupsPreMatch ? lookups : [])
					]
				}
			},
			{
				$unwind: '$count'
			}
		]
	}

	private buildMatch(): this {
		const mongoParseableMatch = Object.assign(this.rawQuery.match)
		if (this.convert.length) {
			Object.entries(mongoParseableMatch).forEach(([key, value]) => {
				const convertion = this.convert.find(({ keys }) => keys.includes(key))
				if (convertion) {
					let ClassToConverTo: any
					switch (convertion.to) {
						case 'number':
							ClassToConverTo = Number
							break

						case 'string':
							ClassToConverTo = String
							break

						case 'objectId':
							ClassToConverTo = Types.ObjectId
							break

						case 'boolean':
							ClassToConverTo = Boolean
							break

						default:
							throw '[QueryTransformation.converTo] "to" is invalid.'
					}

					const transformedValue = ClassToConverTo(value)
					mongoParseableMatch[key] = transformedValue
				}
			})
		}

		this.mongoParseableQuery.match = mongoParseableMatch
		return this
	}

	private buildTime(): this {
		if (this.rawQuery.time) {
			const rawQueryCopy = Object.assign(this.rawQuery) as RawQuery
			const timestampQuery: MongoParseableTime = {
				gte: rawQueryCopy.time?.from,
				lte: rawQueryCopy.time?.to
			}

			Object.entries(timestampQuery).forEach(([key, value]) => {
				if (!value) {
					delete timestampQuery[key]
				}
			})

			if (Object.keys(timestampQuery).length) {
				this.mongoParseableQuery.match[
					rawQueryCopy.time?.field || 'timestamps.createdAt'
				] = timestampQuery
			}
		}

		return this
	}

	private buildSort(): this {
		const rawSortKeys = this.rawQuery.sort?.trim().split(',')
		const mongoParseableMatchSort: MongoParseableSort = {}
		rawSortKeys?.forEach((key) => {
			if (key.startsWith('-')) {
				mongoParseableMatchSort[key.slice(1)] = -1
			} else {
				mongoParseableMatchSort[key] = 1
			}
		})

		this.mongoParseableQuery.sort = mongoParseableMatchSort
		return this
	}

	private buildPaginate(): this {
		const { pageSize, page } = this.rawQuery.paginate || {
			pageSize: '10',
			page: '1'
		}

		const mongoparseablePagination: MongoParseablePaginate = {
			limit: parseInt(pageSize),
			skip: parseInt(pageSize) * (parseInt(page) - 1)
		}

		this.mongoParseableQuery.paginate = mongoparseablePagination
		return this
	}

	private addTextSearchToMatch(): this {
		if (this.rawQuery.textSearch) {
			this.mongoParseableQuery.match = {
				...this.mongoParseableQuery.match,
				$text: {
					$search: this.rawQuery.textSearch
				}
			}
		}

		return this
	}

	private transformOperators(): this {
		const transformedMatch: any = Object.assign(this.mongoParseableQuery.match)
		Object.entries(this.mongoParseableQuery.match).forEach(([key, value]) => {
			if (typeof value === 'object' && key !== '$text') {
				Object.keys(value).forEach((operator) => {
					if (/\b(eq|gt|gte|lt|lte|ne|not|nin|or|in)\b/g.test(operator)) {
						transformedMatch[key] = {
							...transformedMatch[key],
							[`$${operator}`]: value[operator]
						}

						delete transformedMatch[key][operator]
					}
				})
			}
		})

		this.mongoParseableQuery.match = transformedMatch
		return this
	}
}

export interface RawQuery {
	match?: any
	time?: RawTime
	sort?: string
	paginate?: RawPaginate
	textSearch?: string
}

interface RawTime {
	from?: Date
	to?: Date
	field?: string
}

interface MongoParseableQuery {
	match: MongoParseableMatch
	sort: MongoParseableSort
	paginate: MongoParseablePaginate
}

interface RawPaginate {
	pageSize: string
	page: string
}

interface MongoParseablePaginate {
	limit: number
	skip: number
}

interface MongoParseableMatch {
	[key: string]: string | any
	$text?: {
		[key: string]: any
		$search: string
	}
	'timestamps.createdAt'?: MongoParseableTime
}

interface MongoParseableTime {
	[key: string]: Date | undefined
	gte?: Date
	lte?: Date
}

interface MongoParseableSort {
	[key: string]: 1 | -1
}

interface ConvertOption {
	to: 'number' | 'string' | 'objectId' | 'boolean'
	keys: string
}

interface LookUpOption {
	from: string
	localField: string
	foreignField: string
	as: string
	justOne?: boolean
}

export interface PipelineOptions {
	convert?: ConvertOption[]
	lookup?: LookUpOption[]
	performLookupsPreMatch?: boolean
}

// TODO Fix Pipeline type to support a dynamic set of arguments at the beginning of type LookupStage | UnwindStage and ending with 3 hard-coded places
export type Pipeline = [
	// @ts-ignore
	...(LookupStage | UnwindStage)[],
	{ $match: any },
	{
		$facet: {
			count: [{ $count: 'count' }]
			data: [{ $sort: any }, { $skip: number }, { $limit: number }]
		}
	},
	{
		$unwind: '$count'
	}
]

export type LookupOption = {
	from: string
	localField: string
	foreignField: string
	as: string
	justOne: boolean
}

export type Unwind = {
	path: string
	preserveNullAndEmptyArrays: true
}

export type LookupStage = {
	$lookup: Omit<LookupOption, 'justOne'>
}

export type UnwindStage = {
	$unwind: Unwind
}
