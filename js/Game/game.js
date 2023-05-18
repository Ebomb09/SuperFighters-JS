import sf from "../sf";

const PlayerType = {
	Local: 0,
	Net: 1
};

const sounds = {
	explosion: [
		sf.data.loadAudio("sounds/explosion00.mp3"),
		sf.data.loadAudio("sounds/explosion01.mp3"),
		sf.data.loadAudio("sounds/explosion02.mp3"),
		sf.data.loadAudio("sounds/explosion03.mp3")
		],
	ambient: [
		sf.data.loadAudio("sounds/ambient_loop_1.ogg", 0.05, true)
		]
};

export default class Game{

	constructor(options){

		// Play an ambient noise
		sf.data.playAudio(sounds.ambient);

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
				profile: sf.config.profiles[i]
			});
		}

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
								this.ws.send(JSON.stringify({"type": "join_game", "game_id": options.join, "players": this.players}));
							
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
			// Reset physics world
			this.engine = Matter.Engine.create({gravity: {x: 0, y: 0}});
			this.world = this.engine.world;
			this.objects = [];

			// Collision Handlers
			this.detector = Matter.Detector.create();
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
				if(obj)
					objects.push(this.createObject(sf.data.objects[obj.parentKey], obj));
			});
		}

		return objects;
	}

	restartGame(){
		this.frameCounter = 0;
		this.lastWeaponDrop = 0;
		this.gameOver = false;
		this.loadMap(this.map);
		this.createPlayers();
	}

	catchupGameState(states){

		// Catch up game state
		for(let i = 0; i < states.length; i++){
			const frame = states[i].frameCounter;
			const playerState = states[i].players;

			if(frame != this.frameCounter)
				continue;

			if(playerState){

				// Update local players object
				this.players = this.players.filter(ply => ply.type == PlayerType.Local);
				const localPlayers = playerState.filter(ply => ply.netId == this.ws.connectionId);

				if(this.players.length <= localPlayers.length){

					for(let i = 0; i < this.players.length; i ++){
						this.players[i].input = localPlayers[i].input;
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
			}

			// Update the game if not the most current
			if(states[i] != states.at(-1))
				this.update(1000 / sf.config.fps, true);
		}
	}

	setGameState(state){
		this.loadMap(state.map);
		this.frameCounter = state.frameCounter;
		this.gameOver = state.gameOver;
	}

	onClientMessage(event){
		const msg = JSON.parse(event.data);

		switch(msg.type){

			case "join_game":
				if(msg.status == "fail")
					this.ws.close();
				break;

			case "update_game_state":

				if(!msg.state || msg.state.length == 0)
					break;

				// Run on next game update
				this.nextUpdate = () => {
					const currentState = msg.state.at(-1);
					const frameDiff = currentState.frameCounter - this.frameCounter;

					// Out of sync with Host
					if(frameDiff < 0 || frameDiff > msg.state.length-1){

						this.setGameState(msg.state.at(0));

					// Behind in frames of Host
					}else if(frameDiff != 0){

						// Last frame for current remaining for previous frames
						this.setGameState(msg.state.at(-1 - frameDiff));
					}

					this.catchupGameState(msg.state);	
				}

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

				msg.players.forEach((ply) => {
					this.players.push({type: PlayerType.Net, id: msg.connection_id, profile: ply.profile});
				});
				break;

			case "player_left_game":

				if(!msg.connection_id)
					break;

				for(let i = 0; i < this.players.length; i ++){

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
				profile: this.players[i].profile,
				matter:{
					position: spawns[i].getPosition()
				}
			});
			this.players[i].objectId = object.id;
		}
	}

	handlePlayerInput(){

		this.players.forEach((player) => {

			if(!player.input) player.input = {};

			const obj = this.getObjectById(player.objectId);
			const input = player.input;

			// Update local player configured controls
			if(player.type == PlayerType.Local){

				const config = sf.config.controls[player.id];

				if(config){
					input.aim 				= sf.input.key.held[config.aim];
					input.down 				= sf.input.key.held[config.down];
					input.up 				= sf.input.key.held[config.up];
					input.right 			= sf.input.key.held[config.right];
					input.left 				= sf.input.key.held[config.left];
					input.secondaryAttack 	= sf.input.key.pressed[config.secondaryAttack];
					input.primaryAttack 	= sf.input.key.pressed[config.primaryAttack];
					input.interact 			= sf.input.key.pressed[config.interact];
				}
			}
		});
	}

	handleWeaponDrops(){

		const diff = this.frameCounter - this.lastWeaponDrop;

		if(diff > 300){
			this.lastWeaponDrop = this.frameCounter;

			// Randomly sort weapon drops
			const spawns = this.getObjectsByParent(sf.data.objects.weapon_spawn);

			spawns.sort((a, b) => { 
				if(Math.random() < 0.5)
					return 1; 
				else
					return -1;
			});

			// Get all weapon parent objects
			const weaponKeys = Object.keys(sf.data.objects).filter(key => sf.data.objects[key].category & sf.filters.weapon);

			weaponKeys.sort((a, b) => { 
				if(Math.random() < 0.5)
					return 1; 
				else
					return -1;
			});

			// Check if the spawn doesn't already have a weapon associated with it
			for(let i = 0; i < spawns.length; i ++){
				const obj = this.getObjectById(spawns[i].targetAId);

				if(!obj){
					const weapon = this.createObject(sf.data.objects[weaponKeys[0]], 
						{
							lifeTime: 1500,
							matter: {
								position: spawns[i].getPosition()
							}
						});
					spawns[i].targetAId = weapon.id;
					break;
				}
			}
		}
	}

	collisionUpdate(){

		Matter.Detector.setBodies(this.detector, this.world.bodies);
		const collisions = Matter.Detector.collisions(this.detector);

		// Create temporary collision lists
		const temp = {};

		this.objects.forEach((obj) => {

			if(!obj.body)
				return;
			
			temp[obj.id] = [];
		});

		collisions.forEach((collision) => {
			const objA = this.getObjectByBody(collision.bodyA);
			const objB = this.getObjectByBody(collision.bodyB);

			if(objA && objB){

				temp[objA.id].push(objB.id);
				objA.addCollision(objB, collision);

				temp[objB.id].push(objA.id);
				objB.addCollision(objA, collision);
			}
		});

		// Update objects collision lists
		this.objects.forEach((obj) => {

			if(!obj.body)
				return;

			for(let i = 0; i < obj.collisions.length; i ++){

				if(temp[obj.id].indexOf(obj.collisions[i].objectId) == -1)
					obj.removeCollision(obj.collisions[i].objectId);
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

		if(!catchup){

			if(this.nextUpdate){
				const func = this.nextUpdate;
				this.nextUpdate = null;
				func();
			}

			// Handle incoming player input
			this.handlePlayerInput();

			// Update camera position
			this.updateCamera();

			// Check if using WebSockets
			if(this.ws && this.ws.readyState == WebSocket.OPEN){

				// Server Mode
				if (this.ws.serverMode){

					if(!this.prevStates)
						this.prevStates = [];

					// More than 10 frames captured then remove oldest frame
					if(this.prevStates.length > 10)
						this.prevStates.splice(0, 1)

					// Generate current state and push to the front
					const allPlayers = this.players.map((ply) => {

						return {
							objectId: ply.objectId,
							netId: (ply.type == PlayerType.Local) ? this.ws.connectionId : ply.id,
							input: ply.input
						};
					});

					const currentState = {
						map: this.saveMap(),
						players: allPlayers,
						frameCounter: this.frameCounter,
						gameOver: this.gameOver
					};

					this.prevStates.push(currentState);

					// Send it to all connected clients
					this.ws.send(JSON.stringify({
						type: "update_game_state",
						state: this.prevStates,
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

		// Check who won
		if(!this.gameOver){
			let count = 0;
			let winner = null;

			this.players.forEach((player) => {
				const obj = this.getObjectById(player.objectId);

				if(obj){
					count ++;
					winner = player;
				}
			});

			if(count <= 1 && this.players.length > 1){
				this.gameOver = true;
				this.nextGame = Date.now() + 5000;
				console.log("Winner is ", winner);
			}

		}else{

			if(Date.now() >= this.nextGame)
				this.restartGame();
		}

		this.handleWeaponDrops();

		// Send input to player objects
		this.players.forEach((ply) => {
			const obj = this.getObjectById(ply.objectId);

			if(obj)
				obj.input = ply.input;
		});

		// Generic object update
		this.objects.forEach((obj) => {
			obj.update(ms);
		});

		// Matter physics update step
		Matter.Engine.update(this.engine, ms);
		this.collisionUpdate();

		this.frameCounter ++;
	}

	draw(){
		sf.ctx.save();

		sf.ctx.scale(this.camera.zoom, this.camera.zoom);
		sf.ctx.translate(-this.getCameraRealPosition().x, -this.getCameraRealPosition().y);

		// Set draw order
		const order = [
			sf.filters.background,
			/*sf.filters.marker,*/
			sf.filters.ladder,
			sf.filters.platform,
			sf.filters.decoration,
			sf.filters.object,
			sf.filters.player,
			sf.filters.weapon,
			sf.filters.projectile,
			sf.filters.effect
			];

		order.forEach((filter) => {

			this.objects.filter(obj => obj.body && obj.body.collisionFilter.category == filter).forEach((obj) => {
				obj.draw();
			});
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

		if(obj.body){
			Matter.Composite.add(this.world, obj.body);

			// Hack the velocity into actually being set on creation
			Matter.Body.setVelocity(obj.body, obj.body.velocity);
			Matter.Body.setAngularVelocity(obj.body, obj.body.angularVelocity);
		}

		return obj;
	}

	prototypeObject(parent, ...params){
		return new parent.type({id: this.getNextUniqueId()}, parent, ...params, {parent: parent});
	}

	getNextUniqueId(){
		let highest = -1;

		this.objects.forEach((obj) => {

			if(obj.id > highest)
				highest = obj.id;
		});
		return highest+1;
	}

	createExplosion(circle, forceMultiplier){

		// Explosion hitbox and collision check
		const body = Matter.Bodies.circle(circle.x, circle.y, circle.radius);
		const collisions = Matter.Query.collides(body, Matter.Composite.allBodies(this.world));	

		collisions.forEach((collision) => {
			const obj = this.getObjectByBody(collision.bodyA);

			if(!obj)
				return;

			const difference = Matter.Vector.sub(obj.getPosition(), circle);
			const direction = Matter.Vector.normalise(difference);
			const distance = Matter.Vector.magnitude(difference);

			const distanceMultiplier = (distance <= circle.radius) ? ((circle.radius - distance) / circle.radius) : 0;

			const force = Matter.Vector.mult(direction, forceMultiplier * distanceMultiplier);

			Matter.Body.applyForce(obj.body, circle, force);

			obj.dealDamage(distanceMultiplier * circle.radius, "explosion");
		});

		// Create multiple visual explosions
		const relative = [];

		for(let i = 0; i < 6; i ++){
			const angle = Math.random() * 2 * Math.PI;

			relative.push({
				x: Math.cos(angle) * Math.random() * circle.radius,
				y: Math.sin(angle) * Math.random() * circle.radius
			});
		}

		// Explosion effects
		relative.forEach((pos) => {
			const relativePos = {x: circle.x + pos.x, y: circle.y + pos.y};

			this.createObject(sf.data.objects.explosion_large, 
				{
					matter: {
						position: relativePos
					}	
				})
		});

		sf.data.playAudio(sounds.explosion);
	}

	createForce(source, circle, force){

		// Collision check body
		const body = Matter.Bodies.circle(circle.x, circle.y, circle.radius);
		
		const collisions = Matter.Query.collides(body, Matter.Composite.allBodies(this.world));
		let collided = false;

		// Foreach collision check it's not the source and apply the force
		collisions.forEach((collision) => {
			const obj = this.getObjectByBody(collision.bodyA);

			if(obj && source != obj){
				Matter.Body.applyForce(obj.body, body.position, force);
				obj.dealDamage(force.damage, "melee");
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
			const obj = this.getObjectByBody(body);

			if(obj)
				objects.push(obj);
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