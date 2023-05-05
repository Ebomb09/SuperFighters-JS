import sf from "../../sf";
import BaseObject from "./base_object";

export default class Gun extends BaseObject{

	constructor(...params){
		super(...params);

		// Alias the parent gun settings
		this.gun = this.parent.gun;

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

	pullout(){
		sf.data.playAudio(this.gun.drawSound);
		return 100;
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
					damage: this.gun.damage, 
					speed: this.gun.speed,
					matter:{
						angle: angle
					}
				});

			sf.data.playAudio(this.gun.firingSound);
			return this.gun.timing;
		}

		sf.data.playAudio(this.gun.emptySound);
		return 150;
	}
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [
	obj.magnum = { 
		image: sf.data.loadImage("images/weapons/magnum.png"),
		gun: {
			ammo: 6, 
			damage: 20, 
			speed: 15, 
			timing: 400, 
			firingSound: sf.data.loadAudio("sounds/magnum.mp3"),
			emptySound: sf.data.loadAudio("sounds/outofammo_light.mp3"),
			drawSound: sf.data.loadAudio("sounds/aim_small.mp3")
		}
	}

].forEach((item) => {
	item.type = Gun;
	item.category = sf.filters.weapon;
	item.mask = sf.filters.object | sf.filters.platform;
});