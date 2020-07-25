/**
 * Represents a vector in 2d space.
 */
class Vector {
	/**
	 * Creates a vector. If no parameter is given, the vector is set to
	 * all 0's. If values is provided it should be an array
	 * and it will provide UP TO 3 values for the vector. If there are
	 * less than 3 values, the remaining values in the array should
	 * set to 0. If there are more than 3, the rest should be ignored.
	 *
	 * To see if values was passed to the function, you can check if
	 *      typeof values !== "undefined"
	 * This will be true if values has a value.
	 *
	 * @param {number[]} values (optional) An array of floating point values.
	 *
	 */
	constructor(values) {
		this.values = [0, 0];
		if (typeof values !== "undefined") {
			// The user passed in data
			// for loop limits the amount overwitten to ignore input that is too long.
			for (let i = 0; i < this.values.length && i < values.length; i++) {
				this.values[i] = values[i];
			}
		}
	}

	/**
	 * Adds two Vectors (the current Vector and the parameter)
	 *
	 * This should not change the current vector or the parameter.
	 *
	 * @param {Vector} v Vector to add with the current vector.
	 *
	 * @return {Vector} The sum of the current vector and the parameter.
	 */
	add(v) {
		return new Vector([
			this.values[0] + v.values[0],
			this.values[1] + v.values[1]
		]);
	}

	/**
	 * Subtracts two Vectors (the current Vector and the parameter)
	 *
	 * This should not change the current vector or the parameter.
	 *
	 * @param {Vector} v Vector to subtract from the current vector.
	 *
	 * @return {Vector} The difference of the current vector and the parameter.
	 */
	subtract(v) {
		return new Vector([
			this.values[0] - v.values[0],
			this.values[1] - v.values[1]
		]);
	}

	/**
	 * Normalizes the current vector so that is has a
	 * length of 1. The result is returned as a new
	 * Matrix.
	 *
	 * This should not change the current vector.
	 *
	 * @return {Vector} A normalized vector with the same
	 * direction as the current vector.
	 */
	normalize() {
		let magnitude = this.length();
		if (magnitude !== 0) { // Prevent divide by zero error
			return new Vector([
				this.values[0] / magnitude,
				this.values[1] / magnitude
			]);
		} else {
			return new Vector(); // A vector with length zero is a vector where all points are zero.
		}
	}

	/**
	 * Gets the length (magnitude) of the current vector.
	 *
	 * @return {number} The length of the current vector.
	 */
	length() {
		// Magnitude is the pythagorean theorem
		return Math.sqrt(
			Math.pow(this.values[0], 2) +
			Math.pow(this.values[1], 2)
		);
	}

	/**
	 * Scales the current vector by amount s and returns a
	 * new Vector that is the result.
	 *
	 * This should not change the current vector.
	 *
	 * @param {number} s Amount to scale the vector.
	 *
	 * @returns {Vector} A new vector that is the result
	 * of the current vector scaled by the parameter.
	 */
	scale(s) {
		return new Vector([
			this.values[0] * s,
			this.values[1] * s
		]);
	}

	/**
	 * Limits the magnitude (length) of this vector to m and
	 * returns a new vector that is the result.
	 * 
	 * This should not change the current vector.
	 * 
	 * @param {number} m The maximum magnitude of the vector
	 * @returns {Vector} A new vector that is either identical
	 * 					to this vector, or scaled so that its
	 * 					magnitude does not exceed m.
	 */
	limit(m) {
		if (this.length() > m) {
			return this.normalize().scale(m)
		} else {
			return new Vector(this.values)
		}
	}

	/**
	 * Returns the x value of the vector.
	 *
	 * @return {number} The x value of the vector.
	 */
	getX() {
		return this.values[0];
	}

	/**
	 * Returns the y value of the vector.
	 *
	 * @return {number} The y value of the vector.
	 */
	getY() {
		return this.values[1];
	}
}

/**
 * A class which handles boid behavior, including how to draw a boid on a canvas
 * and how to independently make decisions about its movement.
 */
class Boid {
	/**
	 * Creates a Boid with default settings
	 * @param {number} x Starting X Position. Default is 0
	 * @param {number} y Starting Y Position. Default is 0
	 * @param {number} size the size of the boid. Default is 15
	 * @param {number} speed The speed in pixels of the boid, Default is 3
	 */
	constructor(startX, startY, size, speed) {
		this.size = size || 15
		// variables specifically related to their vision
		this.vision = {
			angle: Math.PI / 4,
			radius: this.size * 4
		}

		// current location and direction of the boid
		this.position = new Vector([startX || 10, startY || 10])
		this.velocity = new Vector([Math.random() * 4 - 2, Math.random() * 4 - 2]) // at least a little speed at first

		// declare some coefficients for rule strength
		// TODO: these should all get sliders in the GUI to see
		//		what the best result would be.
		this.maxImpulse = speed || 5 // the maximum speed on a rule
		this.pointImpulseCoeff = 15
		this.separationCoeff = 10 // this one determines how "clustered" the boids will be
		this.pointImpulseLimit = 100

		this.weights = {
			separation: 1,
			cohesion: 1,
			alignment: 1.4,
			avoidance: 1.7 // "Don't Crash" is the most important rule of all
		}
	}

	/**
	 * Calculates an "impulse" akin to cohesion for a single point
	 * @param {Vector} point A vector describing the point we want the boid to go to
	 * @returns {Vector} The "impulse" for that point as a vector
	 */
	pointImpulse(point) {
		let diff = point.subtract(this.position)
		let impulse = new Vector(diff.values)
		let dist = diff.length()
		if (dist < this.vision.radius / 2) {
			impulse = new Vector() // reset to 0, we are close enough to the taret
		} else if (dist <= this.pointImpulseCoeff) {
			impulse = impulse.normalize().scale(1 / (this.velocity.length() * dist / this.pointImpulseCoeff))
		} else {
			impulse = diff.normalize().scale(this.velocity.length())
		}
		return impulse.limit(this.maxImpulse)
	}

	/**
	 * Calculates the separation rule as a vector
	 * @param {array<Boid>} boids An array of all boids in the flock
	 * @returns {Vector} The separation "impulse" as a vector.
	 */
	separation(boids) {
		let sum = new Vector();
		let count = 0;

		for (let i = 0; i < boids.length; i++) {
			if (boids[i] != this && this.canSee(boids[i].position.getX(), boids[i].position.getY())) {
				// the actual distance between this and that boid
				const distance = this.distanceTo(boids[i].position.x, boids[i].position.y)
				// the desired distance between this and that boid
				const sep = this.size + boids[i].size + (25 * this.separationCoeff)
				if (sep > 0 && sep < distance) {
					let diff = this.position.subtract(boids[i].position)
					sum = sum.add(diff.normalize().scale(sep))
					count++
				}
			}
		}

		if (count > 0) {
			sum = sum.scale(1 / count).normalize().scale(this.velocity.length()).subtract(this.velocity)
		}

		return sum.limit(this.maxImpulse)
	}

	/**
	 * Calculates the alignment rule as a vector
	 * @param {array<Boid>} boids An array of all boids in the flock
	 * @returns {Vector} The alignment "impulse" as a vector.
	 */
	alignment(boids) {
		let sum = new Vector()
		let align = new Vector()
		let count = 0
		for (let i = 0; i < boids.length; i++) {
			if (boids[i] != this && this.canSee(boids[i].position.getX(), boids[i].position.getY())) {
				sum = sum.add(boids[i].velocity)
				count++
			}
		}

		if (count > 0) {
			sum = sum.scale(1 / count).normalize().scale(this.velocity.length())
			align = sum.subtract(this.velocity).limit(this.maxImpulse)
		}
		return align
	}

	/**
	 * Calculates the cohesion rule as a vector
	 * @param {array<Boid} boids An array of all boids in the flock
	 * @returns {Vector} The cohesion "impulse" as a vector
	 */
	cohesion(boids) {
		let sum = new Vector()
		let count = 0
		for (let i = 0; i < boids.length; i++) {
			if (boids[i] != this && this.canSee(boids[i].position.getX(), boids[i].position.getY())) {
				sum = sum.add(boids[i].position)
				count++
			}
		}

		if (count > 0) {
			sum.scale(1 / count)
			return this.pointImpulse(sum)
		} else {
			return sum
		}
	}

	/**
	 * Calculates an impulse to steer away from walls
	 * @param {number} width the width of the surrounding environment
	 * @param {number} height the height of the surrounding environment
	 * @returns {Vector} A vector if we need to avoid the walls, false otherwise
	 */
	wallAvoidance(width, height) {
		let x = this.position.getX()
		let y = this.position.getY()
		if (this.canSee(0, y) // left wall
			|| this.canSee(x, 0) // top wall
			|| this.canSee(width, y) // right wall
			|| this.canSee(x, height)) { // bottom wall
			// go to the center
			return this.pointImpulse(new Vector([width / 2, height / 2]))
		} else {
			// return a zero impulse
			return false
		}
	}

	/**
	 * Determines if this boid is out of the box determined by width and height
	 * @param {number} width The width of the surrounding environment
	 * @param {number} height The height of the surrounding environment
	 * @returns {boolean} true if the boid is out of the box, false otherwise
	 */
	wallCollision(width, height) {
		const x = this.position.getX()
		const y = this.position.getY()
		return (0 > x || 0 > y || x > width || y > height)
	}

	/**
	 * Applies a vector with a weight to this.velocity
	 * @param {Vector} impulse The impulse to apply
	 * @param {number} weight The weight behind the impulse (defaults to 1)
	 */
	applyImpulse(impulse, weight = 1) {
		this.velocity = this.velocity.add(impulse.scale(weight)).limit(this.maxImpulse)
	}

	/**
	 * Checks all of the rules
	 * @param {array<Boid>} boids Any array of all boids in the flock
	 * @param {number} width the width of the canvas
	 * @param {number} height the height of the canvas
	 */
	applyRules(boids, width, height) {
		// TODO: Once these functions work individually, merge them into this function
		//	so that we don't have O(n^3) behavior
		// get the rule vectors
		const sep = this.separation(boids)
		const align = this.alignment(boids)
		const coh = this.cohesion(boids)
		const avoidWalls = this.wallAvoidance(width, height)

		// apply the rule vectors to the velocity
		this.applyImpulse(sep, this.weights.separation)
		this.applyImpulse(align, this.weights.alignment)
		this.applyImpulse(coh, this.weights.cohesion)
		if (avoidWalls) { this.applyImpulse(avoidWalls, this.weights.avoidance) }
	}

	move() {
		this.position = this.position.add(this.velocity)
	}

	/**
	 * Determines the direction this boid will go based on its velocity
	 * @returns {number} An angle in radians, bounded between -Math.PI and Math.PI
	 */
	getDirection() {
		return this.angleTo(this.position.getX() + this.velocity.getX(), 
			this.position.getY() + this.velocity.getY())
	}

	/**
	 * Determines if an object is visible to this boid.
	 * @param {number} x The X-Coordinate of the object
	 * @param {number} y The Y-Coordinate of the object
	 * @returns {boolean} Boolean indicating if the x, y coordinates are visible to this boid
	 */
	canSee(x, y) {
		const direction = this.getDirection();
		// determine the distance to the coordinates
		let distance = this.distanceTo(x, y)
		// Check if the object is close enough to see.
		if (distance <= this.vision.radius) {
			// declare some constants to determine vision behavior
			// relative to the X axis to simplify the math.
			const relDirection = (direction > Math.PI) ? direction - 2 * Math.PI : direction
			const fov = Math.PI - this.vision.angle
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
		return Math.atan2(y - this.position.getY(), x - this.position.getX())
	}

	/**
	 * Finds the distance between this boid and any point
	 * @param {number} x The X coordinate of the point in interest.
	 * @param {number} y The Y coordinate of the point in interest.
	 * @returns {number} The distance between this boid and any point.
	 */
	distanceTo(x, y) {
		return Math.sqrt(Math.pow(x - this.position.getX(), 2) + Math.pow(y - this.position.getY(), 2))
	}


}