import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Fire extends BaseObject{

	constructor(...params){
		super(...params);
	}

	update(){

		if(sf.game.frameCounter % 5 == 0)
			sf.game.createObject(sf.data.objects.smoke,
			{
				lifeTime: 30 * this.delayPercentNotDone(),

				matter:{
					position: this.getPosition(),
					velocity: {x: sf.game.random() - 0.5, y: -1}
				}
			});

		super.update();
	}

	draw(){
		sf.ctx.save();

		sf.ctx.globalAlpha = this.delayPercentNotDone();

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
		lifeTime: 180,

		gravityScale: 1/5
	}

].forEach((item) => {
	item.type = Fire;
	item.group = sf.collision.groups.dynamic_inactive;

	item.matter = {
		inertia: Infinity, 
		frictionAir: 0.05, 
		friction: 0
	};
});