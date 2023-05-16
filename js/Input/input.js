import sf from "../sf";

sf.canvas.addEventListener("keydown", (event) => {
	event.preventDefault();

	if(event.repeat)
		return;

	sf.input.key.held[event.code] = true;
	sf.input.key.pressed[event.code] = true;
	sf.input.key.lastPressed = event.code;
});

sf.canvas.addEventListener("keyup", (event) => {
	event.preventDefault();

	if(event.repeat)
		return;

	sf.input.key.held[event.code] = false;
	sf.input.key.released[event.code] = true;
	sf.input.key.lastReleased = event.code;
});

sf.canvas.addEventListener("mousedown", (event) => {

	// Stop middle mouse panning
	if(event.button == 1)
		event.preventDefault();

	sf.input.mouse.held[event.button] = true;
	sf.input.mouse.pressed[event.button] = true;
	sf.input.mouse.lastPressed = event.button;
});

sf.canvas.addEventListener("mouseup", (event) => {
	sf.input.mouse.held[event.button] = false;
	sf.input.mouse.released[event.button] = true;
	sf.input.mouse.lastReleased = event.button;
});

sf.canvas.addEventListener("mousemove", (event) => {
	sf.input.mouse.x = event.offsetX;
	sf.input.mouse.y = event.offsetY;
});

sf.canvas.addEventListener("wheel", (event) => {
	event.preventDefault();
	sf.input.mouse.scroll.x = event.deltaX;
	sf.input.mouse.scroll.y = event.deltaY;
});

sf.canvas.addEventListener("contextmenu", (event) => {
	event.preventDefault();
});

export function poll(){

	// Reset status of the single frame press and release events
	sf.input.mouse.scroll.x = 0;
	sf.input.mouse.scroll.y = 0;

	Object.keys(sf.input.mouse.pressed).forEach((button) => {
		sf.input.mouse.pressed[button] = false;
	});

	Object.keys(sf.input.mouse.released).forEach((button) => {
		sf.input.mouse.released[button] = false;
	});

	Object.keys(sf.input.key.pressed).forEach((button) => {
		sf.input.key.pressed[button] = false;
	});

	Object.keys(sf.input.key.released).forEach((button) => {
		sf.input.key.released[button] = false;
	});

	// Hook into the gamepads and create psuedo input keys
	navigator.getGamepads().forEach((gamepad) => {

		// Some browsers can have nulled out gamepads, ie: Chrome
		if(!gamepad)
			return;

		for(let i = 0; i < gamepad.axes.length; i ++){
			const axis = gamepad.axes[i];

			// Left axis
			const L = axis < -0.25;
			const keyL = `Gamepad${gamepad.index}_Axis${i}-`;

			if(!sf.input.key.held[keyL] && L){
				sf.input.key.pressed[keyL] = true;
				sf.input.key.lastPressed = keyL;
			}

			if(sf.input.key.held[keyL] && !L){
				sf.input.key.released[keyL] = true;
				sf.input.key.lastReleased = keyL;
			}

			sf.input.key.held[keyL] = L;

			// Right axis
			const R = axis > 0.25;
			const keyR = `Gamepad${gamepad.index}_Axis${i}+`;

			if(!sf.input.key.held[keyR] && R){
				sf.input.key.pressed[keyR] = true;
				sf.input.key.lastPressed = keyR;
			}

			if(sf.input.key.held[keyR] && !R){
				sf.input.key.released[keyR] = true;
				sf.input.key.lastReleased = keyR;
			}

			sf.input.key.held[keyR] = R;
		}

		for(let i = 0; i < gamepad.buttons.length; i ++){
			const button = gamepad.buttons[i];
			const key = `Gamepad${gamepad.index}_Button${i}`;

			// Not currently held but just marked as pressed
			if(!sf.input.key.held[key] && button.pressed){
				sf.input.key.pressed[key] = true;
				sf.input.key.lastPressed = key;
			}

			// Currently held but not marked as pressed
			if(sf.input.key.held[key] && !button.pressed){
				sf.input.key.released[key] = true;
				sf.input.key.lastReleased = key;
			}

			sf.input.key.held[key] = button.pressed;
		}
	});
}