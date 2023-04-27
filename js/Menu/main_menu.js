import BaseMenu from "./base_menu"

export default class MainMenu extends BaseMenu{

	constructor(x, y){
		super();

		this.markers.push({
			x: x,
			y: y,
			w: 150,
			h: 30,

			fill: "red",
			font: "30px arial",

			text: "Play",

			onTouch: () => {
				console.log("TEST");
			}
		});
	}
};