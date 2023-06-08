import sf from "../../sf.js";
import BaseObject from "./base_object.js";

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
	Melee: 			"grounded_attacking_melee",
	MeleeCombo1: 	"grounded_attacking_melee_combo_1",
	MeleeCombo2: 	"grounded_attacking_melee_combo_2",
	MeleeCombo3: 	"grounded_attacking_melee_combo_3",
	JumpPunching: 	"jumping_attacking_punching",
	Kicking: 		"grounded_attacking_kicking",
	JumpKicking: 	"jumping_attacking_kicking",
	Drawing: 		"grounded_drawing",
	Aiming: 		"grounded_aiming", 
	PrepareThrow: 	"grounded_aiming_prepare_throw",
	Throwing: 		"grounded_aiming_attacking_throwing",
	Shooting: 		"grounded_aiming_attacking_shooting",
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
		this.last = (this.options.last) ? this.options.last : {};

		this.team = (this.options.team) ? this.options.team : 0;

		// Held Weapons
		this.inventory = (this.options.inventory) ? this.options.inventory : [-1, -1, -1, -1];
		this.equiped = (this.options.equiped) ? (this.options.equiped) : Inventory.Gun;

		// Aiming Properties
		this.crosshair = (this.options.crosshair) ? this.options.crosshair : {
			angle: 0
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
		serial.last			= this.last;

		return serial;
	}

	update(){		
		super.update();

		// Check inventory is still valid
		for(let i = 0; i < this.inventory.length; i ++){
			const item = sf.game.getObjectById(this.inventory[i]);

			if(!item){
				this.inventory[i] = -1;

				// Default items when nothing held
				if(i == Inventory.Melee){
					const fists = sf.game.createObject(sf.data.objects.fists);
					this.inventory[i] = fists.pickup(this);
				}	
			}	
		}

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
		this.aim();
		this.moveDown(); 
		this.moveUp();
		this.moveRight();
		this.moveLeft();
		this.secondaryAttack();
		this.attack();
		this.interact();	
	}

	draw(){
		const meleeWeapon 		= sf.game.getObjectById(this.inventory[Inventory.Melee]);
		const gunWeapon 		= sf.game.getObjectById(this.inventory[Inventory.Gun]);
		const throwableWeapon	= sf.game.getObjectById(this.inventory[Inventory.Throwable]);

		let angle = 0;

		// Get animation from state
		switch(this.state.name){

			case State.Grounded: {
				this.setAnimationFrame(
					[
						{x: 0, y: 0, delay: 12},
						{x: 1, y: 0, delay: 12},
						{x: 2, y: 0, delay: 12}
					]);
				break; 
			}

			case State.Walking: {
				this.setAnimationFrame(
					[
						{x: 3, y: 0, delay: 9},
						{x: 4, y: 0, delay: 9},
						{x: 5, y: 0, delay: 9},
						{x: 4, y: 0, delay: 9}
					]);
				break;
			}

			case State.Crouching: {
				this.frame.index = {x: 0, y: 1};
				break;
			}

			case State.Rolling: {
				this.setAnimationFrame(
					[
						{x: 1, y: 1, delay: 9},
						{x: 2, y: 1, delay: 9},
					],
					this.delayTimestamp());
				break;
			}

			case State.Stun: {

				if(this.getStateEntropy() < 0.5)
					this.frame.index = {x: 0, y: 3};
				else
					this.frame.index = {x: 1, y: 3};
				break;
			}

			case State.Jumping: {
				this.frame.index = {x: 4, y: 1};
				break;
			}

			case State.Recovering: {
				this.setAnimationFrame(
					[
						{x: 6, y: 3, delay: 15},
						{x: 8, y: 1, delay: 15}
					],
					this.delayTimestamp());
				break;
			}

			case State.Kicking: {
				this.frame.index = {x: 0, y: 2};
				break;
			}

			case State.MeleeCombo1: {

				switch(meleeWeapon.hands){

					// Fists
					case 0:
						this.setAnimationFrame(
							[
								{x: 1, y: 2, delay: 9},
								{x: 2, y: 2, delay: 12}
							],
							this.delayTimestamp());
						break;
				
					// Single handed (machete)
					case 1:
						this.setAnimationFrame(
							[
								{x: 0, y: 7, delay: 9},
								{x: 1, y: 7, delay: 12}
							],
							this.delayTimestamp());

						if(this.frame.index.x == 0)	meleeWeapon.offset = {x: -2, y: -9, angle: 180};
						if(this.frame.index.x == 1) meleeWeapon.offset = {x: -1, y: 1, angle: 225, flip: true, onTop: true};
						break;

					// Double handed (swords)
					case 2:
						this.setAnimationFrame(
							[
								{x: 0, y: 8, delay: 9},
								{x: 1, y: 8, delay: 12}
							],
							this.delayTimestamp());			

						if(this.frame.index.x == 0)	meleeWeapon.offset = {x: 6, y: -4, angle: 225};
						if(this.frame.index.x == 1) meleeWeapon.offset = {x: -4, y: 1, angle: 180};
						break;
				}
				break;
			}

			case State.MeleeCombo2: {

				switch(meleeWeapon.hands){

					// Fists
					case 0:
						this.setAnimationFrame(
							[
								{x: 3, y: 2, delay: 9},
								{x: 4, y: 2, delay: 12}
							],
							this.delayTimestamp());
						break;
				
					// Single handed (machete)
					case 1:
						this.setAnimationFrame(
							[
								{x: 1, y: 7, delay: 9},
								{x: 2, y: 7, delay: 12}
							],
							this.delayTimestamp());

						if(this.frame.index.x == 1)	meleeWeapon.offset = {x: -1, y: 1, angle: 225, flip: true, onTop: true};
						if(this.frame.index.x == 2) meleeWeapon.offset = {x: -5, y: -4, angle: 225};
						break;

					// Double handed (swords)
					case 2:
						this.setAnimationFrame(
							[
								{x: 2, y: 8, delay: 9},
								{x: 3, y: 8, delay: 12}
							],
							this.delayTimestamp());	

						if(this.frame.index.x == 2)	meleeWeapon.offset = {x: -4, y: 0, angle: 225, flip: true, onTop: true};
						if(this.frame.index.x == 3) meleeWeapon.offset = {x: 6, y: -4, angle: 225, flip: true};	
						break;
				}
				break;
			}

			case State.MeleeCombo3: {

				switch(meleeWeapon.hands){

					// Fists
					case 0:
						this.setAnimationFrame(
							[
								{x: 5, y: 2, delay: 9},
								{x: 6, y: 2, delay: 18}
							],
							this.delayTimestamp());
						break;
				
					// Single handed (machete)
					case 1:
						this.setAnimationFrame(
							[
								{x: 2, y: 7, delay: 9},
								{x: 3, y: 7, delay: 18}
							],
							this.delayTimestamp());

						if(this.frame.index.x == 2) meleeWeapon.offset = {x: -5, y: -4, angle: 225};
						if(this.frame.index.x == 3) meleeWeapon.offset = {x: 5, y: 4, angle: 0};
						break;

					// Double handed (swords)
					case 2:
						this.setAnimationFrame(
							[
								{x: 4, y: 8, delay: 9},
								{x: 5, y: 8, delay: 18}
							],
							this.delayTimestamp());		

						if(this.frame.index.x == 4)	meleeWeapon.offset = {x: 0, y: -8, angle: 135};
						if(this.frame.index.x == 5) meleeWeapon.offset = {x: 0, y: 4, angle: 0};
						break;
				}
				break;
			}

			case State.JumpPunching: {
				this.frame.index = {x: 8, y: 2};
				break;
			}

			case State.Kicking: {
				this.frame.index = {x: 0, y: 2};
				break;
			}

			case State.JumpKicking: {
				this.frame.index = {x: 7, y: 2};
				break;
			}

			case State.FreeFalling: {

				if(this.getStateEntropy() < 0.5)
					this.setAnimationFrame(
						[
							{x: 5, y: 1, delay: 6},
							{x: 6, y: 1, delay: 6}
						]);
				else
					this.frame.index = {x: 7, y: 1};

				angle = ((Date.now() / 2) % 360) * Math.PI / 180;
				break;
			}

			case State.Drawing:
			case State.Aiming: {

				if(this.equiped == Inventory.Gun)
					this.frame.index = {x: 0, y: 4};
				else
					this.frame.index = {x: 1, y: 4};
				break;
			}

			case State.Throwing: {
				this.frame.index = {x: 2, y: 4};
				break;
			}

			case State.Climbing: {
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

		// Draw weapon when performing melee combo
		const drawMelee = () => {

			sf.ctx.drawImageOptions({

				source: {
					image: meleeWeapon.image,
					width: meleeWeapon.frame.width,
					height: meleeWeapon.frame.height
				},

				destination: {
					x: -2,
					y: -2,

					origin: {
						x: this.getPosition().x + meleeWeapon.offset.x * this.facingDirection,
						y: this.getPosition().y + meleeWeapon.offset.y
					},
					angle: (meleeWeapon.offset.angle * Math.PI / 180 * this.facingDirection),
					scale: { x: this.facingDirection, y: (meleeWeapon.offset.flip) ? -1 : 1 }
				}
			});
		};

		// Draw melee over player
		if(this.checkState(State.Melee) && meleeWeapon && meleeWeapon.offset && !meleeWeapon.offset.onTop)
			drawMelee();

		// Draw main body
		drawOrder.forEach((image) => {

			sf.ctx.drawImageOptions({

				source: {
					image: image,
					x: this.frame.index.x * this.frame.width,
					y: this.frame.index.y * this.frame.height,
					width: this.frame.width,
					height: this.frame.height,					
				},

				destination: {
					x: -this.frame.width / 2,
					y: this.height / 2 - this.frame.height,

					origin: this.getPosition(),
					scale: {x: this.facingDirection},
					angle: angle
				}
			});
		});

		// Draw melee under player
		if(this.checkState(State.Melee) && meleeWeapon && meleeWeapon.offset && meleeWeapon.offset.onTop)
			drawMelee();

		// Draw upper torso when aiming
		if((this.checkState(State.Aiming) || this.checkState(State.Drawing)) && !this.checkState(State.Throwing)){

			if(this.equiped == Inventory.Gun)
				var weapon = gunWeapon;
			else
				var weapon = throwableWeapon;

			// Get the recoil
			let recoil = 0;

			if(this.checkState(State.Shooting))
				recoil = Math.sin(this.delayTimestamp() / this.state.delayMax * Math.PI);

			// Get aiming frame
			if(this.checkState(State.Drawing))
				var aimFrame = {x: 0, y: 5};
			else
				var aimFrame = {x: 1, y: 5};

			// Draw weapon
			if(!this.checkState(State.Drawing)){

				sf.ctx.drawImageOptions({

					source: {
						image: weapon.image,
						x: 0,
						y: 0,
						width: weapon.frame.width,
						height: weapon.frame.height
					},

					destination: {
						x: (this.frame.width / 2 - weapon.frame.width/2) - recoil,
						y: -(weapon.frame.height * 3/4),

						origin: {
							x: this.getPosition().x - this.facingDirection * 2,
							y: this.getPosition().y - 2,
						},
						scale: {y: this.facingDirection},
						angle: this.getCrosshairAngle()
					}
				});
			}

			// Draw upper body
			drawOrder.forEach((image) => {

				sf.ctx.drawImageOptions({

					source: {
						image: image,
						x: this.frame.width * aimFrame.x,
						y: this.frame.height * aimFrame.y,
						width: this.frame.width,
						height: this.frame.height
					},

					destination: {
						x: -this.frame.width / 2 - recoil + 2,
						y: this.height / 2 - this.frame.height + 2,

						origin: {
							x: this.getPosition().x - this.facingDirection * 2,
							y: this.getPosition().y - 2
						},
						scale: {y: this.facingDirection},
						angle: this.getCrosshairAngle()
					}
				});
			});
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

	getThrowablePosition(){
		return {
			x: this.getPosition().x - 8 * this.facingDirection,
			y: this.getPosition().y - 1
		};
	}

	dealDamage(damage){

		// If still trying to get up prevent damage
		if(this.checkState(State.Recovering))
			return;

		// Check if damage is actually dealt
		if(!super.dealDamage(damage))
			return;

		// Create blood effects
		for(let i = 0; i < 2; i ++){

			if(i == 0)
				var effect = sf.data.objects.blood_large;
			else
				var effect = sf.data.objects.blood_small; 
			
			const velocity = {
				x: sf.game.random() * 2 - 1,
				y: sf.game.random() * 2 - 1
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
		switch(damage.type){

			case "melee":

				if(!this.checkState(State.FreeFalling))
					this.setState(State.Stun, 9);
				break;

			case "projectile":

				if(damage.hp > 10)
					this.setState(State.FreeFalling);
				break;

			case "explosion":
				this.setState(State.FreeFalling);
				break;

			case "collision":

				if(damage.hp < 6 && !this.checkState(State.FreeFalling))
					this.setState(State.Stun, 9);
				else
					this.setState(State.FreeFalling, 9);
				break;
		}
	}

	delayCallback(action){

		switch(action){

			case "melee_1":
				sf.game.getObjectById(this.inventory[Inventory.Melee]).swing(0);
				this.movePosition(this.facingDirection * 1.5, 0);
				sf.data.playAudio(this.sounds.punch);
				break;

			case "melee_2":
				sf.game.getObjectById(this.inventory[Inventory.Melee]).swing(1);
				this.movePosition(this.facingDirection * 1.5, 0);
				sf.data.playAudio(this.sounds.punch);
				break;

			case "melee_3":
				sf.game.getObjectById(this.inventory[Inventory.Melee]).swing(2);
				this.movePosition(this.facingDirection * 1.5, 0);
				sf.data.playAudio(this.sounds.punch);
				break;

			case "reset-aim":
				this.setState(State.Aiming); 
				break;
		}
	}

	getButtonStatus(nowButton, prevButton){

		return {
			pressed: !prevButton && nowButton,
			released: prevButton && !nowButton,
			held: nowButton
		};
	}

	moveRight(){

		if(!this.input.right) return;

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

		if(!this.input.left) return;

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

		if(!this.input.up) return;

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

		if(!this.input.down) return;

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

					// Update the collisionGroups of the platforms
					this.collisions.forEach((collision) => {
						const obj = sf.game.getObjectById(collision.objectId);
						const index = this.body.platforms.indexOf(obj);

						if(obj.getType() == "Platform" && index == -1)
							this.body.platforms.push(obj.body);
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

		// Check input button status
		const button = this.getButtonStatus(this.input.primaryAttack, this.last.primaryAttack);
		this.last.primaryAttack = this.input.primaryAttack;

		// Try to fire gun
		if(button.pressed && this.strictState(State.Aiming)){
			const weapon = sf.game.getObjectById(this.inventory[Inventory.Gun]);

			// Equip gun
			if(this.equiped != Inventory.Gun){

				if(weapon)
					this.equiped = Inventory.Gun;

			// Fire gun and set delay to recoil timing
			}else if(weapon){	
				const recoilTime = weapon.shoot();

				this.setState(State.Shooting, recoilTime,
					[{
						delay: recoilTime,
						action: "reset-aim"
					}]);		
			}

		// Melee Combo 1
		}else if(button.pressed && this.checkState(State.Grounded) && !this.checkState(State.Attacking)){

			this.setState(State.MeleeCombo1, 21, 
				[{
					delay: 9,
					action: "melee_1"
				}]);

		// Melee Combo 2
		}else if(button.pressed && this.checkState(State.MeleeCombo1) && this.delayTimestamp() > 9){

			this.setState(State.MeleeCombo2, 21, 
				[{
					delay: 9,
					action: "melee_2"
				}]);

		// Melee Combo 3
		}else if(button.pressed && this.checkState(State.MeleeCombo2) && this.delayTimestamp() > 9){

			this.setState(State.MeleeCombo3, 24, 
				[{
					delay: 9,
					action: "melee_3"
				}]);

		// Jump Punching
		}else if(button.pressed && this.checkState(State.Jumping) && !this.checkState(State.Attacking)){
			this.setState(State.JumpPunching);

			sf.game.createHitbox(this, 
				[{
					x: this.getPosition().x + this.width/2 * this.facingDirection, 
					y: this.getPosition().y,
					width: 3,
					height: 3
				}],
				{
					x: 0.001 * this.facingDirection, 
					y: 0,
					damage: {hp: 5, type: "melee"}
				});
			sf.data.playAudio(this.sounds.punch);
		}
	}

	secondaryAttack(){

		// Check input button status
		const button = this.getButtonStatus(this.input.secondaryAttack, this.last.secondaryAttack);
		this.last.secondaryAttack = this.input.secondaryAttack;

		// Prepare throw / cook
		if(button.pressed && this.strictState(State.Aiming)){
			const weapon = sf.game.getObjectById(this.inventory[Inventory.Throwable]);

			// Equip the throwable item first
			if(this.equiped != Inventory.Throwable){

				if(weapon)
					this.equiped = Inventory.Throwable;

			// Then check if it's still valid 
			}else if(weapon && weapon.ammo > 0){

				// Play the throwable cook start sound effect / same as draw
				weapon.cook();
				this.setState(State.PrepareThrow, Infinity);
			}
				
		// Commit to throw once released
		}else if(button.released && this.strictState(State.PrepareThrow)){
			const weapon = sf.game.getObjectById(this.inventory[Inventory.Throwable]);

			if(weapon){
				const throwDelay = weapon.throw();

				this.setState(State.Throwing, throwDelay,
					[{
						delay: throwDelay,
						action: "reset-aim"
					}]);

			}else{
				this.setState(State.Aiming);
			}

		// Kicking
		}else if(button.pressed && this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Kicking, 6);

			sf.game.createHitbox(this, 
				[{
					x: this.getPosition().x + this.width/2 * this.facingDirection, 
					y: this.getPosition().y + this.height/2,
					width: 5,
					height: 5
				}],
				{
					x: 0.001 * this.facingDirection, 
					y: 0,
					damage: {hp: 1, type: "melee"}
				});
			sf.data.playAudio(this.sounds.punch);

		// Jump kicking
		}else if(button.pressed && this.checkState(State.Jumping) && !this.checkState(State.Attacking)){
			this.setState(State.JumpKicking);

			sf.game.createHitbox(this, 
				[{
					x: this.getPosition().x + this.width/2 * this.facingDirection, 
					y: this.getPosition().y + this.height/2,
					width: 5,
					height: 5
				}],
				{
					x: 0.001 * this.facingDirection, 
					y: -0.001,
					damage: {hp: 1, type: "melee"}
				});
			sf.data.playAudio(this.sounds.punch);
		}
	}

	interact(){

		// Check input button status
		const button = this.getButtonStatus(this.input.interact, this.last.interact);
		this.last.interact = this.input.interact;

		// Pickup weapons
		if(button.pressed){

			sf.game.getObjectsByAABB(this.getBounds()).forEach((obj) => {

				switch(obj.getType()){

					case "Melee":
						this.inventory[Inventory.Melee] = obj.pickup(this);
						break;

					case "Gun":
						this.inventory[Inventory.Gun] = obj.pickup(this);
						break;

					case "Throwable":
						this.inventory[Inventory.Throwable] = obj.pickup(this);
						break;
				}				
			});
		}
	}

	aim(){

		// Check input button status
		const button = this.getButtonStatus(this.input.aim, this.last.aim);
		this.last.aim = this.input.aim;

		if(!this.delayDone())
			return;

		const gunWeapon = sf.game.getObjectById(this.inventory[Inventory.Gun]);
		const throwableWeapon = sf.game.getObjectById(this.inventory[Inventory.Throwable]);

		// Choose which inventory item to use when not holding one or the other
		let weapon = null;

		if(this.equiped == Inventory.Throwable){

			if(throwableWeapon)
				weapon = throwableWeapon;
			else
				this.equiped = Inventory.Gun;
		}

		if(this.equiped == Inventory.Gun){

			if(gunWeapon)
				weapon = gunWeapon;
			else
				this.equiped = Inventory.Throwable;
		}

		if(button.held && this.checkState(State.Grounded) && !this.checkState(State.Aiming) && weapon){

			// Not previously aiming then reset crosshair angled
			if(!this.checkLastState(State.Aiming) && !this.checkState(State.Drawing) && !this.checkLastState(State.Drawing)){
				this.crosshair.angle = 0;
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
			damage_cut: [
				sf.data.loadAudio("sounds/player/cut_player00.mp3"),
				sf.data.loadAudio("sounds/player/cut_player01.mp3"),
				sf.data.loadAudio("sounds/player/cut_player02.mp3")
			],
			damage_collision: [
				sf.data.loadAudio("sounds/player/hit_player00.mp3"),
				sf.data.loadAudio("sounds/player/hit_player01.mp3"),
				sf.data.loadAudio("sounds/player/hit_player02.mp3"),
				sf.data.loadAudio("sounds/player/hit_player03.mp3")				
			],
			roll: sf.data.loadAudio("sounds/player/roll.mp3"),
			jump: sf.data.loadAudio("sounds/player/jump.mp3"),
			punch: [
				sf.data.loadAudio("sounds/player/punch00.mp3"),
				sf.data.loadAudio("sounds/player/punch01.mp3"),
			]
		}
	}

].forEach((item) => {
	item.type = Player;

	item.group = sf.collision.groups.player;
});


/*
	Load the apparel items
*/
const apparel = sf.data.apparel;

apparel.headwear = {
	cap: 			sf.data.loadImage("images/apparel/headwear/hat.png"),
	aviator_hat: 	sf.data.loadImage("images/apparel/headwear/aviator_hat.png")
};

apparel.face = {
	eyes: 			sf.data.loadImage("images/apparel/face/eyes.png"),
	specs: 			sf.data.loadImage("images/apparel/face/specs.png"),
	face_paint: 	sf.data.loadImage("images/apparel/face/face_paint.png")
}

apparel.torso = {
	tuxedo: 		sf.data.loadImage("images/apparel/torso/tuxedo.png"),
	agent_suit: 	sf.data.loadImage("images/apparel/torso/agent_suit.png"),
	sweater: 		sf.data.loadImage("images/apparel/torso/sweater.png"),
	jacket: 		sf.data.loadImage("images/apparel/torso/jacket.png"),
	aviator_jacket: sf.data.loadImage("images/apparel/torso/aviator_jacket.png"),
	tailored_suit: 	sf.data.loadImage("images/apparel/torso/tailored_suit.png")
};

apparel.hands = {
	gloves: 		sf.data.loadImage("images/apparel/hands/gloves.png")
};