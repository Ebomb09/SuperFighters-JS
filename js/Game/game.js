import sf from "../sf";

const PlayerType = {
	Local: 0,
	Net: 1
};

export default class Game{

	constructor(options){

		// Init physics world
		this.engine = Matter.Engine.create({gravity: {x: 0, y: 0}});
		this.world = this.engine.world;

		// Collision Handlers
		Matter.Events.on(this.engine, "collisionStart", this.startCollision.bind(this));
		Matter.Events.on(this.engine, "collisionEnd", this.endCollision.bind(this));

		// Custom Gravity Constant
		this.gravity = {x: 0, y: 0.001};

		// Camera
		this.camera = {
			x: 0,
			y: 0,
			zoom: 1
		};

		// Assign players
		this.max_players 	= (options.max_players) ? options.max_players : 1;
		this.local_players	= (options.local_players) ? options.local_players : 0;
		this.players 		= [];

		for(let i = 0; i < this.local_players; i ++){
			this.players.push({
				type: PlayerType.Local, 
				id: i,
				input: {}
			});
		}

		// Custom game objects
		this.objects = [];

		// Load map and assign players
		this.map = (options.map) ? options.map : "{}";

		if(options.host || options.client){
			// Connect to master server
			this.ws = new WebSocket(master_server);

			this.ws.onerror = (event) => { this.ws.close(); }
			this.ws.onclose = (event) => { this.ws = null; }

			// Client connection
			if(options.client){
				this.ws.onopen = (event) => {
					this.ws.send(JSON.stringify({"type": "join_game", "game_id": options.client, "players": this.local_players}));
				};
				this.ws.onmessage = this.onClientMessage.bind(this);

			// Host start
			}else{
				this.ws.onopen = (event) => {
					this.ws.send(JSON.stringify({"type": "create_game"}));
				};
				this.ws.onmessage = this.onServerMessage.bind(this);
			}
		}

		this.restartGame();
	}

	saveMap(objects){

		if(objects === undefined) objects = this.objects;

		let map = {
			objects: []
		};

		objects.forEach((obj) => {

			let keys = Object.keys(sf.data.objects);
			let values = Object.values(sf.data.objects);

			map.objects.push(obj.serialize());
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

		if(map.objects){
			map.objects.forEach((obj) => {
				objects.push(this.createObject(sf.data.objects[obj.parentKey], obj));
			});
		}

		return objects;
	}

	restartGame(){
		this.loadMap(this.map);
		this.createPlayers();
	}

	onClientMessage(event){
		const msg = JSON.parse(event.data);

		switch(msg.type){

			case "join_game":
				if(msg.status == "fail")
					this.ws.close();
				break;

			case "update_game_state":
				if(msg.status == "ok")
					this.loadMap(msg.state.map);
				break;
		}
	}

	onServerMessage(event){
		const msg = JSON.parse(event.data);

		switch(msg.type){

			case "create_game":
				if(msg.status == "fail")
					this.ws.close();
				break;

			case "update_game_state":
				if(msg.status == "ok"){
					let player = 0;

					this.players.filter(ply => ply.type == PlayerType.Net).forEach((ply) => {

						if(msg.state.input[ply.id]){
							ply.input = msg.state.input[ply.id][player];
							player += 1;
						}
					});
				}
				break;

			case "player_joined_game":
				if(msg.status == "ok"){

					for(let i = 0; i < msg.players; i ++){
						this.players.push({type: PlayerType.Net, id: msg.player_id})
					}
				}
				break;

			case "player_left_game":
				if(msg.status == "ok"){

					for(let i = 0; i <
						this.players.length; i ++){

						if(this.players[i].type == PlayerType.Net && this.players[i].id == msg.player_id){
							this.players.splice(i, 1);
							break;
						}
					}
				}
				break;
		}		
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
		while(spawns.length < this.players.length){
			spawns = spawns.concat(spawns.copyWithin(0));
		}

		// Create players within the spawns
		for(let i = 0; i < this.players.length; i ++){
			this.players[i].object = this.createObject(sf.data.objects.player, spawns[i].position);
		}
	}

	handlePlayerInput(){

		for(let i = 0; i < this.players.length; i ++){
			const player = this.players[i].object;
			const input = this.players[i].input;

			// Player must still be present in-game
			if(!player || !input)
				continue;

			if(input.aim)
				player.aim();

			if(input.down)
				player.moveDown();

			if(input.up)
				player.moveUp();

			if(input.right)
				player.moveRight();

			if(input.left)
				player.moveLeft();

			if(input.secondaryAttack)
				player.secondaryAttack();
			
			if(input.primaryAttack)
				player.attack();

			if(input.interact)
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
			x: (sf.input.mouse.x / this.camera.zoom) + this.getCameraRealPosition().x,
			y: (sf.input.mouse.y / this.camera.zoom) + this.getCameraRealPosition().y 
		};
	}

	update(ms){	

		// Update local player configured controls
		this.players.forEach((player) => {

			if(player.type != PlayerType.Local)
				return;

			// Get controls from local config
			const config = sf.config.controls[player.id];

			// Set player input states
			const input = player.input;

			input.aim 				= sf.input.key.held[config.aim];
			input.down 				= sf.input.key.held[config.down];
			input.up 				= sf.input.key.held[config.up];
			input.right 			= sf.input.key.held[config.right];
			input.left 				= sf.input.key.held[config.left];
			input.secondaryAttack 	= sf.input.key.pressed[config.secondaryAttack];
			input.primaryAttack 	= sf.input.key.pressed[config.primaryAttack];
			input.interact 			= sf.input.key.pressed[config.interact];
		});

		if(sf.input.key.pressed["Space"])
			this.restartGame();

		this.objects.forEach((obj) => {
			obj.update(ms);
		});

		this.handlePlayerInput();

		Matter.Engine.update(this.engine, ms);

		this.updateCamera();

		// Check if using WebSockets
		if(this.ws && this.ws.readyState == WebSocket.OPEN){

			// Send all local player input
			let localPlayerInput = [];

			this.players.filter(ply => ply.type == PlayerType.Local).forEach((ply) => {
				localPlayerInput.push(ply.input);
			});

			this.ws.send(JSON.stringify({
				type: "update_game_state",
				state: {
					map: this.saveMap(),
					input: localPlayerInput
				}
			}));
		}
	}

	draw(){
		sf.ctx.save();

		sf.ctx.scale(this.camera.zoom, this.camera.zoom);
		sf.ctx.translate(-this.getCameraRealPosition().x, -this.getCameraRealPosition().y);
		
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

		if(positions.length == 0)
			return;

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

		const request = {
			x: bounds.min.x + width / 2,
			y: bounds.min.y + height / 2,
			zoom: scale
		};

		this.camera.x 		+= (request.x - this.camera.x) / 25;
		this.camera.y 		+= (request.y - this.camera.y) / 25;
		this.camera.zoom 	+= (request.zoom - this.camera.zoom) / 25;
	}

	getCameraRealPosition(){
		return {
			x: this.camera.x - (sf.canvas.width / 2) / this.camera.zoom,
			y: this.camera.y - (sf.canvas.height / 2) / this.camera.zoom
		};
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

	getPlayers(){
		return this.getObjectsByParent(sf.data.objects.player);
	}
};