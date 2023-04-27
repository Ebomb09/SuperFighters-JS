import * as globals from "./sf";
import * as input from "./input";

import MenuDispatcher from "./Menu/menu_dispatcher";
import MainMenu from "./Menu/main_menu";

function main(){
	globals.init();
	input.init();

	sf.canvas.width = 1024;
	sf.canvas.height = 768;

	sf.menuDispatcher = new MenuDispatcher();
	sf.menuDispatcher.push(new MainMenu(0, 0));

	sfLoop();
}

function sfLoop(){

	let timeNow = Date.now();

	sf.ctx.clearRect(0, 0, sf.canvas.width, sf.canvas.height);

	if(sf.menuDispatcher !== null)
		sf.menuDispatcher.update();

	if(sf.game !== null)
		sf.game.update();

	input.poll();

	// Calculate FPS
	let timeEnd = Date.now();
	let delta = timeEnd - timeNow;

	// ms per frame
	let mspf = 1000 / sf.config.fps;

	if(delta > mspf)
		setTimeout(sfLoop, 0);	
	else
		setTimeout(sfLoop, mspf - delta);
}

main();