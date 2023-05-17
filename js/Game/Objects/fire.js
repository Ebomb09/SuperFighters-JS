import sf from "../../sf";
import BaseObject from "./base_object";

export default class Fire extends BaseObject{

	constructor(...params){
		super(...params);

		this.lifeTime = (this.options.lifeTime) ? this.options.lifeTime : 0;
		this.startTime = (this.options.startTime) ? this.options.startTime : Date.now();
	}

	serialize(){
		const serial = super.serialize();

		serial.lifeTime = this.lifeTime;
		serial.startTime = this.startTime;

		return serial;
	}

	update(ms){
		super.update(ms);

		if((Date.now() - this.startTime) % 5 == 0)
			sf.game.createObject(sf.data.objects.smoke,
			{
				lifeTime: 500 * this.getPercentLifeTime(),

				matter:{
					position: this.getPosition(),
					velocity: {x: Math.random() - 0.5, y: -1}
				}
			});

		this.lifetime -= ms;

		if(Date.now() - this.startTime >= this.lifeTime)
			this.kill();
	}

	getPercentLifeTime(){
		let percent = (this.lifeTime - (Date.now() -  this.startTime)) / this.lifeTime;

		if(percent < 0)
			percent = 0;

		return percent;
	}

	draw(){
		sf.ctx.save();

		sf.ctx.globalAlpha = this.getPercentLifeTime();

		super.draw({angle: 0});
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
		lifeTime: 3000,

		gravityScale: 1/5
	}

].forEach((item) => {
	item.type = Fire;
	item.matter = {inertia: Infinity, frictionAir: 0.05, friction: 0};
	item.category = sf.filters.decoration;
	item.mask = sf.filters.object | sf.filters.platform;
});