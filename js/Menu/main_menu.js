import sf from "../sf";
import Game from "../Game/game";
import Editor from "../Game/editor";
import BaseMenu from "./base_menu";
import SetupMenu from "./setup_menu";
import CreateGameMenu from "./create_game_menu";
import BrowserMenu from "./browser_menu";

export default class MainMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.addMarkers(this.options,
			[{
				text: "Create a Game",
				onSelect: () => {
					sf.menuDispatcher.push(new CreateGameMenu(this.options.x + this.options.w, this.options.y + this.options.h));
				}
			},
			{
				text: "Browse Games",
				onSelect: () => {
					sf.menuDispatcher.push(new BrowserMenu);
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
				text: "Set Up",	
				onSelect: () => {
					sf.menuDispatcher.push(new SetupMenu(this.options.x + this.options.w, this.options.y + this.options.h));
				}
			}
			]);
	}
};