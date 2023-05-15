import sf from "../../sf";
import BaseObject from "./base_object";

export default class Fire extends BaseObject{

	constructor(...params){
		super(...params);

		this.lifeTime = (this.options.lifeTime) ? this.options.lifeTime : 0;
		this.startTime = (this.options.startTime) ? this.options.startTime : Date.now();

		this.setVelocity(Math.cos(this.getAngle()) * this.options.speed, Math.sin(this.getAngle()) * this.options.speed);

		this.setAngle(0);
	}

	serialize(){
		const serial = super.serialize();

		serial.lifeTime = this.lifeTime;
		serial.startTime = this.startTime;

		return serial;
	}

	update(ms){
		const gravity = sf.game.gravity;

		Matter.Body.applyForce(this.body, this.body.position, 
			{
				x: gravity.x * this.body.mass / 5,
				y: gravity.y * this.body.mass / 5
        	});

		this.lifetime -= ms;

		if(Date.now() - this.startTime >= this.lifeTime)
			this.kill();
	}

	draw(){
		sf.ctx.save();

		if(this.lifeTime != 0)
			sf.ctx.globalAlpha = (this.lifeTime - (Date.now() -  this.startTime)) / this.lifeTime;

		if(sf.ctx.globalAlpha > 1)
			sf.ctx.globalAlpha = 1;

		super.draw();
		sf.ctx.restore();
	}
};


/*
	Create data definitions for all Fire objects
*/
const obj = sf.data.objects;

let added = [
	
	obj.fire = {
		image: sf.data.loadImage("images/fire.png"),
		lifeTime: 3000
	}

].forEach((item) => {
	item.type = Fire;
	item.matter = {inertia: Infinity, frictionAir: 0.05};
	item.category = sf.filters.decoration;
	item.mask = sf.filters.object | sf.filters.platform;
});