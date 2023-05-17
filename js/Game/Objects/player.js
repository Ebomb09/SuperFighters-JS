import sf from "../../sf";
import BaseObject from "./base_object";

const State = {
	None: 			"none",
	Jumping: 		"jumping",
	Grounded: 		"grounded",
	Damaged: 		"damaged", 
	Stun: 			"grounded_damaged_stun", 
	Recovering: 	"grounded_damaged_recovering",
	FreeFalling: 	"free_falling",
	Walking: 		"grounded_walking", 
	Running: 		"grounded_running", 
	Crouching: 		"grounded_crouching", 
	Rolling: 		"grounded_rolling", 
	Attacking: 		"attacking", 
	Punching: 		"grounded_attacking_punching",
	Punching1: 		"grounded_attacking_punching1",
	Punching2: 		"grounded_attacking_punching2",
	Punching3: 		"grounded_attacking_punching3",
	JumpPunching: 	"jumping_attacking_punching",
	Kicking: 		"grounded_attacking_kicking",
	JumpKicking: 	"jumping_attacking_kicking",
	Aiming: 		"grounded_aiming", 
	Drawing: 		"grounded_drawing",
	Shooting: 		"grounded_aiming_shooting",
	Climbing: 		"climbing"
};

const Inventory = {
	Melee: 		0,
	Gun: 		1, 
	Throwable: 	2,
	Powerup: 	3
};

export default class Player extends BaseObject{

	constructor(...params){
		super(...params, {width: 8, height: 19, matter: {inertia: Infinity, friction: 0}});

		// Profiles should be set the some other controller class, ie: Game or Marker object
		this.profile = (this.options.profile) ? this.options.profile : null;

		// Input should be set outside the player object	
		this.input = {};

		this.team = (this.options.team) ? this.options.team : 0;

		// Held Weapons
		this.inventory = (this.options.inventory) ? this.options.inventory : [-1, -1, -1, -1];
		this.equiped = (this.options.equiped) ? (this.options.equiped) : Inventory.Gun;

		// Aiming Properties
		this.crosshair = (this.options.crosshair) ? this.options.crosshair : {
			angle: 0
		};

		// Track last time for specific actions
		this.last = {
			crouch: 0
		};

		// Collision Group for platforms
		this.body.collisionFilter.group = this.id;
	}

	serialize(){
		const serial = super.serialize();

		serial.team 		= this.team;
		serial.inventory 	= this.inventory;
		serial.equiped 		= this.equiped;
		serial.crosshair 	= this.crosshair;
		serial.profile		= this.profile;

		return serial;
	}

	update(ms){		

		super.update(ms);

		// Check player is on ground
		if(this.onGround()){

			// Check if previously free falling
			if(this.checkState(State.FreeFalling))
				this.setState(State.Recovering, 30);

			// Check Rolling
			if(this.checkState(State.Rolling)){

				if(this.facingDirection == 1){

					const angle = (this.onGround() + 90) * Math.PI/180;
					this.movePosition(Math.cos(angle), -Math.sin(angle));

				}else if(this.facingDirection == -1){

					const angle = (this.onGround() - 90) * Math.PI/180;
					this.movePosition(Math.cos(angle), -Math.sin(angle));
				}
			}
				

			// Check if any actions are done then reset to grounded
			if(this.delayDone())
				this.setState(State.Grounded);

		}else{

			// If reached high enough velocity enable freefall
			if(Math.abs(this.getVelocity().y) > 6 || this.checkState(State.Stun))
				this.setState(State.FreeFalling);

			// Displaced from off ground then set to jumping
			if(this.checkState(State.Grounded))
				this.setState(State.Jumping);
		}

		// Stop velocity changes
		if(this.checkState(State.Grounded) || this.checkState(State.Climbing))
			this.setVelocity(0, 0);

		// Check if still climbing
		if(this.disableGravity){
			const touching = sf.game.getObjectsByAABB(this.getBounds());
			let onLadder = false;

			for(let i = 0; i < touching.length; i ++){

				if(touching[i].getType() == "Ladder")
					onLadder = true;
			}

			if(!onLadder){
				this.disableGravity = false;
				this.setState(State.Jumping);
			}
		}

		// Check inputs
		if(this.input.aim) 				this.aim();
		if(this.input.down) 			this.moveDown();
		if(this.input.up) 				this.moveUp();
		if(this.input.right) 			this.moveRight();
		if(this.input.left) 			this.moveLeft();
		if(this.input.secondaryAttack) 	this.secondaryAttack();
		if(this.input.primaryAttack) 	this.attack();
		if(this.input.interact) 		this.interact();
	}

	draw(){
		let angle = 0;

		// Get animation from state
		switch(this.state.name){

			case State.Grounded:
				this.setAnimationFrame(
					[
						{x: 0, y: 0, delay: 200},
						{x: 1, y: 0, delay: 200},
						{x: 2, y: 0, delay: 200}
					]);
				break; 

			case State.Walking:
				this.setAnimationFrame(
					[
						{x: 3, y: 0, delay: 150},
						{x: 4, y: 0, delay: 150},
						{x: 5, y: 0, delay: 150},
						{x: 4, y: 0, delay: 150}
					]);
				break;

			case State.Crouching:
				this.frame.index = {x: 0, y: 1};
				break;

			case State.Rolling:
				this.setAnimationFrame(
					[
						{x: 1, y: 1, delay: 9},
						{x: 2, y: 1, delay: 9},
					],
					this.delayTimestamp());
				break;

			case State.Stun:

				if(this.getStateEntropy() < 0.5)
					this.frame.index = {x: 0, y: 3};
				else
					this.frame.index = {x: 1, y: 3};
				break;

			case State.Jumping:
				this.frame.index = {x: 4, y: 1};
				break;

			case State.Recovering:
				this.setAnimationFrame(
					[
						{x: 6, y: 3, delay: 15},
						{x: 8, y: 1, delay: 15}
					],
					this.delayTimestamp());
				break;

			case State.Kicking:
				this.frame.index = {x: 0, y: 2};
				break;

			case State.Punching1:
				this.setAnimationFrame(
					[
						{x: 1, y: 2, delay: 9},
						{x: 2, y: 2, delay: 12}
					],
					this.delayTimestamp());
				break;

			case State.Punching2:
				this.setAnimationFrame(
					[
						{x: 3, y: 2, delay: 9},
						{x: 4, y: 2, delay: 12}
					],
					this.delayTimestamp());
				break;

			case State.Punching3:
				this.setAnimationFrame(
					[
						{x: 5, y: 2, delay: 9},
						{x: 6, y: 2, delay: 18}
					],
					this.delayTimestamp());
				break;

			case State.JumpPunching:
				this.frame.index = {x: 8, y: 2};
				break;

			case State.Kicking:
				this.frame.index = {x: 0, y: 2};
				break;

			case State.JumpKicking:
				this.frame.index = {x: 7, y: 2};
				break;

			case State.FreeFalling:

				if(this.getStateEntropy() < 0.5)
					this.setAnimationFrame(
						[
							{x: 5, y: 1, delay: 100},
							{x: 6, y: 1, delay: 100}
						]);
				else
					this.frame.index = {x: 7, y: 1};

				angle = ((Date.now() / 2) % 360) * Math.PI / 180;
				break;

			case State.Drawing:
			case State.Aiming:
				this.frame.index = {x: 0, y: 4};
				break;

			case State.Climbing:
				this.setAnimationFrame(
					[
						{x: 1, y: 6, delay: 4},
						{x: 2, y: 6, delay: 4},
						{x: 3, y: 6, delay: 4},
						{x: 2, y: 6, delay: 4}
					],
					Math.abs(this.getPosition().y));

				break;
		}

		// Set draw order of cosmetics
		const drawOrder = [this.image];

		if(this.profile){
			const apparel = sf.data.apparel;
			const slots = Object.keys(this.profile);

			slots.forEach((slot) => {
				const category = apparel[slot];
				const name = this.profile[slot];

				if(category && category[name])
					drawOrder.push(category[name]);
			});
		}

		// Draw main body
		sf.ctx.save();
		sf.ctx.translate(this.getPosition().x, this.getPosition().y);
		sf.ctx.scale(this.facingDirection, 1);
		sf.ctx.rotate(angle);

		drawOrder.forEach((image) => {
			sf.ctx.drawImage(
				image,
				this.frame.index.x * this.frame.width,
				this.frame.index.y * this.frame.height,
				this.frame.width,
				this.frame.height,

				-this.frame.width/2,
				this.height/2 - this.frame.height,
				this.frame.width,
				this.frame.height
				);
		});

		sf.ctx.restore();

		// Draw upper torso when aiming
		if(this.checkState(State.Aiming) || this.checkState(State.Drawing)){

			// Get the recoil
			let recoil = 0;

			if(this.checkState(State.Shooting))
				recoil = Math.sin(this.delayTimestamp() / this.state.delayMax * Math.PI);

			// Get equiped weapon
			const weapon = sf.game.getObjectById(this.inventory[this.equiped]);

			// Get aiming frame
			if(this.checkState(State.Drawing)){
				var aimFrame = {x: 0, y: 5};
			}else{
				var aimFrame = {x: 1, y: 5};
			}

			// Get position of body
			const position = this.getPosition();
			const angle = this.getCrosshairAngle();

			sf.ctx.save();
			sf.ctx.translate(position.x - this.facingDirection*2, position.y - 2);
			sf.ctx.scale(1, this.facingDirection);
			sf.ctx.rotate(angle * this.facingDirection);

				// Draw weapon held
				sf.ctx.save();

				if(this.checkState(State.Drawing)){
					sf.ctx.rotate(-Math.PI / 2);
					sf.ctx.translate(0, weapon.frame.height/2);
				}

				sf.ctx.drawImage(
					weapon.image,

					0,
					0,
					weapon.frame.width,
					weapon.frame.height,

					(this.frame.width/2 - weapon.frame.width/2 - 2) - recoil,
					(-weapon.frame.height * 3/4),
					weapon.frame.width,
					weapon.frame.height);

				sf.ctx.restore();

			// Draw torso
			drawOrder.forEach((image) => {
				sf.ctx.drawImage(
					image,

					this.frame.width * aimFrame.x,
					this.frame.height * aimFrame.y,
					this.frame.width,
					this.frame.height,

					(-this.frame.width/2 + 1) - recoil,
					(-this.frame.height/2 - 2),
					this.frame.width,
					this.frame.height);
			});

			sf.ctx.restore();
		}
	}

	getCrosshairAngle(){
		if(this.facingDirection == 1)
			return (this.crosshair.angle) * (Math.PI / 180);
		else
			return (180 - this.crosshair.angle) * (Math.PI / 180);
	}

	getCrosshairPosition(){
		const angle = this.getCrosshairAngle();
		const position = {x: this.getPosition().x - this.facingDirection*2, y: this.getPosition().y - 2};

		position.x += Math.cos(angle) * (this.frame.width / 2 + 4);
		position.y += Math.sin(angle) * (this.frame.width / 2 + 4);

		position.x += Math.cos(angle - Math.PI / 2) * (this.facingDirection * 2);
		position.y += Math.sin(angle - Math.PI / 2) * (this.facingDirection * 2);

		return position;
	}

	dealDamage(damage, type, threshold){

		// If still trying to get up prevent damage
		if(this.checkState(State.Recovering))
			return;

		// Check if damage is actually dealt
		if(!super.dealDamage(damage, type, threshold))
			return;

		// Create blood effects
		for(let i = 0; i < 2; i ++){

			if(i == 0)
				var effect = sf.data.objects.blood_large;
			else
				var effect = sf.data.objects.blood_small; 
			
			const velocity = {
				x: Math.random() * 2 - 1,
				y: Math.random() * 2 - 1
			}

			const obj = sf.game.createObject(effect,
				{
					matter: {
						position: this.getPosition(),
						velocity: velocity
					}
				});
		}

		// Melee cause slight stun
		if(type == "melee"){

			if(!this.checkState(State.FreeFalling))
				this.setState(State.Stun, 9);

		}else if(type == "projectile" && damage > 10){
			this.setState(State.FreeFalling);

		}else if(type == "explosion"){
			this.setState(State.FreeFalling);

		}else if(type == "collision"){

			if(damage < 6 && !this.checkState(State.FreeFalling))
				this.setState(State.Stun, 9);
			else
				this.setState(State.FreeFalling, 9);
		}
	}

	delayCallback(action){

		switch(action){

			case "light-punch":
				sf.game.createForce(this, 
					{
						x: this.getPosition().x + this.width/2 * this.facingDirection, 
						y: this.getPosition().y,
						radius: 5
					},
					{
						x: 0.001 * this.facingDirection, 
						y: 0,
						damage: 7
					});
				this.movePosition(this.facingDirection * 1.5, 0);
				sf.data.playAudio(this.sounds.punch);
				break;

			case "hard-punch":
				sf.game.createForce(this, 
					{
						x: this.getPosition().x + this.width/2 * this.facingDirection, 
						y: this.getPosition().y,
						radius: 5
					},
					{
						x: 0.001 * this.facingDirection, 
						y: -0.001,
						damage: 7
					});
				this.movePosition(this.facingDirection * 1.5, 0);
				sf.data.playAudio(this.sounds.punch);
				break;

			case "reset-aim":
				this.setState(State.Aiming); 
				break;
		}
	}

	moveRight(){
		this.facingDirection = 1;

		if(!this.onRight() && (this.checkState(State.Jumping) || this.strictState(State.Grounded) || this.strictState(State.Crouching) || this.checkState(State.Climbing))){

			if(this.checkState(State.Crouching)){
				this.setState(State.Rolling, 18);
				this.putoutFire();
				sf.data.playAudio(this.sounds.roll);

			}else{

				if(this.onGround()){
					const angle = (this.onGround() + 90) * Math.PI/180;
					this.movePosition(Math.cos(angle), -Math.sin(angle));
				}else{
					this.movePosition(1, 0);
				}

				if(this.checkState(State.Grounded))
					this.setState(State.Walking);
			}
		}
	}

	moveLeft(){
		this.facingDirection = -1;

		if(!this.onLeft() && (this.checkState(State.Jumping) || this.strictState(State.Grounded) || this.strictState(State.Crouching) || this.checkState(State.Climbing))){
	
			if(this.checkState(State.Crouching)){
				this.setState(State.Rolling, 18);
				this.putoutFire();
				sf.data.playAudio(this.sounds.roll);

			}else{

				if(this.onGround()){
					const angle = (this.onGround() - 90) * Math.PI/180;
					this.movePosition(Math.cos(angle), -Math.sin(angle));
				}else{
					this.movePosition(-1, 0);
				}

				if(this.checkState(State.Grounded))
					this.setState(State.Walking);
			}
		}
	}

	moveUp(){

		if(!this.delayDone() && !this.checkState(State.Aiming) && !this.checkState(State.Rolling))
			return;

		// Aiming up
		if(this.checkState(State.Aiming)){

			if(this.crosshair.angle > -90)
				this.crosshair.angle -= 5;

		// Jumping
		}else if(this.checkState(State.Grounded)){
			this.setVelocity(this.getVelocity().x, -4);
			this.setState(State.Jumping);
			sf.data.playAudio(this.sounds.jump);

		// Climb up ladder
		}else if(this.checkState(State.Jumping) || this.checkState(State.Climbing)){

			const touching = sf.game.getObjectsByAABB(this.getBounds());

			for(let i = 0; i < touching.length; i ++){

				if(touching[i].getType() == "Ladder"){
					this.disableGravity = true;
					this.setState(State.Climbing);
					this.movePosition(0, -1);
					break;
				}
			}
		}
	}

	moveDown(){

		if(!this.delayDone() && !this.checkState(State.Aiming))
			return;

		// Aiming down
		if(this.checkState(State.Aiming)){

			if(this.crosshair.angle < 90)
				this.crosshair.angle += 5;

		// Crouching
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Rolling)){

			// Not previously crouching
			if(!this.checkLastState(State.Crouching)){

				if((sf.game.frameCounter - this.last.crouch) < 15){
					this.movePosition(0, 2);

					// Update the collisionGroups of the platforms
					this.collisions.forEach((collision) => {
						const obj = sf.game.getObjectById(collision.objectId);

						if(obj.getType() == "Platform")
							obj.update();
					});
				}
				this.last.crouch = sf.game.frameCounter;
			}
			this.setState(State.Crouching);

		// Climb down ladder
		}else if(this.checkState(State.Jumping) || this.checkState(State.Climbing)){

			const touching = sf.game.getObjectsByAABB(this.getBounds());

			for(let i = 0; i < touching.length; i ++){

				if(touching[i].getType() == "Ladder"){
					this.disableGravity = true;
					this.setState(State.Climbing);
					this.movePosition(0, 1);
					break;
				}
			}
		}
	}

	attack(){

		if(!this.delayDone() && !this.checkState(State.Attacking))
			return;

		// Try to fire gun
		if(this.checkState(State.Aiming)){

			if(!this.strictState(State.Aiming))
				return;

			// Fire gun and set delay to recoil timing
			if(this.inventory[Inventory.Gun] >= 0){
				this.equiped = Inventory.Gun;

				const weapon = sf.game.getObjectById(this.inventory[Inventory.Gun]);
				const recoilTime = weapon.shoot();

				this.setState(State.Shooting, recoilTime,
					[{
						delay: recoilTime,
						action: "reset-aim"
					}]);
			}

		// Punch Combo 1
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Punching1, 21, 
				[{
					delay: 9,
					action: "light-punch"
				}]);

		// Punch Combo 2
		}else if(this.checkState(State.Punching1) && this.delayTimestamp() > 9){
			this.setState(State.Punching2, 21, 
				[{
					delay: 9,
					action: "light-punch"
				}]);

		// Punch Combo 3
		}else if(this.checkState(State.Punching2) && this.delayTimestamp() > 9){
			this.setState(State.Punching3, 24, 
				[{
					delay: 9,
					action: "hard-punch"
				}]);

		// Jump Punching
		}else if(this.checkState(State.Jumping) && !this.checkState(State.Attacking)){
			this.setState(State.JumpPunching);

			sf.game.createForce(this, 
				{
					x: this.getPosition().x + this.width/2 * this.facingDirection, 
					y: this.getPosition().y,
					radius: 3
				},
				{
					x: 0.001 * this.facingDirection, 
					y: 0,
					damage: 5
				});
			sf.data.playAudio(this.sounds.punch);
		}
	}

	secondaryAttack(){

		if(!this.delayDone() && !this.checkState(State.Attacking))
			return;

		// Try to throw gun
		if(this.checkState(State.Aiming)){

			if(!this.strictState(State.Aiming))
				return;

			if(this.inventory[Inventory.Throwable] >= 0){
				this.equiped = Inventory.Throwable;
				this.setState(State.Shooting, 9);
			}

		// Kicking
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Kicking, 6);

			sf.game.createForce(this, 
				{
					x: this.getPosition().x + this.width/2 * this.facingDirection, 
					y: this.getPosition().y + this.height/2,
					radius: 5
				},
				{
					x: 0.001 * this.facingDirection, 
					y: -0.0001,
					damage: 1
				});
			sf.data.playAudio(this.sounds.punch);

		// Jump kicking
		}else if(this.checkState(State.Jumping) && !this.checkState(State.Attacking)){
			this.setState(State.JumpKicking);

			sf.game.createForce(this, 
				{
					x: this.getPosition().x + this.width/2 * this.facingDirection, 
					y: this.getPosition().y + this.height/2,
					radius: 5
				},
				{
					x: 0.001 * this.facingDirection, 
					y: -0.001,
					damage: 1
				});
			sf.data.playAudio(this.sounds.punch);
		}
	}

	interact(){

		// Pickup weapons
		if(this.checkState(State.Grounded)){

			sf.game.getObjectsByAABB(this.getBounds()).forEach((obj) => {

				if(obj.getType() == "Gun")
					this.inventory[Inventory.Gun] = obj.pickup(this);
			});
		}
	}

	aim(){

		if(!this.delayDone())
			return;

		if(this.checkState(State.Grounded) && this.inventory[this.equiped] >= 0){

			// Not previously aiming then reset crosshair angled
			if(!this.checkLastState(State.Aiming) && !this.checkState(State.Drawing) && !this.checkLastState(State.Drawing)){
				this.crosshair.angle = 0;

				const weapon = sf.game.getObjectById(this.inventory[this.equiped]);
				this.setState(State.Drawing, weapon.pullout());

			}else if(this.checkLastState(State.Aiming) || this.checkLastState(State.Drawing)){
				this.setState(State.Aiming);	
			}
		}
	}
};


/*
	Create data definitions for all Player objects
*/
const obj = sf.data.objects;

let added = [

	obj.player = { 
		image: sf.data.loadImage("images/player.png"), 
		frameCount: {x: 10, y: 9},
		health: 100,
		flammable: true,
		
		sounds: {
			damage_melee: [
				sf.data.loadAudio("sounds/player/hit_player00.mp3"),
				sf.data.loadAudio("sounds/player/hit_player01.mp3"),
				sf.data.loadAudio("sounds/player/hit_player02.mp3"),
				sf.data.loadAudio("sounds/player/hit_player03.mp3")				
			],
			damage_collision: [
				sf.data.loadAudio("sounds/player/hit_player00.mp3"),
				sf.data.loadAudio("sounds/player/hit_player01.mp3"),
				sf.data.loadAudio("sounds/player/hit_player02.mp3"),
				sf.data.loadAudio("sounds/player/hit_player03.mp3")				
			],
			punch: [
				sf.data.loadAudio("sounds/player/punch00.mp3"),
				sf.data.loadAudio("sounds/player/punch01.mp3"),
			],
			roll: sf.data.loadAudio("sounds/player/roll.mp3"),
			jump: sf.data.loadAudio("sounds/player/jump.mp3")
		}
	}

].forEach((item) => {
	item.type = Player;
	item.animated = true;

	item.category = sf.filters.player;
	item.mask = sf.filters.object | sf.filters.projectile;
});


/*
	Load the apparel items
*/
const apparel = sf.data.apparel;

apparel.headwear = {
	cap: sf.data.loadImage("images/apparel/hat.png"),
	bomber_hat: sf.data.loadImage("images/apparel/bomber_hat.png")
};

apparel.face = {
	eyes: sf.data.loadImage("images/apparel/eyes.png"),
	specs: sf.data.loadImage("images/apparel/specs.png"),
	face_paint: sf.data.loadImage("images/apparel/face_paint.png")
}

apparel.torso = {
	tuxedo: sf.data.loadImage("images/apparel/tuxedo.png"),
	jacket: sf.data.loadImage("images/apparel/jacket.png"),
	tailored_suit: sf.data.loadImage("images/apparel/tailored_suit.png")
};

apparel.hands = {
	gloves: sf.data.loadImage("images/apparel/gloves.png")
};