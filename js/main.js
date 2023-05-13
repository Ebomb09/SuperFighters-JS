import sf from "./sf";
import * as input from "./Input/input";

import MenuDispatcher from "./Menu/menu_dispatcher";
import MainMenu from "./Menu/main_menu";
import Game from "./Game/game"

function main(){
	sf.canvas.width = 800;
	sf.canvas.height = 600;
	sf.docs.style.height = "600px";
	sf.ctx.imageSmoothingEnabled = false;
	
	sf.menuDispatcher = new MenuDispatcher;
	sf.menuDispatcher.addMenu(new MainMenu);

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

	sf.ctx.fillStyle = "black";
	sf.ctx.fillRect(0, 0, sf.canvas.width, sf.canvas.height);

	if(sf.game !== null){
		sf.game.update(mspf);
		sf.game.draw();
	}

	if(sf.menuDispatcher !== null){
		sf.menuDispatcher.update();
		sf.menuDispatcher.draw();
	}

	input.poll();
	
	requestAnimationFrame(sfLoop);
}

main();