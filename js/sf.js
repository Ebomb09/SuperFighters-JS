function loadImage(src){

	let img = new Image();
	img.src = src;

	img.addEventListener('load', () => {
		img.loaded = true;
	})

	return img;
}

function loadAudio(src, volume, loop){

	if(!volume) volume = 1;
	if(!loop) loop = false;

	if(!sf.data.sounds[src]){
		const sound = new Audio(src);
		sound.volume = volume;
		sound.loop = loop;

		sf.data.sounds[src] = sound;
	}

	return sf.data.sounds[src];
}

function playAudio(audio){

	if(!audio || sf.data.mute)
		return;

	// If array of sounds randomly pick one
	if(audio.constructor.name == "Array")
		audio = audio[Math.round(Math.random() * (audio.length - 1))];

	// Create a clone to buffer multiple copies
	const copy = audio.cloneNode();
	copy.volume = audio.volume;
	copy.loop = audio.loop;
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

// Update Matter to handle SuperFighters Deluxe above bits
Matter.Vector.getAngle = (vector) =>{

	// Find degree
	let degree = Math.atan(Math.abs(vector.y) / Math.abs(vector.x)) * 180 / Math.PI;

	if(vector.x < 0){

		if(-vector.y > 0)
			degree = 180 + degree;
		else
			degree = 180 - degree;
	
	}else{
		if(-vector.y > 0)
			degree = 360 - degree;
	}

	return degree;
}


Matter.Detector._canCollide = Matter.Detector.canCollide;
Matter.Detector.canCollide = (filterA, filterB) => {

    if ((filterA.above & filterB.category)!==0 || (filterB.above & filterA.category)!==0)
        return true;
    
    return Matter.Detector._canCollide(filterA, filterB);
}

Matter.Collision._collides = Matter.Collision.collides;
Matter.Collision.collides = (bodyA, bodyB, pairs) => {

	const collision = Matter.Collision._collides(bodyA, bodyB, pairs);

	if(collision){
		collision.angleA = Matter.Vector.getAngle(collision.normal);
		collision.angleB = Matter.Vector.getAngle(Matter.Vector.neg(collision.normal));

		const filterA = bodyA.collisionFilter;
		const filterB = bodyB.collisionFilter;

		if ((filterA.above & filterB.category)!==0){
			var platform = bodyA;
			var above = bodyB;
		}

		if ((filterB.above & filterA.category)!==0){
			var platform = bodyB;
			var above = bodyA;
		}

		if(above && platform){

		if(!above.platforms)
			above.platforms = [];

			const index = above.platforms.indexOf(platform);

			// Going up
			if(above.velocity.y-platform.velocity.y < -1){

				if(index == -1)
					above.platforms.push(platform);
				
				return null;

			// Going down
			}else{

				if(index != -1)
					return null;
			}
		}
	}
	return collision;
}

Matter.Body._update = Matter.Body.update;
Matter.Body.update = (body, deltaTime) => {

	Matter.Body._update(body, deltaTime);

	if(!body.platforms)
		body.platforms = [];

	for(let i = 0; i < body.platforms.length; i ++){

		if(Matter.Collision._collides(body, body.platforms[i]) == null){
			body.platforms.splice(i, 1);
			i -= 1;
		}
	}
}

const docs = document.getElementById("sf-docs");
const canvas = document.getElementById("sf-canvas");
const ctx = canvas.getContext("2d");

ctx.drawImageOptions = (options) => {
	ctx.save();

	const source = Matter.Common.extend(
		{
			image: null,
			x: 0,
			y: 0,
			width: 0,
			height: 0
		}, 
		options.source);

	const destination = Matter.Common.extend(
		{
			x: 0,
			y: 0,
			width: source.width,
			height: source.height,
			origin: {x: 0, y: 0},
			angle: 0,
			scale: {x: 1, y: 1}
		}, 
		options.destination);

	ctx.translate(destination.origin.x, destination.origin.y);
	ctx.rotate(destination.angle);
	ctx.scale(destination.scale.x, destination.scale.y);
	ctx.translate(destination.x, destination.y);

	ctx.drawImage(
		source.image,

		source.x, 
		source.y,
		source.width, 
		source.height,

		// Destination
		0,
		0,
		destination.width,
		destination.height
		);

	ctx.restore();
};

const sf = {};

sf.docs 			= docs;
sf.canvas 			= canvas;
sf.ctx 				= ctx;
sf.menuDispatcher 	= null;
sf.game 			= null;

sf.input = {
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
};

sf.config = {
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
	],

	profiles:
	[
		// Default profile for Player 1
		{
			name: "New Player"
		}
	]
};

sf.data = {
	loadImage: loadImage,
	loadAudio: loadAudio,
	playAudio: playAudio,
	mute: false,

	materials: {},
	sounds: {},
	objects: {},
	apparel: {}
};

// Psuedo compatibility with Super Fighters Deluxe collision filters
sf.collision = {};

sf.collision.categories = {
	none: 				0,
	static: 			1 << 0,
	platform: 			1 << 1,
	player: 			1 << 2,
	dynamic_active:		1 << 3,
	dynamic_inactive: 	1 << 4, 
	debris: 			1 << 4, 
	item: 				1 << 5,
	projectile: 		1 << 15,
	full: 				Math.pow(2, 32)-1
};

sf.collision.groups = {

	none: {
		category: 	sf.collision.categories.none,
		mask: 		sf.collision.categories.none
	},

	static: {
		category: 	sf.collision.categories.static,
		mask: 		sf.collision.categories.full
	},

	platform: {
		category: 	sf.collision.categories.platform,
		above: 		sf.collision.categories.full
	},

	player: {
		category: 	sf.collision.categories.player,
		mask: 		sf.collision.categories.static | sf.collision.categories.dynamic_active
	},

	dynamic_active: {
		category: 	sf.collision.categories.dynamic_active,
		mask: 		sf.collision.categories.full & ~(sf.collision.categories.dynamic_inactive),
		above: 		sf.collision.categories.dynamic_inactive
	},

	dynamic_inactive: {
		category: 	sf.collision.categories.dynamic_inactive,
		mask: 		sf.collision.categories.static
	},

	debris: {
		category: 	sf.collision.categories.debris,
		mask: 		sf.collision.categories.static | sf.collision.categories.dynamic_active		
	},

	item: {
		category: 	sf.collision.categories.item,
		mask: 		sf.collision.categories.static | sf.collision.categories.platform			
	},

	projectile: {
		category: 	sf.collision.categories.projectile,
		mask: 		sf.collision.categories.static | sf.collision.categories.dynamic_active	| sf.collision.categories.player | sf.collision.categories.projectile	
	},

	full: {
		category: 	sf.collision.categories.full,
		mask: 		sf.collision.categories.full
	}
};

sf.cookies = {
	get: getCookie,
	set: setCookie
};


// Try reloading previous config
const config = localStorage.getItem("config");
if(config) Matter.Common.extend(sf.config, JSON.parse(config));

export default sf;