interface Color {
	red: number
	blue: number
	green: number
}

const color: Color = {
	red: 10,
	blue: 10,
	green: 20,
}

export default () => {
	console.log(color)
}
