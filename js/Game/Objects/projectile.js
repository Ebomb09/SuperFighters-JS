import sf from "../../sf";
import BaseObject from "./base_object";

export default class Projectile extends BaseObject{

	constructor(...params){
		super(...params, {disableGravity: true, width: 8, height: 1});

		this.damage = this.options.damage;
		this.speed = this.options.speed;
		this.angle = this.options.matter.angle;

		Matter.Body.setAngle(this.body, this.angle);
	}

	draw(){
		super.draw(
			{
				offset: {
					x: -this.frame.width/2,
					y: -this.frame.height/2
				}
			});
	}

	addCollision(source, collision){
		source.dealDamage(this.damage);
		sf.game.kill(this);
	}

	update(ms){
		super.update(ms);

		Matter.Body.setVelocity(this.body,
			{
				x: Math.cos(this.angle) * this.speed,
				y: Math.sin(this.angle) * this.speed
			});
	}
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [
	obj.projectile = { image: sf.data.loadImage("images/projectile.png"), resizable: false}

].forEach((item) => {
	item.type = Projectile;
	item.category = sf.filters.projectile;
	item.mask = sf.filters.object | sf.filters.player;
});