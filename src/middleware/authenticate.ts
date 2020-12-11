import { NextFunction, Request, Response } from 'express'
import jsonwebtoken from 'jsonwebtoken'
import { AppError } from '../util'
import { AuthenticatedRequest } from './types'

export default <User extends { role?: string }>({
	jwtSecret,
	jwtIn = 'cookies',
	jwtKeyName = 'jwt',
	decodedJWTUserPropertyKey = 'user',
	ignoreExpirationURLs = [],
	isProtected = true,
	limitToRoles,
	extraCondition
}: IAuthenticateOptions<User>) => (
	req: AuthenticatedRequest<User>,
	_: Response,
	next: NextFunction
) => {
	try {
		const jwt = req[jwtIn][jwtKeyName] as string
		if (!jwt && isProtected) {
			return next(new AppError('Unauthenticated.', 401))
		}

		const { originalUrl } = req
		const decoded: any = jwt
			? jsonwebtoken.verify(jwt, jwtSecret, {
					ignoreExpiration:
						!isProtected || ignoreExpirationURLs.includes(originalUrl)
			  })
			: null

		req.user =
			decoded && decodedJWTUserPropertyKey
				? decoded[decodedJWTUserPropertyKey]
				: decoded

		if (
			req.user &&
			limitToRoles &&
			req.user.role &&
			!limitToRoles.includes(req.user.role)
		) {
			return next(new AppError('Unauthorized', 403))
		}

		if (req.user && extraCondition) {
			if (!extraCondition(req.user, req)) {
				return next(new AppError('Unauthorized', 403))
			}
		}

		next()
	} catch (error) {
		return next(new AppError('Unauthenticated', 401))
	}
}

export interface IAuthenticateOptions<T> {
	jwtSecret: string
	jwtIn?: 'body' | 'cookies' | 'query'
	jwtKeyName?: string
	decodedJWTUserPropertyKey?: string
	ignoreExpirationURLs?: string[]
	isProtected?: boolean
	limitToRoles?: string[]
	extraCondition?: (user: T, req: Request) => boolean
}
