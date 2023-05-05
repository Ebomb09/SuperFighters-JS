import sf from "../../sf";
import BaseObject from "./base_object";

export default class Gun extends BaseObject{

	constructor(...params){
		super(...params);

		// Get Integral Weapon from the parent
		this.type = this.parent.gun.type;
		this.damage = this.parent.gun.damage;
		this.speed = this.parent.gun.speed;
		this.timing = this.parent.gun.timing;

		// Ammo can be set
		this.ammo = this.options.gun.ammo;

		// Who holds the gun
		this.equiper = null;
	}

	pickup(equiper){
		this.equiper = equiper;
		sf.game.kill(this);
		return this;
	}

	shoot(){

		if(this.ammo > 0){
			this.ammo --;

			const position = this.equiper.getCrosshairPosition();
			const angle = this.equiper.getCrosshairAngle();

			sf.game.createObject(sf.data.objects.projectile, 
				{
					x: position.x, 
					y: position.y, 
					damage: this.damage, 
					speed: this.speed,
					matter:{
						angle: angle
					}
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
	obj.magnum = { image: sf.data.loadImage("images/weapons/magnum.png"), gun: {ammo: 6, damage: 20, speed: 15, timing: 400}}

].forEach((item) => {
	item.type = Gun;
	item.category = sf.filters.weapon;
	item.mask = sf.filters.object | sf.filters.platform;
});