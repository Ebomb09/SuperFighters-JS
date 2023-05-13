import sf from "../../sf";
import BaseObject from "./base_object";

const State = {
	Firing: "firing"
};

export default class Gun extends BaseObject{

	constructor(...params){
		super(...params);

		// Alias the parent gun settings
		this.damage 	= this.parent.damage;
		this.speed		= this.parent.speed;
		this.spread		= this.parent.spread;

		this.count		= (this.parent.count) ? this.parent.count : 1;
		this.burst 		= (this.parent.burst) ? this.parent.burst : 1;

		this.projectile	= this.parent.projectile;
		this.expel 		= this.parent.expel;

		this.timing		= this.parent.timing;

		// Ammo can be set
		this.ammo = this.options.ammo;

		// Who holds the gun
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
		return 100;
	}

	shoot(){

		if(this.ammo > 0){
			this.ammo -= this.burst;

			let shots = [];
			let delay = 0;

			// Spread burst fire over the timing delay
			for(let i = 0; i < this.burst; i ++){

				shots.push({
					delay: delay,
					action: () => {
						const holder = sf.game.getObjectById(this.holderId);

						if(!holder)
							return;

						const position = holder.getCrosshairPosition();
						const angle = holder.getCrosshairAngle();

						// Create the count of projectiles
						for(let j = 0; j < this.count; j ++){

							sf.game.createObject(this.projectile, 
								{
									damage: this.damage, 
									speed: this.speed,

									matter:{
										position: position,
										angle: angle + this.getSpread()
									}
								});
						}

						// Effect, typically the casing / shell of the gun
						sf.game.createObject(this.expel, 
							{
								matter:{
									position: position,
									angle: Math.random() * Math.PI * 2,
									velocity: {
										x: (Math.cos(angle) * -3),
										y: (Math.sin(angle) * -3) - 1
									}
								}
							});

						// PLay audio once (spare ears)
						sf.data.playAudio(this.sounds.fire);
					}
				});

				delay += this.timing / this.burst;
			}

			this.setState(State.Firing, this.timing, shots);
			return this.timing;
		}

		sf.data.playAudio(this.sounds.empty);
		return 150;
	}

	getSpread(){
		return Math.round((Math.random()*this.spread) - this.spread/2) * Math.PI / 180;
	}
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [

	obj.pistol = { 
		image: sf.data.loadImage("images/weapon/pistol.png"),

		ammo: 12, 
		damage: 6, 
		speed: 15, 
		timing: 200, 
		spread: 5,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,

		sounds: {
			fire: [
					sf.data.loadAudio("sounds/weapon/pistol00.mp3"),
					sf.data.loadAudio("sounds/weapon/pistol01.mp3"),
					sf.data.loadAudio("sounds/weapon/pistol02.mp3"),
					sf.data.loadAudio("sounds/weapon/pistol03.mp3")
			],
			empty: 	sf.data.loadAudio("sounds/weapon/light_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/light_draw.mp3")
		}
	},

	obj.uzi = { 
		image: sf.data.loadImage("images/weapon/uzi.png"),

		ammo: 25, 
		burst: 5,
		damage: 6, 
		speed: 15, 
		timing: 400, 
		spread: 10,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,

		sounds: {
			fire: [
					sf.data.loadAudio("sounds/weapon/uzi00.mp3"),
					sf.data.loadAudio("sounds/weapon/uzi01.mp3"),
			],
			empty: 	sf.data.loadAudio("sounds/weapon/light_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/light_draw.mp3")
		}
	},

	obj.magnum = { 
		image: sf.data.loadImage("images/weapon/magnum.png"),

		ammo: 6, 
		damage: 25, 
		speed: 15, 
		timing: 400, 
		spread: 1,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,

		sounds: {
			fire: 	sf.data.loadAudio("sounds/weapon/magnum.mp3"),
			empty: 	sf.data.loadAudio("sounds/weapon/light_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/light_draw.mp3")
		}
	},

	obj.rifle = { 
		image: sf.data.loadImage("images/weapon/rifle.png"),

		ammo: 25, 
		burst: 5,
		damage: 7, 
		speed: 15, 
		timing: 400, 
		spread: 5,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,

		sounds: {
			fire: [
					sf.data.loadAudio("sounds/weapon/rifle00.mp3"),
					sf.data.loadAudio("sounds/weapon/rifle01.mp3"),
			],
			empty: 	sf.data.loadAudio("sounds/weapon/heavy_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/rifle_draw.mp3")				
		}
	},

	obj.shotgun = { 
		image: sf.data.loadImage("images/weapon/shotgun.png"),

		ammo: 8, 
		count: 4,
		damage: 6, 
		speed: 15, 
		timing: 400, 
		spread: 20,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.shell,

		sounds: {
			fire: [
					sf.data.loadAudio("sounds/weapon/shotgun00.mp3"),
					sf.data.loadAudio("sounds/weapon/shotgun01.mp3"),
					sf.data.loadAudio("sounds/weapon/shotgun02.mp3")
			],
			empty: 	sf.data.loadAudio("sounds/weapon/heavy_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/shotgun_draw.mp3")				
		}
	},

	obj.sniper = { 
		image: sf.data.loadImage("images/weapon/sniper.png"),

		ammo: 5, 
		damage: 66, 
		speed: 15, 
		timing: 400, 
		spread: 0,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_large,

		sounds: {
			fire: [
					sf.data.loadAudio("sounds/weapon/sniper00.mp3"), 
					sf.data.loadAudio("sounds/weapon/sniper01.mp3")
			],
			empty: 	sf.data.loadAudio("sounds/weapon/heavy_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/rifle_draw.mp3")				
		}
	}

].forEach((item) => {
	item.type = Gun;
	item.category = sf.filters.weapon;
	item.mask = sf.filters.object | sf.filters.platform;

	item.matter = {
		isStatic: true
	};
});