import sf from "../sf";
import Game from "./game";

const Mode = {
	None: 	"none",
	Select: "select",
	Move: 	"move",
	Rotate: "rotate",
	Resize: "resize",
	Pan: 	"pan", 
	Zoom: 	"zoom"
};

export default class Editor extends Game{

	constructor(map){
		super(map);

		this.selection = {
			mode: Mode.None,
			display: null,
			objects: [],
			objectsVar: [],
			start: {x: 0, y: 0},
			grid: {x: 8, y: 8, angle: 15}
		};

		this.live = false;
		this.mapCopy = "";

		sf.docs.innerHTML = "";

		// Editor Control
		let controls = document.createElement("div");

		const play = document.createElement("button");
		play.append("▶");
		play.addEventListener("click", () => {

			if(!this.live){
				this.mapCopy = this.saveMap();
				this.live = true;
			}
		});

		const stop = document.createElement("button");
		stop.append("⏹");
		stop.addEventListener("click", () => {

			if(this.live){
				this.loadMap(this.mapCopy);
				this.live = false;
			}
		});

		const grid = this.createInput("clamp grid", this.selection.grid.x);
		const angle = this.createInput("clamp angle", this.selection.grid.angle);

		grid.addEventListener("input", (event) => {
			let val = parseInt(event.target.value);

			if(val > 0){
				this.selection.grid.x = val;
				this.selection.grid.y = val;
			}
		});


		angle.addEventListener("input", (event) => {
			let val = parseInt(event.target.value);

			if(val > 0)
				this.selection.grid.angle = val;
		});

		controls.append(grid, angle, this.createSubDivider(), stop, play);

		// Selection Control
		this.selection.display = document.createElement("div");

		// Objects
		let objects = document.createElement("div");

		Object.keys(sf.data.objects).forEach((key) => {
			const button = document.createElement("button");
			button.className = "listing";

			button.append(this.getImage(sf.data.objects[key]));
			button.append(key);

			button.addEventListener("click", () => {
				this.createObject(sf.data.objects[key], {x: 20, y: 20});
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

	deconstructor(){
		sf.html.innerHTML = "";
	}

	update(ms){

		// Zoom camera
		if(sf.input.mouse.scroll.y < 0){
			this.camera.zoom += 1;

		}

		if(sf.input.mouse.scroll.y > 0){

			if(this.camera.zoom > 1)
			this.camera.zoom -= 1;
		}

		// Mode starters
		if(this.selection.mode == Mode.None){
			this.selection.start = this.getMousePosition();
			let touching = this.getObjectsByAABB(this.getMousePosition());

			// Check what objects are being interacted with
			let mode = Mode.None;

			// Left Click (Select, Move)
			if(sf.input.mouse.pressed[0]){
				mode = Mode.Select;

				touching.forEach((obj) => {

					if(this.selection.objects.indexOf(obj) != -1)
						mode = Mode.Move;
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

				this.selection.objectsVar[i] = {
					x: obj.position.x,
					y: obj.position.y,
					angle: obj.body.angle
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

					Matter.Body.setPosition(obj.body, {x: useX, y: useY});
				}
				break;

			case Mode.Rotate:
				let angle = (this.getMousePosition().x - this.selection.start.x) + (this.getMousePosition().y - this.selection.start.y);

				for(let i = 0; i < this.selection.objects.length; i ++){
					const obj = this.selection.objects[i];
					const sav = this.selection.objectsVar[i];

					let useAngle = Math.round((sav.angle + angle) / this.selection.grid.angle) * this.selection.grid.angle;
					useAngle = useAngle * Math.PI / 180;

					Matter.Body.setAngle(obj.body, useAngle);
				}		
				break;
		}

		// Mode end
		if(sf.input.mouse.released[0] || sf.input.mouse.released[1] || sf.input.mouse.released[2]){

			switch(this.selection.mode){

				case Mode.Select:
					this.selection.objects = this.getObjectsByAABB(this.getMousePosition(), this.selection.start);
					break;
			}
			this.updateDisplay();
			this.selection.mode = Mode.None;
		}

		// Process the games test loop if live
		if(this.live){
			this.objects.forEach((obj) => {
				obj.update(ms);
			});		

			Matter.Engine.update(this.engine, ms);
		}
	}

	draw(){
		sf.ctx.save();

		sf.ctx.scale(this.camera.zoom, this.camera.zoom);
		sf.ctx.translate(-this.camera.x, -this.camera.y);

		this.objects.forEach((obj) => {
			obj.draw();
		});

		// Get object AABBs
		let bounds = [];

		this.selection.objects.forEach((obj) => {
			bounds.push(obj.body.bounds.min, obj.body.bounds.max);

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

		sf.ctx.restore();
	}

	updateDisplay(){
		this.selection.display.innerHTML = "";

		if(this.selection.objects.length > 1){

			this.selection.objects.forEach((obj) => {
				const button = document.createElement("button");
				button.className = "listing";

				button.append(obj.id);
				button.append(this.getImage(obj.parent, obj.frame.index.x, obj.frame.index.y));

				button.addEventListener("click", () => {
					this.selection.objects = [obj];
					this.updateDisplay();
				});
				this.selection.display.append(button);
			});

		}else if(this.selection.objects.length == 1){

			const obj = this.selection.objects[0];
			const x = this.createInput("x", obj.position.x);
			const y = this.createInput("y", obj.position.y);
			const w = this.createInput("width", obj.tiling.width);
			const h = this.createInput("height", obj.tiling.height);
			const angle = this.createInput("angle", obj.body.angle * 180 / Math.PI);
			const customId = this.createInput("customId", obj.customId);

			x.addEventListener("input", (event) => {
				let x = parseInt(event.target.value);
				let y = this.selection.objects[0].position.y;

				if(!isNaN(x))
					Matter.Body.setPosition(obj.body, {x: x, y: y});
			});

			y.addEventListener("input", (event) => {
				let x = obj.position.x;
				let y = parseInt(event.target.value);

				if(!isNaN(y))
					Matter.Body.setPosition(obj.body, {x: x, y: y});
			});

			w.addEventListener("input", (event) => {
				let w = parseInt(event.target.value);

				if(!isNaN(w))
					obj.resetTiling(w, obj.tiling.height);
			});

			h.addEventListener("input", (event) => {
				let h = parseInt(event.target.value);

				if(!isNaN(h))
					obj.resetTiling(obj.tiling.width, h);
			});

			angle.addEventListener("input", (event) => {
				let angle = parseInt(event.target.value);

				if(!isNaN(angle))
					Matter.Body.setAngle(obj.body, angle * Math.PI / 180);
			});	

			customId.addEventListener("input", (event) => {
				obj.customId = event.target.value;
			});		

			this.selection.display.append(
				x, 
				y,
				w,
				h,
				angle,
				this.createSubDivider(),
				customId
				);
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

	createTitle(text){
		const title = document.createElement("h3");
		title.innerText = text;
		return title;
	}

	createInput(name, value){
		const div = document.createElement("div");

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

	getImage(parent, x, y){

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