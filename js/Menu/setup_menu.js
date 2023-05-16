import sf from "../sf";
import BaseMenu from "./base_menu";
import ControlsMenu from "./controls_menu";
import ProfileMenu from "./profile_menu";

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