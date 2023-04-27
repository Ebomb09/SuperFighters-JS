export default class BaseMenu{

	constructor(){
		// Defines the markers on a menu
		this.markers = [];
	}

	touchMarker(index){
		let find = this.markers.indexOf(index);

		if(find != -1)
			index = find;

		// Interact with marker
		if(index >= 0 && index < this.markers.length){

			if(this.markers[index].onTouch !== undefined)
				this.markers[index].onTouch();
		}
	}
};