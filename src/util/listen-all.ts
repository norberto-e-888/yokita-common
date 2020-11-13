import Container from 'typedi'

export default (subscribers: any) => {
	Object.values(subscribers).forEach((S) => {
		// @ts-ignore
		Container.get(S).listen()
	})
}
