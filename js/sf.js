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
			released: {}
		},

		mouse: {
			x: 0,
			y: 0,
			held: {},
			pressed: {},
			released: {},
			scroll: {
				x: 0,
				y: 0
			}
		}
	},

	config: {
		fps: 60
	},

	data: {
		loadImage: loadImage,
		loadAudio: loadAudio,

		materials: {},
		sounds: {},
		objects: {}
	}
};

export default sf;