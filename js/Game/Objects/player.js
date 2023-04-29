import sf from "../../sf";
import BaseObject from "./base_object";

const State = {
	None: 			"none",
	Jumping: 		"jumping",
	Grounded: 		"grounded",
	Walking: 		"grounded_walking", 
	Running: 		"grounded_running", 
	Crouching: 		"grounded_crouching", 
	Rolling: 		"grounded_rolling", 
	FreeFalling: 	"free_falling",
	Recovering: 	"recovering",
	Attacking: 		"attacking", 
	Punching: 		"grounded_attacking_punching",
	Punching1: 		"grounded_attacking_punching1",
	Punching2: 		"grounded_attacking_punching2",
	Punching3: 		"grounded_attacking_punching3",
	JumpPunching: 	"jumping_attacking_punching",
	Kicking: 		"grounded_attacking_kicking",
	JumpKicking: 	"jumping_attacking_kicking"
};

export default class Player extends BaseObject{

	constructor(x, y){
		super(sf.data.objects.player, x, y, {inertia: Infinity, friction: 0, width: 8, height: 19});
		this.team = 0;
		this.facingDirection = 1;

		this.action = {
			state: State.Grounded,
			done: false,
			delay: 0,
			delayMax: 0
		};
	}

	update(){

		// State Control
		if(this.action.delay > 0){
			this.action.delay -= sf.game.delta;

			if(this.action.delay < 0)
				this.action.delay = 0;
		}

		// Check player is on ground
		if(this.onGround()){

			// Check previously free falling
			if(this.checkState(State.FreeFalling))
				this.setState(State.Recovering, 500);

			// Check attack delay
			if(this.checkState(State.Punching) && this.delayTimeStamp() > 100 && !this.action.done){
				this.action.done = true;

				Matter.Body.setPosition(this.body, {x: this.body.position.x + 1.5 * this.facingDirection, y: this.body.position.y })

				// Punch Combo 1/2
				if(this.checkState(State.Punching1) || this.checkState(State.Punching2)){
					sf.game.createForce(
						this, 
						Matter.Vector.create(
							this.position.x + this.width/2 * this.facingDirection, 
							this.position.y
							),
						5,
						0.002);

				// Punch Combo 3
				}else{
					sf.game.createForce(
						this, 
						Matter.Vector.create(
							this.position.x + this.width/2 * this.facingDirection, 
							this.position.y
							),
						5,
						0.004);
				}
			}

			// Check Rolling
			if(this.checkState(State.Rolling))
				Matter.Body.setPosition(this.body, {x: this.body.position.x + this.facingDirection * 1.5, y: this.body.position.y });

			// Check if any actions are done then reset to grounded
			if(this.action.delay == 0)
				this.action.state = State.Grounded;

			Matter.Body.setVelocity(this.body, {x: 0, y: 0 });

		}else{

			if(this.checkState(State.Grounded))
				this.action.state = State.Jumping;

			if(Matter.Vector.magnitude(this.velocity) > 10)
				this.action.state = State.FreeFalling;
		}

		// Check inputs
		if(sf.input.key.held["ArrowDown"])
			this.moveDown();

		if(sf.input.key.held["ArrowUp"])
			this.moveUp();

		if(sf.input.key.held["ArrowRight"])
			this.moveRight();

		if(sf.input.key.held["ArrowLeft"])
			this.moveLeft();

		if(sf.input.key.pressed["KeyS"])
			this.kick();
		
		if(sf.input.key.pressed["KeyA"])
			this.punch();
	}

	checkState(state){
		return this.action.state.includes(state);
	}

	setState(state, delay){
		this.action.state = state;
		this.action.done = false;

		if(delay === undefined)
			delay = 0;

		this.action.delay = delay;
		this.action.delayMax = delay;
	}

	delayTimeStamp(){
		return this.action.delayMax - this.action.delay;
	}

	draw(){

		switch(this.action.state){

			case State.Grounded:
				this.setAnimationFrame(
					[
						{x: 0, y: 0, delay: 200},
						{x: 1, y: 0, delay: 200},
						{x: 2, y: 0, delay: 200}
					]
					);
				break; 

			case State.Walking:
				this.setAnimationFrame(
					[
						{x: 3, y: 0, delay: 200},
						{x: 4, y: 0, delay: 200},
						{x: 5, y: 0, delay: 200},
						{x: 4, y: 0, delay: 200}
					]
					);
				break;

			case State.Crouching:
				this.frameIndex = {x: 0, y: 1};
				break;

			case State.Rolling:
				this.setAnimationFrame(
					[
						{x: 1, y: 1, delay: 200},
						{x: 2, y: 1, delay: 200},
					],
					this.delayTimeStamp()
					);
				break;

			case State.Jumping:
				this.frameIndex = {x: 4, y: 1};
				break;

			case State.Recovering:
				this.setAnimationFrame(
					[
						{x: 6, y: 3, delay: 250},
						{x: 8, y: 1, delay: 250}
					],
					this.delayTimeStamp()
					);
				break;

			case State.Kicking:
				this.frameIndex = {x: 0, y: 2};
				break;

			case State.Punching1:
				this.setAnimationFrame(
					[
						{x: 1, y: 2, delay: 100},
						{x: 2, y: 2, delay: 150}
					],
					this.delayTimeStamp()
					);
				break;

			case State.Punching2:
				this.setAnimationFrame(
					[
						{x: 3, y: 2, delay: 100},
						{x: 4, y: 2, delay: 150}
					],
					this.delayTimeStamp()
					);
				break;

			case State.Punching3:
				this.setAnimationFrame(
					[
						{x: 5, y: 2, delay: 100},
						{x: 6, y: 2, delay: 200}
					],
					this.delayTimeStamp()
					);
				break;

			case State.JumpPunching:
				this.frameIndex = {x: 8, y: 2};
				break;

			case State.Kicking:
				this.frameIndex = {x: 0, y: 2};
				break;

			case State.JumpKicking:
				this.frameIndex = {x: 7, y: 2};
				break;

			case State.FreeFalling:
				this.setAnimationFrame(
					[
						{x: 5, y: 1, delay: 100},
						{x: 6, y: 1, delay: 100}
					]
					);
				break;
		}

		sf.ctx.save();

		sf.ctx.translate(this.position.x, this.position.y);
		sf.ctx.scale(this.facingDirection, 1);

		sf.ctx.drawImage(
			this.image,
			this.frameIndex.x * this.frame.width,
			this.frameIndex.y * this.frame.height,
			this.frame.width,
			this.frame.height,
			-this.frame.width/2,
			this.height/2 - this.frame.height,
			this.frame.width,
			this.frame.height
			);

		sf.ctx.restore();
	}

	moveRight(){

		if(!this.onRight() && (this.checkState(State.Jumping) || (this.checkState(State.Grounded) && !this.checkState(State.Attacking)) ) ){
			this.facingDirection = 1;

			if(this.checkState(State.Crouching)){
				this.setState(State.Rolling, 400);

			}else if(!this.checkState(State.Rolling)){
				Matter.Body.setPosition(this.body, {x: this.body.position.x + 1.5, y: this.body.position.y });

				if(this.checkState(State.Grounded))
					this.setState(State.Walking);
			}
		}
	}

	moveLeft(){

		if(!this.onLeft() && (this.checkState(State.Jumping) || (this.checkState(State.Grounded) && !this.checkState(State.Attacking)) ) ){
			this.facingDirection = -1;

			if(this.checkState(State.Crouching)){
				this.setState(State.Rolling, 400);

			}else if(!this.checkState(State.Rolling)){
				Matter.Body.setPosition(this.body, {x: this.body.position.x - 1.5, y: this.body.position.y });

				if(this.checkState(State.Grounded))
					this.setState(State.Walking);
			}
		}
	}

	moveUp(){

		if(this.checkState(State.Grounded) && !this.checkState(State.Attacking)){
			this.setState(State.Jumping);
			Matter.Body.setVelocity(this.body, {x: this.body.velocity.x, y: -4 });
		}
	}

	moveDown(){

		if(this.checkState(State.Grounded) && !this.checkState(State.Rolling) && !this.checkState(State.Attacking)){
			this.setState(State.Crouching);
		}
	}

	punch(){

		if(
			(this.checkState(State.Grounded) && !this.checkState(State.Attacking)) ||
			(this.checkState(State.Punching1) && this.delayTimeStamp() > 100) ||
			(this.checkState(State.Punching2) && this.delayTimeStamp() > 100) ||
			(this.checkState(State.Jumping) && !this.checkState(State.Attacking))
		){

			if(this.action.state == State.Grounded)
				this.setState(State.Punching1, 250);

			else if(this.action.state == State.Punching1)
				this.setState(State.Punching2, 250);

			else if(this.action.state == State.Punching2)
				this.setState(State.Punching3, 300);

			// Like kicking frame 1
			else if(this.action.state == State.Jumping){
				this.setState(State.JumpPunching);

				sf.game.createForce(
					this, 
					Matter.Vector.create(
						this.position.x + this.width/2 * this.facingDirection, 
						this.position.y
						),
					5,
					0.002);
			}
		}
	}

	kick(){

		if((this.checkState(State.Grounded) || this.checkState(State.Jumping)) && !this.checkState(State.Attacking)){

			if(this.action.state == State.Grounded)
				this.setState(State.Kicking, 100);

			if(this.action.state == State.Jumping)
				this.setState(State.JumpKicking);

			sf.game.createForce(
				this, 
				Matter.Vector.create(
					this.position.x + this.width/2 * this.facingDirection, 
					this.position.y + this.height/2
					),
				5,
				0.002);
		}
	}
};


/*
	Create data definitions for all Player objects
*/
const obj = sf.data.objects;

let added = [
	obj.player = { image: sf.data.loadImage("images/player.png"), frames: [24, 16]}

].forEach((item) => {
	item.type = Player;
});