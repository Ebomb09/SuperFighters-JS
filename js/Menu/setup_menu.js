import sf from "../sf.js";
import BaseMenu from "./base_menu.js";
import ControlsMenu from "./controls_menu.js";
import ProfileMenu from "./profile_menu.js";

export default class SetupMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.addMarkers(this.options, 
			[
			{
				text: "Customize",
				onSelect: () => {
					sf.menuDispatcher.addMenu(ProfileMenu);
				}
			},
			{
				text: "Edit Controls",
				onSelect: () => {
					sf.menuDispatcher.addMenu(ControlsMenu);
				}	
			}]);
	}

	onClose(){
		// Save config
		localStorage.setItem("config", JSON.stringify(sf.config));
	}
};