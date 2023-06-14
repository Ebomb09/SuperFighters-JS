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

	update(){
		super.update();

		this.frame.index.x = sf.game.frameCounter % this.frame.count.x;
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
	},

	obj.rocket = {
		image: sf.data.loadImage("images/rocket.png"),
		frameCount: {x: 4, y: 1},

		onkill: (object) => {

			sf.game.createExplosion(
				{
					x: object.getPosition().x,
					y: object.getPosition().y,
					radius: 32
				},
				0.008);
		}
	}

].forEach((item) => {
	item.type = Projectile;
	item.group = sf.collision.groups.projectile;
});