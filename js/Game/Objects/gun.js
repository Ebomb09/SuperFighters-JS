import sf from "../../sf.js";
import BaseObject from "./base_object.js";
import Projectile from "./projectile.js";
import Fire from "./fire.js";
import Effect from "./effect.js";

const State = {
	Picked: "picked_up",
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
		this.flash		= this.parent.flash;

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
		this.setState(State.Picked);
		sf.data.playAudio(this.sounds.draw);
		return 6;
	}

	delayCallback(action){

		super.delayCallback(action);

		switch(action){

			case "shoot":
				const holder = sf.game.getObjectById(this.holderId);

				if(!holder)
					break;

				const position = holder.getCrosshairPosition();
				const angle = holder.getCrosshairAngle();

				// Create the count of projectiles
				for(let j = 0; j < this.count; j ++){

					const projectileAngle = angle + this.getSpread();

					// Create Projectile
					sf.game.createObject(this.projectile, 
						{
							damage: this.damage, 

							matter:{
								position: position,
								angle: projectileAngle,
								velocity: {
									x: Math.cos(projectileAngle) * this.speed,
									y: Math.sin(projectileAngle) * this.speed
								}
							}
						});
				}

				// Create muzzle flash
				if(this.flash){
					sf.game.createObject(this.flash,
						{
							matter:{
								position: {
									x: position.x + Math.cos(angle) * (this.frame.width/4),
									y: position.y + Math.sin(angle) * (this.frame.width/4)
								},
								angle: angle
							}
						});
				}

				// Effect, typically the casing / shell of the gun
				if(this.expel){
					sf.game.createObject(this.expel, 
						{
							matter:{
								position: position,
								angle: sf.game.random() * Math.PI * 2,
								velocity: {
									x: (Math.cos(angle) * -3),
									y: (Math.sin(angle) * -3) - 1
								}
							}
						});
				}

				sf.data.playAudio(this.sounds.fire);
				break;
		}
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
					action: "shoot"
				});

				delay += this.timing / this.burst;
			}

			// Play audio once (spare ears)
			sf.data.playAudio(this.sounds.fireOnce);

			this.setState(State.Firing, this.timing, shots);
			return this.timing;
		}

		sf.data.playAudio(this.sounds.empty);
		return 9;
	}

	getSpread(){
		return Math.round((sf.game.random()*this.spread) - this.spread/2) * Math.PI / 180;
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
		timing: 12, 
		spread: 5,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,
		flash: sf.data.objects.light_flash,

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
		timing: 24, 
		spread: 10,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,
		flash: sf.data.objects.light_flash,

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
		timing: 24, 
		spread: 1,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,
		flash: sf.data.objects.heavy_flash,

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
		timing: 24, 
		spread: 5,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_small,
		flash: sf.data.objects.rifle_flash,

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
		timing: 24, 
		spread: 20,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.shell,
		flash: sf.data.objects.heavy_flash,

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
		timing: 24, 
		spread: 0,

		projectile: sf.data.objects.projectile,
		expel: sf.data.objects.casing_large,
		flash: sf.data.objects.rifle_flash,

		sounds: {
			fire: [
					sf.data.loadAudio("sounds/weapon/sniper00.mp3"), 
					sf.data.loadAudio("sounds/weapon/sniper01.mp3")
			],
			empty: 	sf.data.loadAudio("sounds/weapon/heavy_outofammo.mp3"),
			draw: 	sf.data.loadAudio("sounds/weapon/rifle_draw.mp3")				
		}
	},

	obj.flamethrower = { 
		image: sf.data.loadImage("images/weapon/flamethrower.png"),

		ammo: 60, 
		burst: 10,
		speed: 4, 
		timing: 30, 
		spread: 15,

		projectile: sf.data.objects.fire,

		sounds: {
			fireOnce: 	sf.data.loadAudio("sounds/fireplosion.mp3"), 
			empty: 		sf.data.loadAudio("sounds/weapon/light_outofammo.mp3"),
			draw: 		sf.data.loadAudio("sounds/weapon/heavy_draw.mp3")				
		}
	},

	obj.bazooka = {
		image: sf.data.loadImage("images/weapon/bazooka.png"),

		ammo: 3,
		speed: 4,
		timing: 30,
		spread: 5,

		projectile: sf.data.objects.rocket,
		flash: sf.data.objects.heavy_flash,

		sounds: {
			fire: 	sf.data.loadAudio("sounds/weapon/bazooka.mp3"), 
			empty: 	sf.data.loadAudio("sounds/weapon/heavy_draw.mp3"), 
			draw: 	sf.data.loadAudio("sounds/weapon/bazooka_aim.mp3")
		}
	}

].forEach((item) => {
	item.type = Gun;
	item.group = sf.collision.groups.item;

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