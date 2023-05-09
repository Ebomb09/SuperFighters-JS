import sf from "../sf";
import Game from "../Game/game";
import BaseMenu from "./base_menu";

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

		ws.onopen = (event) => {
			ws.send(JSON.stringify({
				type: "get_games"
			}));
		};

		ws.onerror = (event) => {
			this.resetMarkers();
			ws.close();
		}

		ws.onmessage = (event) => {
			let games = [];
			
			JSON.parse(event.data).games.forEach((game) => {
				games.push({
					text: `game_id: ${game.id} | players: ${game.players}`,
					onSelect: () => { this.joinGame(game.id); }
				});
			});

			this.resetMarkers(games);
			ws.close();
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