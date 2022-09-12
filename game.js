const DEBUG = false;
const PRIMARY_COLOR = "#ff9305";
const SECONDARY_COLOR = "#ccc6be";
const BG_COLOR = "#f6f4ec";

function randomInt(min, max) {
    return Math.floor(random(min, max+1));
}

function onHover(x, y, w, h) {
    if (mouseX >= x && mouseX <= (x + w) && mouseY >= y && mouseY <= (y + h)) {
        return true;
    }
    return false;
}

class Grid {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.nodeSize = 80;
        this.nodes = [];
        this.bars = [];
        this.magnets = [];
        this.emptyNodeRadius = 10;
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedMagnet = null;
        this.maxMagCount = 0;

        this.calcOffset();
        this.populate();

        for (let i=0; i<randomInt(20, 60); i++) {
            let x = randomInt(0, this.width-1);
            let y = randomInt(0, this.height-1);
            let node = this.locate(x, y);
            if (node.constructor.name == "Bar") {
                this.setMagnet(randomInt(0, this.width-1), randomInt(0, this.height-1));
            }
        }

        document.querySelector("#magnet-count").textContent = this.maxMagCount;
    }
    
    calcOffset() {
        this.offsetX = width/2 - (this.width-1)/2 * this.nodeSize;
        this.offsetY = height/2 - (this.height-1)/2 * this.nodeSize;
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

    checkPositions() {
        this.magnets.each(item => {
            
        });
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

    deactivateMagnets() {
        this.magnets.forEach(item => {
            item.isActive = false;
        })
    }

    locate(x, y) {
        if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
            return this.nodes[y][x];
        }
        return undefined;
    }

    draw() {
        this.selectedMagnet = null;
        translate(this.offsetX, this.offsetY);

        for (let y=0; y<this.height; y++) {
            for (let x=0; x<this.width; x++) {
                this.nodes[y][x].draw();
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
        // 8 rotations: 0(North) - 7 clockwise
        this.initialRotation = randomInt(0, 7);
        this.rotation = this.initialRotation;
        this.targetRotation = null;
        this.angle = this.toAngle(this.rotation);
        this.isAttracted = false;
    }

    toAngle(angle) {
        return radians(45 * angle)
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

    attract(option=1) {
        let magDirections = [];

        let nodeList = this.getNeighbours();
        nodeList.forEach(item => {
            if (item.constructor.name === "Magnet" && item.isActive) {
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
                let strength = item.getStrength();
                if ([1, 3, 5, 7].indexOf(direction) > -1) {
                    strength -= 0.25;
                }
                magDirections.push({
                    offset: offset,
                    direction: direction,
                    strength: strength,
                });
            }
        });

        if (magDirections.length) {
            this.isAttracted = true;

            let strongestDirections = [];
            let strongestMagnets = [{strength: 0}];

            magDirections.forEach(item => {
                // Find the strongest direction
                if (item.strength > strongestMagnets[0].strength) {
                    strongestMagnets = [item];
                } else if (item.strength == strongestMagnets[0].strength) {
                    strongestMagnets.push(item);
                }
            });

            strongestMagnets.forEach(item => {
                strongestDirections.push(item.direction);
            })

            if (strongestMagnets.length == 1) {
                // If there is only one strongest direction
                // Set the rotation to point to that magnet
                if (option == 0) {
                    this.rotation = strongestMagnets[0].direction;
                } else {
                    this.targetRotation = strongestMagnets[0].direction;
                }
            } else {
                // If Two or more directions with equal (max) strenghs
                // Calculate an average direction

                let rotation = strongestMagnets.reduce((a, b) => a + b.direction, 0) / strongestMagnets.length;

                // If direction includes a decimal (ie half way between two directions)
                if (rotation % 1 !== 0) {
                    let netDirections = [];
                    strongestDirections.forEach(item => {
                        let index = netDirections.indexOf((item + 4) % 8);
                        if (index > -1) {
                            netDirections.splice(index, 1);
                        } else {
                            netDirections.push(item);
                        }
                    })
                    rotation = netDirections[0];
                }

                // Reverse direction
                if (strongestDirections.indexOf(rotation) === -1 && strongestDirections.indexOf(rotation-1) === -1 && strongestDirections.indexOf(rotation+1) === -1) {
                    rotation = (rotation + 4) % 8;
                }

                // Set rotation
                if (option == 0) {
                    this.rotation = rotation;
                } else {
                    this.targetRotation = rotation;
                }
            }

            // Shift the initial rotation if target rotation is the same as (or opposite to) the initial rotation
            if (option == 1) {
                let difference = Math.abs(this.targetRotation - this.initialRotation);
                if (this.targetRotation && (difference == 0 || difference == 4)) {
                    this.initialRotation = (this.initialRotation + 1) % 8;
                    this.rotation = this.initialRotation;
                    this.angle = this.toAngle(this.rotation);
                }
            }

        } else {
            this.isAttracted = false;
            this.rotation = this.initialRotation;
        }
    }

    drawBar(angle, pointerColor, bg) {
        let renderX = this.x * this.grid.nodeSize;
        let renderY = this.y * this.grid.nodeSize;

        let circleRadius = this.width/2;
        let circleYOffset = this.height/2;

        translate(renderX, renderY);
        rotate(angle);
        fill(bg);
        rect(0,0, this.width, this.height, 20);


        // Draw pointer
        fill(pointerColor);
        circle(0, 0-circleYOffset+circleRadius, circleRadius);

        // Reset rotation and translation
        rotate(-angle);
        translate(-renderX, -renderY);
    }

    draw() {
        // Draw target bar
        if (this.targetRotation) {
            this.drawBar(this.toAngle(this.targetRotation), SECONDARY_COLOR, SECONDARY_COLOR);
        }

        // Update angle animation
        let targetAngle = this.toAngle(this.rotation);
        let d = targetAngle - this.angle;
        this.angle = (Math.abs(d) < 0.01) ? targetAngle : this.angle + d * 0.1;

        // Draw bar
        this.drawBar(this.angle, (DEBUG && this.isAttracted) ? PRIMARY_COLOR : BG_COLOR, 0);
    }
}

class Magnet {
    constructor(grid, x, y) {
        this.grid = grid
        this.x = x;
        this.y = y;
        this.strength = 1;
        this.isActive = Boolean(randomInt(0, 1));
        this.activeRadius = 30;
        this.inActiveRadius = 10;
        this.radius = this.inActiveRadius;

        if (this.isActive) {
            this.grid.maxMagCount++;
        }
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
            if (item.constructor.name === "Magnet" && item.isActive) {
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
        let gridCenterOffset = this.grid.nodeSize/2;
        let targetRadius = this.isActive ? this.activeRadius : this.inActiveRadius;

        if (onHover(renderX + this.grid.offsetX - gridCenterOffset, renderY + this.grid.offsetY - gridCenterOffset, this.grid.nodeSize, this.grid.nodeSize)) {
            this.grid.selectedMagnet = this;
            targetRadius += 10;
            cursor("pointer");
        }

        // Update radius animation
        let d = targetRadius - this.radius;
        this.radius = (Math.abs(d) < 0.01) ? targetRadius : this.radius + d * 0.1;

        // Draw magnet
        this.isActive ? fill(PRIMARY_COLOR) : fill(SECONDARY_COLOR);
        circle(renderX, renderY, this.radius);
        fill(BG_COLOR);

        if (DEBUG) {
            textAlign(CENTER, CENTER);
            text(this.getStrength(), renderX, renderY);
        }
    }
}

// Game Loop

var grid;

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    noStroke(); 
    grid = new Grid(8, 8);
    grid.bars.forEach(item => {
        item.attract(1);
    });
    grid.deactivateMagnets();
}

function draw() {
    background(BG_COLOR);
    cursor("auto");
    grid.draw();
}

function mouseClicked() {
    // Get no. of active magnets
    let activeCount = 0;
    grid.magnets.forEach(item => {
        if (item.isActive) {
            activeCount++;
        }
    })

    if (grid.selectedMagnet) {
        if (grid.selectedMagnet.isActive) {
            grid.selectedMagnet.isActive = false;
            activeCount--;
        } else {
            if (activeCount < grid.maxMagCount) {
                grid.selectedMagnet.isActive = true;
                activeCount++;
            }
        }
        grid.bars.forEach(item => {
            item.attract(0);
        });
    }

    // Update counter text
    document.querySelector("#magnet-count").textContent = grid.maxMagCount - activeCount;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    grid.calcOffset();
}