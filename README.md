# Boids In Browser

I am fiddling with the famous 'boids' algorithm, which was [first published in 1987](https://www.red3d.com/cwr/papers/1987/boids.html) as a method to emulate the "aggregate motion of a flock of birds, a herd of land animals, or a school of fish." This method gives each "boid" independence from the flock, and each boid moves according to its local perception of an ever-changing environment. The fascinating part of this design is that with a few simple rules, a bunch of boids will flock together and move in a simple yet beautiful pattern.

#### Added caveat: I'm challenging myself.
Because I want to challenge myself a tiny bit when making this project. I haven't searched for tutorials or looked at any source code. In this project I only know what I have described below, and details from a few YouTube videos I watched to see what a good end result looks like (none of which included code or tutorials). In other words, I am going to completely implement this algorithm while having only read the abstract of the paper it is from.

## Rules of Motion: How to be a 'Boid'
There are three main rules that each boid has to follow, they are called separation, aligment, and cohesion.
### Separation
The boid doesn't want to become so crowded that it collides with other members of its flock. So they will remain distinctly apart from one another. Separation is represented by the orange line protruding from the boid, it shows where the boid would want to go given only the separation rule.

![](images/separation.png?raw=true)
### Alignment
The boid wants to move with the flock. It will steer towards the average heading of local flockmates. In other words, if all of the boids around you are moving to the left, move to the left as well. Alignment is represented by the green line, it shows where the boid would want to go given only the alignment rule.

![](images/alignment.png?raw=true)
### Cohesion
The boid wants to be as close to the center of the flock as possible. So it steers towards the average position of local flockmates. Cohesion is marked in yellow, with a dot marking the center of all visible boids, and a yellow line representing where the boid would want to go given only the cohesion rule.

![](images/cohesion.png?raw=true)
### Applying these rules
The astute observer may note that there are contradictions in these three rules, one cannot separate and be cohesive at the same time, these rules will be playing together and fighting against each other simultaneously to determine the boid's behavior. The blue line represents the final decision, a weighted average of all rules put together.

![](images/decision.png?raw=true)
#### Another rule I'm explicitly adding: Don't crash
There will be one more rule, implicit but essential. Don't hit obstacles, running into other boids may be inevitable, but we should not hit the edge of the display, or any obstacles that we encounter. 
## Boid vision: How do Boids 'see'?
Each Boid will be able to see the entire scene, but the boids algorithm requires that each boid only respond to the stimulus within a specific radius of the boid itself. Thus, in this 2D environment, the boid can only see within a circle with itself at the center. However, real birds and fish can't see directly behind itself, all animals have blind spots. So boids can only see a specific angle within the circle too. See this screenshot from early development of this repository. In it I only draw the "vision" of the boid in the center. The image shows which boids are visible by drawing a blue line between the center boid and all boids it can see. 

![](images/boidsVision.png?raw=true)

## Learning from my mistakes
Ok, so coming back to this project after a while away from it, I've come to realize why this was challenging. I was using polar coordinates for boid decision making behavior. I made this decision because the math was a little easier when dealing with the drawing libraries, which use radians for angles. The unfortunate part of this was that when taking an average of angles which are bounded from -PI to PI, they will have some regression to a mean of 0. In the drawing system I defined, this meant that the boids had a hidden bias to go right, which just through the entire algorithm off. 

There is a lesson to be learned here. Keep your logic math separate from your drawing math, and really think about how your coordinate system impacts your algorithm. Using the lines approach I demonstrate above was not the best method to use because it created bias. So, instead of taking the weighted average of some radians, I think the best way to move forward is to change separation, alignment, cohesion, and (of course) the don't crash rule, so that they resolve to a point (X,Y coordinate) on the 2 dimensional plane. Then the boid just decides to move to the average point of those three to four points. Thus, the boid should no longer decide a direction to go to, it should decide what point it should go to, and the constraints on it's movement will dictate how it arrives at that point.
