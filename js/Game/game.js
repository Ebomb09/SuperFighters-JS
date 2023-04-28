import BaseObject from "./Objects/base_object";
import Player from "./Objects/player";

export default class Game{

	constructor(){

		this.engine = Matter.Engine.create();
		this.world = this.engine.world;

		Matter.Events.on(this.engine, "collisionStart", this.startCollision.bind(this));
		Matter.Events.on(this.engine, "collisionEnd", this.endCollision.bind(this));

		this.objects = [];

		this.create([
			new BaseObject(sf.data.objects["crate_hanging"], 100, 100, {isStatic: true, angle: -0.5}),
			new BaseObject(sf.data.objects["crate_hanging"], 70, 120, {isStatic: true}),
			new BaseObject(sf.data.objects["crate"], 85, 60),
			new BaseObject(sf.data.objects["crate"], 85, 70),

			new Player(100, 50)
			]);
	}

	startCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.get(pair.bodyA.id);
			let objB = this.get(pair.bodyB.id);

			objA.collisions.push(objB);
			objB.collisions.push(objA);
		});
	}

	endCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.get(pair.bodyA.id);
			let objB = this.get(pair.bodyB.id);

			objA.collisions.splice(objA.collisions.indexOf(objB), 1);
			objB.collisions.splice(objB.collisions.indexOf(objA), 1);
		});
	}

	update(ms){
		this.objects.forEach((obj) => {
			obj.update();
			obj.draw();
		});

		Matter.Engine.update(this.engine, ms);
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

	create(obj){

		if(Array.isArray(obj)){

			obj.forEach((item) => {
				this.create(item);
			});

		}else{
			Matter.Composite.add(this.world, obj.body);
			this.objects.push(obj);
		}
	}

	get(id){

		for(let i = 0; i < this.objects.length; i ++){

			if(this.objects[i].id == id)
				return this.objects[i];
		}
		return null;
	}
};