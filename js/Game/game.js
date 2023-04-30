import sf from "../sf";

export default class Game{

	constructor(){

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

		this.loadMap();
	}

	loadMap(map){
		// Create some test objects
		this.createObject(sf.data.objects["floor"], 200, 100, {tiling: {width: 5, height: 1}, angle: -0.5} );
		this.createObject(sf.data.objects["floor"], 200, 50, {tiling: {width: 5, height: 1}, angle: 0.5} );
		this.createObject(sf.data.objects["floor"], 70, 120, {tiling: {width: 8, height: 2}} );
		this.createObject(sf.data.objects["crate"], 85, 60, {frictionStatic: 50});
		this.createObject(sf.data.objects["crate"], 85, 70);

		this.createObject(sf.data.objects["player"], 100, 50);		

		var ply = this.createObject(sf.data.objects["player"], 90, 50);	
		ply.customId = "TEST";
	}

	startCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.getObjectById(pair.bodyA.id);
			let objB = this.getObjectById(pair.bodyB.id);

			// Calculate damage as the difference of colliding velocities
			let damageVector = Matter.Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity);
			let damage = Math.round(Math.abs(Matter.Vector.magnitude(damageVector)));

			// Threshold damage to 6, around freefall state
			if(damage < 6)
				damage = 0;

			if(objA != null){ objA.collisions.push(pair.collision); if(damage > 0) objA.dealDamage(damage); }
			if(objB != null){ objB.collisions.push(pair.collision); if(damage > 0) objB.dealDamage(damage); }
		});
	}

	endCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.getObjectById(pair.bodyA.id);
			let objB = this.getObjectById(pair.bodyB.id);

			if(objA != null) objA.collisions.splice(objA.collisions.indexOf(pair.collision), 1);
			if(objB != null) objB.collisions.splice(objB.collisions.indexOf(pair.collision), 1);
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

	createObject(objDef, ...params){

		// BaseObject expects the definition to get the default image
		if(objDef.type.name == "BaseObject")
			var obj = new objDef.type(objDef, ...params);
		
		// Extending classes will have their own constructors
		else
			var obj = new objDef.type(...params);

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