import sf from "../../sf";
import BaseObject from "./base_object";

export default class Fire extends BaseObject{

	constructor(...params){
		super(...params);
	}

	update(ms){
		
		if(sf.game.frameCounter % 5 == 0)
			sf.game.createObject(sf.data.objects.smoke,
			{
				lifeTime: 30 * this.delayPercentNotDone(),

				matter:{
					position: this.getPosition(),
					velocity: {x: Math.random() - 0.5, y: -1}
				}
			});

		super.update(ms);
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
	item.matter = {inertia: Infinity, frictionAir: 0.05, friction: 0};
	item.category = sf.filters.decoration;
	item.mask = sf.filters.object | sf.filters.platform;
});