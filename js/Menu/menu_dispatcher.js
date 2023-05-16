import sf from "../sf";
import BaseMenu from "./base_menu";

const sounds = {
	accept: sf.data.loadAudio("sounds/ui/accept.mp3"),
	cancel: sf.data.loadAudio("sounds/ui/cancel.mp3")
};

export default class MenuDispatcher extends Array{

	update(){
		const controls = sf.config.controls[0];

		// Only interact with the top most menu item
		if(this.length > 0){
			const menu = this.at(-1);

			menu.update();

			// Send mouse hover position
			if(menu.hover(sf.input.mouse.x, sf.input.mouse.y, sf.input.mouse.pressed[0]))
				sf.data.playAudio(sounds.accept);
			
			if(sf.input.key.pressed[controls.primaryAttack]){
				
				if(menu.select())
					sf.data.playAudio(sounds.accept);
			}

			if(sf.input.key.pressed[controls.up])
				menu.up();

			if(sf.input.key.pressed[controls.down])
				menu.down();

			if(sf.input.key.pressed[controls.left])
				menu.left();

			if(sf.input.key.pressed[controls.right])
				menu.right();

			// Close current menu
			if(sf.input.key.pressed[controls.secondaryAttack]){
				sf.data.playAudio(sounds.cancel);
				menu.onClose();
				this.pop();
			}
		}
	}

	draw(){

		// Draw and set focus if it's the topmost menu
		this.forEach((menu) => {
			menu.draw(menu == this.at(-1));
		});
	}

	clear() {
		this.splice(0, this.length);
	}

	addMenu(menu){
		const currentMenu = this.at(-1);
		const options = {
			x: 0,
			y: 0
		};

		if(currentMenu){
			options.x = currentMenu.options.x + currentMenu.options.w;
			options.y = currentMenu.options.y + currentMenu.options.h;
		}

		this.push(new menu(options.x, options.y));
	}
};