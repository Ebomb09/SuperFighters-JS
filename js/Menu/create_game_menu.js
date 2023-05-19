import sf from "../sf.js";
import Game from "../Game/game.js";
import BaseMenu from "./base_menu.js";

export default class CreateGameMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		fetch("maps").then((response) => {
			return response.text();

		}).then((text) => {
			this.maps = text.match(/"\w+.sfm"/g);

			// Remove the trailing quotation marks
			for(let i = 0; i < this.maps.length; i ++){
				this.maps[i] = this.maps[i].slice(1,-5);
			}
		});

		this.maps = [];
		this.mapIndex = 0;
		this.players = 1;

		this.addMarkers(this.options,
			[{
				text: "Map",
				onRight: () => {
					this.mapIndex ++;

					if(this.mapIndex >= this.maps.length)
						this.mapIndex = 0;
				},
				onLeft: () => {
					this.mapIndex --;

					if(this.mapIndex < 0)
						this.mapIndex = this.maps.length-1;
				}
			},
			{
				text: "Players",
				onRight: () => {

					if(this.players < 8)
						this.players ++;
				},
				onLeft: () => {

					if(this.players > 1)
						this.players --;
				}
			},
			{
				text: "Start Game",
				onSelect: () => { 

					fetch(`maps/${this.maps[this.mapIndex]}.sfm`).then((response) => {
						return response.text();
					
					}).then((data) => {

						sf.game = new Game({
							map: data, 
							local_players: this.players, 
							host: true
						});

						sf.menuDispatcher.clear();
					
					}).catch((error) => {
						console.error(error);
					});
				}
			}]);

		this.options.x += this.options.w;

		this.addMarkers(this.options,
			[{
				type: "map"
			},
			{
				type: "players"
			}]);
	}

	update(){

		this.markers.forEach((marker) => {

			switch(marker.type){

				case "map":
					marker.text = this.maps[this.mapIndex];
					break;

				case "players":
					marker.text = this.players;
					break;
			}
		});
	}
};