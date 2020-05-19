# Boids In Browser

I am fiddling with the famous 'boids' algorithm, which was [first published in 1987](https://www.red3d.com/cwr/papers/1987/boids.html) as a method to emulate the "aggregate motion of a flock of birds, a herd of land animals, or a school of fish." This method gives each "boid" independence from the flock, and each boid moves according to its local perception of an ever-changing environment. The fascinating part of this design is that with a few simple rules, a bunch of boids will flock together and move in a simple yet beautiful pattern.

## Rules of Motion: How to be a 'Boid'
There are three main rules that each boid has to follow, they are called separation, aligment, and cohesion.
### Separation
The boid doesn't want to become so crowded that it collides with other members of its flock. So they will remain distinctly apart from one another.
### Alignment
The boid wants to move with the flock. It will stee towards the average heading of local flockmates. In other words, if all of the boids around you are moving to the left, move to the left as well.
### Cohesion
The boid wants to be as close to the center of the flock as possible. So it steers towards the average position of local flockmates.
### Applying these rules
The astute observer may note that there are contradictions in these three rules, one cannot separate and be cohesive at the same time, these rules will be playing together and fighting against each other simultaneously to determine the boid's behavior.
#### Another rule I'm explicitly adding: Don't crash
There will be one more rule, implicit but essential. Don't hit obstacles, running into other boids may be inevitable, but we should not hit the edge of the display, or any obstacles that we encounter. 
## Boid vision: How do Boids 'see'?
Each Boid will be able to see the entire scene, but the boids algorithm requires that each boid only respond to the stimulus within a specific radius of the boid itself. Thus, in this 2D environment, the boid can only see within a circle with itself at the center. However, real birds and fish can't see directly behind itself, all animals have blind spots. So boids can only see a specific angle within the circle too. See this screenshot from early development of this repository. In it I only draw the "vision" of the boid in the center. The image shows which boids are visible by drawing a blue line between the center boid and all boids it can see. 

![](images/boidsVision.png?raw=true)
