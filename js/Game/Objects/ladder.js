import sf from "../../sf";
import BaseObject from "./base_object";

export default class Ladder extends BaseObject{

	constructor(...params){
		super(...params);
	}
};


/*
	Create data definitions for all Ladder objects
*/
const obj = sf.data.objects;

let added = [
	
	obj.ladder = {
		image: sf.data.loadImage("images/ladder.png"),
		frameCount: {x: 3, y: 1}
	}

].forEach((item) => {
	item.type = Ladder;
	item.resizable = true;
	item.matter = {isStatic: true};
	item.category = sf.filters.ladder;
});