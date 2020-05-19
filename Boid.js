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
			radius: this.appearance.boidSize * 3,
			neighboringBoids: []
		}

		// current location and direction of the boid
		this.direction = startDirection || 0
		this.position = {
			x: startX || 0,
			y: startY || 0
		}
	}

	/**
	 * Given an array of boids, determine which boids this boid can see
	 * with its current vision.
	 * @param {Array<Boid>} boids An array of boid objects
	 * @returns An array of all boids which this boid can see.
	 */
	detectBoids(boids) {
		// clear the current list of boids
		this.vision.neighboringBoids = []
		// declare some constants to determine vision behavior
		// relative to the X axis for simplicity
		const relDirection = (this.direction > Math.PI) ? this.direction - 2 * Math.PI : this.direction
		const fov = Math.PI - this.vision.angle

		for (let i = 0; i < boids.length; i++) {
			if (boids[i] == this) {
				continue // Skip the math and don't compare this to itself
			}
			// calculate the distance between this and that boid
			let distance = Math.abs(Math.sqrt(
				Math.pow(boids[i].position.x - this.position.x, 2) +
				Math.pow(boids[i].position.y - this.position.y, 2)))
			// calculate the angle between the line drawn by these two points
			// and the horizontal axis (in radians)
			const boidAngle = Math.atan2(boids[i].position.y - this.position.y, boids[i].position.x - this.position.x)
			// calculate the smallest angle between the boid and this.direction
			let angle = Math.abs(Math.atan2(Math.sin(boidAngle - relDirection), Math.cos(boidAngle - relDirection)))
			if (distance < this.vision.radius // the boid is close enough to see
				&& angle <= fov) { // and is within the field of view
				this.vision.neighboringBoids.push(boids[i])
			}
		}
		return this.vision.neighboringBoids
	}

	/*
	    Decision Methods:
	    This is where the boid chooses which direction to go. This will be done in four functions:
	    - cohesion
	        - Determine the average position of all visible flockmates
	    - Alignment
	        - Determine the average direction of all visible flockmates
	    - Separation
	        - Don't overlap with nearby boids
	        - The hardest to implement
	    - Don't crash principle
	        - Do not touch the edge of the display
	        - Do not touch obstacles on the path
	    
	    I would normally implement these as four separate functions, but then every decision
	    for every boid on the screen would have O(m * n^3) efficiency where n is the number of
	    visible boids and m is the number of visible obstacles, including the edges of the display.

	    As such, I have to implement this entire decision making process inside one function to
	    keep the efficiency in O(n*m), which is important once I reach a large number of boids.
	*/

	/**
	 * Determine what direction the boid should move based on what information the boid can 'see'. The decision is made
	 * based on the following criteria:
	 * Cohesion: The average position of all visible flockmates
	 * Alignment: The Average direction of all visible flockmates
	 * Separation: Do not overcrowd the flock
	 * Don't Crash: Avoid obstacles and the edge of the display (To be implemented later - I need obstacle vision)
	 * 
	 * @param {CanvasRenderingContext2D} ctx The rendering context of the canvas. If given, the boid will draw representations
	 *                                      of its decision making process on the canvas.
	 * @returns {number} a number indicating the angle (in radians) the boid ought to go based on its decision making principles.
	 */
	decideDirection(ctx) {
		if (this.vision.neighboringBoids.length == 0) {
			// We don't see anything, maintain course
			if (ctx != undefined) {
				// Draw the decision of "maintain course"
				ctx.save()
				// Set up for drawing arrows from the center of the boid
				ctx.translate(this.position.x, this.position.y)
				ctx.lineWidth = this.appearance.boidSize / 8
				// Draw Cohesion Decision
				ctx.beginPath()
				ctx.strokeStyle = 'blue'
				ctx.moveTo(0,0)
				ctx.lineTo(
					this.appearance.boidSize * Math.cos(this.direction),
					this.appearance.boidSize * Math.sin(this.direction)
				)
				ctx.stroke()
				ctx.restore()
			}
			// end early to prevent more math
			return this.direction
		}
		let cohesionX = 0
		let cohesionY = 0
		let cohesion = 0
		let alignment = 0
		let shortestDistance = this.vision.radius + 1 // guarentees at least one visible boid will be shortest
		let separation = 0
		for(let i = 0; i < this.vision.neighboringBoids.length; i++) {
			// Get the aggregate sum of coordinates and direction for averages
			cohesionX += this.vision.neighboringBoids[i].position.x
			cohesionY += this.vision.neighboringBoids[i].position.y
			alignment += this.vision.neighboringBoids[i].direction
			// calculate the distance between this and that boid
			let distance = Math.abs(Math.sqrt(
				Math.pow(this.vision.neighboringBoids[i].position.x - this.position.x, 2) +
				Math.pow(this.vision.neighboringBoids[i].position.y - this.position.y, 2)))
			// figure out how close the closest boid is (for a weighted average)
			if (distance < shortestDistance) {
				shortestDistance = distance
			}
			// determine separation behavior "go in the opposite direction of all the boids"
			// get the angle of each boid
			const boidAngle = Math.atan2(this.vision.neighboringBoids[i].position.y - this.position.y,
				this.vision.neighboringBoids[i].position.x - this.position.x)
			separation += boidAngle + Math.PI // add the opposite direction
		}
		// Get the X and Y coordinates of the cohesion point
		cohesionX /= this.vision.neighboringBoids.length
		cohesionY /= this.vision.neighboringBoids.length
		// Get the angle to the cohesion point
		cohesion = Math.atan2(cohesionY - this.position.y, cohesionX - this.position.x)
		alignment /= this.vision.neighboringBoids.length
		// Get the direction away from all other boids
		separation /= this.vision.neighboringBoids.length

		/* Make a decision by using a weighted average of all factors.
			cohesion and separation compete with each other through a weight
			Given by the closest boid to this boid.
		*/
		let distanceWeight = (shortestDistance / this.vision.radius)
		let alignmentWeight = 1.0 // How should I determine this? maybe compete with obstacles?
		let decision = separation * distanceWeight
		decision += cohesion * (1 - distanceWeight)
		decision += alignment * alignmentWeight
		decision /= 3

		if (ctx != undefined) {
			ctx.save()
			/* Draw the decision making process:
				- yellow Dot: The average of all flockmate positions (Cohesion)
				- yellow arrow: The direction to the yellow dot
				- Green Arrow: The average direction of all flockmates (Alignment)
				- Orange Arrow: The best (separation) direction
				- Red Arrow: The best "Don't Crash" direction
				- Blue Arrow: Ultimately where the boid decided to go
			*/
			// Draw Cohesion Decision
			ctx.beginPath()
			ctx.fillStyle = 'yellow'
			ctx.arc(cohesionX, cohesionY, this.appearance.boidSize / 4, 0, 2 * Math.PI)
			ctx.fill()
			// Set up for drawing arrows from the center of the boid
			ctx.translate(this.position.x, this.position.y)
			ctx.lineWidth = this.appearance.boidSize / 8
			// Draw Cohesion Decision
			ctx.beginPath()
			ctx.strokeStyle = 'yellow'
			ctx.moveTo(0,0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(cohesion),
				this.appearance.boidSize * Math.sin(cohesion)
			)
			ctx.stroke()
			// Draw Alignment Decision
			ctx.beginPath()
			ctx.strokeStyle = 'green'
			ctx.moveTo(0, 0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(alignment),
				this.appearance.boidSize * Math.sin(alignment))
			ctx.stroke()
			// Draw Separation Decision
			ctx.beginPath()
			ctx.strokeStyle = 'orange'
			ctx.moveTo(0,0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(separation),
				this.appearance.boidSize * Math.sin(separation))
			ctx.stroke()
			// TODO draw obstacle avoidance decision
			// Draw Final Decision
			ctx.beginPath()
			ctx.strokeStyle = 'blue'
			ctx.moveTo(0,0)
			ctx.lineTo(
				this.appearance.boidSize * Math.cos(decision),
				this.appearance.boidSize * Math.sin(decision))
			ctx.stroke()
			ctx.restore()
		}

		return decision
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
		// TODO: Draw a line between this boid and all obstacles it sees (marked with red line)

		// restore the context state to not interfere with other drawing functions
		ctx.restore()
	}
}