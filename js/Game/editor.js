import sf from "../sf";
import Game from "./game";

export default class Editor extends Game{

	constructor(map){
		super(map);

		this.debug.live = false;
		this.debug.mapCopy = "";
	}

	toggleLive(){

		if(this.debug.live){
			this.loadMap(this.debug.mapCopy);
			this.debug.live = false;

		}else{
			this.debug.mapCopy = this.saveMap();
			this.debug.live = true;
		}
	}

	update(ms){

		this.delta = ms;

		if(this.debug.mode){

			// Draw Bodies
			this.draw();

			if(sf.input.key.pressed["Space"])
				this.toggleLive();

			// Grab objects with mouse
			if(sf.input.mouse.held[0]){

				if(this.debug.select == null){
					let grab = Matter.Query.point(Matter.Composite.allBodies(this.world), Matter.Vector.create(sf.input.mouse.x, sf.input.mouse.y));

					if(grab.length > 0)
						this.debug.select = grab[0];
				}

				if(this.debug.select != null)
					Matter.Body.setPosition(this.debug.select, sf.input.mouse);
			}else{
				this.debug.select = null;
			}
		}

		this.objects.forEach((obj) => {
			obj.draw();

			if(this.debug.live)
				obj.update();
		});		

		if(this.debug.live)
			Matter.Engine.update(this.engine, ms);
	}
};