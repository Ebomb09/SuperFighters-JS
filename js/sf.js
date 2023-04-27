export function init(){

	const canvas = document.getElementById("sf-canvas");

	window.sf = {

		canvas: canvas,
		ctx: canvas.getContext("2d"),

		menuDispatcher: null,

		game: null,

		input: {
			key: {
				held: {},
				pressed: {},
				released: {}
			},

			mouse: {
				x: 0,
				y: 0,
				held: {},
				pressed: {},
				released: {}					
			}
		},

		config: {
			fps: 60
		},

		data: {}
	};
}