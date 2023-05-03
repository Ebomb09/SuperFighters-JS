import sf from "../../sf";
import BaseObject from "./base_object";

export default class Projectile extends BaseObject{

	constructor(...params){
		super(...params, {width: 2, height: 2, matter: {inertia: Infinity}});

		this.damage = this.options.damage;
		this.speed = this.options.speed;
		this.angle = this.options.angle * Math.PI / 180;

		Matter.Body.setAngle(this.body, this.angle);
	}

	draw(){
		super.draw({
			offset: {
				x: -this.frame.width/2,
				y: -this.frame.height/2
			}
		});
	}

	addCollision(src, collision){
		sf.game.kill(this);
	}

	update(ms){
		super.update(ms);

		let velocity = Matter.Vector.create(
			Math.cos(this.angle) * this.speed,
			Math.sin(this.angle) * this.speed
			);

		Matter.Body.setVelocity(this.body, velocity);
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
});