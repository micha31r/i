const DEBUG = false;
const PRIMARY_COLOR = "#0841ff";
const SECONDARY_COLOR = "#a5bde8";
const BG_COLOR = "#f0f6ff";
const ANIMATION_SPEED = 8;
const MARGIN = 100;

function randomInt(min, max) {
    return Math.floor(random(min, max+1));
}

function onHover(x, y, w, h) {
    if (mouseX >= x && mouseX <= (x + w) && mouseY >= y && mouseY <= (y + h)) {
        return true;
    }
    return false;
}

class Game {
    constructor() {
        this.state = -1;

        let hCells = 9;
        if (windowWidth < 450) { hCells = 5; } else
        if (windowWidth < 600) { hCells = 6; }

        this.grid = new Grid(this, hCells, 9);
        this.grid.bars.forEach(item => {
            item.attract(1);
        });
        this.grid.deactivateMagnets();
        this.resize();

        this.initialTimerValue = this.grid.width * this.grid.height;
        this.timer = this.initialTimerValue;

        this.maxPreTimerValue = 5;
        this.preTimer = 0;

        this.coolDownTimer = 6;
    }

    getDt() {
        let dt = 1/frameRate();
        return isFinite(dt) ? dt : 0;
    }

    updateTimer() {
        let timerWidth;
        let elem = document.querySelector("#timer");
        let dt = this.getDt();
        if (this.state == -1) {
            this.preTimer += dt;
            timerWidth = this.preTimer / this.maxPreTimerValue * 100 + "%";
            if (this.preTimer >= this.maxPreTimerValue) {
                timerWidth = "100%";
                this.state = 0;
                elem.style.background = PRIMARY_COLOR;
            }

        } else if (this.state == 0) {
            this.timer -= dt;
            timerWidth = (this.timer > 0) ? this.timer / this.initialTimerValue * 100 + "%" : 0;
        
        } else if (this.state == 1) {
            this.coolDownTimer -= dt;
            if (this.coolDownTimer < 0){
                cursor("pointer");
                document.querySelector("#restart-instruction").style.opacity = 1;
            };
        }
        elem.style.width = timerWidth;
    }

    mouseClickCallback() {
        switch (this.state) {
        case 0:
            // Get no. of active magnets
            let activeCount = 0;
            this.grid.magnets.forEach(item => {
                if (item.isActive) {
                    activeCount++;
                }
            })

            if (this.grid.selectedMagnet) {
                if (this.grid.selectedMagnet.isActive) {
                    this.grid.selectedMagnet.isActive = false;
                    activeCount--;
                } else {
                    if (activeCount < this.grid.maxMagCount) {
                        this.grid.selectedMagnet.isActive = true;
                        activeCount++;
                    }
                }
                mouseX = 0;
                mouseY = 0;
                this.grid.bars.forEach(item => {
                    item.attract(0);
                });
                this.grid.checkWinState();
            }

            // Update counter text
            document.querySelector("#magnet-count").textContent = this.grid.maxMagCount - activeCount;
            break;
        }
    }

    resize() {
        this.grid.calcScale();
        this.grid.calcOffset();
    }

    draw() {
        this.grid.draw();
    }
}

class Grid {
    constructor(game, w, h) {
        this.game = game;
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
        this.scale = 1;
        this.targetScale = this.scale;

        this.populate();

        // Make ~50% of all nodes magnets
        while (this.magnets.length < this.width * this.height * 0.5) {
            let x = randomInt(0, this.width-1);
            let y = randomInt(0, this.height-1);
            let node = this.nodes[y][x];

            if (node.constructor.name == "Bar") {
                this.bars.splice(this.bars.indexOf(node), 1);
                this.setMagnet(x, y);
            }
        }

        if (!this.maxMagCount) {
            this.magnets[0].isActive = true;
            this.maxMagCount++;
        }

        document.querySelector("#magnet-count").textContent = this.maxMagCount;
    }
    
    calcOffset() {
        let absoluteWidth = (this.width-1) * this.nodeSize * this.scale;
        let absoluteHeight = (this.height-1) * this.nodeSize * this.scale;
        this.offsetX = width/2 - absoluteWidth/2;
        this.offsetY = height/2 - absoluteHeight/2;
    }

    calcScale() {
        let absoluteWidth = this.width * this.nodeSize * this.scale;
        let absoluteHeight = this.height * this.nodeSize * this.scale;
        let hRatio = (windowWidth - MARGIN) / absoluteWidth;
        let vRatio = (windowHeight - MARGIN) / absoluteHeight;

        this.scale *= Math.min(hRatio, vRatio);
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

    checkAlignment() {
        let aligned = [];
        let complete = true;
        this.bars.some(item => {
            if (item.targetRotation) {
                if (item.targetRotation == item.rotation) {
                    aligned.push(item);
                } else {
                    // Break if at least one bar is misaligned
                    complete = false;
                    return true;
                }
            }
        });
        return complete ? aligned : false;
    }

    checkWinState() {
        let bars = this.checkAlignment();
        if (typeof(bars) === "object") {
            this.game.state = 1;
            setTimeout(() => {
                document.querySelector("#pop-up").style.opacity = 1;
                document.querySelector("#pop-up #message span").textContent = (this.game.timer > 0 ? "Great Job!" : "Too Slow!") + " " + (this.game.initialTimerValue - this.game.timer).toFixed(2) + "s";
            }, 3000);
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

    allRotationComplete() {
        let complete = true;
        this.bars.some(item => {
            if (item.isRotating) {
                complete = false;
                return true;
            }
        });
        return complete;
    }

    draw() {
        this.selectedMagnet = null;

        translate(this.offsetX , this.offsetY);
        scale(this.scale);

        for (let y=0; y<this.height; y++) {
            for (let x=0; x<this.width; x++) {
                let node = this.nodes[y][x];
                if (this.game.state == 1 && node.constructor.name == "Bar" && node.targetRotation) {
                    if (this.allRotationComplete()) {
                        node.popAnimation(1.2);
                    }
                }
                node.draw();
            }  
        }

        scale(1/this.scale);
    }
}

class Bar {
    constructor(grid, x, y) {
        this.game = grid.game;
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
        this.isRotating = false;
        this.isAttracted = false;
        this.scale = 1;
        // 0 = forward, 1 = backward
        this.popAnimationDirection = 0;
    }

    popAnimation(maxScale) {
        let targetScale = this.popAnimationDirection == 0 ? maxScale : 1;
        let d = targetScale - this.scale;
        if (Math.abs(d) < 0.01) {
            this.scale = targetScale;
            this.popAnimationDirection = 1;
        } else {
            this.scale += d * this.game.getDt() * ANIMATION_SPEED;
        }
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
        scale(this.scale);
        fill(bg);
        rect(0,0, this.width, this.height, 20);


        // Draw pointer
        fill(pointerColor);
        circle(0, 0-circleYOffset+circleRadius, circleRadius);

        // Reset rotation and translation
        scale(1 / this.scale);
        rotate(-angle);
        translate(-renderX, -renderY);
    }

    draw() {
        // Draw target bar
        if (this.targetRotation) {
            strokeWeight(2);
            stroke(PRIMARY_COLOR);
            this.drawBar(this.toAngle(this.targetRotation), BG_COLOR, BG_COLOR);
            strokeWeight(0)
        }

        // Update angle animation
        let targetAngle = this.toAngle(this.rotation);
        let d = targetAngle - this.angle;
        if (Math.abs(d) < 0.01) {
            this.angle = targetAngle;
            this.isRotating = false;
        } else {
            this.angle += d * this.game.getDt() * ANIMATION_SPEED;
            this.isRotating = true;
        }

        // Draw bar
        this.drawBar(this.angle, (DEBUG && this.isAttracted) ? PRIMARY_COLOR : BG_COLOR, 0);
    }
}

class Magnet {
    constructor(grid, x, y) {
        this.game = grid.game;
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.strength = 1;
        this.isActive = Boolean(randomInt(0, 1));
        this.activeRadius = 30;
        this.inActiveRadius = 0;
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

        if (this.game.state == 0 && onHover(
            renderX * this.grid.scale + this.grid.offsetX - gridCenterOffset,
            renderY * this.grid.scale + this.grid.offsetY - gridCenterOffset,
            this.grid.nodeSize * this.grid.scale,
            this.grid.nodeSize * this.grid.scale
        )) {
            this.grid.selectedMagnet = this;
            targetRadius += targetRadius * 0.3 || 20;
        }

        // Update radius animation
        let d = targetRadius - this.radius;
        this.radius = (Math.abs(d) < 0.01) ? targetRadius : this.radius + d * this.game.getDt() * ANIMATION_SPEED;

        // Draw magnet
        if (this.radius > 0) fill(PRIMARY_COLOR);
        circle(renderX, renderY, this.radius);

        if (DEBUG) {
            textAlign(CENTER, CENTER);
            text(this.getStrength(), renderX, renderY);
        }
    }
}

function reset() {
    document.querySelector("#pop-up").style.opacity = 0;
    document.querySelector("#restart-instruction").style.opacity = 0;
    document.querySelector("#timer").style.background = "#000";
    setTimeout(function() {
        game = new Game();
    }, 500);
}

// Game Loop

var game;

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    cursor("pointer");
    game = new Game();
}

function draw() {
    noStroke();
    background(BG_COLOR);
    game.draw();
    game.updateTimer();
}

function touchEnded(event) {
    game.mouseClickCallback();
    
    if (game.coolDownTimer < 0) {
        reset();
    };

    // If clicked on logo
    let target = document.querySelector(".logo");
    if (event.srcElement == target || event.srcElement.parentNode == target) {
        reset();
    }

    // return false -> preventDefault()
    return false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    game.resize();
}