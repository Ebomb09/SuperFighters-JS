import sf from "../sf.js";
import Game from "../Game/game.js";
import BaseMenu from "./base_menu.js";

export default class BrowserMenu extends BaseMenu{

	constructor(text, callback){
		super();
		this.getGames();
	}

	getGames(){

		try{
			var ws = new WebSocket(master_server);

		}catch(error){
			this.resetMarkers();
			return;
		}

		ws.onerror = (event) => {
			this.resetMarkers();
			ws.close();
		}

		ws.onmessage = (event) => {

			const msg = JSON.parse(event.data);

			switch(msg.type){

				case "connect":
					ws.send(JSON.stringify({
						type: "get_games"
					}));
					break;

				case "get_games":

					if(!msg.games)
						break;

					const games = [];

					msg.games.forEach((game) => {
						games.push({
							text: `game_id: ${game.id} | players: ${game.players}`,
							onSelect: () => { this.joinGame(game.id); }
						});
					});

					this.resetMarkers(games);
					ws.close();
					break;
			}
		}
	}

	joinGame(gameId){
		sf.game = new Game({local_players: 1, join: gameId});
		sf.menuDispatcher.clear();
	}

	resetMarkers(games){
		this.options.w = 150;
		this.options.x = 32;
		this.options.y = 32;

		this.addMarkers(this.options,
			[{
				text: "Refresh",
				onSelect: () => { this.getGames(); }
			}]);	

		this.options.y += this.options.h;
		this.options.w = 736;

		if(games)
			this.addMarkers(this.options, games);
	}
}