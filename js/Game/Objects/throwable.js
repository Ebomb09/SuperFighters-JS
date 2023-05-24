import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Throwable extends BaseObject{

	constructor(...params){
		super(...params);

		this.projectile = this.parent.projectile;
		this.detonationTime = this.parent.detonationTime;

		this.ammo = this.options.ammo;

		this.holderId = (this.options.holderId) ? this.options.holderId : -1;
	}

	serialize(){
		const serial = super.serialize();

		serial.ammo = this.ammo;
		serial.holderId = this.holderId;

		return serial;
	}

	pickup(equiper){
		this.holderId = equiper.id;

		// Remove physical body from world
		this.killBody();

		sf.data.playAudio(this.sounds.draw);

		return this.id;
	}

	pullout(){
		sf.data.playAudio(this.sounds.draw);
		return 6;
	}

	throw(cooked){

		if(this.ammo > 0){
			const holder = sf.game.getObjectById(this.holderId);

			if(!holder)
				return;

			sf.game.createObject(this.projectile,
				{
					lifeTime: (this.detonationTime) ? this.detonationTime - cooked : undefined,

					matter: {
						position: holder.getCrosshairPosition(),
						angle: holder.getCrosshairAngle(),
						velocity: {
							x: Math.cos(holder.getCrosshairAngle()) * 5,
							y: Math.sin(holder.getCrosshairAngle()) * 5
						}
					}
				});

			this.ammo --;
		}
		return 9;
	}
};

/*
	Create data definitions for all Throwable objects
*/
const obj = sf.data.objects;

let added = [

	obj.grenades = { 
		image: sf.data.loadImage("images/weapon/grenades.png"),

		ammo: 3,
		projectile: obj.grenade,
		detonationTime: 120,

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/grenade_draw.mp3")
		}
	},

	obj.molotovs = {
		image: sf.data.loadImage("images/weapon/molotovs.png"),

		ammo: 3,
		projectile: obj.molotov,

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/grenade_draw.mp3")
		}
	}

].forEach((item) => {
	item.type = Throwable;
	item.category = sf.filters.weapon;
	item.mask = sf.filters.object | sf.filters.platform;

	item.matter = {
		isStatic: true
	};
});