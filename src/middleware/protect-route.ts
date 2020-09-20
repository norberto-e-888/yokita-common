import { NextFunction, Response } from 'express'
import jsonwebtoken from 'jsonwebtoken'
import { AuthenticatedRequest } from '../typings'
import { AppError } from '../util'

export default (jwtSecret: string) => (
	req: AuthenticatedRequest,
	_: Response,
	next: NextFunction
) => {
	try {
		const {
			cookies: { jwt },
			originalUrl,
		} = req

		if (!jwt) {
			return next(new AppError('Unauthenticated.', 401))
		}

		const decoded: any = jsonwebtoken.verify(jwt, jwtSecret, {
			ignoreExpiration: originalUrl === '/api/auth/refresh',
		})

		req.user = decoded.user
		next()
	} catch (error) {
		return next(error)
	}
}
