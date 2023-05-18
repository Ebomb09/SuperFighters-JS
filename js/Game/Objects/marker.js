import sf from "../../sf";
import BaseObject from "./base_object";

export default class Marker extends BaseObject{

	constructor(...params){
		super(...params);
	}

	serialize(){
		const serial = super.serialize();

		if(this.targetAId) serial.targetAId = this.targetAId;
		if(this.targetBId) serial.targetBId = this.targetBId;

		return serial;
	}

	update(ms){
		const targetA = sf.game.getObjectById(this.targetAId);
		const targetB = sf.game.getObjectById(this.targetBId);

		// Check if the targets are still valid
		if(!targetA)
			this.targetAId = -1;
		if(!targetB)
			this.targetBId = -1;		

		// Create constraint and add to world on first game update
		if(!this.constraint && targetA && targetB){

			this.constraint = Matter.Constraint.create({
				bodyA: targetA.body,
				bodyB: targetB.body
				});

			Matter.Composite.add(sf.game.world, this.constraint);
		}
	}
};


/*
	Create data definitions for all Marker objects
*/
const obj = sf.data.objects;

let added = [

	obj.player_spawn = { 
		image: sf.data.loadImage("images/marker/player_spawn.png")
	},

	obj.weapon_spawn = {
		image: sf.data.loadImage("images/marker/weapon_spawn.png")
	},

	obj.distance_marker = {
		image: sf.data.loadImage("images/marker/distance.png"),

		oncreate: (object) => {
			object.targetAId = (object.options.targetAId) ? object.options.targetAId : -1;
			object.targetBId = (object.options.targetBId) ? object.options.targetBId : -1;
		}
	}


].forEach((item) => {
	item.type = Marker;
	item.matter = {
		isStatic: true
	};
	item.category = sf.filters.marker;
});