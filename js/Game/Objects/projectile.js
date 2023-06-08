import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Projectile extends BaseObject{

	constructor(...params){
		super(...params, {disableGravity: true, width: 8, height: 1, matter: {isSensor: true}});

		this.damage = this.options.damage;
	}

	serialize(){
		const serial = super.serialize();
		serial.damage = this.damage;
		return serial;
	}

	draw(){

		const speed = Math.sqrt(Math.pow(this.getVelocity().x, 2) + Math.pow(this.getVelocity().y, 2));

		super.draw(
			{
				offset: {
					x: -this.frame.width/2,
					y: -this.frame.height/2
				},
				scale: {
					x: speed * 2 / this.frame.width,
					y: 0.5
				}
			});
	}

	addCollision(source, collision){
		source.dealDamage({hp: this.damage, type: "projectile"});
		sf.game.createObject(sf.data.objects.hit, {matter: { position: this.getPosition() }});
		this.kill();
	}
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [
	
	obj.projectile = { 
		image: sf.data.loadImage("images/projectile.png")
	}

].forEach((item) => {
	item.type = Projectile;
	item.group = sf.collision.groups.projectile;
});