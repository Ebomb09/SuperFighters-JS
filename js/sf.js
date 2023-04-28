function loadImage(src){
	let img = new Image();
	img.src = src;

	img.addEventListener('load', () => {
		img.loaded = true;
	})

	return img;
}

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

		data: {

			materials: {

			},

			sounds: {

			},

			objects: {
				crate: 			{ image: loadImage("images/crate.png") },	
				crate_hanging: 	{ image: loadImage("images/crate_hanging.png")},
				filecab: 		{ image: loadImage("images/filecab.png") },
				barrel: 		{ image: loadImage("images/barrel.png") },
				pool_table: 	{ image: loadImage("images/pool_table.png") },
				floor:  		{ image: loadImage("images/floor.png"), tiling: [3, 1]},
				wall: 			{ image: loadImage("images/wall.png"), tiling: [3, 1]}
			}
		}
	};
}