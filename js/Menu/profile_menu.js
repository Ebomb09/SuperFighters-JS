import sf from "../sf";
import Player from "../Game/Objects/player";
import BaseMenu from "./base_menu";

export default class ProfileMenu extends BaseMenu{

	constructor(x, y){
		super(x, y);

		this.playerIndex = 0;
		this.getProfile();

		console.log(sf.canvas.width/2)

		this.player = new Player(sf.data.objects.player,
			{
				parent: sf.data.objects.player,
				state: {
					name: "grounded"
				},
				matter: {
					position: {x: 0, y: 0}
				}
			});

		this.addMarkers(this.options,
			[{
				text: this.getPlayerText(),
				onRight: (marker) => {

					if(this.playerIndex < 7)
						this.playerIndex ++;

					marker.text = this.getPlayerText();
					this.getProfile();
				},	
				onLeft: (marker) => {

					if(this.playerIndex > 0)
						this.playerIndex --;

					marker.text = this.getPlayerText();		
					this.getProfile();			
				}		
			},
			{
				text: "Name",
				onSelect: (marker) => {

				}
			}]);

		// Customizer Options
		this.options.y += this.options.h * 2;

		Object.keys(sf.data.apparel).forEach((key) => {

			this.addMarker({
				x: this.options.x,
				y: this.options.y,
				w: this.options.w,
				h: this.options.h,

				text: `${key[0].toUpperCase()}${key.substring(1)}`,

				onRight: () => { this.nextApparel(key) },
				onLeft: () => { this.previousApparel(key) }
			});		

			this.addMarker({
				x: this.options.x + this.options.w,
				y: this.options.y,
				w: this.options.w,
				h: this.options.h,

				slot: key
			});		

			this.options.y += this.options.h;
		})

	}

	update(){
		this.markers.forEach((marker) => {

			if(marker.slot){
				const item = this.profile[marker.slot];
				
				if(item)
					marker.text = item;
				else
					marker.text = "Nothing";
			}
		});
	}

	draw(){
		super.draw();

		// Draw player
		sf.ctx.save();
		sf.ctx.translate(sf.canvas.width / 2, sf.canvas.height / 2);
		sf.ctx.scale(5, 5);
		this.player.profile = this.profile;
		this.player.draw();
		sf.ctx.restore();
	}

	nextApparel(slot){
		const items = Object.keys(sf.data.apparel[slot]);
		let index = items.indexOf(this.profile[slot]);

		if(index != -1){
			index += 1;

			if(index >= items.length)
				this.profile[slot] = null;
			else
				this.profile[slot] = items.at(index);

		}else{
			this.profile[slot] = items.at(0);
		}
	}

	previousApparel(slot){
		const items = Object.keys(sf.data.apparel[slot]);
		let index = items.indexOf(this.profile[slot]);

		if(index != -1){
			index -= 1;

			if(index < 0)
				this.profile[slot] = null;
			else
				this.profile[slot] = items.at(index);

		}else{
			this.profile[slot] = items.at(-1);
		}
	}

	getProfile(){

		// Create a new default profile
		if(!sf.config.profiles[this.playerIndex])
			sf.config.profiles[this.playerIndex] = {
				name: `New Player ${this.playerIndex}`
			};

		this.profile = sf.config.profiles[this.playerIndex];
	}

	getPlayerText(){
		return `Player ${this.playerIndex+1}`;
	}
};