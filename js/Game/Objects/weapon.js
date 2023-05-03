import sf from "../../sf";
import BaseObject from "./base_object";

export default class Weapon extends BaseObject{

	constructor(...params){
		super(...params);

		this.type = this.parent.weapon.type;
		this.damage = this.parent.weapon.damage;
		this.speed = this.parent.weapon.speed;
		this.timing = this.parent.weapon.timing;

		this.ammo = this.options.weapon.ammo;
	}

	getType(){
		return this.type;
	}

	pickup(){
		sf.game.kill(this);
		return this;
	}

	shoot(x, y, angle){

		if(this.ammo > 0){
			this.ammo --;

			sf.game.createObject(
				sf.data.objects.projectile, 
				{
					x: x, 
					y: y, 
					damage: this.damage, 
					speed: this.speed,
					angle: angle
				});
			return this.timing;
		}

		// Empty
		return 150;
	}
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [
	obj.magnum = { image: sf.data.loadImage("images/magnum.png"), resizable: false, weapon: {type: 1, ammo: 6, damage: 20, speed: 10, timing: 200}}

].forEach((item) => {
	item.type = Weapon;
	item.category = sf.filters.weapon;
	item.mask = sf.filters.object;
});