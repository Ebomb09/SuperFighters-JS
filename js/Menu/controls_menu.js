import sf from "../sf.js";
import BaseMenu from "./base_menu.js";
import KeyPressMenu from "./key_press_menu.js";

/* Default Control scheme
	up: 				"ArrowUp",
	down: 				"ArrowDown",
	left: 				"ArrowLeft",
	right: 				"ArrowRight",
	primaryAttack: 		"KeyA",
	secondaryAttack: 	"KeyS",
	aim: 				"KeyD",
	interact: 			"KeyF"
*/

export default class ControlsMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.playerIndex = 0;

		this.addMarkers(this.options, 
			[{
				text: this.getPlayerText(),
				onRight: (marker) => {

					if(this.playerIndex < 7)
						this.playerIndex ++;

					marker.text = this.getPlayerText();
				},	
				onLeft: (marker) => {

					if(this.playerIndex > 0)
						this.playerIndex --;

					marker.text = this.getPlayerText();					
				}		
			},
			{
				text: "Up",
				onSelect: () => { this.setControlKey("up"); }
			},
			{
				text: "Down",
				onSelect: () => { this.setControlKey("down"); }
			},
			{
				text: "Left",
				onSelect: () => { this.setControlKey("left"); }
			},
			{
				text: "Right",
				onSelect: () => { this.setControlKey("right"); }
			},
			{
				text: "Primary Attack",
				onSelect: () => { this.setControlKey("primaryAttack"); }
			},
			{
				text: "Secondary Attack",
				onSelect: () => { this.setControlKey("secondaryAttack"); }
			},
			{
				text: "Aim",
				onSelect: () => { this.setControlKey("aim"); }
			},
			{
				text: "Interact",
				onSelect: () => { this.setControlKey("interact"); }
			}
			]);

		this.options.x += this.options.w;
		this.options.y += this.options.h;

		this.addMarkers(this.options,
			[
				{key: "up"},
				{key: "down"},
				{key: "left"},
				{key: "right"},
				{key: "primaryAttack"},
				{key: "secondaryAttack"},
				{key: "aim"},
				{key: "interact"}
			]);
	}

	update(){

		this.markers.forEach((marker) => {

			if(marker.key)
				marker.text = this.getControlKey(marker.key);
		});
	}

	setControlKey(control){

		sf.menuDispatcher.push(new KeyPressMenu("Press a Key...",
			(key) => {
				const config = sf.config.controls;

				// Create config for player if not already
				if(!config[this.playerIndex])
					config[this.playerIndex] = {};

				// Set the control key
				if(key == "Escape" || key == "Delete")
					config[this.playerIndex][control] = "";
				else
					config[this.playerIndex][control] = key;
			}));
	}

	getPlayerText(){
		return `Player ${this.playerIndex+1}`;
	}

	getControlKey(control){
		const config = sf.config.controls;

		if(config[this.playerIndex] && config[this.playerIndex][control] != "")
			return config[this.playerIndex][control];

		return "<Unbound>";
	}
};