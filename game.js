function randomInt(min, max) {
    return Math.floor(random(min, max+1));
}

class Grid {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.nodeSize = 80;
        this.nodes = [];
        this.bars = [];
        this.magnets = [];

        this.populate();

        for (let i=0; i<randomInt(1, 5); i++) {
            this.setMagnet(randomInt(0, this.width-1), randomInt(0, this.height-1));
        }

        // this.setMagnet(1,2);
        // this.setMagnet(2,2);
        // this.setMagnet(3,2);
        // this.setMagnet(2,4);

        // this.setMagnet(2,3);
        // this.setMagnet(3,2);
    }
    
    populate() {
        for (let y=0; y<this.height; y++) {
            this.nodes.push([]);
            for (let x=0; x<this.width; x++) {
                let bar = new Bar(this, x, y);
                this.nodes[y][x] = bar;
                this.bars.push(bar);
            }  
        }
    }

    setMagnet(x, y) {
        if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
            let magnet = new Magnet(this, x, y);
            this.nodes[y][x] = magnet;
            this.magnets.push(magnet);
            return magnet;
        }
        return undefined;
    }

    locate(x, y) {
        if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
            return this.nodes[y][x];
        }
        return undefined;
    }

    draw() {
        translate(width/2 - (this.width-1)/2 * this.nodeSize, height/2 - (this.height-1)/2 * this.nodeSize);
        for (let y=0; y<this.height; y++) {
            for (let x=0; x<this.width; x++) {
                if (this.nodes[y][x] === 0) {
                    circle(x * this.nodeSize, y * this.nodeSize, 10);
                } else {
                    this.nodes[y][x].draw();
                }
            }  
        }
    }
}

class Bar {
    constructor(grid, x, y) {
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 60;
        this.isAttracted = false;
        // 8 rotations: 0(North) - 7 clockwise
        this.rotation = 0;
        this.targetRotation = null;
    }

    getNeighbours() {
        let nodeList = [];
        let relativePositions = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
        relativePositions.forEach(pos => {
            let absolutePosition = [this.x + pos[0], this.y + pos[1]];
            let node = this.grid.locate(...absolutePosition);
            if (node) {
                nodeList.push(node);
            }
        });
        return nodeList;
    }

    attract() {
        // let rotation = 0;
        // let magnetCount = 0;
        let magDirections = [];

        let nodeList = this.getNeighbours();
        nodeList.forEach(item => {
            if (item.constructor.name === "Magnet") {
                let offset = [item.x - this.x, item.y - this.y];
                let direction;
                switch(JSON.stringify(offset)) {
                    case "[0,-1]":
                        direction = 0;
                        break;
                    case "[1,-1]":
                        direction = 1;
                        break;
                    case "[1,0]":
                        direction = 2;
                        break;
                    case "[1,1]":
                        direction = 3;
                        break;
                    case "[0,1]":
                        direction = 4;
                        break;
                    case "[-1,1]":
                        direction = 5;
                        break;
                    case "[-1,0]":
                        direction = 6;
                        break;
                    case "[-1,-1]":
                        direction = 7;
                        break;
                }
                magDirections.push({
                    offset: offset,
                    direction: direction,
                    strength: item.getStrength(),
                });
            }
        });

        if (magDirections.length) {
            // Find the strongest direction

            let nearDirections = [];

            let allDirections = [];

            let max = [{strength: 0}];
            magDirections.forEach(item => {
                if (item.strength > max[0].strength) {
                    max = [item];
                } else if (item.strength == max[0].strength) {
                    max.push(item);
                }

                if ([0, 2, 4, 6].indexOf(item.direction) > -1) {
                    nearDirections.push(item.direction);
                }
                allDirections.push(item.direction);
            });

            if (max.length == 1) {
                this.rotation = max[0].direction;
            } else { // Two or more directions with equal (max) strenghs
                let totalRotation = max.reduce((a, b) => a + b.direction, 0) / max.length;
                // console.log(totalRotation)

                if (allDirections.indexOf(totalRotation) === -1 && allDirections.indexOf(totalRotation-1) === -1 && allDirections.indexOf(totalRotation+1) === -1) {
                    totalRotation = (totalRotation + 4) % 8;
                }

                if (totalRotation % 1 !== 0) {
                    // let nearDirections = [0, 2, 4, 6].filter(v => magDirections.includes(v));
                    totalRotation = nearDirections.reduce(function(prev, curr) {
                        return (Math.abs(curr - totalRotation) < Math.abs(prev - totalRotation) ? curr : prev);
                    });
                }
                this.rotation = totalRotation;
            }
            this.isAttracted = true;
        }



        /*if (magnetCount) {
            let totalRotation = rotation / magnetCount;

            // if (magDirections.indexOf(totalRotation) === -1 && magDirections.indexOf(totalRotation-1) === -1 && magDirections.indexOf(totalRotation+1) === -1) {
            //     totalRotation = (totalRotation + 4) % 8;
            // }

            if (totalRotation % 1 !== 0) {
                let nearDirections = [0, 2, 4, 6].filter(v => magDirections.includes(v));
                totalRotation = nearDirections.reduce(function(prev, curr) {
                    return (Math.abs(curr - totalRotation) < Math.abs(prev - totalRotation) ? curr : prev);
                });
            }
            this.rotation = totalRotation;
            this.isAttracted = true;
        }*/
    }

    setRotation(n) {
        // 8 possible options for n (0 - 7)
        this.rotation = n % 8;
    }

    draw() {
        let renderX = this.x * this.grid.nodeSize;
        let renderY = this.y * this.grid.nodeSize;
        let rotation = radians(45 * this.rotation);

        let circleRadius = this.width/2;
        let circleYOffset = this.height/2;

        translate(renderX, renderY);
        // circle(0,0, this.grid.nodeSize);
        rotate(rotation);
        fill(0);
        rect(0,0, this.width, this.height, 20);
        if (this.isAttracted) {
            fill("#f28400")
        } else {
            fill(255);
        }
        circle(0, 0-circleYOffset+circleRadius, circleRadius);
        // Reset rotation and translation
        rotate(-rotation);
        translate(-renderX, -renderY);
    }
}

class Magnet {
    constructor(grid, x, y) {
        this.grid = grid
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.strength = 1;
    }

    getNeighbours() {
        let nodeList = [];
        let relativePositions = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
        relativePositions.forEach(pos => {
            let absolutePosition = [this.x + pos[0], this.y + pos[1]];
            let node = this.grid.locate(...absolutePosition);
            if (node) {
                nodeList.push(node);
            }
        });
        return nodeList;
    }

    getStrength() {
        let strength = this.strength;
        let nodeList = this.getNeighbours();
        nodeList.forEach(item => {
            if (item.constructor.name === "Magnet") {
                // Only combine strenth if they are vertical / horizontal neighbours
                if (Math.abs((item.x - this.x)) + Math.abs((item.y - this.y)) == 1) {
                    strength += item.strength;
                }
            }
        });
        return strength;
    }

    draw() {
        let renderX = this.x * this.grid.nodeSize;
        let renderY = this.y * this.grid.nodeSize;
        fill("#f28400");
        circle(renderX, renderY, this.radius);
        fill(255);
        textAlign(CENTER, CENTER);
        text(this.getStrength(), renderX, renderY);
    }
}

// Game Loop

var grid;

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    noStroke(); 
    grid = new Grid(5, 5);
    grid.bars.forEach(function(item) {
        item.attract();
    })
}

function draw() {
    background(255);
    grid.draw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}