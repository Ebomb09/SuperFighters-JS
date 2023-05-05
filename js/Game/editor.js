import sf from "../sf";
import Game from "./game";

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
		super(map, {local_players: 1});

		this.selection = {
			mode: Mode.None,
			display: null,
			objects: [],
			objectsVar: [],
			copy: [],
			start: {x: 0, y: 0},
			grid: {x: 8, y: 8, angle: 15}
		};

		this.live = false;
		this.mapCopy = "";
		this.mapName = map;
		this.cameraCopy = {};
		this.debug = true;

		sf.docs.innerHTML = "";

		// Editor Control
		let controls = document.createElement("div");

		// Map name
		const mapname = this.createInput("Map Name", this.mapName);
		mapname.addEventListener("input", (event) => {
			this.mapName = event.target.value;
		});
		controls.append(mapname, this.createSubDivider());

		// Load map
		const load = document.createElement("button");
		load.append("📁 Load");
		load.addEventListener("click", () => {
			let name = prompt();

			fetch("maps/"+name+".sfm").then((response) => {
				return response.text();
			}).then((data) => {
				this.loadMap(data);
			});
		});
		controls.append(load);

		// Save map
		const save = document.createElement("button");
		save.append("💾 Save");
		save.addEventListener("click", () => {
			let a = document.createElement("a");
			a.href = "data:text/sf-map;charset=utf-8,"+encodeURIComponent(this.saveMap());
			a.download = `${this.mapName}.sfm`;
			a.click();
		});
		controls.append(save, this.createSubDivider());

		// Play map
		const play = document.createElement("button");
		play.append("▶ Play");
		play.addEventListener("click", () => {

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
		});
		controls.append(play);

		// Stop map
		const stop = document.createElement("button");
		stop.append("⏹ Stop");
		stop.addEventListener("click", () => {

			if(this.live){
				this.loadMap(this.mapCopy);
				this.camera = this.cameraCopy;
				this.live = false;
			}
		});
		controls.append(stop, this.createSubDivider());

		// Editor grid clamp
		const grid = this.createInput("clamp grid", this.selection.grid.x);
		grid.addEventListener("input", (event) => {
			let val = parseInt(event.target.value);

			if(val > 0){
				this.selection.grid.x = val;
				this.selection.grid.y = val;
			}
		});
		controls.append(grid);

		// Editor angle clamp
		const angle = this.createInput("clamp angle", this.selection.grid.angle);
		angle.addEventListener("input", (event) => {
			let val = parseInt(event.target.value);

			if(val > 0)
				this.selection.grid.angle = val;
		});
		controls.append(angle);

		// Selection Control
		this.selection.display = document.createElement("div");

		// Objects
		let objects = document.createElement("div");

		Object.keys(sf.data.objects).forEach((key) => {
			const button = document.createElement("button");
			button.className = "listing";

			button.append(this.createImage(sf.data.objects[key]));
			button.append(key);

			button.addEventListener("click", () => {
				this.createObject(
					sf.data.objects[key], 
					{
						x: this.camera.x, 
						y: this.camera.y, 
					});
			});

			objects.append(button);
		});

		// Append documents
		sf.docs.append(
			this.createTitle("Controls"),
			controls,
			this.createDivider(),

			this.createTitle("Selected"),
			this.selection.display,
			this.createDivider(),

			this.createTitle("Objects"),
			objects
			);
	}

	update(ms){

		// Copy
		if(sf.input.key.held["ControlLeft"] && sf.input.key.pressed["KeyC"]){
			this.selection.copy = this.saveMap(this.selection.objects);
		}

		// Paste
		if(sf.input.key.held["ControlLeft"] && sf.input.key.pressed["KeyV"]){
			this.selection.objects = this.loadMap(this.selection.copy, true);
			this.updateDisplay();
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
				this.kill(obj);
			});
			this.selection.objects = [];
			this.updateDisplay();
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
						if(this.selection.objects.length == 1 && obj.parent.resizable){

							if(this.selection.start.y > obj.bounds.max.y - 2){
								mode = Mode.ResizeY;
							}

							if(this.selection.start.x > obj.bounds.max.x - 2){

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
				let obj = this.selection.objects[i];

				// Save state of top left corner
				this.selection.objectsVar[i] = {
					x: obj.position.x - obj.width / 2,
					y: obj.position.y - obj.height / 2,
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
			this.updateDisplay();
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
		let bounds = [];

		this.selection.objects.forEach((obj) => {
			bounds.push(obj.bounds.min, obj.bounds.max);

			// Draw the selected bodies
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

		let region = Matter.Bounds.create(bounds);

		// Draw the Selected Boundary
		sf.ctx.beginPath();
		sf.ctx.rect(region.min.x, region.min.y, region.max.x - region.min.x, region.max.y - region.min.y);
		sf.ctx.strokeStyle = "rgb(255, 255, 0)";
		sf.ctx.stroke();

		// Draw the selection boundary
		switch(this.selection.mode){

			case Mode.Select:
				let region = Matter.Bounds.create([this.selection.start, this.getMousePosition()]);

				// Draw the Selected Boundary
				sf.ctx.beginPath();
				sf.ctx.rect(region.min.x, region.min.y, region.max.x - region.min.x, region.max.y - region.min.y);
				sf.ctx.fillStyle = "rgba(0, 120, 215, 0.25)";
				sf.ctx.fill();
				sf.ctx.strokeStyle = "rgb(0, 120, 215)";
				sf.ctx.stroke();
				break;
		}

		// Draw the resizer boxes
		if(this.selection.objects.length == 1 && this.selection.objects[0].parent.resizable){
			let obj = this.selection.objects[0];
			let width = obj.bounds.max.x - obj.bounds.min.x;
			let height = obj.bounds.max.y - obj.bounds.min.y;

			sf.ctx.beginPath();
			sf.ctx.rect(obj.bounds.min.x + width / 2 - 1, obj.bounds.min.y + height - 1, 2, 2);
			sf.ctx.strokeStyle = "white";
			sf.ctx.lineWidth = 0.5;
			sf.ctx.stroke();

			sf.ctx.beginPath();
			sf.ctx.rect(obj.bounds.min.x + width - 1, obj.bounds.min.y + height / 2 - 1, 2, 2);
			sf.ctx.strokeStyle = "white";
			sf.ctx.lineWidth = 0.5;
			sf.ctx.stroke();

			sf.ctx.beginPath();
			sf.ctx.rect(obj.bounds.min.x + width - 1, obj.bounds.min.y + height - 1, 2, 2);
			sf.ctx.strokeStyle = "white";
			sf.ctx.lineWidth = 0.5;
			sf.ctx.stroke();
		}

		sf.ctx.restore();

		// Draw Coordinates
		sf.ctx.font = "13px sans-serif";
		sf.ctx.fillStyle = "grey";
		sf.ctx.fillText(`X: ${Math.round(this.camera.x)} Y: ${Math.round(this.camera.y)}, Zoom: ${Math.round(this.camera.zoom)}`, 0, sf.canvas.height);
	}

	updateDisplay(){
		this.selection.display.innerHTML = "";

		if(this.selection.objects.length > 1){

			this.selection.objects.forEach((obj) => {
				const button = document.createElement("button");
				button.className = "listing";

				button.append(obj.id);
				button.append(this.createImage(obj.parent, obj.frame.index.x, obj.frame.index.y));

				button.addEventListener("click", () => {
					this.selection.objects = [obj];
					this.updateDisplay();
				});
				this.selection.display.append(button);
			});

		}else if(this.selection.objects.length == 1){

			const obj = this.selection.objects[0];

			// X Position
			const x = this.createInput("x", obj.position.x);
			x.addEventListener("input", (event) => {
				let x = parseInt(event.target.value);
				let y = this.selection.objects[0].position.y;

				if(!isNaN(x))
					Matter.Body.setPosition(obj.body, {x: x, y: y});
			});
			this.selection.display.append(x);

			// Y Position
			const y = this.createInput("y", obj.position.y);
			y.addEventListener("input", (event) => {
				let x = obj.position.x;
				let y = parseInt(event.target.value);

				if(!isNaN(y))
					Matter.Body.setPosition(obj.body, {x: x, y: y});
			});
			this.selection.display.append(y);

			// Width and Height
			if(obj.parent.resizable){
				const w = this.createInput("width", obj.tiling.width);
				w.addEventListener("input", (event) => {
					let w = parseInt(event.target.value);

					if(!isNaN(w) && w >= 1)
						obj.resetTiling(w, obj.tiling.height);
				});


				const h = this.createInput("height", obj.tiling.height);
				h.addEventListener("input", (event) => {
					let h = parseInt(event.target.value);

					if(!isNaN(h) && h >= 1)
						obj.resetTiling(obj.tiling.width, h);
				});	

				this.selection.display.append(w, h);
			}

			// Angle in degrees
			const angle = this.createInput("angle", obj.body.angle * 180 / Math.PI);
			angle.addEventListener("input", (event) => {
				let angle = parseInt(event.target.value);

				if(!isNaN(angle))
					Matter.Body.setAngle(obj.body, angle * Math.PI / 180);
			});	
			this.selection.display.append(angle);

			// Static
			const isStatic = this.createCheckbox("static", obj.body.isStatic);
			isStatic.addEventListener("input", (event) => {
				Matter.Body.setStatic(obj.body, event.target.checked);
			});	
			this.selection.display.append(isStatic);
			this.selection.display.append(this.createSubDivider());

			// Body Id
			const id = this.createText(`id: ${obj.id}`);
			this.selection.display.append(id);

			// Text custom Id
			const customId = this.createInput("customId", obj.customId);
			customId.addEventListener("input", (event) => {
				obj.customId = event.target.value;
			});		
			this.selection.display.append(customId);
			this.selection.display.append(this.createSubDivider());

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
							this.updateDisplay();
						});

						frames.append(button);
					}
				}
				this.selection.display.append(frames);
			}
		}
	}

	createDivider(){
		return document.createElement("hr");
	}

	createSubDivider(){
		let hr = document.createElement("hr");
		hr.style = "border: 1px dotted black";
		return hr
	}

	createText(text){
		let span = document.createElement("span");
		span.innerText = text;
		return span;
	}

	createTitle(text){
		const title = document.createElement("h3");
		title.innerText = text;
		return title;
	}

	createInput(name, value){
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

		div.append(label, input);

		return div;
	}

	createCheckbox(name, value){
		const div = this.createInput(name);

		const input = div.querySelector("input");
		input.type = "checkbox";
		input.checked = value;

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