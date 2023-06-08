import sf from "../../sf.js";
import BaseObject from "./base_object.js";
import Effect from "./effect.js";

export default class Melee extends BaseObject{

	constructor(...params){
		super(...params);

		this.damage = this.parent.damage;
		this.hands	= this.parent.hands;
		this.effect	= this.parent.effect;
		this.hitbox = this.parent.hitbox;

		// Who holds the gun
		this.holderId = (this.options.holderId) ? this.options.holderId : -1;

		this.rectangles = [];
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

	draw(){
		super.draw();

		/*Show Hitboxes*/
		/*this.rectangles.forEach((rectangle) => {
			sf.ctx.save();
			sf.ctx.globalAlpha = 0.25;
			sf.ctx.fillStyle = "red";
			sf.ctx.fillRect(rectangle.x - rectangle.width/2, rectangle.y - rectangle.height/2, rectangle.width, rectangle.height);
			sf.ctx.restore();			
		})*/
	}

	swing(combo){
		const holder = sf.game.getObjectById(this.holderId);

		if(holder){
			const position = holder.getPosition();

			// Create hitboxes
			this.rectangles = [];

			this.hitbox[combo].forEach((hitbox) => {
				this.rectangles.push({
					x: position.x + hitbox.x * holder.facingDirection,
					y: position.y + hitbox.y,
					width: hitbox.width,
					height: hitbox.height
				});
			});

			sf.game.createHitbox(holder, 
				this.rectangles,
				{
					x: 0.001 * holder.facingDirection, 
					y: (combo == 2) ? -0.001 : 0,
					damage: this.damage,
				});

			// Swing effect
			if(this.effect){
				sf.game.createObject(this.effect,
					{
						facingDirection: holder.facingDirection,
						frameIndex: {
							x: combo,
							y: 0
						},

						matter: {
							position: position
						}
					});
			}
		}
	}
};

/*
	Create data definitions for all Weapon objects
*/
const obj = sf.data.objects;

let added = [

	obj.fists = {
		image: sf.data.loadImage("images/player.png"),
		hands: 0,

		damage: {hp: 7, type: "melee"},
		hitbox: [
			[
				{x: 8, y: -3, width: 6, height: 5}
			],
			[
				{x: 7, y: -2, width: 5, height: 7},
			],
			[
				{x: 8, y: -3, width: 6, height: 5},
			],
		],
	},

	obj.sword = { 
		image: sf.data.loadImage("images/weapon/sword.png"),
		hands: 2,

		effect: sf.data.objects.sword_swing,

		damage: {hp: 10, type: "melee", sound: "cut"},
		hitbox: [
			[
				{x: 0, y: 0, width: 39, height: 12}
			],
			[
				{x: 11, y: -15, width: 25, height: 10},
				{x: 22, y: -3, width: 6, height: 13}
			],
			[
				{x: 12, y: -9, width: 18, height: 8},
				{x: 19, y: 1, width: 5, height: 12}
			],
		],

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/katana.mp3")
		}
	},

	obj.axe = {
		image: sf.data.loadImage("images/weapon/axe.png"),
		hands: 2,

		effect: sf.data.objects.axe_swing,

		damage: {hp: 10, type: "melee", sound: "cut"},
		hitbox: [
			[
				{x: 0, y: 0, width: 31, height: 12}
			],
			[
				{x: 5, y: -12, width: 22, height: 10},
				{x: 14, y: -1, width: 6, height: 13}
			],
			[
				{x: 8, y: -7, width: 17, height: 9},
				{x: 13, y: 3, width: 7, height: 11}
			],
		],

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/katana.mp3")
		}		
	},

	obj.machete = {
		image: sf.data.loadImage("images/weapon/machete.png"),
		hands: 1,

		effect: sf.data.objects.machete_swing,

		damage: {hp: 10, type: "melee", sound: "cut"},
		hitbox: [
			[
				{x: 1, y: 1, width: 19, height: 9}
			],
			[
				{x: 3, y: -13, width: 27, height: 8},
				{x: 14, y: -4, width: 5, height: 9}
			],
			[
				{x: 10, y: 0, width: 12, height: 20}
			],
		],

		sounds: {
			draw: sf.data.loadAudio("sounds/weapon/katana.mp3")
		}		
	}

].forEach((item) => {
	item.type = Melee;
	item.group = sf.collision.groups.none;

	item.matter = {
		isStatic: true
	};
});