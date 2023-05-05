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
	Shooting: 		"grounded_aiming_shooting"
};

const Inventory = {
	Melee: 		0,
	Gun: 		1, 
	Throwable: 	2,
	Powerup: 	3
};

export default class Player extends BaseObject{

	constructor(...params){
		super(...params, {width: 8, height: 19, matter: {inertia: Infinity, friction: 0, slop: 1}});

		this.team = 0;

		// Held Weapons
		this.inventory = [null, null, null, null];
		this.equiped = Inventory.Gun;

		// Aiming Properties
		this.crosshair = {
			angle: 		0
		};
	}

	update(ms){
		super.update(ms);

		// Check player is on ground
		if(this.onGround()){

			// Check if previously free falling
			if(this.checkState(State.FreeFalling))
				this.setState(State.Recovering, 500);

			// Check Rolling
			if(this.checkState(State.Rolling))
				Matter.Body.setPosition(this.body, 
					{
						x: this.body.position.x + this.facingDirection * 1, 
						y: this.body.position.y 
					});

			// Check if any actions are done then reset to grounded
			if(this.state.delay == 0)
				this.setState(State.Grounded);

		}else{

			// If reached high enough velocity enable freefall
			if(Math.abs(this.velocity.y) > 6 || this.checkState(State.Stun))
				this.setState(State.FreeFalling);

			// Displaced from off ground then set to jumping
			if(this.checkState(State.Grounded))
				this.setState(State.Jumping);
		}

		// Stop velocity changes
		if(this.checkState(State.Grounded))
			Matter.Body.setVelocity(this.body, 
				{
					x: 0, 
					y: 0
				});
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
						{x: 3, y: 0, delay: 200},
						{x: 4, y: 0, delay: 200},
						{x: 5, y: 0, delay: 200},
						{x: 4, y: 0, delay: 200}
					]);
				break;

			case State.Crouching:
				this.frame.index = {x: 0, y: 1};
				break;

			case State.Rolling:
				this.setAnimationFrame(
					[
						{x: 1, y: 1, delay: 150},
						{x: 2, y: 1, delay: 150},
					],
					this.delayTimestamp());
				break;

			case State.Stun:

				if(this.getStateEntropy() < 0.5)
					this.frame.index = {x: 0, y: 3};
				else
					this.frame.index = {x: 1, y: 3};
				break;

			case State.Knockdown:
				this.frame.index = {x: 7, y: 1};
				break;

			case State.Jumping:
				this.frame.index = {x: 4, y: 1};
				break;

			case State.Recovering:
				this.setAnimationFrame(
					[
						{x: 6, y: 3, delay: 250},
						{x: 8, y: 1, delay: 250}
					],
					this.delayTimestamp());
				break;

			case State.Kicking:
				this.frame.index = {x: 0, y: 2};
				break;

			case State.Punching1:
				this.setAnimationFrame(
					[
						{x: 1, y: 2, delay: 150},
						{x: 2, y: 2, delay: 200}
					],
					this.delayTimestamp());
				break;

			case State.Punching2:
				this.setAnimationFrame(
					[
						{x: 3, y: 2, delay: 150},
						{x: 4, y: 2, delay: 200}
					],
					this.delayTimestamp());
				break;

			case State.Punching3:
				this.setAnimationFrame(
					[
						{x: 5, y: 2, delay: 150},
						{x: 6, y: 2, delay: 300}
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

			case State.Aiming:
				this.frame.index = {x: 0, y: 4};
				break;
		}

		super.draw(
			{
				offset: {
					x: -this.frame.width / 2, 
					y: this.height / 2 - this.frame.height
				},
				angle: angle
			});

		// Draw upper torso when aiming
		if(this.checkState(State.Aiming)){
			sf.ctx.save();

			// Transform Image
			sf.ctx.translate(this.position.x - this.facingDirection, this.position.y - 1);
			sf.ctx.rotate(this.getCrosshairAngle());
			sf.ctx.scale(1, this.facingDirection);
			sf.ctx.translate(-this.frame.width/2, this.height / 2 - this.frame.height);

			// Draw weapon held
			const weapon = this.inventory[this.equiped];

			sf.ctx.drawImage(
				weapon.image,
				0,
				0,
				weapon.frame.width,
				weapon.frame.height,
				this.frame.width - weapon.frame.width / 1.5,
				this.frame.height/2 - weapon.frame.height/2,
				weapon.frame.width,
				weapon.frame.height);

			// Draw upper torso
			sf.ctx.drawImage(
				this.image,
				this.frame.width * 1,
				this.frame.height * 5,
				this.frame.width,
				this.frame.height,
				0,
				0,
				this.frame.width,
				this.frame.height);
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
		const position = {x: this.position.x - this.facingDirection, y: this.position.y - 1};

		position.x += Math.cos(angle) * (this.frame.width / 2 + 4);
		position.y += Math.sin(angle) * (this.frame.width / 2 + 4);

		position.x += Math.cos(angle - Math.PI / 2) * (this.facingDirection * 4);
		position.y += Math.sin(angle - Math.PI / 2) * (this.facingDirection * 4);

		return position;
	}

	dealDamage(damage){

		// If still trying to get up prevent damage
		if(this.checkState(State.Recovering))
			return;

		super.dealDamage(damage);

		// Lower damage cause slight stun
		if(damage < 10){

			if(!this.checkState(State.FreeFalling))
				this.setState(State.Stun, 150);

		// Larger damage knock over
		}else
			this.setState(State.FreeFalling);
	}

	moveRight(){
		this.facingDirection = 1;

		if(!this.onRight() && (this.checkState(State.Jumping) || this.strictState(State.Grounded) || this.strictState(State.Crouching))){

			if(this.checkState(State.Crouching)){
				this.setState(State.Rolling, 300);

			}else if(!this.checkState(State.Rolling)){
				Matter.Body.setPosition(this.body, 
					{
						x: this.body.position.x + 1.5, 
						y: this.body.position.y 
					});

				if(this.checkState(State.Grounded))
					this.setState(State.Walking);
			}
		}
	}

	moveLeft(){
		this.facingDirection = -1;

		if(!this.onLeft() && (this.checkState(State.Jumping) || this.strictState(State.Grounded) || this.strictState(State.Crouching))){
	
			if(this.checkState(State.Crouching)){
				this.setState(State.Rolling, 300);

			}else if(!this.checkState(State.Rolling)){
				Matter.Body.setPosition(this.body, 
					{
						x: this.body.position.x - 1.5, 
						y: this.body.position.y 
					});

				if(this.checkState(State.Grounded))
					this.setState(State.Walking);
			}
		}
	}

	moveUp(){

		// Aiming up
		if(this.checkState(State.Aiming)){

			if(this.crosshair.angle > -90)
				this.crosshair.angle -= 5;

		// Jumping
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Jumping);
			Matter.Body.setVelocity(this.body, 
				{
					x: this.body.velocity.x, 
					y: -4 
				});
		}
	}

	moveDown(){

		// Aiming down
		if(this.checkState(State.Aiming)){

			if(this.crosshair.angle < 90)
				this.crosshair.angle += 5;

		// Crouching
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Rolling) && !this.checkState(State.Attacking)){
			this.setState(State.Crouching);
		}
	}

	attack(){

		if(this.checkState(State.Damaged))
			return;

		// Try to fire gun
		if(this.checkState(State.Aiming)){

			if(!this.strictState(State.Aiming))
				return;

			// Fire gun and set delay to recoil timing
			if(this.inventory[Inventory.Gun] != null){
				this.equiped = Inventory.Gun;
				this.setState(State.Shooting, this.inventory[Inventory.Gun].shoot());
			}

		// Punch Combo 1
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Punching1, 350, 
				[{
					delay: 150,
					action: () => {
						sf.game.createForce(this, 
							{
								x: this.position.x + this.width/2 * this.facingDirection, 
								y: this.position.y,
								radius: 5
							},
							{
								x: 0.001 * this.facingDirection, 
								y: 0,
								damage: 7
							});
						Matter.Body.setPosition(this.body, 
							{
								x: this.body.position.x + this.facingDirection * 1.5, 
								y: this.body.position.y 
							});
					}
				}]);

		// Punch Combo 2
		}else if(this.checkState(State.Punching1) && this.delayTimestamp() > 150){
			this.setState(State.Punching2, 350, 
				[{
					delay: 150,
					action: () => {
						sf.game.createForce(this, 
							{
								x: this.position.x + this.width/2 * this.facingDirection, 
								y: this.position.y,
								radius: 5
							},
							{
								x: 0.001 * this.facingDirection, 
								y: 0,
								damage: 7
							});
						Matter.Body.setPosition(this.body, 
							{
								x: this.body.position.x + this.facingDirection * 1.5, 
								y: this.body.position.y 
							});
					}
				}]);

		// Punch Combo 3
		}else if(this.checkState(State.Punching2) && this.delayTimestamp() > 150){
			this.setState(State.Punching3, 400, 
				[{
					delay: 100,
					action: () => {
						sf.game.createForce(this, 
							{
								x: this.position.x + this.width/2 * this.facingDirection, 
								y: this.position.y,
								radius: 5
							},
							{
								x: 0.001 * this.facingDirection, 
								y: -0.001,
								damage: 7
							});
						Matter.Body.setPosition(this.body, 
							{
								x: this.body.position.x + this.facingDirection * 1.5, 
								y: this.body.position.y 
							});
					}
				}]);

		// Jump Punching
		}else if(this.checkState(State.Jumping) && !this.checkState(State.Attacking)){
			this.setState(State.JumpPunching);

			sf.game.createForce(this, 
				{
					x: this.position.x + this.width/2 * this.facingDirection, 
					y: this.position.y,
					radius: 3
				},
				{
					x: 0.001 * this.facingDirection, 
					y: 0,
					damage: 5
				});
		}
	}

	secondaryAttack(){

		if(this.checkState(State.Damaged))
			return;

		// Try to throw gun
		if(this.checkState(State.Aiming)){

			if(!this.strictState(State.Aiming))
				return;

			if(this.inventory[Inventory.Throwable] != null){
				this.equiped = Inventory.Throwable;
				this.setState(State.Shooting, this.inventory[Inventory.Throwable].throw());
			}

		// Kicking
		}else if(this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Kicking, 100);

			sf.game.createForce(this, 
				{
					x: this.position.x + this.width/2 * this.facingDirection, 
					y: this.position.y + this.height/2,
					radius: 5
				},
				{
					x: 0.001 * this.facingDirection, 
					y: -0.0001,
					damage: 1
				});

		// Jump kicking
		}else if(this.checkState(State.Jumping) && !this.checkState(State.Attacking)){
			this.setState(State.JumpKicking);

			sf.game.createForce(this, 
				{
					x: this.position.x + this.width/2 * this.facingDirection, 
					y: this.position.y + this.height/2,
					radius: 5
				},
				{
					x: 0.001 * this.facingDirection, 
					y: -0.001,
					damage: 1
				});
		}
	}

	interact(){

		// Pickup weapons
		if(this.checkState(State.Grounded)){

			sf.game.getObjectsByAABB(this.bounds).forEach((obj) => {

				if(obj.constructor.name == "Gun")
					this.inventory[Inventory.Gun] = obj.pickup(this);
			});
		}
	}

	aim(){

		if(this.checkState(State.Damaged))
			return;

		if(this.checkState(State.Grounded) && !this.checkState(State.Attacking) && !this.checkState(State.Rolling) && this.inventory[this.equiped] != null){

			if(!this.checkState(State.Aiming))
				this.crosshair.angle = 0;

			this.setState(State.Aiming, 20);	
		}
	}
};


/*
	Create data definitions for all Player objects
*/
const obj = sf.data.objects;

let added = [
	obj.player 			=	{ image: sf.data.loadImage("images/player.png"), frameCount: {x: 24, y: 16}, resizable: false},

].forEach((item) => {
	item.type = Player;

	item.category = sf.filters.player;
	item.mask = sf.filters.object | sf.filters.projectile;
});