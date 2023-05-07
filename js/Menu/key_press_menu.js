import sf from "../sf";
import BaseMenu from "./base_menu";

/* Default Control scheme
	up: 				"ArrowUp",
	down: 				"ArrowDown",
	left: 				"ArrowLeft",
	right: 				"ArrowRight",
	primaryAttack: 		"KeyA",
	secondaryAttack: 	"KeyS",
	aim: 				"KeyD",
	interact: 			"KeyF"
*/

export default class KeyPressMenu extends BaseMenu{

	constructor(text, callback){
		super();

		this.addMarker({
			x: 325,
			y: 225,
			w: 150,
			h: 150,

			text: text
		});

		sf.input.key.lastPressed = "";

		this.callback = callback;
	}

	update() {

		if(sf.input.key.lastPressed != ""){
			sf.menuDispatcher.pop()

			if(this.callback)
				this.callback(sf.input.key.lastPressed);
		}
	}
};