import sf from "../../sf";
import BaseObject from "./base_object";

export default class Background extends BaseObject{

	constructor(...params){
		super(...params);
	}
};


/*
	Create data definitions for all Marker objects
*/
const obj = sf.data.objects;

let added = [
	

].forEach((item) => {
	item.type = Background;
	item.matter = {isStatic: true, inertia: Infinity};
	item.category = sf.filters.background;
});