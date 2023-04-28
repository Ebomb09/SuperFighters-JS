import BaseMenu from "./base_menu";

function inRect(pos, rect){
	return (pos.x > rect.x && pos.x < rect.x + rect.w) && (pos.y > rect.y && pos.y < rect.y + rect.h);
}

export default class MenuDispatcher extends Array{

	update(){

		// Only interact with the top most menu item
		if(this.length > 0){
			let menu = this[this.length-1];
			let selection = null;

			// Attempt to make selections from the available markers
			menu.markers.forEach((marker) => {

				if(inRect(sf.input.mouse, marker))
					selection = marker;
			});

			if(selection !== null && sf.input.mouse.pressed[0])
				menu.touchMarker(selection);

			// Close current menu
			if(sf.input.key.pressed["Escape"])
				this.pop();
		}

		this.draw();	
	}

	draw(){

		this.forEach((menu) => {
			menu.markers.forEach((marker) => {

				// Default to visible
				if(marker.visible === undefined || marker.visible){

					// Fill background of button
					if(marker.fill !== undefined){
						sf.ctx.fillStyle = marker.fill;
						sf.ctx.fillRect(marker.x, marker.y, marker.w, marker.h);
					}

					// Create text on top of button
					if(marker.text !== undefined){

						// Change context font
						if(marker.font !== undefined)
							sf.ctx.font = marker.font;

						sf.canvas.style.font = sf.ctx.font;

						// Calculate text height
						let textHeight = parseInt(getComputedStyle(sf.canvas).fontSize, 0);

						// Check if cursor touching
						if(inRect(sf.input.mouse, marker))
							sf.ctx.fillStyle = "yellow";
						else
							sf.ctx.fillStyle = "black";

						sf.ctx.fillText(marker.text, marker.x, marker.y + textHeight, marker.w);
					}
				}
			});
		});
	}
};