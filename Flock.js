class Flock {
	/**
	 * Generates, animates, and handles a group of Boid objects.
	 * @param {Element} canvas The Canvas Element that we are drawing on.
	 * @param {Window} window The window of the page the canvas resides in.
	 * @param {number} initialSize Optional, Initial size of the flock, default is 5.
	 */
	constructor(canvas, window, initialSize) {
		this.canvas = canvas
		this.window = window
		this.ctx = canvas.getContext('2d')
		// Increase DPI for smoother drawing
		let dpi = window.devicePixelRatio
		// get css properties to match up
		let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2)
		let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2)
		// scale the canvas for better DPI
		canvas.setAttribute('height', style_height * dpi)
		canvas.setAttribute('width', style_width * dpi)
		// TODO: add listener to change in height/width variable to adjust
		// DPI every time the canvas dimensions change (and pause?)
		// Create all the boids in this flock
		let size = initialSize || 5
		this.boids = []
		for (let i = 0; i < size; i++) {
			this.addRandomBoid()
		}
	}

	/**
	 * Returns the number of boids in the flock
	 * @returns {number} the number of boids in the flock
	 */
	size() {
		return this.boids.length
	}

	/**
	 * Adds a boid at a random location and orientation
	 */
	addRandomBoid() {
		this.boids.push(new Boid(
				Math.random() * this.canvas.width,
				Math.random() * this.canvas.height,
				this.canvas.height * 0.03
		))
	}

	/**
	 * Asks each of the boids where they wish to go and then modifies each boid's direction
	 * and position to both go in the requested direction, and animate as smooth as possible.
	 */
	moveFlock() {
		// get the boids to update their velocities
		for(let i = 0; i < this.boids.length; i++){
			this.boids[i].applyRules(this.boids, this.canvas.width, this.canvas.height)
		}
		// get the boids to update their positions
		for(let i = 0; i < this.boids.length; i++) {
			this.boids[i].move()
		}
	}

	/**
	 * Draws the flock of boids once.
	 */
	drawFlock() {
		// clear the canvas
		this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientWidth)
		// for now, draw the vision of the first boid
		if (this.boids.length > 0) {
			this.drawBoidVision(this.ctx, 0)
		}
		// draw each individual boid
		for (let i = 0; i < this.boids.length; i++) {
			this.drawBoid(this.ctx, i)
		}
	}

	/**
	 * Performs one animation cycle
	 */
	step() {
		this.moveFlock()
		this.drawFlock()
	}

	/**
	 * Draws a single boid from the boid array
	 * @param {CanvasRenderingContext2D} ctx The rendering context of the canvas that we are drawing to.
	 * @param {number} index The index of the boid from the array of boids
	 */
	drawBoid(ctx, index) {
		const boid = this.boids[index]
		// save the context state before this function was called so we can modify the context state
		ctx.save()

		// change the context to be centered and rotated around the boid
		ctx.translate(boid.position.getX(), boid.position.getY())
		ctx.rotate(boid.getDirection())

		// draw the boid as a triangle with a notch to indicate the front
		ctx.fillStyle = 'rgba(102, 153, 255, 1.0)'
		ctx.beginPath()
		ctx.moveTo(boid.size / 2, 0)
		ctx.lineTo(boid.size / 2, 0)
		ctx.lineTo(-boid.size / 3, -boid.size / 3)
		ctx.lineTo(-boid.size / 8, 0)
		ctx.lineTo(-boid.size / 3, boid.size / 3)
		ctx.lineTo(boid.size / 2, 0)
		ctx.stroke()
		ctx.fill()

		// restore the context state to not interfere with other drawing functions
		ctx.restore()
	}

	/**
	 * Draws the visible area of a single boid. Note, You should call drawBoid AFTER calling this
	 * function to see the boid on top of the vision circle.
	 * @param {CanvaseRenderingContext2D} ctx The rendering context of the canvas that we are drawing to.
	 * @param {number} index The index of the boid from the array of boids
	 */
	drawBoidVision(ctx, index) {
		const boid = this.boids[index]
		// save the context state before this function was called so we can modify the context state
		ctx.save()

		// move the context to the boid so that I don't have to worry about positioning
		ctx.translate(boid.position.getX(), boid.position.getY())
		// rotate so that 0 degrees is directly behind the boid
		ctx.rotate(boid.getDirection() - Math.PI)

		// Draw the semi-circle of vision
		ctx.beginPath()
		ctx.arc(0, 0, boid.vision.radius, boid.vision.angle, 2 * Math.PI - boid.vision.angle, false)
		ctx.lineTo(0, 0)
		ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
		ctx.fill()

		// undo transformations to draw lines using absolute locations
		ctx.restore()
		ctx.save()
	}
}