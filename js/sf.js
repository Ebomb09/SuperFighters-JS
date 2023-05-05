function loadImage(src){
	let img = new Image();
	img.src = src;

	img.addEventListener('load', () => {
		img.loaded = true;
	})

	return img;
}

function loadAudio(src){
	return new Audio(src);
}

const docs = document.getElementById("sf-docs");
const canvas = document.getElementById("sf-canvas");
const ctx = canvas.getContext("2d");

const sf = {

	docs: docs,

	canvas: canvas,
	ctx: ctx,

	menuDispatcher: null,

	game: null,

	input: {
		key: {
			held: {},

			pressed: {},
			lastPressed: "",

			released: {},
			lastReleased: ""
		},

		mouse: {
			x: 0,
			y: 0,

			held: {},

			pressed: {},
			lastPressed: "",

			released: {},
			lastReleased: "",

			scroll: {
				x: 0,
				y: 0
			}
		}
	},

	config: {
		fps: 60,

		controls: 
		[
			// Default Controls for Player 1
			{
				up: 				"ArrowUp",
				down: 				"ArrowDown",
				left: 				"ArrowLeft",
				right: 				"ArrowRight",
				primaryAttack: 		"KeyA",
				secondaryAttack: 	"KeyS",
				aim: 				"KeyD",
				interact: 			"KeyF"
			}
		]
	},

	data: {
		loadImage: loadImage,
		loadAudio: loadAudio,

		materials: {},
		sounds: {},
		objects: {}
	},

	filters: {
		object: 		1 << 0,
		player: 		1 << 1,
		weapon: 		1 << 2,
		projectile: 	1 << 3,
		marker: 		1 << 4, 
		background: 	1 << 5, 
	},
};

export default sf;