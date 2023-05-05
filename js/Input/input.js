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
}