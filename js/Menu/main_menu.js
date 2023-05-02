import sf from "../sf";
import Game from "../Game/game";
import Editor from "../Game/editor";
import BaseMenu from "./base_menu";
import SetupMenu from "./setup_menu";

export default class MainMenu extends BaseMenu{

	constructor(){
		super();

		this.addMarker({
			x: 0,
			y: 0,
			w: 150,
			h: 30,

			text: "Play",
			textSize: 20,

			onTouch: () => {

				fetch("maps/test.sfm").then((response) => {
					return response.text();
				}).then((data) => {
					sf.game = new Game(data);
					sf.menuDispatcher.clear();
				});
			}
		});

		this.addMarker({
			x: 0,
			y: 30,
			w: 150,
			h: 30,

			text: "Editor",
			textSize: 20,

			onTouch: () => {
				sf.game = new Editor();
				sf.menuDispatcher.clear();
			}
		});

		this.addMarker({
			x: 0,
			y: 60,
			w: 150,
			h: 30,

			text: "Tutorial",
			textSize: 20,

			onTouch: () => {

			}
		});

		this.addMarker({
			x: 0,
			y: 90,
			w: 150,
			h: 30,

			text: "Set up",
			textSize: 20,

			onTouch: () => {
				sf.menuDispatcher.push(new SetupMenu);
			}
		});
	}
};