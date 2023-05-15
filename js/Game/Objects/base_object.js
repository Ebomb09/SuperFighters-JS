import sf from "../../sf";

const Default = {
	sounds: {
		damage_melee: sf.data.loadAudio("sounds/hit_generic.mp3")
	}
};

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
		 *	Object callbacks
		 */
		this.onkill = options.onkill;
		this.oncreate = options.oncreate;

		/*
		 *	Game specific attributes
		 */ 
		this.id 				= (options.id !== undefined) ? options.id : -1;
		this.customId 			= (options.customId) ? options.customId : "";
		this.facingDirection 	= (options.facingDirection) ? options.facingDirection : 1;

		this.health 			= (options.health) ? options.health : -1;
		this.fire				= (options.fire) ? options.fire : 0;
		this.flammable			= this.parent.flammable;

		this.damageModifier = {
			default: 	1,
			collision: 	1,
			melee: 		1,
			projectile: 1,
			explosion: 	1,
			fire: 		1, 
		};
		if(options.damageModifier) Matter.Common.extend(this.damageModifier, options.damageModifier);

		/*
		 *	Physics 
		 */
		if(!options.noBody){
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
			if(options.category !== undefined) this.body.collisionFilter.category = options.category;
			if(options.mask !== undefined) this.body.collisionFilter.mask = options.mask;
		}

		if(this.oncreate)
			this.oncreate(this);
	}

	serialize(){
		const serial = {
			parentKey: this.getParentKey(),
			id: this.id,
		};

		if(this.customId != "") 						serial.customId 		= this.customId;
		if(this.health != "") 							serial.health 			= this.health;
		if(this.fire != 0) 								serial.fire 			= this.fire;
		if(this.facingDirection != 1) 					serial.facingDirection 	= this.facingDirection;
		if(this.frame.index.x+this.frame.index.y != 0)	serial.frameIndex 		= this.frame.index;
		if(this.tiling.x+this.tiling.y != 0)			serial.tiling 			= this.tiling;
		if(this.state.name != "none") 					serial.state 			= this.state;

		// Physics specifics
		if(this.body){
			serial.matter = {
				position: this.getPosition(),
				velocity: this.getVelocity(),

				angle: this.getAngle(),
				angularVelocity: this.getAngularVelocity(),

				isStatic: this.body.isStatic
			};
			serial.collisions = this.collisions;
		}else{
			serial.noBody = true;
		}

		return serial;
	}

	update(ms){ 
		this.delayStep(ms);

		this.updateFire();

		if(!this.disableGravity && this.body){
			const gravity = sf.game.gravity;

			Matter.Body.applyForce(this.body, this.body.position, 
				{
					x: gravity.x * this.body.mass,
					y: gravity.y * this.body.mass
	        	});
		}
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

	updateFire(){

		if(this.flammable){

			if(this.fire < 0)
				this.fire = 0;

			let touchingFire = false;

			sf.game.getObjectsByAABB(this.getBounds()).forEach((obj) => {

				if(obj.getType() == "Fire" && !touchingFire){
					this.fire += 1;
					touchingFire = true;
				}
			});

			if(this.fire > 0){

				if(!touchingFire)
					this.fire += 1;

				if(this.fire % 5 == 0)
					sf.game.createObject(sf.data.objects.smoke,
						{
							matter:{
								position: this.getPosition(),
								velocity: {x: Math.random() - 0.5, y: -1}
							}
						});
				

				if(this.fire > 100){
					this.dealDamage(1, "fire");

					sf.game.createObject(sf.data.objects.burn,
						{
							matter: {
								position: this.getPosition(),
								velocity: this.getVelocity()
							}
						});
				}
			}
		}		
	}

	putoutFire(){

		// Set from burning to smoking
		if(this.fire > 100){
			this.fire = 1;

		// Set fire out
		}else{
			this.fire = 0;
		}
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

		const damage = Math.round(6 * Math.sqrt(Math.pow(forceVector.x, 2) + Math.pow(forceVector.y, 2)));	

		// Deal damage within a threshold of 6 (ie: time to hit freefall)	
		source.dealDamage(damage, "collision", 6);
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

	kill(){
		// Remove from object list
		const index = sf.game.objects.indexOf(this);

		if(index >= 0)
			sf.game.objects.splice(index, 1);

		if(this.onkill)
			this.onkill(this);

		// Remove world body
		this.killBody();
	}

	killBody(){
		
		if(this.body){
			Matter.Composite.remove(sf.game.world, this.body);
			this.body = null;
		}

		// Remove collisions to this object
		sf.game.objects.forEach((obj) => {
			obj.removeCollision(this);
		});

		sf.data.playAudio(this.sounds.killed);
	}

	dealDamage(damage, type, threshold){

		// Get type of damage
		if(!type) type = "default";

		// Get threshold
		if(!threshold) threshold = 0;

		// Find damage after modifier is applied
		damage *= this.damageModifier[type];

		// Deal damage if above threshold
		if(this.health != -1 && damage > threshold){

			if(this.sounds[`damage_${type}`])
				sf.data.playAudio(this.sounds[`damage_${type}`]);
			else
				sf.data.playAudio(Default.sounds[`damage_${type}`]);

			this.health -= Math.round(damage);

			if(this.health < 0){
				sf.data.playAudio(this.sounds.kill);
				this.kill();
			}
			return true;
		}
		return false;
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
		if(this.body) return Matter.Vector.create(this.body.position.x, this.body.position.y);
		return Matter.Vector.create(0, 0);
	}

	movePosition(x, y){
		if(this.body) Matter.Body.setPosition(this.body, Matter.Vector.create(this.body.position.x + x, this.body.position.y + y));
	}

	setPosition(x, y){
		if(this.body) Matter.Body.setPosition(this.body, Matter.Vector.create(x, y));
	}

	getVelocity(){
		if(this.body) return Matter.Body.getVelocity(this.body);
		return Matter.Vector.create(0, 0);	
	}

	setVelocity(x, y){
		if(this.body) Matter.Body.setVelocity(this.body, Matter.Vector.create(x, y));
	}

	moveVelocity(x, y){
		if(this.body) Matter.Body.setVelocity(this.body, Matter.Vector.create(this.body.velocity.x + x, this.body.velocity.y + y));
	}

	getAngle(){
		if(this.body) return this.body.angle;
		return 0;	
	}

	setAngle(angle){
		if(this.body) Matter.Body.setAngle(this.body, angle);
	}

	getAngularVelocity(){
		if(this.body) Matter.Body.getAngularVelocity(this.body);
		return 0;
	}

	setAngularVelocity(velocity){
		if(this.body) Matter.Body.setAngularVelocity(this.body, velocity);
	}

	getBounds(){
		if(this.body) return this.body.bounds;
		return {min: Matter.Vector.create(0, 0), max: Matter.Vector.create(0, 0)};
	}

	getStatic(){
		if(this.body) return this.body.isStatic;
		return false;	
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

/*
 *	Decorative Objects
 */
let decorativeObjects = [

	obj.computer_monitor = { 
		image: sf.data.loadImage("images/computer_monitor.png"), 
		health: 5,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_computer00.mp3"),
				sf.data.loadAudio("sounds/bust_computer01.mp3")
			]
		},

		onkill: (object) => {

			sf.game.createObject(sf.data.objects.explosion_small, 
				{
					matter: {
						position: object.getPosition()
					}
				});
		}
	},

	obj.computer_desktop = { 
		image: sf.data.loadImage("images/computer_desktop.png"), 
		health: 5,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_computer00.mp3"),
				sf.data.loadAudio("sounds/bust_computer01.mp3")
			]
		},

		onkill: (object) => {

			sf.game.createObject(sf.data.objects.explosion_small, 
				{
					matter: {
						position: object.getPosition()
					}
				});
		} 
	},

	obj.target = { 
		image: sf.data.loadImage("images/target.png"), 
		health: 5, 
		flammable: true,

		matter: {
			isStatic: true
		},

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},

		onkill: (object) => {

			sf.game.createObject(sf.data.objects.target_debris00, 
				{
					matter: {
						position: {
							x: object.getPosition().x,
							y: object.getPosition().y - 5
						},
						velocity: object.getVelocity()
					}
				});
			sf.game.createObject(sf.data.objects.target_debris01, 
				{
					matter: {
						position: object.getPosition(),
						velocity: object.getVelocity()
					}
				});
			sf.game.createObject(sf.data.objects.target_debris02, 
				{
					matter: {
						position: {
							x: object.getPosition().x,
							y: object.getPosition().y + 5
						},
						velocity: object.getVelocity()
					}
				});
		}
	},

	obj.target_debris00 = { 
		image: sf.data.loadImage("images/target_debris00.png"), 
		health: 5, 
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},
	},

	obj.target_debris01 = { 
		image: sf.data.loadImage("images/target_debris01.png"), 
		health: 5, 
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},
	},

	obj.target_debris02 = { 
		image: sf.data.loadImage("images/target_debris02.png"), 
		health: 5, 
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},
	},

	obj.table_chair = { 
		image: sf.data.loadImage("images/table_chair.png")
	},

	obj.beachball = { 
		image: sf.data.loadImage("images/beachball.png"), 
		health: 25, 
		shape: "circle",

		matter: {
			restitution: 1
		},

		onkill: (object) => {

			sf.game.createObject(sf.data.objects.beachball_debris, 
				{
					matter: {
						position: object.getPosition(),
						velocity: object.getVelocity()
					}
				});
		}
	},

	obj.beachball_debris = { 
		image: sf.data.loadImage("images/beachball_debris.png"), 
		health: 10
	},

	obj.paper =	{ 
		image: sf.data.loadImage("images/paper.png"), 
		frameCount: {x: 2, y: 1}, 
		health: 5,
		flammable: true,
	},

	obj.crate_debris00 = {
		image: sf.data.loadImage("images/crate_debris00.png"),
		health: 25,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},
	},

	obj.crate_debris01 = {
		image: sf.data.loadImage("images/crate_debris01.png"),
		health: 25,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},
	},

	obj.crate_debris02 = {
		image: sf.data.loadImage("images/crate_debris02.png"),
		health: 25,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},
	},

	obj.table_debris00 = { 
		image: sf.data.loadImage("images/table_debris00.png"), 
		health: 15,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		}
	},

	obj.table_debris01 = { 
		image: sf.data.loadImage("images/table_debris01.png"), 
		health: 15,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		}
	},

	obj.table_debris02 = { 
		image: sf.data.loadImage("images/table_debris02.png"), 
		health: 15,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		}
	},

].forEach((item) => {
	item.type = BaseObject;
	item.category = sf.filters.decoration;
	item.mask = sf.filters.object | sf.filters.projectile | sf.filters.platform;
});


/*
 *	World Objects
 */
let worldObjects = [

	obj.crate =	{ 
		image: sf.data.loadImage("images/crate.png"), 
		health: 50,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},

		onkill: (object) => {

			sf.game.createObject(sf.data.objects.crate_debris02, 
				{
					matter: {
						position: {
							x: object.getPosition().x,
							y: object.getPosition().y - 5
						},
						velocity: object.getVelocity()
					}
				});
			sf.game.createObject(sf.data.objects.crate_debris01, 
				{
					matter: {
						position: object.getPosition(),
						velocity: object.getVelocity()
					}
				});
			sf.game.createObject(sf.data.objects.crate_debris00, 
				{
					matter: {
						position: {
							x: object.getPosition().x,
							y: object.getPosition().y + 5
						},
						velocity: object.getVelocity()
					}
				});			
		}
	},

	obj.crate_hanging =	{ 
		image: sf.data.loadImage("images/crate_hanging.png") 
	},

	obj.barrel = { 
		image: sf.data.loadImage("images/barrel.png")
	},

	obj.explosive_barrel = {
		image: sf.data.loadImage("images/explosive_barrel.png"), 
		frameIndex: {x: 0, y: 0},
		frameCount: {x: 2, y: 1},

		health: 1,
		flammable: true,
		damageModifier: {
			melee: 0
		},

		onkill: (object) => {
			sf.game.createExplosion(
				{
					x: object.getPosition().x,
					y: object.getPosition().y,
					radius: 32
				},
				0.008);

			const velocity = {
				x: object.getVelocity().x + Math.random() * 5 - 2.5,
				y: object.getVelocity().y + -5 + Math.random() * 2
			};

			sf.game.createObject(sf.data.objects.explosive_barrel_debris, 
				{
					matter: {
						position: object.getPosition(),
						velocity: velocity,
						angle: object.getAngle(),
						angularVelocity: Math.random() - 0.5
					}
				});
		}
	},

	obj.explosive_barrel_debris = {
		image: sf.data.loadImage("images/explosive_barrel.png"), 
		frameIndex: {x: 1, y: 0},
		frameCount: {x: 2, y: 1},

		health: 1,
		damageModifier: {
			melee: 0,
			collision: 100
		},

		onkill: (object) => {
			sf.game.createExplosion(
				{
					x: object.getPosition().x,
					y: object.getPosition().y,
					radius: 32
				},
				0.008);
		}
	},

	obj.filecab	= { 
		image: sf.data.loadImage("images/filecab.png"),
	},

	obj.globe = { 
		image: sf.data.loadImage("images/globe.png"), 
		shape: "circle"
	},

	obj.pipe = { 
		image: sf.data.loadImage("images/pipe.png"), 
		shape: "circle"
	},

	obj.desk = { 
		image: sf.data.loadImage("images/desk.png"), 
		frameCount: {x: 2, y: 1}
	},

	obj.chair = { 
		image: sf.data.loadImage("images/chair.png")
	},

	obj.table = { 
		image: sf.data.loadImage("images/table.png"), 
		health: 35,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},

		onkill: (object) => {

			sf.game.createObject(sf.data.objects.table_debris00, 
				{
					matter: {
						position: {
							x: object.getPosition().x - 5,
							y: object.getPosition().y
						},
						velocity: object.getVelocity()
					}
				});
			sf.game.createObject(sf.data.objects.table_debris01, 
				{
					matter: {
						position: object.getPosition(),
						velocity: object.getVelocity()
					}
				});
			sf.game.createObject(sf.data.objects.table_debris02, 
				{
					matter: {
						position: {
							x: object.getPosition().x + 5,
							y: object.getPosition().y
						},
						velocity: object.getVelocity()
					}
				});
		}
	},

	obj.small_table	= { 
		image: sf.data.loadImage("images/small_table.png"), 
		health: 15,
		flammable: true,

		sounds: {
			killed: [
				sf.data.loadAudio("sounds/bust_wood00.mp3"),
				sf.data.loadAudio("sounds/bust_wood01.mp3")
			]
		},

		onkill: (object) => {
			sf.game.createObject(sf.data.objects.table_debris01, 
				{
					matter: {
						position: object.getPosition(),
						velocity: object.getVelocity()
					}
				});
		}
	},

	obj.air_duct = { 
		image: sf.data.loadImage("images/air_duct.png"), 

		matter: {
			isStatic: true
		}
	},

	obj.pool_table = { 
		image: sf.data.loadImage("images/pool_table.png")
	},

	obj.dirt = { 
		image: sf.data.loadImage("images/dirt.png"), 
		frameCount: {x: 2, y: 1},
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

	obj.concrete_stair00 = { 
		image: sf.data.loadImage("images/concrete_stair00.png"), 
		shape: "tl-br", 
		resizable: true,

		matter: {
			isStatic: true
		}
	},

	obj.concrete_stair01 = { 
		image: sf.data.loadImage("images/concrete_stair01.png"), 
		shape: "tr-bl", 
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
		frameCount: {x: 3, y: 1}, 
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
	}

].forEach((item) => {
	item.type = BaseObject;
	item.category = sf.filters.object;
	item.mask = sf.filters.object | sf.filters.player | sf.filters.weapon | sf.filters.projectile | sf.filters.platform | sf.filters.decoration;
});