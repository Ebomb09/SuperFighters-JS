import sf from "../sf";

addEventListener("keydown", (event) => {

	if(event.repeat)
		return;

	sf.input.key.held[event.code] = true;
	sf.input.key.pressed[event.code] = true;
});

addEventListener("keyup", (event) => {

	if(event.repeat)
		return;

	sf.input.key.held[event.code] = false;
	sf.input.key.released[event.code] = true;
});

addEventListener("mousedown", (event) => {
	sf.input.mouse.held[event.button] = true;
	sf.input.mouse.pressed[event.button] = true;
});

addEventListener("mouseup", (event) => {
	sf.input.mouse.held[event.button] = false;
	sf.input.mouse.released[event.button] = true;
});

sf.canvas.addEventListener("mousemove", (event) => {
	sf.input.mouse.x = event.offsetX;
	sf.input.mouse.y = event.offsetY;
});

export function poll(){

	// Reset status of the single frame press and release events
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
}