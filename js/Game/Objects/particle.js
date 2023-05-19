import sf from "../../sf.js";
import BaseObject from "./base_object.js";

class Particle extends BaseObject{

	constructor(...params){
		super(...params);

		this.animation 			= this.parent.animation;
		this.animateRealTime 	= this.parent.animateRealTime;
		this.fade 				= this.parent.fade;
	}

	draw(){

		if(this.animation){

			if(this.animateRealTime)
				this.setAnimationFrame(this.animation);
			else
				this.setAnimationFrame(this.animation, this.delayTimestamp());
		}

		sf.ctx.save();

		if(this.fade)
			sf.ctx.globalAlpha = this.delayPercentNotDone();

		super.draw({angle: 0});
		sf.ctx.restore();
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

		lifeTime: 6,
		animation: [
			{x: 1, y: 0, delay: 3},
			{x: 1, y: 1, delay: 3}
		],

		disableGravity: true
	},

	obj.explosion_small = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifeTime: 6,
		animation: [
			{x: 2, y: 0, delay: 3},
			{x: 2, y: 1, delay: 3}
		],

		disableGravity: true
	},

	obj.explosion_large = { 
		image: sf.data.loadImage("images/effect/hit.png"), 
		frameCount: {x: 4, y: 2},

		lifeTime: 6,
		animation: [
			{x: 3, y: 0, delay: 3},
			{x: 3, y: 1, delay: 3}
		],

		disableGravity: true
	},

	obj.electric = {
		image: sf.data.loadImage("images/effect/electric.png"), 
		frameCount: {x: 3, y: 1},

		lifeTime: 9,
		animation: [
			{x: 0, y: 0, delay: 3},
			{x: 1, y: 0, delay: 3},
			{x: 2, y: 0, delay: 3},	
		],

		disableGravity: true	
	},

	obj.spark = {
		image: sf.data.loadImage("images/effect/spark.png"), 
		frameCount: {x: 5, y: 1},

		lifeTime: 15,
		animation: [
			{x: 0, y: 0, delay: 3},
			{x: 1, y: 0, delay: 3},
			{x: 2, y: 0, delay: 3},
			{x: 3, y: 0, delay: 3},		
			{x: 4, y: 0, delay: 3},	
		],

		disableGravity: true
	},

	obj.blood_small = {
		image: sf.data.loadImage("images/effect/blood.png"), 
		frameCount: {x: 2, y: 1},
		frameIndex: {x: 0, y: 0},

		lifeTime: 30,
		fade: true
	},

	obj.blood_large = {
		image: sf.data.loadImage("images/effect/blood.png"), 
		frameCount: {x: 2, y: 1},
		frameIndex: {x: 1, y: 0},

		lifeTime: 30,
		fade: true
	},

	obj.casing_small = {
		image: sf.data.loadImage("images/effect/casing_small.png"), 
		lifeTime: 30,
		fade: true
	},

	obj.casing_large = {
		image: sf.data.loadImage("images/effect/casing_large.png"), 
		lifeTime: 30,
		fade: true
	},

	obj.shell = {
		image: sf.data.loadImage("images/effect/shell.png"), 
		lifeTime: 30,
		fade: true
	},

	obj.smoke = {
		image: sf.data.loadImage("images/effect/smoke.png"),
		lifeTime: 30,
		fade: true,
		disableGravity: true
	},

	obj.burn = {
		image: sf.data.loadImage("images/effect/burn.png"),
		frameCount: {x: 5, y: 1},
		animation: [
			{x: 0, y: 0, delay: 3},
			{x: 1, y: 0, delay: 3},
			{x: 2, y: 0, delay: 3},
			{x: 3, y: 0, delay: 3},		
			{x: 4, y: 0, delay: 3},
		],
		animateRealTime: true,
		lifeTime: 1,
		disableGravity: true
	}

].forEach((item) => {
	item.type = Particle;
	item.category = sf.filters.effect;
	item.mask = 0;
});