import sf from "../sf.js";
import Game from "./game.js";

const Mode = {
	None: 		"none",
	Select: 	"select",
	Move: 		"move",
	Rotate: 	"rotate",
	Resize: 	"resize",
	ResizeX: 	"resize-x",
	ResizeY: 	"resize-y",
	Pan: 		"pan", 
	Zoom: 		"zoom"
};

export default class Editor extends Game{

	constructor(map){
		super({map: map, local_players: 1});

		this.selection = {
			mode: Mode.None,
			objects: [],
			objectsVar: [],
			copy: "",
			start: {x: 0, y: 0},
			grid: {x: 8, y: 8, angle: 15}
		};

		this.live = false;
		this.mapCopy = "";
		this.mapName = map;
		this.cameraCopy = {};
		this.debug = true;

		// Create the documents body
		this.body = sf.docs;
		this.body.innerHTML = "";

		this.section = {};

		// Editor Control
		this.section.controls = this.createDiv();

		// Map name
		const mapName = this.createInput("Map Name", this.mapName, 
			(event) => {
				this.mapName = event.target.value;
			}
		);
		this.section.controls.append(mapName);

		// Load map
		const load = this.createButton("📁 Load",
			(event) => {
				let name = prompt();

				fetch("maps/"+name+".sfm").then((response) => {
					return response.text();
				}).then((data) => {
					this.loadMap(data);
				});
			}
		);
		this.section.controls.append(load);

		// Save map
		const save = this.createButton("💾 Save",
			(event) => {
				let a = document.createElement("a");
				a.href = "data:text/sf-map;charset=utf-8,"+encodeURIComponent(this.saveMap());
				a.download = `${this.mapName}.sfm`;
				a.click();
			}
		);
		this.section.controls.append(save, this.createSubDivider());

		// Play map
		const play = this.createButton("▶ Play", 
			(event) => {

				if(!this.live){
					this.mapCopy = this.saveMap();
					this.cameraCopy = {
						x: this.camera.x,
						y: this.camera.y,
						zoom: this.camera.zoom
					};
					this.createPlayers();
					this.live = true;
				}
			}
		);
		this.section.controls.append(play);

		// Stop map
		const stop = this.createButton("⏹ Stop",
			(event) => {

				if(this.live){
					this.loadMap(this.mapCopy);
					this.camera = this.cameraCopy;
					this.live = false;
				}
			}
		);
		this.section.controls.append(stop, this.createSubDivider());

		// Editor grid clamp
		const grid = this.createInput("Clamp Grid", this.selection.grid.x,
			(event) => {
				const val = parseInt(event.target.value);

				if(val > 0){
					this.selection.grid.x = val;
					this.selection.grid.y = val;
				}
			}
		);
		this.section.controls.append(grid);

		// Editor angle clamp
		const angle = this.createInput("Clamp Angle", this.selection.grid.angle,
			(event) => {
				const val = parseInt(event.target.value);

				if(val > 0)
					this.selection.grid.angle = val;
			}
		);
		this.section.controls.append(angle);

		// Selection Control
		this.section.selected = this.createDiv();

		// Objects
		this.section.objects = this.createDiv();

		Object.keys(sf.data.objects).forEach((key) => {
			const parent = sf.data.objects[key];

			if(!parent.editor || !parent.editor.enabled)
				return;
			
			const button = this.createButton("", 
				(event) => {
					this.createObject(parent, {
							matter:{
								position: {
									x: this.camera.x, 
									y: this.camera.y
								}
							}
						});
				}
			);
			button.className = "listing";

			button.append(this.createImage(parent));
			button.append(key);

			this.section.objects.append(button);
		});

		// Append documents
		this.body.append(
			this.createTitle("Controls"),
			this.section.controls,
			this.createDivider(),

			this.createTitle("Selected"),
			this.section.selected,
			this.createDivider(),

			this.createTitle("Objects"),
			this.section.objects
			);
	}

	update(ms){

		// Copy
		if(sf.input.key.held["ControlLeft"] && sf.input.key.pressed["KeyC"]){
			this.selection.copy = this.saveMap(this.selection.objects);
		}

		// Paste
		if(sf.input.key.held["ControlLeft"] && sf.input.key.pressed["KeyV"] && this.selection.copy){

			try{
				const objects = JSON.parse(this.selection.copy).objects;

				this.selection.objects = [];

				// Create copies of object's with a new id
				objects.forEach((obj) => {
					this.selection.objects.push(
						this.createObject(sf.data.objects[obj.parentKey], obj, {id: this.getNextUniqueId()})
						);
				});

				this.updateSelectedDisplay();
			
			}catch(error){
				console.log(error);
			}
		}

		// Zoom Camera
		if(sf.input.mouse.scroll.y < 0){
			let pos = this.getMousePosition();
			this.camera.zoom += 1;
			this.camera.x += pos.x - this.getMousePosition().x;
			this.camera.y += pos.y - this.getMousePosition().y;
		}

		if(sf.input.mouse.scroll.y > 0){
			let pos = this.getMousePosition();

			if(this.camera.zoom > 1)
				this.camera.zoom -= 1;

			this.camera.x += pos.x - this.getMousePosition().x;
			this.camera.y += pos.y - this.getMousePosition().y;
		}

		// Delete Objects
		if(sf.input.key.pressed["Delete"]){

			this.selection.objects.forEach((obj) => {
				obj.kill();
			});
			this.selection.objects = [];
			this.updateSelectedDisplay();
		}

		// Mode starters
		if(this.selection.mode == Mode.None){
			this.selection.start = this.getMousePosition();
			let touching = this.getObjectsByPoints(this.getMousePosition());

			// Check what objects are being interacted with
			let mode = Mode.None;

			// Left Click (Select, Move, Resize)
			if(sf.input.mouse.pressed[0]){
				mode = Mode.Select;

				touching.forEach((obj) => {

					if(this.selection.objects.indexOf(obj) != -1){
						mode = Mode.Move;

						// Check if in resize bounds
						if(this.selection.objects.length == 1 && obj.getResizable()){

							if(obj.getResizableHeight() && this.selection.start.y > obj.getBounds().max.y - 2){
								mode = Mode.ResizeY;
							}

							if(obj.getResizableWidth() && this.selection.start.x > obj.getBounds().max.x - 2){

								if(mode == Mode.ResizeY)
									mode = Mode.Resize;
								else
									mode = Mode.ResizeX;
							}
						}
					}
				});

			// Middle Click (PanCamera)
			}else if(sf.input.mouse.pressed[1]){
				mode = Mode.Pan;

			// Right Click (Rotate)
			}else if(sf.input.mouse.pressed[2]){

				touching.forEach((obj) => {

					if(this.selection.objects.indexOf(obj) != -1)
						mode = Mode.Rotate;
				});
			}

			// Save the original state of selected
			for(let i = 0; i < this.selection.objects.length; i ++){
				const obj = this.selection.objects[i];

				if(!obj.body)
					continue;

				// Save state of top left corner
				this.selection.objectsVar[i] = {
					x: obj.getPosition().x - obj.width / 2,
					y: obj.getPosition().y - obj.height / 2,
					angle: obj.body.angle * 180 / Math.PI,
					w: obj.tiling.width,
					h: obj.tiling.height
				};
			}
			this.selection.mode = mode;
		}

		// Selection Mode Update
		switch(this.selection.mode){

			case Mode.Pan:
				this.camera.x -= this.getMousePosition().x - this.selection.start.x;
				this.camera.y -= this.getMousePosition().y - this.selection.start.y;

				this.selection.start = this.getMousePosition();
				break;

			case Mode.Move:
				let x = (this.getMousePosition().x - this.selection.start.x);
				let y = (this.getMousePosition().y - this.selection.start.y);

				for(let i = 0; i < this.selection.objects.length; i ++){
					const obj = this.selection.objects[i];
					const sav = this.selection.objectsVar[i];

					let useX = Math.round((sav.x + x) / this.selection.grid.x) * this.selection.grid.x;
					let useY = Math.round((sav.y + y) / this.selection.grid.y) * this.selection.grid.y;

					// Set body position so top left corner is algined to grid
					Matter.Body.setPosition(obj.body, {x: useX + obj.width / 2, y: useY + obj.height / 2});
					Matter.Body.setVelocity(obj.body, {x: 0, y: 0});
				}
				break;

			case Mode.Rotate:
				let angle = ((this.getMousePosition().x - this.selection.start.x) + (this.getMousePosition().y - this.selection.start.y)) * this.camera.zoom;

				for(let i = 0; i < this.selection.objects.length; i ++){
					const obj = this.selection.objects[i];
					const sav = this.selection.objectsVar[i];

					let useAngle = Math.round((sav.angle + angle) / this.selection.grid.angle) * this.selection.grid.angle;
					useAngle = useAngle * Math.PI / 180;

					Matter.Body.setAngle(obj.body, useAngle);
				}		
				break;

			case Mode.Resize:	
			case Mode.ResizeX:
				var w = this.selection.objectsVar[0].w;
			case Mode.ResizeY:	
				if(this.selection.mode == Mode.ResizeY || this.selection.mode == Mode.Resize)
					var h = this.selection.objectsVar[0].h;

				const obj = this.selection.objects[0];
				const sav = this.selection.objectsVar[0];

				if(w){
					w += Math.round((this.getMousePosition().x - this.selection.start.x) / obj.frame.width);

					if(w >= 1)
						this.selection.objects[0].resetTiling(w, obj.tiling.height);	
				}

				if(h){
					h += Math.round((this.getMousePosition().y - this.selection.start.y) / obj.frame.height);	

					if(h >= 1)
						this.selection.objects[0].resetTiling(obj.tiling.width, h);
				}

				Matter.Body.setPosition(obj.body, {x: this.selection.objectsVar[0].x + obj.width / 2, y: this.selection.objectsVar[0].y + obj.height / 2});	
				break;
		}

		// Mode end
		if(sf.input.mouse.released[0] || sf.input.mouse.released[1] || sf.input.mouse.released[2]){

			switch(this.selection.mode){

				case Mode.Select:
					this.selection.objects = this.getObjectsByPoints(this.getMousePosition(), this.selection.start);

					// No drag box so get last element
					if(this.selection.objects.length > 1)
						if(this.getMousePosition().x == this.selection.start.x && this.getMousePosition().y == this.selection.start.y)
							this.selection.objects = [this.selection.objects.at(-1)];
					break;
			}
			this.updateSelectedDisplay();
			this.selection.mode = Mode.None;
		}

		// Process the game's update loop if live
		if(this.live)
			super.update(ms);
	}

	draw(){
		sf.ctx.save();

		const realCamera = this.getCameraRealPosition();

		sf.ctx.scale(this.camera.zoom, this.camera.zoom);
		sf.ctx.translate(-realCamera.x, -realCamera.y);

		// Draw grid
		for(let i = 0; i < sf.canvas.width / this.camera.zoom; i += this.selection.grid.x){
			let x = Math.round((realCamera.x + i) / this.selection.grid.x) * this.selection.grid.x;

			sf.ctx.beginPath();
			sf.ctx.moveTo(x, realCamera.y);
			sf.ctx.lineTo(x, realCamera.y + sf.canvas.height);
			sf.ctx.strokeStyle = "grey";
			sf.ctx.lineWidth = 0.1;
			sf.ctx.stroke();
		}
		for(let i = 0; i < sf.canvas.height / this.camera.zoom; i += this.selection.grid.y){
			let y = Math.round((realCamera.y + i) / this.selection.grid.y) * this.selection.grid.y;

			sf.ctx.beginPath();
			sf.ctx.moveTo(realCamera.x, y);
			sf.ctx.lineTo(realCamera.x + sf.canvas.width, y);
			sf.ctx.strokeStyle = "grey";
			sf.ctx.lineWidth = 0.1;
			sf.ctx.stroke();
		}

		// Draw center lines
		sf.ctx.beginPath();
		sf.ctx.moveTo(0, realCamera.y);
		sf.ctx.lineTo(0, realCamera.y + sf.canvas.height);
		sf.ctx.strokeStyle = "blue";
		sf.ctx.lineWidth = 0.5;
		sf.ctx.stroke();	

		sf.ctx.beginPath();
		sf.ctx.moveTo(realCamera.x, 0);
		sf.ctx.lineTo(realCamera.x + sf.canvas.width, 0);
		sf.ctx.strokeStyle = "red";
		sf.ctx.lineWidth = 0.5;
		sf.ctx.stroke();	

		// Draw objects
		this.objects.forEach((obj) => {
			obj.draw();
		});

		// Get object AABBs
		const bounds = [];

		this.selection.objects.forEach((obj) => {

			if(!obj.body)
				return;

			bounds.push(obj.getBounds().min, obj.getBounds().max);

			// Highlight the selected bodies area
			sf.ctx.beginPath();

			let start = obj.body.vertices.at(-1);
			sf.ctx.moveTo(start.x, start.y);

			for(let i = 0; i < obj.body.vertices.length; i ++){
				let end = obj.body.vertices[i];
				sf.ctx.lineTo(end.x, end.y);
			}

			sf.ctx.fillStyle = "rgba(255, 255, 0, 0.25)";
			sf.ctx.fill();
		});

		const region = Matter.Bounds.create(bounds);

		// Draw the Selected Boundary
		sf.ctx.beginPath();
		sf.ctx.rect(region.min.x, region.min.y, region.max.x - region.min.x, region.max.y - region.min.y);
		sf.ctx.strokeStyle = "rgb(255, 255, 0)";
		sf.ctx.stroke();

		// Draw the selection boundary
		switch(this.selection.mode){

			case Mode.Select: {
				const region = Matter.Bounds.create([this.selection.start, this.getMousePosition()]);

				// Draw the Selected Boundary
				sf.ctx.beginPath();
				sf.ctx.rect(region.min.x, region.min.y, region.max.x - region.min.x, region.max.y - region.min.y);
				sf.ctx.fillStyle = "rgba(0, 120, 215, 0.25)";
				sf.ctx.fill();
				sf.ctx.strokeStyle = "rgb(0, 120, 215)";
				sf.ctx.stroke();
				break;
			}
		}

		// Draw the resizer boxes
		if(this.selection.objects.length == 1){
			const obj = this.selection.objects[0];
			const width = obj.getBounds().max.x - obj.getBounds().min.x;
			const height = obj.getBounds().max.y - obj.getBounds().min.y;

			if(obj.getResizableWidth()){
				sf.ctx.beginPath();
				sf.ctx.rect(obj.getBounds().min.x + width - 1, obj.getBounds().min.y + height / 2 - 1, 2, 2);
				sf.ctx.strokeStyle = "white";
				sf.ctx.lineWidth = 0.5;
				sf.ctx.stroke();
			}

			if(obj.getResizableHeight()){
				sf.ctx.beginPath();
				sf.ctx.rect(obj.getBounds().min.x + width / 2 - 1, obj.getBounds().min.y + height - 1, 2, 2);
				sf.ctx.strokeStyle = "white";
				sf.ctx.lineWidth = 0.5;
				sf.ctx.stroke();
			}

			if(obj.getResizableWidth() && obj.getResizableHeight()){
				sf.ctx.beginPath();
				sf.ctx.rect(obj.getBounds().min.x + width - 1, obj.getBounds().min.y + height - 1, 2, 2);
				sf.ctx.strokeStyle = "white";
				sf.ctx.lineWidth = 0.5;
				sf.ctx.stroke();
			}
		}

		sf.ctx.restore();

		// Draw Coordinates
		sf.ctx.font = "13px sans-serif";
		sf.ctx.fillStyle = "grey";
		sf.ctx.fillText(`X: ${Math.round(this.camera.x)} Y: ${Math.round(this.camera.y)}, Zoom: ${Math.round(this.camera.zoom)}`, 0, sf.canvas.height);
	}

	updateSelectedDisplay(){
		this.section.selected.innerHTML = "";

		// Show display of objects highlighted
		if(this.selection.objects.length > 1){

			this.selection.objects.forEach((obj) => {
				const button = document.createElement("button");
				button.className = "listing";

				button.append(obj.id);
				button.append(this.createImage(obj.parent, obj.frame.index.x, obj.frame.index.y));

				button.addEventListener("click", () => {
					this.selection.objects = [obj];
					this.updateSelectedDisplay();
				});
				this.section.selected.append(button);
			});

		// Show modifiable properties of a single object selected
		}else if(this.selection.objects.length == 1){

			const obj = this.selection.objects[0];

			// Check what parameters are given as options
			if(obj.parent.editor){

				// Default object modifiers
				const defaults = [];

				defaults.push(
					{
						name: "Id",
						type: "view",
						get: (obj) => {return obj.id}
					},
					{ 
						name: "Custom Id", 
						type: "string", 	
						get: (obj) => {return obj.customId}, 		
						post: (obj, id) => {obj.customId = id}
					},
					{ 
						name: "X", 		
						type: "number", 	
						get: (obj) => {return obj.getPosition().x}, 		
						post: (obj, x) => {Matter.Body.setPosition(obj.body, x, obj.position.y)}
					},
					{ 
						name: "Y", 		
						type: "number", 	
						get: (obj) => {return obj.getPosition().y}, 		
						post: (obj, y) => {Matter.Body.setPosition(obj.body, obj.position.x, y)}
					}
				)

				if(obj.parent.editor.resizable){
					const resizable = obj.parent.editor.resizable;

					if(resizable.width)
						defaults.push(
							{
								name: "Width", 
								type: "number", 
								get: (obj) => {return obj.tiling.width},
								post: (obj, w) => { obj.resetTiling(w, obj.tiling.height)}
							}
						);

					if(resizable.height)
						defaults.push(
							{
								name: "Height", 
								type: "number", 
								get: (obj) => {return obj.tiling.height},
								post: (obj, h) => {obj.resetTiling(obj.tiling.width, h)}
							}
						);
				}
				
				defaults.push(
					{ 
						name: "Angle", 	
						type: "number", 	
						get: (obj) => {return obj.getAngle()}, 		
						post: (obj, angle) => {Matter.Body.setAngle(obj.body, angle * Math.PI / 180)}
					},
					{ 
						name: "Static", 	
						type: "boolean", 	
						get: (obj) => {return obj.getStatic()}, 	
						post: (obj, isStatic) => {Matter.Body.setStatic(obj.body, isStatic)}
					}
				);

				// Per object properties
				const properties = defaults.concat(obj.parent.editor.properties);

				// Add inputs to the display
				properties.forEach((property) => {

					if(!property)
						return;

					const name 		= property.name;
					const type		= property.type;
					const get 		= property.get;
					const post 		= property.post;

					switch(property.type){

						case "view": {
							const text = this.createText(`${name}: ${get(obj)}`);
							this.section.selected.append(text);
							break;
						}

						case "string": {
							const input = this.createInput(name, get(obj));

							input.addEventListener("input", (event) => {
								const string = event.target.value;
								post(obj, string);
							});

							this.section.selected.append(input);
							break;
						}

						case "number": {
							const input = this.createInput(name, get(obj));

							input.addEventListener("input", (event) => {
								const number = parseInt(event.target.value);

								if(!isNaN(number))
									post(obj, number);
							});

							this.section.selected.append(input);
							break;
						}

						case "boolean": {
							const input = this.createCheckbox(name, get(obj));

							input.addEventListener("input", (event) => {
								const checked = event.target.checked;
								post(obj, checked);
							});

							this.section.selected.append(input);
							break;
						}
					}
				});
			}

			this.section.selected.append(this.createSubDivider());

			// Frame Index
			if(!obj.parent.animated){
				const frames = document.createElement("div");

				for(let h = 0; h < obj.frame.count.y; h ++){
					for(let w = 0; w < obj.frame.count.x; w ++){
						const button = document.createElement("button");
						button.className = "listing";

						button.append(this.createImage(obj.parent, w, h));
						button.append(`Frame {X: ${w}, Y: ${h}}`);

						if(obj.frame.index.x == w && obj.frame.index.y == h)
							button.style = "text-shadow: 1px 1px 3px yellow;";

						button.addEventListener("click", () => {
							obj.frame.index.x = w;
							obj.frame.index.y = h;
							this.updateSelectedDisplay();
						});

						frames.append(button);
					}
				}
				this.section.selected.append(frames);
			}
		}
	}

	createDivider(){
		return document.createElement("hr");
	}

	createDiv(){
		return document.createElement("div");
	}

	createSubDivider(){
		const hr = document.createElement("hr");
		hr.style = "border: 1px dotted black";
		return hr
	}

	createText(text){
		const span = document.createElement("span");
		span.innerText = text;
		return span;
	}

	createTitle(text){
		const title = document.createElement("h3");
		title.innerText = text;
		return title;
	}

	createButton(text, callback){
		const button = document.createElement("button");
		button.innerText = text;

		button.addEventListener("click", callback);

		return button;
	}

	createInput(name, value, callback){
		const div = document.createElement("div");
		div.style = `
			display: flex;
			flex-direction: row;
			justify-content: space-between;
		`;

		const label = document.createElement("label");
		label.for = name;
		label.innerText = `${name}: `;

		const input = document.createElement("input");
		input.type = "text";
		input.id = name;
		input.value = value;

		input.addEventListener("input", callback);

		div.append(label, input);

		return div;
	}

	createCheckbox(name, value, callback){
		const div = this.createInput(name);

		const input = div.querySelector("input");
		input.type = "checkbox";
		input.checked = value;

		input.addEventListener("input", callback);

		return div;
	}

	createImage(parent, x, y){

		if(x === undefined){
			x = 0;
			y = 0;
		}

		if(parent.frameCount){
			var width = parent.image.width / parent.frameCount.x;
			var height = parent.image.height / parent.frameCount.y;
		}else{
			var width = parent.image.width;
			var height = parent.image.height;
		}

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		canvas.width = width;
		canvas.height = height;

		ctx.drawImage(
			parent.image,
			x * width,
			y * height,
			width,
			height,
			0,
			0,
			width,
			height
			);

		return canvas;
	}
};