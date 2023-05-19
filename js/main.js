import sf from "./sf.js";
import * as input from "./Input/input.js";

import MenuDispatcher from "./Menu/menu_dispatcher.js";
import MainMenu from "./Menu/main_menu.js";
import Game from "./Game/game.js"

function main(){
	sf.canvas.width = 800;
	sf.canvas.height = 600;
	sf.docs.style.height = "600px";
	
	sf.menuDispatcher = new MenuDispatcher;
	sf.menuDispatcher.addMenu(MainMenu);

	sfLoop();
}

let lastTimestamp = Date.now();

function sfLoop(){
	const mspf = 1000 / sf.config.fps;

	if(Date.now() - lastTimestamp < mspf){
		requestAnimationFrame(sfLoop);
		return;
	}
	lastTimestamp = Date.now();

	sf.ctx.imageSmoothingEnabled = false;
	sf.ctx.fillStyle = "black";
	sf.ctx.fillRect(0, 0, sf.canvas.width, sf.canvas.height);

	if(sf.game){
		sf.game.update(mspf);
		sf.game.draw();
	}

	if(sf.menuDispatcher){
		sf.menuDispatcher.update();
		sf.menuDispatcher.draw();
	}

	input.poll();
	
	requestAnimationFrame(sfLoop);
}

main();