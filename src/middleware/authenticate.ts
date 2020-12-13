import { NextFunction, Request, Response } from 'express'
import { Document, Model } from 'mongoose'
import jwt from 'jsonwebtoken'
import { Callback } from 'redis'
import { AppError } from '../util'

export default ({
	userModel,
	getCachedUser,
	jwtSecret,
	jwtIn,
	jwtKeyName,
	ignoreExpirationURLs = [],
	extraCondition,
	isProtected
}: PopulateUserArgs) => (roles: string[] = []) => (
	req: Request,
	_: Response,
	next: NextFunction
) => {
	try {
		const token = req[jwtIn][jwtKeyName]
		if (!token && isProtected) {
			return next(new AppError('Unauthenticated', 401))
		}

		if (!token) {
			req.user = null
			return next()
		}

		const decoded = jwt.verify(token, jwtSecret, {
			ignoreExpiration: ignoreExpirationURLs.includes(req.originalUrl)
		}) as {
			id: string
			iat: number
			exp: number
		}

		getCachedUser(decoded.id, async (err, data) => {
			if (err) return next(err)
			const cachedUser = JSON.parse(data) as { role: string }
			if (!!cachedUser) {
				if (roles.length && !roles.includes(cachedUser.role)) {
					return next(new AppError('Forbidden', 403))
				}

				if (extraCondition && !extraCondition(cachedUser, req)) {
					return next(new AppError('Forbidden', 403))
				}

				req.user = cachedUser
				return next()
			}

			const freshUserFromDB = (await userModel.findById(
				decoded.id as string
			)) as Document & { role: string }

			if (!!freshUserFromDB) {
				if (roles.length && !roles.includes(freshUserFromDB.role)) {
					return next(new AppError('Forbidden', 403))
				}

				if (extraCondition && !extraCondition(freshUserFromDB, req)) {
					return next(new AppError('Forbidden', 403))
				}

				req.user = freshUserFromDB.toObject()
				return next()
			} else if (!freshUserFromDB && isProtected) {
				return next(new AppError('Unauthenticated', 401))
			} else {
				req.user = null
				return next()
			}
		})
	} catch (error) {
		return next(error)
	}
}

export type PopulateUserArgs = {
	userModel: Model<any>
	getCachedUser(userId: string, cb: Callback<string>): boolean
	extraCondition?(user: any, req: Request): boolean
	jwtIn: 'body' | 'cookies' | 'query'
	jwtKeyName: string
	jwtSecret: string
	ignoreExpirationURLs?: string[]
	isProtected?: boolean
}
