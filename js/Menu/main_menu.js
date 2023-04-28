import BaseMenu from "./base_menu";
import Game from "../Game/game";

export default class MainMenu extends BaseMenu{

	constructor(){
		super();

		this.markers.push({
			x: 0,
			y: 0,
			w: 150,
			h: 30,

			fill: "red",
			font: "30px arial",

			text: "Play",

			onTouch: () => {
				sf.game = new Game();
			}
		});
	}
};