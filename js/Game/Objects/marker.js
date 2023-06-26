import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Marker extends BaseObject{

	constructor(...params){
		super(...params);
	}

	serialize(){
		const serial = super.serialize();

		if(this.targetAId !== undefined) serial.targetAId = this.targetAId;
		if(this.targetBId !== undefined) serial.targetBId = this.targetBId;

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
		image: sf.data.loadImage("images/marker/player_spawn.png"),

		editor: {
			enabled: true
		}
	},

	obj.weapon_spawn = {
		image: sf.data.loadImage("images/marker/weapon_spawn.png"),

		editor: {
			enabled: true
		}
	},

	obj.distance_marker = {
		image: sf.data.loadImage("images/marker/distance.png"),

		oncreate: (object) => {
			object.targetAId = (object.options.targetAId) ? object.options.targetAId : -1;
			object.targetBId = (object.options.targetBId) ? object.options.targetBId : -1;
		},

		editor: {
			enabled: true,

			properties: [
				{
					name: "target A Id",
					type: "number",
					get: (obj) => {return obj.targetAId},
					post: (obj, id) => {obj.targetAId = id}			
				},
				{
					name: "target B Id",
					type: "number",
					get: (obj) => {return obj.targetBId},
					post: (obj, id) => {obj.targetBId = id}			
				}
			]
		}
	}


].forEach((item) => {
	item.type = Marker;
	item.matter = {
		isStatic: true
	};
	item.group = sf.collision.groups.none;
});