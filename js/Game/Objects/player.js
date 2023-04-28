import BaseObject from "./base_object";

export default class Player extends BaseObject{

	constructor(x, y){
		super(sf.data.objects.filecab, x, y, {inertia: Infinity});
		this.team = 0;
	}

	update(){

		if(sf.input.key.held["KeyD"])
			Matter.Body.setVelocity(this.body, {x: 2, y: this.body.velocity.y });

		if(sf.input.key.held["KeyA"])
			Matter.Body.setVelocity(this.body, {x: -2, y: this.body.velocity.y });

		if(sf.input.key.held["KeyW"] && this.onGround())
			Matter.Body.setVelocity(this.body, {x: this.body.velocity.x, y: -5 });
	}
};