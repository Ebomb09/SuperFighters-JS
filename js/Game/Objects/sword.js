import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Sword extends BaseObject{

	constructor(...params){
		super(...params);

		this.damage = this.parent.damage;
		this.hands	= this.parent.hands;

		// Who holds the gun
		this.holderId = (this.options.holderId) ? this.options.holderId : -1;
	}

	serialize(){
		const serial = super.serialize();

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
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [

	obj.sword = { 
		image: sf.data.loadImage("images/weapon/sword.png"),
		damage: 10,
		hands: 2,

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/katana.mp3")
		}
	},

	obj.axe = {
		image: sf.data.loadImage("images/weapon/axe.png"),
		damage: 10,
		hands: 2,

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/katana.mp3")
		}		
	},

	obj.machete = {
		image: sf.data.loadImage("images/weapon/machete.png"),
		damage: 10,
		hands: 1,

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/katana.mp3")
		}		
	}

].forEach((item) => {
	item.type = Sword;
	item.category = sf.filters.weapon;
	item.mask = sf.filters.object | sf.filters.platform;

	item.matter = {
		isStatic: true
	};
});