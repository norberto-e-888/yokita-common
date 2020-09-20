import { NextFunction } from 'express'
import jsonwebtoken from 'jsonwebtoken'
import { AuthenticatedRequest } from '../typings'
import { AppError } from '../util'

export default ({
	refreshURL = '/api/auth/refresh',
	roles,
}: {
	refreshURL: string
	roles: string[]
}) => (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
	try {
		const {
			cookies: { jwt },
			originalUrl,
		} = req

		if (!jwt) {
			return next(new AppError('You are not authenticated.', 401))
		}

		const decoded: any = jsonwebtoken.verify(
			jwt,
			process.env.JWT_SECRET || '',
			{
				ignoreExpiration: originalUrl === refreshURL,
			}
		)

		if (decoded.user?.role && roles && !roles.includes(decoded.user.role)) {
			throw new AppError('Unauthorized', 403)
		}

		req.user = decoded.user
		next()
	} catch (error) {
		return next(error)
	}
}
