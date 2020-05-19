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
            startAngle: Math.PI / 4,
            endAngle: 7 * Math.PI / 4,
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
        for(let i = 0; i < boids.length; i++) {
            if (boids[i] == this) {
                continue // Skip the math and don't compare this to itself
            }
            // calculate the distance between this and that boid
            let distance = Math.abs(Math.sqrt(
                Math.pow(boids[i].position.x - this.position.x, 2) 
                + Math.pow(boids[i].position.y - this.position.y, 2)))
            // calculate the angle between the line drawn by these two points
            // and the horizontal axis (in radians)
            let angle = Math.abs(Math.atan2(boids[i].position.y - this.position.y, boids[i].position.x - this.position.x) - Math.PI)
            if (distance < this.vision.radius // the boid is close enough to see
                && angle >= this.vision.startAngle && angle <= this.vision.endAngle) { // and is within the field of view
                    this.vision.neighboringBoids.push(boids[i])
            }
        }
        return this.vision.neighboringBoids
    }

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
        ctx.lineTo(-this.appearance.boidSize / 3, - this.appearance.boidSize / 3)
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
        ctx.arc(0, 0, this.vision.radius, this.vision.startAngle, this.vision.endAngle, false)
        ctx.lineTo(0, 0)
        ctx.fillStyle = this.appearance.visionColor
        ctx.fill()

        // undo transformations to draw lines using absolute locations
        ctx.restore()
        ctx.save()

        // Draw a line between this boid and all boids it sees (marked with blue line)
        ctx.strokeStyle = this.appearance.boidColor
        for(let i = 0; i < this.vision.neighboringBoids.length; i++) {
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