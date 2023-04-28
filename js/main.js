import * as globals from "./sf";
import * as input from "./Input/input";

import MenuDispatcher from "./Menu/menu_dispatcher";
import MainMenu from "./Menu/main_menu";
import Game from "./Game/game"

function main(){
	globals.init();
	input.init();

	sf.canvas.width = 1024;
	sf.canvas.height = 768;

	sf.menuDispatcher = new MenuDispatcher();
	sf.menuDispatcher.push(new MainMenu());

	sfLoop();
}

function sfLoop(){

	// Time calculations
	let timeNow = Date.now();
	let mspf = 1000 / sf.config.fps;

	sf.ctx.clearRect(0, 0, sf.canvas.width, sf.canvas.height);

	if(sf.game !== null)
		sf.game.update(mspf);

	if(sf.menuDispatcher !== null)
		sf.menuDispatcher.update();

	input.poll();

	// Calculate FPS
	let timeEnd = Date.now();
	let delta = timeEnd - timeNow;

	if(delta > mspf)
		setTimeout(sfLoop, 0);	
	else
		setTimeout(sfLoop, mspf - delta);
}

main();