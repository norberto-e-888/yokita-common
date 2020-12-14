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
	isProtected = true,
	unauthenticatedOnly = false
}: AuthenticateArgs) => (...roles: string[]) => (
	...extraConditions: ExtraCondition[]
) => (req: Request, _: Response, next: NextFunction) => {
	try {
		const token = req[jwtIn][jwtKeyName]
		if (!token) {
			if (isProtected) {
				return next(new AppError('Unauthenticated', 401))
			}

			req.user = null
			return next()
		}

		const decoded = jwt.verify(token, jwtSecret, {
			ignoreExpiration:
				ignoreExpirationURLs.includes(req.originalUrl) || !isProtected
		}) as {
			id: string
			iat: number
			exp: number
		}

		if (decoded.id) {
			if (unauthenticatedOnly) {
				console.log('HERE 1', decoded)
				return next(new AppError('Forbidden', 403))
			}

			if (!getCachedUser || !userModel) {
				return next(new AppError('Invalid middleware', 500))
			}

			getCachedUser(decoded.id, async (err, data) => {
				if (err) return next(err)
				const cachedUser = JSON.parse(data) as { role: string }
				if (cachedUser) {
					if (roles.length && !roles.includes(cachedUser.role)) {
						console.log('HERE 2', cachedUser)
						return next(new AppError('Forbidden', 403))
					}

					if (
						!extraConditions.every((condition) => condition(cachedUser, req))
					) {
						console.log('HERE 3', cachedUser)
						return next(new AppError('Forbidden', 403))
					}

					req.user = cachedUser
					return next()
				}

				const freshUserFromDB = (await userModel.findById(
					decoded.id as string
				)) as (Document & { role: string }) | null

				if (freshUserFromDB) {
					if (roles.length && !roles.includes(freshUserFromDB.role)) {
						console.log('HERE 4', freshUserFromDB)
						return next(new AppError('Forbidden', 403))
					}

					if (
						!extraConditions.every((condition) =>
							condition(freshUserFromDB, req)
						)
					) {
						console.log('HERE 5', freshUserFromDB)
						return next(new AppError('Forbidden', 403))
					}

					req.user = freshUserFromDB.toObject()
					return next()
				}

				if (isProtected) {
					return next(new AppError('Unauthenticated', 401))
				}

				req.user = null
				return next()
			})
		} else {
			if (isProtected) {
				return next(new AppError('Unauthenticated', 401))
			}

			req.user = null
			return next()
		}
	} catch (error) {
		return next(new AppError('Unauthenticated', 401))
	}
}

export type AuthenticateArgs = {
	userModel?: Model<any>
	getCachedUser?(userId: string, cb: Callback<string>): boolean
	jwtIn: 'body' | 'cookies' | 'query'
	jwtKeyName: string
	jwtSecret: string
	ignoreExpirationURLs?: string[]
	isProtected?: boolean
	unauthenticatedOnly?: boolean
}

export type ExtraCondition = (user: any, req: Request) => boolean
