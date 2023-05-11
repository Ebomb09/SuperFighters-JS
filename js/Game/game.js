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
		this.players 		= [];

		const local_players	= (options.local_players) ? options.local_players : 0;

		for(let i = 0; i < local_players; i ++){
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

		if(options.host || options.join){

			// Connect to master server
			try{
				this.ws = new WebSocket(master_server);

			}catch(error){
				this.ws = null;
			}

			if(this.ws){
				this.ws.onerror = (event) => { this.ws.close(); }
				this.ws.onclose = (event) => { this.ws = null; }

				// Check first response to ensure connection is valid
				this.ws.onmessage = (event) => {
					const msg = JSON.parse(event.data);

					switch(msg.type){

						case "connect":

							if(!msg.connection_id)
								this.ws.close();

							this.ws.connectionId = msg.connection_id;

							if(options.join){
								this.ws.onmessage = this.onClientMessage.bind(this);
								this.ws.send(JSON.stringify({"type": "join_game", "game_id": options.join, "players": local_players}));
							
							}else if(options.host){
								this.ws.serverMode = true;
								this.ws.onmessage = this.onServerMessage.bind(this);
								this.ws.send(JSON.stringify({"type": "create_game"}));
							}
							break;

						default:
							this.ws.close();
							break;
					}
				};
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
		
		// Parse the buffer contents
		try{
			var map = JSON.parse(buffer);
			var objects = [];

		}catch(error){
			return [];
		}

		if(map.objects){
			map.objects.forEach((obj) => {
				objects.push(this.createObject(sf.data.objects[obj.parentKey], obj));
			});
		}

		return objects;
	}

	restartGame(){
		this.frameCounter = 0;
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

				if(!msg.state || !msg.state.map || !msg.state.players || !msg.state.frameCounter)
					break;

				const frameDiff = msg.state.frameCounter - this.frameCounter;

				// Reload the game state
				if(frameDiff >= 30 || frameDiff < 0){
					this.loadMap(msg.state.map);
					this.frameCounter = msg.state.frameCounter;

				// Catch up game state
				}if(frameDiff > 0){

					for(let i = 0; i < frameDiff; i++){
						const playerState = msg.state.players.at(-2 - i);

						if(!playerState)
							continue;

						// Update local players object
						this.players = this.players.filter(ply => ply.type == PlayerType.Local);
						const localPlayers = playerState.filter(ply => ply.netId == this.ws.connectionId);

						if(this.players.length <= localPlayers.length){

							for(let i = 0; i < this.players.length; i ++){
								this.players[i].objectId = localPlayers[i].objectId;
							}
						}

						// Recreate all remaining net player
						playerState.filter(ply => ply.netId != this.ws.connectionId).forEach((ply) => {
							this.players.push({
								type: PlayerType.Net,
								id: ply.netId,
								objectId: ply.objectId,
								input: ply.input
							});
						});

						// Update the game
						this.update(1000 / sf.config.fps, true);
					}
				}

				// Set the current input
				const playerState = msg.state.players.at(-1);

				// Update local players object
				this.players = this.players.filter(ply => ply.type == PlayerType.Local);
				const localPlayers = playerState.filter(ply => ply.netId == this.ws.connectionId);

				if(this.players.length <= localPlayers.length){

					for(let i = 0; i < this.players.length; i ++){
						this.players[i].objectId = localPlayers[i].objectId;
					}
				}

				// Recreate all remaining net player
				playerState.filter(ply => ply.netId != this.ws.connectionId).forEach((ply) => {
					this.players.push({
						type: PlayerType.Net,
						id: ply.netId,
						objectId: ply.objectId,
						input: ply.input
					});
				});
				break;

			case "upgrade":
				this.ws.serverMode = true;
				this.ws.onmessage = this.onServerMessage.bind(this);
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

			case "update_player_input":

				if(!msg.input || !msg.connection_id)
					break;

				let player = 0;

				this.players.filter(ply => ply.id == msg.connection_id && ply.type == PlayerType.Net).forEach((ply) => {
					ply.input = msg.input[player++];				
				});
				break;

			case "player_joined_game":

				if(!msg.players || !msg.connection_id)
					break;

				for(let i = 0; i < msg.players; i ++){
					this.players.push({type: PlayerType.Net, id: msg.connection_id})
				}
				break;

			case "player_left_game":

				if(!msg.connection_id)
					break;

				for(let i = 0; i <
					this.players.length; i ++){

					if(this.players[i].type == PlayerType.Net && this.players[i].id == msg.connection_id){
						this.players.splice(i, 1);
						break;
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
			const object = this.createObject(sf.data.objects.player, { 
				matter:{
					position: spawns[i].getPosition()
				}
			});
			this.players[i].objectId = object.id;
		}
	}

	handlePlayerInput(){

		for(let i = 0; i < this.players.length; i ++){
			const player = this.getObjectById(this.players[i].objectId);
			const input = this.players[i].input;

			// Player must still be present in-game
			if(!player || !input)
				continue;

			// Send input states to the player
			if(input.aim) 				player.aim();
			if(input.down) 				player.moveDown();
			if(input.up) 				player.moveUp();
			if(input.right) 			player.moveRight();
			if(input.left) 				player.moveLeft();
			if(input.secondaryAttack) 	player.secondaryAttack();
			if(input.primaryAttack) 	player.attack();
			if(input.interact) 			player.interact();
		};
	}

	startCollision(event){

		event.pairs.forEach((pair) => {
			const objA = this.getObjectByBody(pair.bodyA);
			const objB = this.getObjectByBody(pair.bodyB);

			if(objA && objB){
				objA.addCollision(objB, pair.collision);
				objB.addCollision(objA, pair.collision);
			}
		});
	}

	endCollision(event){

		event.pairs.forEach((pair) => {
			const objA = this.getObjectByBody(pair.bodyA);
			const objB = this.getObjectByBody(pair.bodyB);

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

	update(ms, catchup){

		// Update local player configured controls
		this.players.forEach((player) => {

			if(player.type != PlayerType.Local && player.id >= 0)
				return;

			// Get controls from local config
			const config = sf.config.controls[player.id];

			// Set player input states
			if(!player.input)
				player.input = {};

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
		if(!catchup){

			if(this.ws && this.ws.readyState == WebSocket.OPEN){

				// Server Mode
				if (this.ws.serverMode){

					// Get all players
					const allPlayers = this.players.map((ply) => {

						return {
							objectId: ply.objectId,
							netId: (ply.type == PlayerType.Local) ? this.ws.connectionId : ply.id,
							input: ply.input
						};
					});

					if(!this.prevPlayerState)
						this.prevPlayerState = [];

					// More than 30 frames captured then remove oldest frame + current frame
					if(this.prevPlayerState.length >= 31)
						this.prevPlayerState.splice(0, 1)

					this.prevPlayerState.push(allPlayers);

					this.ws.send(JSON.stringify({
						type: "update_game_state",
						state: {
							map: this.saveMap(),
							players: this.prevPlayerState,
							frameCounter: this.frameCounter
						},
					}));

				// Client Mode
				}else{

					// Send all local player input
					const localPlayerInput = this.players.filter(ply => ply.type == PlayerType.Local).map(ply => ply.input);

					this.ws.send(JSON.stringify({
						type: "update_player_input",
						input: localPlayerInput
					}));
				}
			}
		}

		this.frameCounter ++;
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
			positions.push(obj.getPosition());
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

		const obj = this.prototypeObject(parent, ...params);
		this.objects.push(obj);

		if(obj.body)
			Matter.Composite.add(this.world, obj.body);

		return obj;
	}

	prototypeObject(parent, ...params){
		return new parent.type({id: this.getNextUniqueId()}, parent, ...params, {parent: parent});;
	}

	getNextUniqueId(){
		let highest = -1;

		this.objects.forEach((obj) => {

			if(obj.id > highest)
				highest = obj.id;
		});
		return highest+1;
	}

	createForce(source, circle, force){

		// Collision check body
		let body = Matter.Bodies.circle(circle.x, circle.y, circle.radius);
		
		let collisions = Matter.Query.collides(body, Matter.Composite.allBodies(this.world));
		let collided = false;

		// Foreach collision check it's not the source and apply the force
		collisions.forEach((collision) => {
			const obj = this.getObjectByBody(collision.bodyA);

			if(obj && source != obj){
				Matter.Body.applyForce(
					obj.body, 
					body.position, 
					force
					);

				obj.dealDamage(force.damage);

				collided = true;
			}
		});

		if(collided)
			sf.game.createObject(sf.data.objects.hit, {matter: { position: circle }});
	}

	getObjectById(id){

		for(let i = 0; i < this.objects.length; i ++){

			if(this.objects[i].id == id)
				return this.objects[i];
		}
		return null;
	}

	getObjectByBody(body){

		for(let i = 0; i < this.objects.length; i ++){

			if(body.clientId == this.objects[i].id)
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
			objects.push(this.getObjectByBody(body));
		});
		return objects;
	}

	getObjectsByAABB(bounds){
		let bodies = Matter.Query.region(Matter.Composite.allBodies(this.world), bounds);
		let objects = [];

		bodies.forEach((body) => {
			const obj = this.getObjectByBody(body);
			if(obj) objects.push(obj);
		});
		return objects;
	}

	getPlayers(){
		return this.getObjectsByParent(sf.data.objects.player);
	}
};