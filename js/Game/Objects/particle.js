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

		serial.lifetime = this.lifetime;
		serial.animation = this.animation;
		serial.startTime = this.startTime;

		return serial;
	}

	update(ms){
		super.update(ms);

		if(Date.now() - this.startTime >= this.lifetime)
			this.kill();
	}

	draw(){

		if(this.animation)
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

		disableGravity: true
	},

	obj.explosion_small = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifetime: 100,
		animation: [
			{x: 2, y: 0, delay: 50},
			{x: 2, y: 1, delay: 50}
		],

		disableGravity: true
	},

	obj.explosion_large = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifetime: 100,
		animation: [
			{x: 3, y: 0, delay: 50},
			{x: 3, y: 1, delay: 50}
		],

		disableGravity: true
	},

	obj.electric = {
		image: sf.data.loadImage("images/effect/electric.png"), 
		frameCount: {x: 3, y: 1},

		lifetime: 150,
		animation: [
			{x: 0, y: 0, delay: 50},
			{x: 1, y: 0, delay: 50},
			{x: 2, y: 0, delay: 50},	
		],

		disableGravity: true	
	},

	obj.spark = {
		image: sf.data.loadImage("images/effect/spark.png"), 
		frameCount: {x: 5, y: 1},

		lifetime: 250,
		animation: [
			{x: 0, y: 0, delay: 50},
			{x: 1, y: 0, delay: 50},
			{x: 2, y: 0, delay: 50},
			{x: 3, y: 0, delay: 50},		
			{x: 4, y: 0, delay: 50},	
		],

		disableGravity: true
	},

	obj.blood_small = {
		image: sf.data.loadImage("images/effect/blood.png"), 
		frameCount: {x: 2, y: 1},
		frameIndex: {x: 0, y: 0},

		lifetime: 500
	},

	obj.blood_large = {
		image: sf.data.loadImage("images/effect/blood.png"), 
		frameCount: {x: 2, y: 1},
		frameIndex: {x: 1, y: 0},

		lifetime: 500
	},

	obj.casing_small = {
		image: sf.data.loadImage("images/effect/casing_small.png"), 
		lifetime: 500
	},

	obj.casing_large = {
		image: sf.data.loadImage("images/effect/casing_large.png"), 
		lifetime: 500
	},

	obj.shell = {
		image: sf.data.loadImage("images/effect/shell.png"), 
		lifetime: 500
	}

].forEach((item) => {
	item.type = Particle;
	item.category = sf.filters.effect;
	item.mask = 0;
});