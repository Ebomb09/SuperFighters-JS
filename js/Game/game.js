import sf from "../sf";

export default class Game{

	constructor(map, options){

		// Init physics world
		this.engine = Matter.Engine.create({gravity: {x: 0, y: 0}});
		this.world = this.engine.world;

		// Custom Gravity Constant
		this.gravity = {x: 0, y: 0.001};

		// Camera
		this.camera = {
			x: 0,
			y: 0,
			zoom: 1
		};

		// Assign players
		this.local_players 	= (options.local_players) ? options.local_players : 0;
		this.net_players 	= (options.net_players) ? options.net_players : 0;
		this.players 		= [];

		// Collision Handlers
		Matter.Events.on(this.engine, "collisionStart", this.startCollision.bind(this));
		Matter.Events.on(this.engine, "collisionEnd", this.endCollision.bind(this));

		// Custom game objects
		this.objects = [];

		// Load map and assign players
		if(map){
			this.loadMap(map);
			this.createPlayers();
		}
	}

	saveMap(objects){

		if(objects === undefined) objects = this.objects;

		let map = {
			objects: []
		};

		objects.forEach((obj) => {

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

	loadMap(buffer, add){

		// Clear all objects if you not request to add them
		if(!add){
			Matter.Composite.clear(this.world);
			this.objects = [];
		}
		
		let map = JSON.parse(buffer);
		let objects = [];

		map.objects.forEach((obj) => {
			objects.push(this.createObject(sf.data.objects[obj.parentKey], obj));
		});

		return objects;
	}

	createPlayers(){
		let spawns = this.getObjectsByParent(sf.data.objects.player_spawn);

		if(spawns.length == 0)
			return;

		// Randomly sort the array
		spawns.sort((a, b) => { 
			if(Math.random() < 0.5) 
				return 1; 
			else
				return -1;
		});

		// Repeat until the spawns can fulfill the players
		while(spawns.length < (this.local_players + this.net_players)){
			spawns = spawns.concat(spawns.copyWithin(0));
		}

		// Create players within the spawns
		this.players = [];

		for(let i = 0; i < this.local_players; i ++){
			this.players.push(
				{
					type: "local",
					id: i,
					object: this.createObject(sf.data.objects.player, spawns[i].position)
				});
		}

		for(let i = 0; i < this.net_players; i ++){
			this.players.push(
				{
					type: "net",
					id: i,
					object: this.createObject(sf.data.objects.player, spawns[i].position)
				});
		}
	}

	handlePlayerInput(){

		for(let i = 0; i < this.players.length; i ++){
			const player = this.players[i].object;

			// Get controls
			if(this.players[i].type == "local")
				var controls = sf.config.controls[i];

			// If no control config received move to next player
			if(!controls)
				continue;

			if(sf.input.key.held[controls.aim])
				player.aim();

			if(sf.input.key.held[controls.down])
				player.moveDown();

			if(sf.input.key.held[controls.up])
				player.moveUp();

			if(sf.input.key.held[controls.right])
				player.moveRight();

			if(sf.input.key.held[controls.left])
				player.moveLeft();

			if(sf.input.key.pressed[controls.secondaryAttack])
				player.secondaryAttack();
			
			if(sf.input.key.pressed[controls.primaryAttack])
				player.attack();

			if(sf.input.key.pressed[controls.interact])
				player.interact();
		};
	}

	startCollision(event){

		event.pairs.forEach((pair) => {
			let objA = this.getObjectById(pair.bodyA.id);
			let objB = this.getObjectById(pair.bodyB.id);

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

		this.handlePlayerInput();

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

		this.getObjectsByParent(sf.data.objects.player).forEach((obj) => {
			positions.push(obj.position);
		});

		let bounds = Matter.Bounds.create(positions);
		bounds.min.x -= 32;
		bounds.min.y -= 64;
		bounds.max.x += 32;
		bounds.max.y += 64;

		const width = bounds.max.x - bounds.min.x;
		const height = bounds.max.y - bounds.min.y;

		if(width > height)
			var scale = sf.canvas.width / width;
		else	
			var scale = sf.canvas.height / height;

		scale = Math.round(scale);

		const camera = {
			x: this.camera.x + (sf.canvas.width / 2) / this.camera.zoom,
			y: this.camera.y + (sf.canvas.height / 2) / this.camera.zoom,
			zoom: this.camera.zoom		
		};

		const request = {
			x: bounds.min.x + width / 2,
			y: bounds.min.y + height / 2,
			zoom: scale
		};

		this.camera.x 		+= (request.x - camera.x) / 25;
		this.camera.y 		+= (request.y - camera.y) / 25;
		this.camera.zoom 	+= (request.zoom - camera.zoom) / 25;
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

	getObjectsByParent(parent){
		let objects = [];

		for(let i = 0; i < this.objects.length; i ++){

			if(this.objects[i].parent == parent)
				objects.push(this.objects[i]);
		}
		return objects;		
	}

	getObjectsByPoints(...points){
		let bounds = Matter.Bounds.create(points);
		let bodies = Matter.Query.region(Matter.Composite.allBodies(this.world), bounds);
		let objects = [];

		bodies.forEach((body) => {
			objects.push(this.getObjectById(body.id));
		});
		return objects;
	}

	getObjectsByAABB(bounds){
		let bodies = Matter.Query.region(Matter.Composite.allBodies(this.world), bounds);
		let objects = [];

		bodies.forEach((body) => {
			objects.push(this.getObjectById(body.id));
		});
		return objects;
	}
};