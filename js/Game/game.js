import sf from "../sf";

export default class Game{

	constructor(map){

		// Init physics world
		this.engine = Matter.Engine.create();
		this.world = this.engine.world;
		this.delta = 0;

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

			if(objA) objA.addCollision(objB, pair.collision);
			if(objB) objB.addCollision(objA, pair.collision);
		});
	}

	endCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.getObjectById(pair.bodyA.id);
			let objB = this.getObjectById(pair.bodyB.id);

			if(objA) objA.removeCollision(objB);
			if(objB) objB.removeCollision(objA);
		});
	}

	update(ms){	
		sf.ctx.save();

		this.delta = ms;

		if(this.debug.mode){

			// Draw Bodies
			this.draw();

			// Grab objects with mouse
			if(sf.input.mouse.held[0]){

				if(this.debug.select == null){
					let grab = Matter.Query.point(Matter.Composite.allBodies(this.world), Matter.Vector.create(sf.input.mouse.x, sf.input.mouse.y));

					if(grab.length > 0)
						this.debug.select = grab[0];
				}

				if(this.debug.select != null){
					let diff = Matter.Vector.sub(Matter.Vector.create(sf.input.mouse.x, sf.input.mouse.y), this.debug.select.position);
					diff = Matter.Vector.div(diff, 4);
					Matter.Body.setVelocity(this.debug.select, diff);
				}
			}else{
				this.debug.select = null;
			}
		}

		this.objects.forEach((obj) => {
			obj.update();
			obj.draw();
		});

		Matter.Engine.update(this.engine, ms);

		sf.ctx.restore();
	}

	// Draw Polygonal Shape
	draw(){
		Matter.Composite.allBodies(this.world).forEach((body) => {

			sf.ctx.beginPath();

			let start = body.vertices.at(-1);
			sf.ctx.moveTo(start.x, start.y);

			for(let i = 0; i < body.vertices.length; i ++){
				let end = body.vertices[i];
				sf.ctx.lineTo(end.x, end.y);
				sf.ctx.moveTo(end.x, end.y);
			}

			sf.ctx.stroke();
		});
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
};