import sf from "../sf.js";
import Game from "../Game/game.js";
import Editor from "../Game/editor.js";
import BaseMenu from "./base_menu.js";
import SetupMenu from "./setup_menu.js";
import CreateGameMenu from "./create_game_menu.js";
import BrowserMenu from "./browser_menu.js";

export default class MainMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.addMarkers(this.options,
			[{
				text: "Create a Game",
				onSelect: () => {
					sf.menuDispatcher.addMenu(CreateGameMenu);
				}
			},
			{
				text: "Browse Games",
				onSelect: () => {
					sf.menuDispatcher.addMenu(BrowserMenu);
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
					sf.menuDispatcher.addMenu(SetupMenu);
				}
			}
			]);
	}
};