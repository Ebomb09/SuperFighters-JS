import sf from "../../sf";
import BaseObject from "./base_object";

export default class Platform extends BaseObject{

	constructor(...params){
		super(...params);

		this.platformBodies = [];
	}

	update(){
		const players = sf.game.getPlayers();

		for(let i = 0; i < players.length; i ++){

			// Create collision bodies per player
			if(!this.platformBodies[i]){

				// Copy
				this.platformBodies[i] = Matter.Bodies.rectangle(this.getPosition().x, this.getPosition().y, this.width, this.height, {isStatic: true});
				this.platformBodies[i].collisionFilter.category = 0;
				this.platformBodies[i].collisionFilter.mask = 0;
				this.platformBodies[i].clientId = this.id;

				Matter.Composite.add(sf.game.world, this.platformBodies[i]);
			}

			// Copy the main body position
			Matter.Body.setPosition(this.platformBodies[i], this.getPosition());
			Matter.Body.setAngle(this.platformBodies[i], this.body.angle);

			// If the platform is above disable the collision group
			if(this.getPosition().y <= players[i].getPosition().y + players[i].height/2)
				this.platformBodies[i].collisionFilter.group = 0;
			else
				this.platformBodies[i].collisionFilter.group = players[i].id;
		}
	}

	killBody(){

		this.platformBodies.forEach((plat) => {
			Matter.Composite.remove(sf.game.world, plat);
		});

		super.killBody();
	}
};


/*
	Create data definitions for all Platform objects
*/
const obj = sf.data.objects;

let added = [
	obj.platform = { image: sf.data.loadImage("images/platform.png"), frameCount: {x: 3, y: 1}},

].forEach((item) => {
	item.type = Platform;
	item.resizable = true;
	item.matter = {isStatic: true};
	item.category = sf.filters.platform;
	item.mask = sf.filters.object | sf.filters.decoration | sf.filters.weapon;
});