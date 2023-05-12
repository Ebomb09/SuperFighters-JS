function loadImage(src){

	let img = new Image();
	img.src = src;

	img.addEventListener('load', () => {
		img.loaded = true;
	})

	return img;
}

function loadAudio(src, loop){

	if(!loop) loop = false;

	if(!sf.data.sounds[src]){
		const sound = new Audio(src);
		sound.loop = loop;

		sf.data.sounds[src] = sound;
	}

	return sf.data.sounds[src];
}

function playAudio(audio){

	if(!audio)
		return;

	// If array of sounds randomly pick one
	if(audio.constructor.name == "Array")
		audio = audio[Math.round(Math.random() * (audio.length - 1))];

	// Create a clone to buffer multiple copies
	let copy = audio.cloneNode();
	copy.play();
	
	return copy;
}

function getCookie(key, defaultValue){
	let found = "";

	document.cookie.split(";").forEach((cookie) => {

		let data = cookie.split("=");

		if(data.length == 2){
			if(data[0] == key)
				found = data[1];
		}
	});

	if(defaultValue !== undefined && found == ""){
		setCookie(key, defaultValue);
		return defaultValue;
	}

	return found;
}

function setCookie(key, value){
	let cookies = "";
	let added = false;

	document.cookie.split(";").forEach((cookie) => {

		let data = cookie.split("=");

		if(data.length == 2){
			
			if(data[0] == key){
				cookie = `${data[0]}=${value};`;
				added = true;
			}
		}
		cookies += cookie;
	});

	if(!added)
		cookies += `${key}=${value};`;

	document.cookie = cookies;
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
		playAudio: playAudio,

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
		platform: 		1 << 6,
		decoration: 	1 << 7,
		effect: 		1 << 8,
		ladder: 		1 << 9
	},

	cookies: {
		get: getCookie,
		set: setCookie
	}
};

// Try reloading previous config
const config = localStorage.getItem("config");
if(config) sf.config = JSON.parse(config);


export default sf;