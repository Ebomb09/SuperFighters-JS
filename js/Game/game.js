import sf from "../sf";

export default class Game{

	constructor(map){

		// Init physics world
		this.engine = Matter.Engine.create();
		this.world = this.engine.world;

		// Camera
		this.camera = {
			x: 0,
			y: 0,
			zoom: 1
		};

		// Collision Handlers
		Matter.Events.on(this.engine, "collisionStart", this.startCollision.bind(this));
		Matter.Events.on(this.engine, "collisionEnd", this.endCollision.bind(this));

		// Custom game objects
		this.objects = [];

		// Debug Tester
		this.debug = {
			mode: true,
			select: null
		};

		this.loadMap(map);
	}

	saveMap(){
		let map = {
			objects: []
		};

		this.objects.forEach((obj) => {

			let keys = Object.keys(sf.data.objects);
			let values = Object.values(sf.data.objects);

			map.objects.push({
				parentKey: keys[values.indexOf(obj.parent)],

				// Descriptors
				x: obj.position.x,
				y: obj.position.y,
				facingDirection: obj.facingDirection,
				customId: obj.customId,

				// Rendering
				frameIndex: obj.frame.index,
				tiling: obj.tiling,

				// Physics specifics
				matter: {
					angle: obj.body.angle,
					isStatic: obj.body.isStatic
				}
			});
		});

		return JSON.stringify(map);
	}

	loadMap(buffer){

		// Unload all current objects
		Matter.Composite.clear(this.world);
		this.objects = [];

		if(buffer == "test"){
			// Create some test objects
			this.createObject(sf.data.objects["floor"], {x: 200, y: 100, tiling: {width: 5, height: 1}, matter: {angle: -0.5}});
			this.createObject(sf.data.objects["floor"], {x: 200, y: 50, tiling: {width: 5, height: 1}, matter: {angle: 0.5}});
			this.createObject(sf.data.objects["floor"], {x: 70, y: 120, tiling: {width: 8, height: 2}});
			this.createObject(sf.data.objects["crate"], {x: 85, y: 60});
			this.createObject(sf.data.objects["crate"], {x: 85, y: 70});

			this.createObject(sf.data.objects["player"], {x: 100, y: 50});		

			this.createObject(sf.data.objects["player"], {x: 90, y: 50, customId: "TEST"});	

		}else{
			let map = JSON.parse(buffer);

			map.objects.forEach((obj) => {
				this.createObject(sf.data.objects[obj.parentKey], obj);
			});
		}
	}

	startCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.getObjectById(pair.bodyA.id);
			let objB = this.getObjectById(pair.bodyB.id);

			// Calculate damage as the difference of colliding velocities
			let damageVector = Matter.Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity);
			let damage = Math.round(Math.abs(Matter.Vector.magnitude(damageVector)));

			// Threshold damage to 6, around freefall state
			if(damage >= 6){
				if(objA) objA.dealDamage(damage); 
				if(objB) objB.dealDamage(damage);
			}

			if(objA && objB){
				objA.addCollision(objB, pair.collision);
				objB.addCollision(objA, pair.collision);
			}
		});
	}

	endCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.getObjectById(pair.bodyA.id);
			let objB = this.getObjectById(pair.bodyB.id);

			if(objA && objB){
				objA.removeCollision(objB);
				objB.removeCollision(objA);
			}
		});
	}

	getMousePosition(){
		return {
			x: (sf.input.mouse.x / this.camera.zoom) + this.camera.x,
			y: (sf.input.mouse.y / this.camera.zoom) + this.camera.y 
		};
	}

	update(ms){	
		
		this.objects.forEach((obj) => {
			obj.update(ms);
		});

		Matter.Engine.update(this.engine, ms);

		this.updateCamera();
	}

	draw(){
		sf.ctx.save();

		sf.ctx.scale(this.camera.zoom, this.camera.zoom);
		sf.ctx.translate(-this.camera.x, -this.camera.y);

		this.objects.forEach((obj) => {
			obj.draw();
		});

		sf.ctx.restore();
	}

	updateCamera(){
		let positions = [];

		this.objects.forEach((obj) => {
			if(obj.constructor.name == "Player")
				positions.push(obj.position);
		});

		let bounds = Matter.Bounds.create(positions);
		bounds.min.x -= 32;
		bounds.min.y -= 64;
		bounds.max.x += 32;
		bounds.max.y += 64;

		let width = bounds.max.x - bounds.min.x;
		let height = bounds.max.y - bounds.min.y;

		if(width > height)
			var scale = sf.canvas.width / width;
		else	
			var scale = sf.canvas.height / height;

		scale = Math.round(scale);

		this.request_camera = {
			x: (bounds.min.x + width / 2) - (sf.canvas.width / scale) / 2,
			y: (bounds.min.y + height / 2) - (sf.canvas.height / scale) / 2,
			zoom: scale
		};

		let diff = (this.request_camera.x - this.camera.x) / 25;
		this.camera.x += diff;

		diff = (this.request_camera.y - this.camera.y) / 25;
		this.camera.y += diff;

		diff = (this.request_camera.zoom - this.camera.zoom) / 25;
		this.camera.zoom += diff;
	}

	createObject(parent, ...params){

		var obj = new parent.type(parent, ...params, {parent: parent});

		Matter.Composite.add(this.world, obj.body);
		this.objects.push(obj);

		return obj;
	}

	createForce(src, circle, force){

		// Collision check body
		let body = Matter.Bodies.circle(circle.x, circle.y, circle.radius);
		
		let collisions = Matter.Query.collides(body, Matter.Composite.allBodies(this.world));

		// Foreach collision check it's not the source and apply the force
		collisions.forEach((collision) => {
			let obj = this.getObjectById(collision.bodyA.id);

			if(src != obj){
				Matter.Body.applyForce(
					obj.body, 
					body.position, 
					force
					);

				obj.dealDamage(force.damage);
			}
		});
	}

	kill(object){
		let index = this.objects.indexOf(object);

		// Remove collisions to this object
		this.objects.forEach((obj) => {
			obj.removeCollision(object);
		});

		// Remove all references to the object
		this.objects.splice(index, 1);
		Matter.Composite.remove(this.world, object.body);
	}

	getObjectById(id){

		for(let i = 0; i < this.objects.length; i ++){

			if(this.objects[i].id == id)
				return this.objects[i];
		}
		return null;
	}

	getObjectByCustomId(customId){

		for(let i = 0; i < this.objects.length; i ++){

			if(this.objects[i].customId == customId)
				return this.objects[i];
		}
		return null;		
	}

	getObjectsByAABB(...points){
		let bounds = Matter.Bounds.create(points);
		let bodies = Matter.Query.region(Matter.Composite.allBodies(this.world), bounds);
		let objects = [];

		bodies.forEach((body) => {
			objects.push(this.getObjectById(body.id));
		});
		return objects;
	}
};