import sf from "../sf";
import BaseMenu from "./base_menu";

const sounds = {
	accept: sf.data.loadAudio("sounds/ui/accept.mp3"),
	cancel: sf.data.loadAudio("sounds/ui/cancel.mp3")
};

export default class MenuDispatcher extends Array{

	update(){

		// Only interact with the top most menu item
		if(this.length > 0){
			const menu = this.at(-1);

			menu.update();

			// Send mouse hover position
			if(menu.hover(sf.input.mouse.x, sf.input.mouse.y, sf.input.mouse.pressed[0]))
				sf.data.playAudio(sounds.accept);
			
			if(sf.input.key.pressed["Space"] || sf.input.key.pressed["Enter"]){
				
				if(menu.select())
					sf.data.playAudio(sounds.accept);
			}

			if(sf.input.key.pressed["ArrowUp"])
				menu.up();

			if(sf.input.key.pressed["ArrowDown"])
				menu.down();

			if(sf.input.key.pressed["ArrowLeft"])
				menu.left();

			if(sf.input.key.pressed["ArrowRight"])
				menu.right();

			// Close current menu
			if(sf.input.key.pressed["Escape"]){
				sf.data.playAudio(sounds.cancel);
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
		this.push(menu);
	}
};