import sf from "../sf";
import BaseMenu from "./base_menu";
import Game from "../Game/game";

export default class SetupMenu extends BaseMenu{

	constructor(){
		super();

		this.addMarker({
			x: 200,
			y: 0,
			w: 150,
			h: 30,

			text: "Graphic Quality",
			textSize: 20,

			onTouch: () => {

			}			
		});

		this.addMarker({
			x: 200,
			y: 30,
			w: 150,
			h: 30,

			text: "Effect Quality",
			textSize: 20,

			onTouch: () => {

			}			
		});

		this.addMarker({
			x: 200,
			y: 60,
			w: 150,
			h: 30,

			text: "Sound Volume",
			textSize: 20,

			onTouch: () => {

			}			
		});

		this.addMarker({
			x: 200,
			y: 90,
			w: 150,
			h: 30,

			text: "Edit Controls",
			textSize: 20,

			onTouch: () => {

			}			
		});
	}
};