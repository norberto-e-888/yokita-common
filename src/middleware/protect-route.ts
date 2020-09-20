import { NextFunction, Response } from 'express'
import jsonwebtoken from 'jsonwebtoken'
import { AuthenticatedRequest } from '../typings'
import { AppError } from '../util'

interface IOptions {
	refreshURL?: string
	roles?: string[]
}

export default (options?: IOptions) => (
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

		const decoded: any = jsonwebtoken.verify(
			jwt,
			process.env.JWT_SECRET || '',
			{
				ignoreExpiration:
					originalUrl === (options?.refreshURL || '/api/auth/refresh'),
			}
		)

		if (
			decoded.user?.role &&
			options?.roles &&
			!options.roles.includes(decoded.user.role)
		) {
			throw new AppError('Unauthorized', 403)
		}

		req.user = decoded.user
		next()
	} catch (error) {
		return next(error)
	}
}
