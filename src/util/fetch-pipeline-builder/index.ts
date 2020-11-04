import { Types } from 'mongoose'

export default class {
	private mongoParseableQuery: IMongoParseableQuery = {
		match: {},
		sort: {},
		paginate: {
			limit: 10,
			skip: 0,
		},
	}

	private rawQuery: IRawQuery = {}
	private convert: IConvertOption[]
	private lookup: ILookUpOption[]

	constructor(
		query?: IRawQuery,
		{ convert = [], lookup = [] }: IGetPipelineOptions = {
			convert: [],
			lookup: [],
		}
	) {
		this.rawQuery.match = query?.match || {}
		this.rawQuery.time = query?.time
		this.rawQuery.sort = query?.sort || '-timestamps.createdAt'
		this.rawQuery.paginate = query?.paginate || { pageSize: '10', page: '1' }
		this.rawQuery.textSearch = query?.textSearch || undefined
		this.convert = convert
		this.lookup = lookup
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
						as,
					},
				})
			} else {
				lookups.push(
					{
						$lookup: {
							from,
							localField,
							foreignField,
							as,
						},
					},
					{
						$unwind: {
							path: `$${as}`,
							preserveNullAndEmptyArrays: true,
						},
					}
				)
			}
		})

		return [
			...lookups,
			{
				$match: this.mongoParseableQuery.match,
			},
			{
				$facet: {
					count: [{ $count: 'count' }],
					data: [
						{ $sort: this.mongoParseableQuery.sort },
						{ $skip: this.mongoParseableQuery.paginate.skip },
						{ $limit: this.mongoParseableQuery.paginate.limit },
					],
				},
			},
			{
				$unwind: '$count',
			},
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

						case 'objectID':
							ClassToConverTo = Types.ObjectId
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
			const rawQueryCopy = Object.assign(this.rawQuery) as IRawQuery
			const timestampQuery: IMongoParseableTime = {
				gte: rawQueryCopy.time?.from,
				lte: rawQueryCopy.time?.to,
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
		const mongoParseableMatchSort: IMongoParseableSort = {}
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
			page: '1',
		}

		const mongoparseablePagination: IMongoParseablePaginate = {
			limit: parseInt(pageSize),
			skip: parseInt(pageSize) * (parseInt(page) - 1),
		}

		this.mongoParseableQuery.paginate = mongoparseablePagination
		return this
	}

	private addTextSearchToMatch(): this {
		if (this.rawQuery.textSearch) {
			this.mongoParseableQuery.match = {
				...this.mongoParseableQuery.match,
				$text: {
					$search: this.rawQuery.textSearch,
				},
			}
		}

		return this
	}

	private transformOperators(): this {
		const transformedMatch: any = Object.assign(this.mongoParseableQuery.match)
		Object.entries(this.mongoParseableQuery.match).forEach(([key, value]) => {
			if (typeof value === 'object' && key !== '$text') {
				Object.keys(value).forEach((operator) => {
					if (/\b(eq|gt|gte|lt|lte|ne|not|nin)\b/g.test(operator)) {
						transformedMatch[key] = {
							...transformedMatch[key],
							[`$${operator}`]: value[operator],
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

export interface IRawQuery {
	match?: any
	time?: IRawTime
	sort?: string
	paginate?: IRawPaginate
	textSearch?: string
}

export interface IRawTime {
	from?: Date
	to?: Date
	field?: string
}

interface IMongoParseableQuery {
	match: IMongoParseableMatch
	sort: IMongoParseableSort
	paginate: IMongoParseablePaginate
}

interface IRawPaginate {
	pageSize: string
	page: string
}

interface IMongoParseablePaginate {
	limit: number
	skip: number
}

interface IMongoParseableMatch {
	[key: string]: string | any
	$text?: {
		[key: string]: any
		$search: string
	}
	'timestamps.createdAt'?: IMongoParseableTime
}

interface IMongoParseableTime {
	[key: string]: Date | undefined
	gte?: Date
	lte?: Date
}

interface IMongoParseableSort {
	[key: string]: 1 | -1
}

interface IConvertOption {
	to: 'number' | 'string' | 'objectID'
	keys: string
}

interface ILookUpOption {
	from: string
	localField: string
	foreignField: string
	as: string
	justOne?: boolean
}

interface IGetPipelineOptions {
	convert?: IConvertOption[]
	lookup?: ILookUpOption[]
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
