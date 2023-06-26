import sf from "../../sf.js";
import BaseObject from "./base_object.js";

export default class Platform extends BaseObject{

	constructor(...params){
		super(...params);
	}
};

/*
	Create data definitions for all Platform objects
*/
const obj = sf.data.objects;

let added = [

	obj.platform = { 
		image: sf.data.loadImage("images/platform.png"), 
		frameCount: {x: 3, y: 1}
	}

].forEach((item) => {
	item.type = Platform;
	item.matter = {isStatic: true};
	item.group = sf.collision.groups.platform;

	item.editor = {
		enabled: true,

		resizable: {
			width: true
		}
	};
});