import sf from "../sf";
import Game from "../Game/game";
import Editor from "../Game/editor";
import BaseMenu from "./base_menu";
import SetupMenu from "./setup_menu";
import GameMenu from "./game_menu";

export default class MainMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.addMarkers(this.options,
			[{
				text: "Play",
				onSelect: () => {
					sf.menuDispatcher.push(new GameMenu(this.options.x + this.options.w, this.options.y + this.options.h));
				}
			},
			{
				text: "Editor",
				onSelect: () => {
					sf.game = new Editor;
					sf.menuDispatcher.clear();
				}
			},
			{
				text: "Tutorial"
			},
			{
				text: "Set up",	
				onSelect: () => {
					sf.menuDispatcher.push(new SetupMenu(this.options.x + this.options.w, this.options.y + this.options.h));
				}
			}
			]);
	}
};