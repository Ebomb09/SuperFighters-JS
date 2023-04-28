export default class BaseObject{

	constructor(object, x, y, options){
		this.image = object.image;
		this.width = this.image.width;
		this.height = this.image.height;

		this.body = Matter.Bodies.rectangle(x, y, this.width, this.height, options);
		this.collisions = [];

		this.id = this.body.id;
		this.customId = "";
	}

	update(){}

	draw(){
		sf.ctx.save();

		sf.ctx.translate(this.body.position.x, this.body.position.y);
		sf.ctx.rotate(this.body.angle);
		sf.ctx.translate(-this.body.position.x, -this.body.position.y);

		sf.ctx.drawImage(
			this.image, 
			this.body.position.x - this.width/2, 
			this.body.position.y - this.height/2
			);

		sf.ctx.restore();
	}

	getPenetrationAngle(obj){
		let collision = Matter.Collision.collides(this.body, obj.body);
		
		if(collision != null){
			let penVector = null;

			// Check if collision is going this -> obj
			if(collision.bodyB == this.body)
				penVector = collision.penetration;

			// Reverse the vector if it is obj -> this
			else
				penVector = Matter.Vector.neg(collision.penetration);

			let rad = Matter.Vector.angle(Matter.Vector.create(0, 0), penVector);

			// Convert to degrees and correct for perspective of x, -y
			return 360 - rad * 180 / Math.PI ;
		}
		return -1;
	}

	onGround(){

		for(let i = 0; i < this.collisions.length; i ++){
			let obj = this.collisions[i];

			let penAngle = this.getPenetrationAngle(obj);

			if(penAngle >= 225 && penAngle <= 315)
				return true;
		}
		return false;
	}
};