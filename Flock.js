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
			this.boids.push(
				new Boid(Math.random() * this.canvas.clientWidth,
					Math.random() * this.canvas.clientHeight,
					Math.random() * 2 * Math.PI, this.canvas.height * 0.05)
			)
		}

		this.verbosity = {
			vision: false,
			v1: true,
			decision: false,
			d1: true
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
	 * Asks each of the boids where they wish to go and then modifies each boid's direction
	 * and position to both go in the requested direction, and animate as smooth as possible.
	 */
	moveFlock() {
		const boidSpeed = 3 // move each boid 3 pixels per step
		const maxTurn = Math.PI / 10 // turn at most this many radians, makes turns smoother and slower
		let terminate = []
		for (let i = 0; i < this.size(); i++) {
			// ask each boid which way it wants to go
			let desiredDirection = this.boids[i].decideDirection(this.boids)
			// turn the boid in the desired direction
			// calculate the smallest angle between the rays cast by the desired angle and the direction
			// preserving the sign of the angle
			let turnAngle = Math.atan2(Math.sin(desiredDirection - this.boids[i].direction), Math.cos(desiredDirection - this.boids[i].direction))
			if (Math.abs(turnAngle) > maxTurn) { // enforce turning constraints for smoother animations
				turnAngle = (turnAngle > 0) ? maxTurn : - maxTurn
			}
			// apply the turn
			this.boids[i].direction += turnAngle
			// move the boid forward in the new direction
			this.boids[i].position.x += boidSpeed * Math.cos(this.boids[i].direction)
			this.boids[i].position.y += boidSpeed * Math.sin(this.boids[i].direction)

			// If the boid has moved out of the screen, kill it to save memory
			if (this.boids[i].position.x < 0 || this.boids[i].position.y < 0 
				|| this.boids[i].position.x > this.canvas.clientWidth
				|| this.boids[i].position.y > this.canvas.clientHeight) { 
				terminate.push(i) 
			}
		}
		terminate.reverse()
		for(let i = 0; i < terminate.length; i++) {
			this.boids.splice(terminate[i], 1)
		}
	}

	/**
	 * Draws the flock of boids once. Note on efficiency, if showVision and showDecision is false (or if the "once" parameters
	 * are both true), efficiency is O(n). If one is true and the other is false, efficiency is O(n^2) if the corresponding 
	 * "once" parameters are false. If both are true and their "once" parameters are false, efficiency becomes O(n^3). The 
	 * defaults are made to be the most efficient version of the function.
	 * @param {boolean} showVision Optional. Indictates if the boids should draw their vision area. Default is false
	 * @param {boolean} visionOnce Optional. If verbose is true, just show vision area for one boid in the flock. Default is true.
	 * @param {boolean} showDecision Optional, indicates if the boids should show their decision process. Default is false.
	 * @param {boolean} decisionOnce Optional, If verbose is true, just show the decision process for one boid in the flock. Default is true.
	 */
	drawFlock(showVision = false, visionOnce = true,
			showDecision = false, decisionOnce = true) {
		// clear the canvas
		this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientWidth)
		// Show boid vision if requested
		if (this.verbosity.vision) {
			if (this.verbosity.v1 && this.size() > 0) {
				this.boids[0].drawVision(this.ctx)
			} else {
				for (let i = 0; i < this.size(); i++) {
					this.boids[i].drawVision(this.ctx)
				}
			}
		}
		// show decision rules if requested
		if (this.verbosity.decision) {
			if (this.verbosity.d1 && this.size() > 0) {
				this.boids[0].drawDecision(this.ctx)
			} else {
				for (let i = 0; i < this.size(); i++) {
					this.boids[i].drawDecision(this.ctx)
				}
			}
		}
		// Draw all boids
		for (let i = 0; i < this.size(); i++) {
			this.boids[i].drawBoid(this.ctx)
		}
	}

	/**
	 * Performs one animation cycle
	 */
	step() {
		this.moveFlock()
		this.drawFlock()
	}
}