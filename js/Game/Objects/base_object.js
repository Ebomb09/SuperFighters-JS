import sf from "../../sf";

export default class BaseObject{

	constructor(...params){

		// Combine the parameters
		let options = {};

		params.forEach((param) => {

			Object.keys(param).forEach((key) => {

				if(options[key] === undefined)
					options[key] = {};

				if(key == "matter")
					options[key] = Object.assign(options[key], param[key])
				else
					options[key] = param[key];
			});
		});

		// Set objects parent
		this.parent = options.parent;

		// Find how many sub-images or frames are present
		this.image = options.image;

		this.frame = {
			count: {
				x: (options.frameCount) ? options.frameCount.x : 1,
				y: (options.frameCount) ? options.frameCount.y : 1,
			},
			index: {
				x: 0,
				y: 0
			},
		};
		this.frame.width = this.image.width / this.frame.count.x;
		this.frame.height = this.image.height / this.frame.count.y;

		this.tiling = {
			width: (options.tiling) ? options.tiling.width : 1, 
			height: (options.tiling) ? options.tiling.height : 1
		};

		// Determine the object size based on the source image and number of tiling
		this.width = (options.width) ? options.width : this.frame.width * this.tiling.width;
		this.height = (options.height) ? options.height : this.frame.height * this.tiling.height;

		// Create the physics body
		this.body = Matter.Bodies.rectangle(options.x, options.y, this.width, this.height, options.matter);
		this.collisions = [];

		// Alias to Matter Body
		this.position 			= this.body.position;
		this.velocity 			= this.body.velocity;

		// Game specific attributes
		this.id 				= this.body.id;
		this.customId 			= (options.customId) ? options.customId : "";
		this.facingDirection 	= (options.facingDirection) ? options.facingDirection : 1;
		this.health 			= (options.health) ? options.health : -1;

		// State control of object
		this.action = {
			state: "none",
			done: false,
			entropy: 0,
			delay: 0,
			delayMax: 0
		};
	}

	update(){}

	draw(options){
		if(options === undefined) options = {};

		sf.ctx.save();

		// Transform Image
		sf.ctx.translate(this.position.x, this.position.y);

		// Rotate according to bodies rotation
		if(options.angle === undefined)
			sf.ctx.rotate(this.body.angle);
		else 
			sf.ctx.rotate(options.angle);

		sf.ctx.scale(this.facingDirection, 1);

		// Offset from origin of body to start tiling, default top-left corner
		if(options.offset === undefined)
			sf.ctx.translate(-this.width / 2, -this.height / 2);
		else
			sf.ctx.translate(options.offset.x, options.offset.y);

		for(let w = 0; w < this.tiling.width; w ++){
			for(let h = 0; h < this.tiling.height; h ++){

				sf.ctx.drawImage(
					// Source
					this.image, 
					this.frame.index.x * this.frame.width,
					this.frame.index.y * this.frame.height,
					this.frame.width,
					this.frame.height,

					// Destination
					w * this.frame.width,
					h * this.frame.width,
					this.frame.width,
					this.frame.height
					);				
			}
		}

		sf.ctx.restore();
	}

	checkState(state){
		return this.action.state.includes(state);
	}

	setState(state, delay){
		this.action.state = state;
		this.action.done = false;
		this.action.entropy = Math.random();

		if(delay === undefined)
			delay = 0;

		this.action.delay = delay;
		this.action.delayMax = delay;
	}

	getStateEntropy(){
		return this.action.entropy;
	}

	delayTimeStamp(){
		return this.action.delayMax - this.action.delay;
	}

	delayStep(){
		
		if(this.action.delay > 0){
			this.action.delay -= sf.game.delta;

			if(this.action.delay < 0)
				this.action.delay = 0;
		}		
	}

	addCollision(src, collision){

		this.collisions.push(
		{
			source: src,

			// Store penetration vector from this -> object 
			penetration: (collision.bodyB.id == this.id) ? collision.penetration : Matter.Vector.neg(collision.penetration)
		}
		);	
	}

	removeCollision(obj){

		for(let i = 0; i < this.collisions.length; i ++){

			if(this.collisions[i].source.id == obj.id){
				this.collisions.splice(i, 1)
				break;
			}
		}
	}

	dealDamage(damage){

		if(this.health != -1){
			this.health -= damage;

			if(this.health < 0)
				sf.game.kill(this);
		}
	}

	getVectorAngle(vector){

		// Find degree
		let degree = Math.atan(Math.abs(vector.y) / Math.abs(vector.x)) * 180 / Math.PI;

		if(vector.x < 0){

			if(vector.y > 0)
				degree = 180 + degree;
			else
				degree = 180 - degree;
		
		}else{
			if(vector.y > 0)
				degree = 360 - degree;
		}

		return degree;
	}

	onLeft(){

		for(let i = 0; i < this.collisions.length; i ++){
			let collision = this.collisions[i];

			let penAngle = this.getVectorAngle(collision.penetration);

			if(penAngle >= 135 && penAngle <= 225)
				return true;
		}
		return false;
	}

	onRight(){

		for(let i = 0; i < this.collisions.length; i ++){
			let collision = this.collisions[i];

			let penAngle = this.getVectorAngle(collision.penetration);

			if((penAngle >= 0 && penAngle <= 45) || (penAngle >= 315 && penAngle <= 360))
				return true;
		}
		return false;
	}

	onGround(){

		for(let i = 0; i < this.collisions.length; i ++){
			let collision = this.collisions[i];

			let penAngle = this.getVectorAngle(collision.penetration);

			if(penAngle >= 225 && penAngle <= 315)
				return true;
		}
		return false;
	}

	setAnimationFrame(frames, timestamp){

		// Find total animation time
		let loop = 0;
		frames.forEach((frame) => {
			loop += frame.delay;
		});

		// Get current time in the animation
		if(timestamp === undefined)
			var time = Date.now() % loop;
		else
			var time = timestamp % loop;

		// Set the frame index to the animation frame
		let accum = 0;
		for(let i = 0; i < frames.length; i ++){

			if(accum <= time && time < accum + frames[i].delay)
				this.frame.index = frames[i];

			accum += frames[i].delay;
		}
	}
};


/*
	Create data definitions for all BaseObject objects
*/
const obj = sf.data.objects;

let added = [
	obj.crate 			=	{ image: sf.data.loadImage("images/crate.png"), health: 50},
	obj.crate_hanging 	=	{ image: sf.data.loadImage("images/crate_hanging.png")},
	obj.filecab			=	{ image: sf.data.loadImage("images/filecab.png") },
	obj.barrel			=	{ image: sf.data.loadImage("images/barrel.png"), health: 100 },
	obj.pool_table		=	{ image: sf.data.loadImage("images/pool_table.png") },
	obj.floor			=	{ image: sf.data.loadImage("images/floor.png"), frameCount: {x: 3, y: 1}, matter: {isStatic: true}},
	obj.wall			=	{ image: sf.data.loadImage("images/wall.png"), frameCount: {x: 3, y: 1}, matter: {isStatic: true}},

].forEach((item) => {
	item.type = BaseObject;
});
