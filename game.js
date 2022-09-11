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
        this.offsetX = width/2 - (this.width-1)/2 * this.nodeSize;
        this.offsetY = height/2 - (this.height-1)/2 * this.nodeSize;
        this.selectedNode = null;

        this.populate();

        for (let i=0; i<randomInt(20, 60); i++) {
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

    // removeNode(x, y) {
    //     let node = this.locate(x, y);
        
    //     // Remove item from this.bars / this.magnets
    //     let array = this.bars;
    //     if (node && node.constructor.name == "Magnet") {
    //         array = this.magnets
    //     }
    //     let index = array.indexOf(node);
    //     array.splice(index, 1);

    //     // Remove node from grid
    //     this.nodes[y][x] = null;
    // }

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
        this.selectedNode = null;
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

                magDirections.push({
                    offset: offset,
                    direction: direction,
                    strength: item.getStrength(),
                });
            }
        });

        if (magDirections.length) {
            let nearDirections = [];
            let allDirections = [];

            let max = [{strength: 0}];
            magDirections.forEach(item => {
                // Find the strongest direction
                if (item.strength > max[0].strength) {
                    max = [item];
                } else if (item.strength == max[0].strength) {
                    max.push(item);
                }

                // Check if any magnets are directly horizontal / vertical
                if ([0, 2, 4, 6].indexOf(item.direction) > -1) {
                    nearDirections.push(item.direction);
                }

                allDirections.push(item.direction);
            });

            if (max.length == 1) {
                // If there is only one strongest direction
                // Set the rotation to point to that magnet
                if (option == 0) {
                    this.rotation = max[0].direction;
                } else {
                    this.targetRotation = max[0].direction;
                }
            } else {
                // If Two or more directions with equal (max) strenghs
                // Calculate an average direction

                let rotation = max.reduce((a, b) => a + b.direction, 0) / max.length;

                // Reverse direction
                if (allDirections.indexOf(rotation) === -1 && allDirections.indexOf(rotation-1) === -1 && allDirections.indexOf(rotation+1) === -1) {
                    rotation = (rotation + 4) % 8;
                }

                // If direction includes a decimal (ie half way between two directions)
                if (rotation % 1 !== 0) {
                    // Find the closest horizontal / vertical direction where there is a magnet
                    rotation = nearDirections.reduce(function(prev, curr) {
                        return (Math.abs(curr - rotation) < Math.abs(prev - rotation) ? curr : prev);
                    });
                }

                // Set rotation
                if (option == 0) {
                    this.rotation = rotation;
                } else {
                    this.targetRotation = rotation;
                }
            }
        } else {
            this.rotation = this.initialRotation;
        }
    }

    drawBar(rotation, pointerColor, bg) {
        let renderX = this.x * this.grid.nodeSize;
        let renderY = this.y * this.grid.nodeSize;
        rotation = radians(45 * rotation);

        let circleRadius = this.width/2;
        let circleYOffset = this.height/2;

        translate(renderX, renderY);
        // Debugging
        // fill(200);
        // circle(0,0, this.grid.nodeSize);
        
        fill(bg);
        rotate(rotation);
        rect(0,0, this.width, this.height, 20);


        // Draw pointer
        fill(pointerColor);
        circle(0, 0-circleYOffset+circleRadius, circleRadius);

        // Reset rotation and translation
        rotate(-rotation);
        translate(-renderX, -renderY);
    }

    draw() {
        if (this.targetRotation) {
            this.drawBar(this.targetRotation, "#f28400", "#f28400");
        }
        this.drawBar(this.rotation, 255, 0);
    }
}

class Magnet {
    constructor(grid, x, y) {
        this.grid = grid
        this.x = x;
        this.y = y;
        this.activeRadius = 30;
        this.inActiveRadius = 10;
        this.strength = 1;
        this.isActive = Boolean(randomInt(0, 1));
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
        let renderRadius = this.isActive ? this.activeRadius : this.inActiveRadius;
        let gridCenterOffset = this.grid.nodeSize/2;

        // console.log(this.grid.selectedNode)
        if (onHover(renderX + this.grid.offsetX - gridCenterOffset, renderY + this.grid.offsetY - gridCenterOffset, this.grid.nodeSize, this.grid.nodeSize)) {
            this.grid.selectedNode = this;
            renderRadius += 10;
            cursor("pointer");
        }

        this.isActive ? fill("#f28400") : fill("#cccccc");
        circle(renderX, renderY, renderRadius);
        fill(255);
        // textAlign(CENTER, CENTER);
        // text(this.getStrength(), renderX, renderY);
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
    background(255);
    cursor("auto");
    grid.draw();
}

function mouseClicked() {
    if (grid.selectedNode) {
        grid.selectedNode.isActive = grid.selectedNode.isActive ? false : true;
        grid.bars.forEach(item => {
            item.attract(0);
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}