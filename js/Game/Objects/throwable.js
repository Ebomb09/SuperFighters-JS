import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Throwable extends BaseObject{

	constructor(...params){
		super(...params);

		this.projectile = this.parent.projectile;
		this.detonationTime = this.parent.detonationTime;

		this.ammo = this.options.ammo;

		this.holderId = (this.options.holderId) ? this.options.holderId : -1;
		this.projectileId = (this.options.projectileId) ? this.options.projectileId : -1;
	}

	serialize(){
		const serial = super.serialize();

		serial.ammo = this.ammo;
		serial.holderId = this.holderId;
		serial.projectileId = this.projectileId;

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

	update(){

		const holder = sf.game.getObjectById(this.holderId);
		const projectile = sf.game.getObjectById(this.projectileId);

		if(!projectile)
			this.projectileId = -1;

		// Reset cooking projectile to the holders defined position
		if(holder && projectile){

			// Check if the holder is still prepareing the throw
			if(holder.checkState("prepare_throw")){
				projectile.setPosition(holder.getThrowablePosition().x, holder.getThrowablePosition().y);
				projectile.setVelocity(0, 0);
				projectile.setAngle(0);
				projectile.setAngularVelocity(0);

			// If not then no longer need to keep track of
			}else{
				this.projectileId = -1;
			}
		}		
	}

	cook(){

		// Create projectile item and prepare to throw
		if(this.ammo > 0){
			this.ammo --;
			sf.data.playAudio(this.sounds.draw);

			const holder = sf.game.getObjectById(this.holderId);

			if(!holder)
				return;

			const projectile = sf.game.createObject(this.projectile,
				{
					lifeTime: this.detonationTime,

					matter: {
						position: holder.getThrowablePosition(),
					}
				});

			this.projectileId = projectile.id;
		}
	}

	throw(){

		const holder = sf.game.getObjectById(this.holderId);
		const projectile = sf.game.getObjectById(this.projectileId);

		// Throw to the holders crosshair
		if(holder && projectile){
			projectile.setPosition(holder.getCrosshairPosition().x, holder.getCrosshairPosition().y);
			projectile.setVelocity(Math.cos(holder.getCrosshairAngle()) * 5, Math.sin(holder.getCrosshairAngle()) * 5);
			this.projectileId = -1;
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
	item.group = sf.collision.groups.dynamic_inactive;

	item.matter = {
		isStatic: true
	};

	item.editor = {
		enabled: true,
		
		properties: [
			{
				name: "Ammo", 
				type: "number", 
				get: (obj) => {return obj.ammo},
				post: (obj, ammo) => {obj.ammo = ammo}
			}
		]
	};
});