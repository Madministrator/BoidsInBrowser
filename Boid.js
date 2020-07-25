/**
 * A class which handles boid behavior, including how to draw a boid on a canvas
 * and how to independently make decisions about its movement.
 */
class Boid {
	/**
	 * Creates a Boid with default settings
	 * @param {number} x Starting X Position. Default is 0
	 * @param {number} y Starting Y Position. Default is 0
	 * @param {number} startDirection the starting direction/angle of the boid, in radians. Default is 0 (right)
	 * @param {number} size the size of the boid. Default is 15
	 */
	constructor(startX, startY, startDirection, size) {
		// settings for appearance
		this.appearance = {
			visionColor: 'rgba(0, 0, 0, 0.25)',
			boidColor: 'rgba(102, 153, 255, 1.0)', // #6699ff
			boidSize: size || 15
		}
		// variables specifically related to their vision
		this.vision = {
			angle: Math.PI / 4,
			radius: this.appearance.boidSize * 4,
			neighboringBoids: [],
			obstacles: []
		}

		// current location and direction of the boid
		this.direction = startDirection || 0
		this.position = {
			x: startX || 0,
			y: startY || 0
		}

		// Decision information for drawing the decision process
		this.decision = {
			cohesion: {x: undefined, y: undefined},
			alignment: {x: undefined, y: undefined},
			separation: {x: undefined, y: undefined},
			avoidance: {x: undefined, y: undefined},
			final: {x: 3 * this.appearance.boidSize * Math.cos(this.direction), y: 3 * this.appearance.boidSize * Math.sin(this.direction)},
		}
	}

	/**
	 * Determines if an object is visible to this boid.
	 * @param {number} x The X-Coordinate of the object
	 * @param {number} y The Y-Coordinate of the object
	 * @returns {boolean} Boolean indicating if the x, y coordinates are visible to this boid
	 */
	canSee(x, y) {
		// declare some constants to determine vision behavior
		// relative to the X axis to simplify the math.
		const relDirection = (this.direction > Math.PI) ? this.direction - 2 * Math.PI : this.direction
		const fov = Math.PI - this.vision.angle
		// determine the distance to the coordinates
		let distance = this.distanceTo(x, y)
		// Check if the object is close enough to see.
		if (distance <= this.vision.radius) {
			// calculate the angle between the line drawn by these two points
			// and the horizontal axis (in radians)
			const targetAngle = this.angleTo(x, y)
			if (Math.abs(this.distanceBetweenAngles(targetAngle, relDirection)) <= fov) { // boid is within the field of view
				return true
			}
		}
		return false
	}

	/**
	 * A utility function which finds the smallest angle between two angles.
	 * @param {number} a an angle in radians
	 * @param {number} b an angle in radians
	 * @returns The difference between angles a and b in radians, preserving signs.
	 */
	distanceBetweenAngles(a, b) {
		return Math.atan2(Math.sin(a - b), Math.cos(a - b))
	}

	/**
	 * Finds the angle from this boid to any point, relative to the X-axis
	 * @param {number} x the X-coordinate of the point in interest
	 * @param {number} y the Y-coordinate of the point in interest
	 * @returns {number} The angle to the point from this boid in radians.
	 * 						In range -Math.PI (exclusive) to Math.PI (inclusive)
	 */
	angleTo(x, y) {
		return Math.atan2(y - this.position.y, x - this.position.x)
	}

	/**
	 * Constrains an input to the range 0 to 2 * Math.PI, inclusive
	 * @param {number} theta 
	 */
	constrainAngle(theta) {
		while (theta < 0) {
			theta += 2 * Math.PI
		}
		while (theta > 2 * Math.PI) {
			theta -= 2 * Math.PI
		}
		return theta
	}

	/**
	 * Finds the distance between this boid and any point
	 * @param {number} x The X coordinate of the point in interest.
	 * @param {number} y The Y coordinate of the point in interest.
	 * @returns {number} The distance between this boid and any point.
	 */
	distanceTo(x, y) {
		return Math.sqrt(Math.pow(x - this.position.x, 2) + Math.pow(y - this.position.y, 2))
	}

	/**
	 * Given the coordinates of all obstacles on the canvas, plus the dimensions of the canvas,
	 * detect all obstacles within the field of view of this boid.
	 * Will also make the avoidance decision.
	 * @param {Array<Object>} obstacles A series of coordinates in the format {x: number, y: number}
	 * @param {number} width the width of the canvas
	 * @param {number} height the height of the canvas
	 * @returns {Array{Object}} A series of coordinates in the format {x: number, y: number} that this boid can see.
	 */
	detectObstacles(obstacles, width, height) {
		// clear the list and start from scratch
		this.vision.obstacles = []
		// while we are here, determine the safest point away from those obstacles
		let safety = [];
		const danger = 2; // the greater the danger, the more weight "don't crash" will have

		for (let i = 0; i < obstacles.length; i++) {
			if (this.canSee(obstacles[i].x, obstacles[i].y)) {
				this.vision.obstacles.push({
					x: obstacles[i].x,
					y: obstacles[i].y
				})
				// the safest point is the opposite direction, and a little further
				safety.push({
					x: this.position.x + (this.position.x - obstacles[i].x) * danger,
					y: this.position.y + (this.position.y - obstacles[i].y) * danger
				})
			}
		}
		// check for the edges of the display
		if (this.canSee(0, this.position.y)) { // left edge
			this.vision.obstacles.push({
				x: 0,
				y: this.position.y
			})
			safety.push({
				x: this.position.x * danger,
				y: this.position.y
			})
		}
		if (this.canSee(width, this.position.y)) { // right edge
			this.vision.obstacles.push({
				x: width,
				y: this.position.y
			})
			safety.push({
				x: this.position.x - (width - this.position.x) * danger,
				y: this.position.y
			})
		}
		if (this.canSee(this.position.x, 0)) { // top edge
			this.vision.obstacles.push({
				x: this.position.x,
				y: 0
			})
			safety.push({
				x: this.position.x,
				y: this.position.y * danger
			})
		}
		if (this.canSee(this.position.x, height)) { // bottom edge
			this.vision.obstacles.push({
				x: this.position.x,
				y: height
			})
			safety.push({
				x: this.position.x,
				y: this.position.y - (height - this.position.y) * danger
			})
		}
		if (safety.length > 0) {
			// determine the safest point (average of points in safety)
			this.decision.avoidance = {x: 0, y: 0}
			for(let i = 0; i < safety.length; i++) {
				this.decision.avoidance.x += safety[i].x;
				this.decision.avoidance.y += safety[i].y;
			}
			this.decision.avoidance.x /= safety.length;
			this.decision.avoidance.y /= safety.length;
		} else {
			// there are no obstacles, reset avoidance behavior
			this.decision.avoidance = {
				x: undefined,
				y: undefined
			}
		}
		return this.vision.obstacles
	}

	/**
	 * Determine what direction the boid should move based on what information the boid can 'see'. The decision is made
	 * based on the following criteria:
	 * Cohesion: The average position of all visible flockmates
	 * Alignment: The Average direction of all visible flockmates
	 * Separation: Do not overcrowd the flock
	 * Don't Crash: Avoid obstacles and the edge of the display (To be implemented later - I need obstacle vision)
	 * @param {Array<Boid>} boids An array of boid objects which could be flockmates to be factored into the decision.
	 * @returns {object} a number indicating the angle (in radians) the boid ought to go based on its decision making principles.
	 */
	decideDirection(boids) {
		// reset vision on neighboring boids
		this.vision.neighboringBoids = []
		// START WITH SIMPLE BASE CASES
		if (boids.length <= 1 && this.vision.obstacles.length <= 0) {
			// We see nothing (the boids array always contains at least this boid), so maintain course
			this.decision.final = {
				x: this.position.x + this.appearance.boidSize * Math.cos(this.direction),
				y: this.position.y + this.appearance.boidSize * Math.sin(this.direction)
			}
		} else if (boids.length <= 1 && this.vision.obstacles.length > 0) {
			// we have no other boids, but we have obstacles to deal with
			// sanity check: make sure that avoidance isn't undefined
			if (this.decision.avoidance.x && this.decision.avoidance.y) {
				this.decision.final = this.decision.avoidance
			} else {
				this.decision.final = {
					x: this.position.x + this.appearance.boidSize * Math.cos(this.direction),
					y: this.position.y + this.appearance.boidSize * Math.sin(this.direction)
				}
			}
		} else { // GENERAL CASE
			// We have at least one other boid to check, but we don't know about other obstacles for sure yet
			//setup this.decision struct
			this.decision.cohesion = {x: 0, y: 0}
			this.decision.alignment = {x: 0, y: 0}
			this.decision.separation = {x: 0, y: 0}
			// check if we can "see" the other boids, and collect data on visible ones
			for (let i = 0; i < boids.length; i++) {
				if (boids[i] != this && this.canSee(boids[i].position.x, boids[i].position.y)) {
					this.vision.neighboringBoids.push(boids[i]);
					// Get the aggregate sum of coordinates of neighboring boids
					this.decision.cohesion.x += boids[i].position.x
					this.decision.cohesion.y += boids[i].position.y
					// choose a point 2 "boid lengths" along the ray cast by the other boids' direction for aligment
					this.decision.alignment.x += 2 * boids[i].appearance.boidSize * Math.cos(boids[i].direction) + boids[i].position.x
					this.decision.alignment.y += 2 * boids[i].appearance.boidSize * Math.cos(boids[i].direction) + boids[i].position.y
				}
			}
			// check if we can "see" other boids and make decisions based on that
			if (this.vision.neighboringBoids.length > 0) {
				// averaging vectors time
				this.decision.cohesion.x /= this.vision.neighboringBoids.length
				this.decision.cohesion.y /= this.vision.neighboringBoids.length
				this.decision.alignment.x /= this.vision.neighboringBoids.length
				this.decision.alignment.y /= this.vision.neighboringBoids.length
				// TODO: revisit separation rules here

				// put all the rules together here
				if (this.vision.obstacles.length > 0) {
					// factor in avoidance
					this.decision.final.x = (this.decision.cohesion.x + this.decision.alignment.x + this.decision.separation.x + this.decision.avoidance) / 4
					this.decision.final.y = (this.decision.cohesion.y + this.decision.alignment.y + this.decision.separation.y + this.decision.avoidance) / 4
				} else {
					// don't factor in avoidance
					this.decision.avoidance = {x: undefined, y: undefined}
					this.decision.final.x = (this.decision.cohesion.x + this.decision.alignment.x + this.decision.separation.x) / 3
					this.decision.final.y = (this.decision.cohesion.y + this.decision.alignment.y + this.decision.separation.y) / 3
				}
			} else {
				// reset the decision struct to show we didn't find anyhing
				this.decision.cohesion = {x: undefined, y: undefined}
				this.decision.alignment = {x: undefined, y: undefined}
				this.decision.separation = {x: undefined, y: undefined}
				// we don't have other boids, check for other obstacles
				if (this.vision.obstacles.length > 0) {
					// our decision is based entirely on obstacle avoidance
					this.decision.final = this.decision.avoidance
				} else {
					// We don't see anything, maintain course
					this.decision.final = {
						x: this.position.x + this.appearance.boidSize * Math.cos(this.direction),
						y: this.position.y + this.appearance.boidSize * Math.sin(this.direction)
					}
				}
			}
		
			// put all the rules together
			this.decision.final.x = (this.decision.cohesion.x + this.decision.alignment.x + this.decision.separation.x) / 3
			this.decision.final.y = (this.decision.cohesion.y + this.decision.alignment.y + this.decision.separation.y) / 3
			if (this.vision.obstacles.length > 0) { // we need to factor in avoidance
				this.decision.final.x = (this.decision.final.x + this.decision.avoidance.x) / 2
				this.decision.final.y = (this.decision.final.y + this.decision.avoidance.y) / 2
			}
		}
		// Add some noise to the final decision
		if (Math.random() < 0.1) { 
			this.decision.final.x += (Math.random() * 10) - 5
			this.decision.final.y += (Math.random() * 10) - 5
		}
		return this.angleTo(this.decision.final.x, this.decision.final.y)
	}


	// DRAWING FUNCTIONS

	/**
	 * Draws the boid
	 * @param {CanvasRenderingContext2D} ctx The rendering context of the canvas that we are drawing to.
	 */
	drawBoid(ctx) {
		// save the context state before this function was called so we can modify the context state
		ctx.save()

		// change the context to be centered and rotated around the boid
		ctx.translate(this.position.x, this.position.y)
		ctx.rotate(this.direction)

		// draw the boid as a triangle with a notch to indicate the front
		ctx.fillStyle = this.appearance.boidColor
		ctx.beginPath()
		ctx.moveTo(this.appearance.boidSize / 2, 0)
		ctx.lineTo(this.appearance.boidSize / 2, 0)
		ctx.lineTo(-this.appearance.boidSize / 3, -this.appearance.boidSize / 3)
		ctx.lineTo(-this.appearance.boidSize / 8, 0)
		ctx.lineTo(-this.appearance.boidSize / 3, this.appearance.boidSize / 3)
		ctx.lineTo(this.appearance.boidSize / 2, 0)
		ctx.stroke()
		ctx.fill()

		// restore the context state to not interfere with other drawing functions
		ctx.restore()
	}

	/**
	 * Draws a representation of the boid vision.
	 * Note, You must call drawBoid AFTER calling drawVision to see the boid on top of the vision circle.
	 * @param {CanvasRenderingContext2D} ctx The rendering context of the canvas that we are drawing to.
	 */
	drawVision(ctx) {
		// save the context state before this function was called so we can modify the context state
		ctx.save()

		// move the context to the boid so that I don't have to worry about positioning
		ctx.translate(this.position.x, this.position.y)
		// rotate so that 0 degrees is directly behind the boid
		ctx.rotate(this.direction - Math.PI)

		// Draw the semi-circle of vision
		ctx.beginPath()
		ctx.arc(0, 0, this.vision.radius, this.vision.angle, 2 * Math.PI - this.vision.angle, false)
		ctx.lineTo(0, 0)
		ctx.fillStyle = this.appearance.visionColor
		ctx.fill()

		// undo transformations to draw lines using absolute locations
		ctx.restore()
		ctx.save()

		// Draw a line between this boid and all boids it sees (marked with blue line)
		ctx.strokeStyle = this.appearance.boidColor
		for (let i = 0; i < this.vision.neighboringBoids.length; i++) {
			ctx.beginPath()
			ctx.moveTo(this.position.x, this.position.y)
			ctx.lineTo(this.vision.neighboringBoids[i].position.x, this.vision.neighboringBoids[i].position.y)
			ctx.stroke()
		}
		// restore the context state to not interfere with other drawing functions
		ctx.restore()
	}

	/**
	 * Draws the decision making process of the boid with the following pattern:
	 * Yellow Dot: The average of all flockmate positions (Cohesion)
	 * Yellow Arrow: The direction to the yellow dot.
	 * Green Arrow: The average direction of all flockmates (Alighment)
	 * Orange Arrow: The best (separation) direction
	 * Red Arrow: The best "don't crash" direction (not implemented)
	 * Blue Arrow: Ultimately where the boid decided to go.
	 * @param {CanvasRenderingContext2D} ctx The context of the canvas we want to draw to.
	 */
	drawDecision(ctx) {
		ctx.save() // preserve previous state before changing state
		// Draw the cohesion point
		if (this.decision.cohesionX != undefined && this.decision.cohesionY != undefined) {
			ctx.beginPath()
			ctx.fillStyle = 'yellow'
			ctx.arc(this.decision.cohesion.x, this.decision.cohesion.y,
				this.appearance.boidSize / 4, 0, 2 * Math.PI)
			ctx.fill()
		}
		// Draw the set of visible obstacles
		ctx.fillStyle = 'red'
		if (this.vision.obstacles.length > 0) {
			for (let i = 0; i < this.vision.obstacles.length; i++) {
				ctx.beginPath()
				ctx.arc(this.vision.obstacles[i].x,
					this.vision.obstacles[i].y,
					this.appearance.boidSize / 4,
					0, 2 * Math.PI)
				ctx.fill()
			}
		}
		// set up for drawing arrows from the center of this boid
		ctx.translate(this.position.x, this.position.y)
		ctx.lineWidth = this.appearance.boidSize / 8
		// Draw Cohesion rule
		if (this.decision.cohesion.x != 0) {
			const cohesion = this.angleTo(this.decision.cohesion.x, this.decision.cohesion.y)
			ctx.beginPath()
			ctx.strokeStyle = 'yellow'
			ctx.moveTo(0, 0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(cohesion),
				this.appearance.boidSize * Math.sin(cohesion)
			)
			ctx.stroke()
		}
		// Draw alignment rule
		if (this.decision.alignment.x != 0) {
			const alignment = this.angleTo(this.decision.alignment.x, this.decision.alignment.y)
			ctx.beginPath()
			ctx.strokeStyle = 'green'
			ctx.moveTo(0, 0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(alignment),
				this.appearance.boidSize * Math.sin(alignment))
			ctx.stroke()
		}
		// Draw separation rule
		if (this.decision.separation.x != 0) {
			const separation = this.angleTo(this.decision.separation.x, this.decision.separation.y)
			ctx.beginPath()
			ctx.strokeStyle = 'orange'
			ctx.moveTo(0, 0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(separation),
				this.appearance.boidSize * Math.sin(separation))
			ctx.stroke()
		}
		// Draw "Don't crash" rule
		if (this.decision.avoidance.x != 0) {
			const avoidance = this.angleTo(this.decision.avoidance.x, this.decision.avoidance.y)
			ctx.beginPath()
			ctx.strokeStyle = 'red'
			ctx.moveTo(0, 0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(avoidance),
				this.appearance.boidSize * Math.sin(avoidance))
			ctx.stroke()
		}
		// Draw final decision
		if (this.decision.final.x != 0) {
			const final = this.angleTo(this.decision.final.x, this.decision.final.y)
			ctx.beginPath()
			ctx.strokeStyle = 'blue'
			ctx.moveTo(0, 0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(final),
				this.appearance.boidSize * Math.sin(final))
			ctx.stroke()
		}
		ctx.restore() // undo any changes to state
	}
}