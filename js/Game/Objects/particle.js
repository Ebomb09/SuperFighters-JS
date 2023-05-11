import sf from "../../sf";
import BaseObject from "./base_object";

class Particle extends BaseObject{

	constructor(...params){
		super(...params);

		this.lifetime 	= this.parent.lifetime;
		this.animation 	= this.parent.animation;

		this.startTime = (this.options.startTime) ? this.options.startTime : Date.now();
	}

	serialize(){
		const serial = this.serialize;

		return serial;
	}

	update(){

		if(Date.now() - this.startTime >= this.lifetime)
			this.kill();
	}

	draw(){
		this.setAnimationFrame(this.animation, Date.now() - this.startTime);
		super.draw();
	}
};


/*
	Create data definitions for all Particle objects
*/
const obj = sf.data.objects;

let added = [

	obj.hit = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifetime: 100,
		animation: [
			{x: 1, y: 0, delay: 50},
			{x: 1, y: 1, delay: 50}
		],

		matter: {
			isStatic: true
		}
	},

	obj.explosion_small = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifetime: 100,
		animation: [
			{x: 2, y: 0, delay: 50},
			{x: 2, y: 1, delay: 50}
		],

		matter: {
			isStatic: true
		}
	},

	obj.explosion_large = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifetime: 100,
		animation: [
			{x: 3, y: 0, delay: 50},
			{x: 3, y: 1, delay: 50}
		],

		matter: {
			isStatic: true
		}
	},

].forEach((item) => {
	item.type = Particle;
	item.category = sf.filters.effect;
});