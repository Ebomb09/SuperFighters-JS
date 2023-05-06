import sf from "../../sf";
import BaseObject from "./base_object";

export default class Marker extends BaseObject{

	constructor(...params){
		super(...params);
	}
};


/*
	Create data definitions for all Marker objects
*/
const obj = sf.data.objects;

let added = [
	obj.player_spawn = { image: sf.data.loadImage("images/marker/player_spawn.png"), matter: {isStatic: true}}

].forEach((item) => {
	item.type = Marker;
	item.category = sf.filters.marker;
});