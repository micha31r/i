class Grid {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.nodeSize = 80;
        this.nodes = [];

        this.populate();
    }
    
    populate() {
        for (let y=0; y<this.height; y++) {
            this.nodes.push([]);
            for (let x=0; x<this.width; x++) {
                this.nodes[y][x] = new Bar(this, x, y);
            }  
        }
    }

    locate(x, y) {
        if ((0 <= x && x < this.width-1) && (0 <= y && y < this.height-1)) {
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
        // 8 rotations: 0(North) - 7 clockwise
        this.rotation = 0;
    }

    getNeighbours() {
        let nodeList = [];
        let relativePositions = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,-1],[-1,0],[-1,-1]];
        relativePositions.forEach(function(item) {
            let absolutePosition = [this.x + item[0], this.y + item[1]];
            let node = this.grid.locate(...absolutePosition);
            if (node) {
                nodeList.push(node);
            }
        });
        return nodeList;
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
        rect(0,0, this.width, this.height);
        fill(255);
        circle(0, 0-circleYOffset+circleRadius, circleRadius);
        // Reset rotation and translation
        rotate(-rotation);
        translate(-renderX, -renderY);
    }
}

// Game Loop

var grid;

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    grid = new Grid(5, 5);
}

function draw() {
    background(255);
    grid.draw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}