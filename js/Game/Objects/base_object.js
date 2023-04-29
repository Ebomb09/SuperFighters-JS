import sf from "../../sf";

export default class BaseObject{

	constructor(object, x, y, options){

		if(options === undefined)
			options = {};

		this.image = object.image;

		// Find how many sub-images or frames are present
		this.frameCount = {x: 1, y: 1};
		this.frameIndex = {x: 0, y: 0};

		if(object.frames !== undefined){
			this.frameCount.x = object.frames[0];
			this.frameCount.y = object.frames[1];
		}
		this.frame = {width: this.image.width / this.frameCount.x, height: this.image.height / this.frameCount.y};

		this.tiling = {width: 1, height: 1};

		if(options.tiling !== undefined)
			this.tiling = options.tiling;

		// Determine the object size based on the source image and number of tiling
		if(options.width === undefined && options.height === undefined){
			this.width = this.frame.width * this.tiling.width;
			this.height = this.frame.height * this.tiling.height;

		}else{
			this.width = options.width;
			this.height = options.height;
		}

		// Create the physics body
		if(object.static !== undefined)
			options.isStatic = object.static;

		this.body = Matter.Bodies.rectangle(x, y, this.width, this.height, options);
		this.collisions = [];

		// Alias to Matter Body
		this.position = this.body.position;
		this.velocity = this.body.velocity;
		this.id = this.body.id;

		this.customId = "";
	}

	update(){}

	draw(){
		sf.ctx.save();

		sf.ctx.translate(this.body.position.x, this.body.position.y);
		sf.ctx.rotate(this.body.angle);

		for(let w = 0; w < this.tiling.width; w ++){
			for(let h = 0; h < this.tiling.height; h ++){

				sf.ctx.drawImage(
					this.image, 
					this.frameIndex.x * this.frame.width,
					this.frameIndex.y * this.frame.height,
					this.frame.width,
					this.frame.height,
					-this.width/2 + this.frame.width * w, 
					-this.height/2 + this.frame.height * h,
					this.frame.width,
					this.frame.height
					);				
			}
		}

		sf.ctx.restore();
	}

	getPenetrationAngle(collision){

		if(collision != null){
			let penVector = null;

			// Check if collision is going this -> obj
			if(collision.bodyB == this.body)
				penVector = collision.penetration;

			// Reverse the vector if it is obj -> this
			else
				penVector = Matter.Vector.neg(collision.penetration);

			// Find degree of collision from this -> obj
			let degree = Math.atan(Math.abs(penVector.y) / Math.abs(penVector.x)) * 180 / Math.PI;

			if(penVector.x < 0){

				if(penVector.y > 0)
					degree = 180 + degree;
				else
					degree = 180 - degree;
			
			}else{
				if(penVector.y > 0)
					degree = 360 - degree;
			}

			return degree;
		}
		return -1;
	}

	onLeft(){

		for(let i = 0; i < this.collisions.length; i ++){
			let collision = this.collisions[i];

			let penAngle = this.getPenetrationAngle(collision);

			if(penAngle >= 135 && penAngle <= 225)
				return true;
		}
		return false;
	}

	onRight(){

		for(let i = 0; i < this.collisions.length; i ++){
			let collision = this.collisions[i];

			let penAngle = this.getPenetrationAngle(collision);

			if((penAngle >= 0 && penAngle <= 45) || (penAngle >= 315 && penAngle <= 360))
				return true;
		}
		return false;
	}

	onGround(){

		for(let i = 0; i < this.collisions.length; i ++){
			let collision = this.collisions[i];

			let penAngle = this.getPenetrationAngle(collision);

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
				this.frameIndex = frames[i];

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
	obj.floor			=	{ image: sf.data.loadImage("images/floor.png"), frames: [3, 1], static: true},
	obj.wall			=	{ image: sf.data.loadImage("images/wall.png"), frames: [3, 1], static: true},

].forEach((item) => {
	item.type = BaseObject;
});
