import sf from "../../sf";

export default class BaseObject{

	constructor(...params){

		/*
		 *	Combine the parameters
		 */
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
		this.options = options;
		this.parent = options.parent;

		/*
		 *	Find how many sub-images or frames are present
		 */
		this.image = options.image;

		this.frame = {
			count: {
				x: (options.frameCount) ? options.frameCount.x : 1,
				y: (options.frameCount) ? options.frameCount.y : 1,
			},
			index: {
				x: (options.frameIndex) ? options.frameIndex.x : 0,
				y: (options.frameIndex) ? options.frameIndex.y : 0
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

		/*
		 *	Get sounds
		 */
		this.sounds = (options.sounds) ? options.sounds : [];

		/*
		 *	State control of object
		 */
		this.state = (options.state) ? options.state : {
			name: "none",
			lastName: "",
			entropy: 0,
			delay: 0,
			delayMax: 0
		};
		this.state.callbacks = [];

		/*
		 *	Game specific attributes
		 */ 
		this.id 				= (options.id) ? options.id : -1;
		this.customId 			= (options.customId) ? options.customId : "";
		this.facingDirection 	= (options.facingDirection) ? options.facingDirection : 1;
		this.health 			= (options.health) ? options.health : -1;

		/*
		 *	Physics 
		 */
		if(options.matter){
			const matter = options.matter;

			if(options.shape == "circle"){
				this.body = Matter.Bodies.circle(matter.position.x, matter.position.y, this.height / 2, matter);

			}else if(options.shape == "tl-br"){

				matter.vertices = [
					{x: this.frame.width, y: this.frame.height / 2},
					{x: this.frame.width, y: this.frame.height},
					{x: 0, y: this.frame.height / 2},
					{x: 0, y: 0}
					];

				this.body = Matter.Body.create(matter);

			}else if(options.shape == "tr-bl"){

				matter.vertices = [
					{x: this.frame.width, y: 0},
					{x: this.frame.width, y: this.frame.height / 2},
					{x: 0, y: this.frame.height},
					{x: 0, y: this.frame.height / 2}
					];

				this.body = Matter.Body.create(matter);

			}else{
				this.body = Matter.Bodies.rectangle(matter.position.x, matter.position.y, this.width, this.height, matter);
			}
			this.body.clientId = this.id;
			this.collisions = (options.collisions) ? options.collisions : [];

			if(options.disableGravity) this.disableGravity = options.disableGravity;

			// Collision filter is it and mask is what
			if(options.category) this.body.collisionFilter.category = options.category;
			if(options.mask) this.body.collisionFilter.mask = options.mask;
		}
	}

	serialize(){
		const serial = {
			parentKey: this.getParentKey(),
			id: this.id,
		};

		if(this.customId != "") 						serial.customId 		= this.customId;
		if(this.facingDirection != 1) 					serial.facingDirection 	= this.facingDirection;
		if(this.frame.index.x+this.frame.index.y != 0)	serial.frameIndex 		= this.frame.index;
		if(this.tiling.x+this.tiling.y != 0)			serial.tiling 			= this.tiling;
		if(this.state.name != "none") 					serial.state 			= this.state;

		// Physics specifics
		if(this.body){
			serial.matter = {
				position: this.getPosition(),
				velocity: this.getVelocity(),
				angle: this.body.angle,

				isStatic: this.body.isStatic
			};
			serial.collisions = this.collisions;
		}
		return serial;
	}

	update(ms){ 
		this.delayStep(ms);

		if(this.disableGravity || !this.body)
			return;

		const gravity = sf.game.gravity;

		Matter.Body.applyForce(this.body, this.body.position, 
			{
				x: gravity.x * this.body.mass,
				y: gravity.y * this.body.mass
        	});
	}

	draw(options){

		if(this.disableDrawing || !this.body)
			return;

		if(!options) options = {};

		sf.ctx.save();

		// Transform Image
		sf.ctx.translate(this.getPosition().x, this.getPosition().y);

		// Rotate according to bodies rotation
		if(options.angle === undefined)
			sf.ctx.rotate(this.body.angle);
		else 
			sf.ctx.rotate(options.angle);

		// Scale image by an x / y vector
		let scale = {x: 1, y: 1};

		if(options.scale){
			scale.x = (options.scale.x) ? options.scale.x : scale.x;
			scale.y = (options.scale.y) ? options.scale.y : scale.y;
		}

		sf.ctx.scale(this.facingDirection * scale.x, scale.y);

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
					h * this.frame.height,
					this.frame.width,
					this.frame.height
					);				
			}
		}

		sf.ctx.restore();
	}

	strictState(state){
		return this.state.name == state;
	}

	checkState(state){
		return this.state.name.includes(state);
	}

	checkLastState(state){
		return this.state.lastName.includes(state);
	}

	strictLastState(state){
		return this.state.lastName == state;
	}

	setState(state, delay, callbacks){
		this.state.lastName = this.state.name;
		this.state.name = state;
		this.state.entropy = Math.random();
		this.state.delay = (delay) ? delay : 0;
		this.state.delayMax = this.state.delay;
		this.state.callbacks = callbacks;
	}

	getStateEntropy(){
		return this.state.entropy;
	}

	delayDone(){
		return this.delayTimestamp() == this.state.delayMax;
	}

	delayTimestamp(){
		return this.state.delayMax - this.state.delay;
	}

	delayStep(ms){
		
		if(this.state.delay > 0){
			this.state.delay -= ms;
			this.state.delay = (this.state.delay < 0) ? 0 : this.state.delay;

			// Run callback once timestamp is met
			if(this.state.callbacks){
				const timestamp = this.delayTimestamp();
				const callbacks = this.state.callbacks;

				for(let i = 0; i < callbacks.length; i ++){

					// Once fullfilled run and delete callback
					if(timestamp >= callbacks[i].delay){
						callbacks[i].action();
						callbacks.splice(i, 1);
					}
				}
			}
		}		
	}

	getParentKey(){
		const keys = Object.keys(sf.data.objects);

		for(let i = 0; i < keys.length; i ++){

			if(sf.data.objects[keys[i]] == this.parent)
				return keys[i]
		}
		return "";
	}

	getType(){
		return this.constructor.name;
	}

	addCollision(source, collision){

		// Remove any existing collision with an object
		this.removeCollision(source, collision);

		if(!this.body)
			return;

		this.collisions.push(
			{
				objectId: source.id,

				// Store penetration vector from this -> object 
				penetration: (collision.bodyB == this.body) ? collision.penetration : Matter.Vector.neg(collision.penetration)
			});	

		// All force went back into this
		if(source.body.mass == Infinity)
			return;

		// This is an unmoving object, force returns to source
		if(this.body.mass == Infinity){
			var forceVector = {
				x: source.getVelocity().x * source.body.mass,
				y: source.getVelocity().y * source.body.mass,
			};

		// Difference of forces
		}else{
			var forceVector = {
				x: this.getVelocity().x * this.body.mass - source.getVelocity().x * source.body.mass,
				y: this.getVelocity().y * this.body.mass - source.getVelocity().y * source.body.mass,
			};
		}

		let damage = Math.round(6 * Math.sqrt(Math.pow(forceVector.x, 2) + Math.pow(forceVector.y, 2)));		

		// Threshold damage to 6, around freefall state			
		if(damage >= 6)
			source.dealDamage(damage);
	}

	removeCollision(obj){

		if(!this.body)
			return;

		for(let i = 0; i < this.collisions.length; i ++){

			if(this.collisions[i].objectId == obj.id){
				this.collisions.splice(i, 1)
				break;
			}
		}
	}

	resetTiling(w, h){
		this.tiling.width = w;
		this.tiling.height = h;
		this.width = this.frame.width * this.tiling.width;
		this.height = this.frame.height * this.tiling.height;

		let body = Matter.Bodies.rectangle(
			this.getPosition().x, 
			this.getPosition().y, 
			this.width, 
			this.height);

		Matter.Body.setAngle(body, this.body.angle);
		this.body.vertices = body.vertices;
		this.body.bounds.min = body.bounds.min;
		this.body.bounds.max = body.bounds.max;
	}

	dealDamage(damage){
		sf.data.playAudio(this.sounds.hit);

		if(this.health != -1){
			this.health -= damage;

			if(this.health < 0){
				sf.data.playAudio(this.sounds.kill);
				sf.game.kill(this);
			}
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

	getPosition(){
		if(this.body) return {x: this.body.position.x, y: this.body.position.y};
		return {x: 0, y: 0};
	}

	movePosition(x, y){
		if(this.body) Matter.Body.setPosition(this.body, Matter.Vector.create(this.body.position.x + x, this.body.position.y + y));
	}

	setPosition(x, y){
		if(this.body) Matter.Body.setPosition(this.body, Matter.Vector.create(x, y));
	}

	getVelocity(){
		if(this.body) return {x: this.body.velocity.x, y: this.body.velocity.y};
		return {x: 0, y: 0};	
	}

	setVelocity(x, y){
		if(this.body) Matter.Body.setVelocity(this.body, Matter.Vector.create(x, y));
	}

	moveVelocity(x, y){
		if(this.body) Matter.Body.setVelocity(this.body, Matter.Vector.create(this.body.velocity.x + x, this.body.velocity.y + y));
	}

	getBounds(){
		if(this.body) return this.body.bounds;
		return {min: {x: 0, y: 0}, max: {x: 0, y: 0}};
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
		if(timestamp)
			var time = timestamp % loop;
		else
			var time = Date.now() % loop;

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

	/*
	 *	Decorative Objects
	 */
	obj.crate =	{ 
		image: sf.data.loadImage("images/crate.png"), 
		health: 50
	},

	obj.crate_hanging =	{ 
		image: sf.data.loadImage("images/crate_hanging.png") 
	},

	obj.barrel = { 
		image: sf.data.loadImage("images/barrel.png"), 
		health: 100 
	},

	obj.filecab	= { 
		image: sf.data.loadImage("images/filecab.png")
	},

	obj.computer_monitor = { 
		image: sf.data.loadImage("images/computer_monitor.png"), 
		health: 5 
	},

	obj.computer_desktop = { 
		image: sf.data.loadImage("images/computer_desktop.png"), 
		health: 5 
	},

	obj.target = { 
		image: sf.data.loadImage("images/target.png"), 
		health: 5, 

		matter: {
			isStatic: 
			true
		}
	},

	obj.pool_table = { 
		image: sf.data.loadImage("images/pool_table.png")
	},

	obj.air_duct = { 
		image: sf.data.loadImage("images/air_duct.png"), 

		matter: {
			isStatic: true
		}
	},

	obj.desk = { 
		image: sf.data.loadImage("images/desk.png"), 
		frameCount: {x: 2, y: 1}
	},

	obj.table = { 
		image: sf.data.loadImage("images/table.png"), 
		health: 35
	},

	obj.small_table	= { 
		image: sf.data.loadImage("images/small_table.png"), 
		health: 15
	},

	obj.chair = { 
		image: sf.data.loadImage("images/chair.png")
	},

	obj.table_chair = { 
		image: sf.data.loadImage("images/table_chair.png")
	},

	obj.globe = { 
		image: sf.data.loadImage("images/globe.png"), 
		shape: "circle"
	},

	obj.beachball = { 
		image: sf.data.loadImage("images/beachball.png"), 
		health: 25, 
		shape: "circle"
	},

	obj.paper =	{ 
		image: sf.data.loadImage("images/paper.png"), 
		frameCount: {x: 2, y: 1}, 
		health: 5
	},

	obj.pipe = { 
		image: sf.data.loadImage("images/pipe.png"), 
		shape: "circle"
	},

	// Ground Objects
	obj.dirt = { 
		image: sf.data.loadImage("images/dirt.png"), 
		resizable: true, 

		matter: {
			isStatic: true
		}
	},

	obj.concrete = { 
		image: sf.data.loadImage("images/concrete.png"), 
		frameCount: {x: 3, y: 3}, 
		resizable: true, 

		matter: {
			isStatic: true
		}
	},

	obj.concrete_slope00 = { 
		image: sf.data.loadImage("images/concrete_slope00.png"), 
		shape: "tl-br", 
		resizable: true,

		matter: {
			isStatic: true
		}
	},

	obj.concrete_slope01 = { 
		image: sf.data.loadImage("images/concrete_slope01.png"), 
		shape: "tr-bl", 
		resizable: true, 
		matter: {
			isStatic: true
		}
	},

	obj.brick = { 
		image: sf.data.loadImage("images/brick.png"), 
		frameCount: {x: 2, y: 1}, 
		resizable: true, 

		matter: {
			isStatic: true
		}
	},

	obj.block = { 
		image: sf.data.loadImage("images/block.png"), 
		resizable: true, 

		matter: {
			isStatic: true
		}
	},

	obj.grider = {
		image: sf.data.loadImage("images/girder.png"), 
		frameCount: {x: 3, y: 1}, 
		resizable: true, 

		matter: {
			isStatic: true
		}
	},

	obj.metal = { 
		image: sf.data.loadImage("images/metal.png"), 
		frameCount: {x: 3, y: 1}, 
		resizable: true, 

		matter: {
			isStatic: true
		}
	},

].forEach((item) => {
	item.type = BaseObject;
	item.category = sf.filters.object;
	item.mask = sf.filters.object | sf.filters.player | sf.filters.weapon | sf.filters.projectile | sf.filters.platform;
});
