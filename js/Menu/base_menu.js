import sf from "../sf";

function inRect(pos, rect){
	return (pos.x > rect.x && pos.x < rect.x + rect.w) && (pos.y > rect.y && pos.y < rect.y + rect.h);
}

export default class BaseMenu{

	constructor(x, y){

		this.options = {
			x: (x) ? x : 0,
			y: (y) ? y : 0,
			w: 150,
			h: 30,
			textSize: 20
		};		
		
		// Defines the markers on a menu
		this.markers = [];
		this.cursor = null;
	}

	update() {}

	draw(focus) {

		this.markers.forEach((marker) => {

			// Default to visible
			if(marker.visible === undefined || marker.visible){

				// Fill background of button
				sf.ctx.fillStyle = "white";
				sf.ctx.fillRect(marker.x-1, marker.y-1, marker.w+2, marker.h+2);

				sf.ctx.fillStyle = "black";
				sf.ctx.fillRect(marker.x, marker.y, marker.w, marker.h);

				// Create text on top of button
				if(marker.text !== undefined){

					// Change context font
					if(marker.textSize !== undefined)
						sf.ctx.font = `${marker.textSize}px Arial`;

					sf.canvas.style.font = sf.ctx.font;

					// Calculate text height
					let textWidth = sf.ctx.measureText(marker.text).width;
					let textHeight = parseInt(getComputedStyle(sf.canvas).fontSize, 0);

					if(textWidth > marker.w)
						textWidth = marker.w;

					// Check if cursor touching
					if(this.cursor == marker)
						sf.ctx.fillStyle = "yellow";
					else
						sf.ctx.fillStyle = "white";

					sf.ctx.fillText(
						marker.text, 
						marker.x + marker.w / 2 - textWidth / 2, 
						marker.y + textHeight, 
						marker.w
						);
				}
			}
		});
	}

	hover(x, y, touch){
		let touched = false;

		this.markers.forEach((marker) => {

			if(inRect({x: x, y: y}, marker)){
				this.cursor = marker;

				if(touch){
					this.select();
					touched = true;
				}
			}
		});
		return touched;
	}

	select(){
		const marker = this.cursor;

		if(marker && marker.onSelect){
			marker.onSelect(marker);
			return true;
		}
		return false;
	}

	right(){
		const marker = this.cursor;

		// Check if button has a custom method
		if(marker && marker.onRight)
			marker.onRight(marker);

		// Move the cursor
		else
			this.moveCursor(1, 0);
	}

	left(){
		const marker = this.cursor;

		// Check if button has a custom method
		if(marker && marker.onLeft)
			marker.onLeft(marker);

		// Move the cursor
		else
			this.moveCursor(-1, 0);
	}

	up(){
		const marker = this.cursor;

		// Check if button has a custom method
		if(marker && marker.onUp)
			marker.onUp(marker);

		// Move the cursor
		else
			this.moveCursor(0, -1);
	}

	down(){
		const marker = this.cursor;

		// Check if button has a custom method
		if(marker && marker.onDown)
			marker.onDown(marker);

		// Move the cursor
		else
			this.moveCursor(0, 1);
	}

	moveCursor(x, y){

		// If cursor not set yet then try first marker
		if(!this.cursor){
			this.cursor = this.markers.at(0);

			if(!this.cursor)
				return;
		}

		let closest = null;

		// Check which marker is closer in the requested transition
		this.markers.forEach((marker) => {

			if(marker != this.cursor){
				let passed = false;

				if(x > 0)
					passed = marker.x > this.cursor.x;

				else if(x < 0)
					passed = marker.x < this.cursor.x;

				else if(y > 0)
					passed = marker.y > this.cursor.y;

				else if(y < 0)
					passed = marker.y < this.cursor.y;

				if(passed){

					if(!closest)
						closest = marker;

					// Check which one is closer to the cursor
					else{
						const dist1 = Matter.Vector.magnitude({x: marker.x - this.cursor.x, y: marker.y - this.cursor.y}) ;
						const dist2 = Matter.Vector.magnitude({x: closest.x - this.cursor.x, y: closest.y - this.cursor.y});

						if(dist1 < dist2)
							closest = marker;
					}
				}
			}
		});

		// Update cursor only if found a valid movement marker
		if(closest)
			this.cursor = closest;
	}

	addMarker(marker){
		this.markers.push(marker);
	}

	addMarkers(options, markers){
		let x 			= options.x;
		let y 			= options.y;
		let w 			= options.w;
		let h 			= options.h;
		let textSize 	= options.textSize;

		markers.forEach((marker) => {

			// Set options
			marker.x 		= x;
			marker.y		= y;
			marker.w		= w;
			marker.h		= h;
			marker.textSize	= textSize;

			this.addMarker(marker);
			
			y += h;
		});
	}
};