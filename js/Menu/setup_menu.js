import sf from "../sf";
import BaseMenu from "./base_menu";
import ControlsMenu from "./controls_menu";

export default class SetupMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.addMarkers(this.options, 
			[{
				text: "Graphic Quality",
				onSelect: () => {

				}			
			},
			{
				text: "Effect Quality",
				onSelect: () => {

				}					
			},
			{
				text: "Sound Volume",
				onSelect: () => {

				}				
			},
			{
				text: "Edit Controls",
				onSelect: () => {
					sf.menuDispatcher.push(new ControlsMenu(this.options.x + this.options.w, this.options.y + this.options.h))
				}	
			}]);
	}
};