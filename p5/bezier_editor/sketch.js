class Shape {
	static LAST_COLOR_HUE = 0;

	constructor() {
		this.points = [];
		Shape.LAST_COLOR_HUE = (Shape.LAST_COLOR_HUE + 23) % 360;
		this.color = Shape.LAST_COLOR_HUE;
	}

	addPoint(x, y, h1x, h1y, h2x, h2y, type) {
		this.points.push(new Point(x, y, h1x, h1y, h2x, h2y, type));
	}
	removePoint(point) {
		if (this.points.indexOf(point) !== -1) {
			this.points.splice(this.points.indexOf(point), 1);
		}
	}

	draw() {
		noStroke();
		colorMode(HSB);
		fill(this.color, 150, 255, 0.5)
		this.smooth();
		colorMode(RGB)
		let m = mousePos();
		let closestEdgePoint = this.closestEdgePoint(20, m);
		if (closestEdgePoint) {
			let { p } = closestEdgePoint;
			// stroke(255, 128, 0)
			// strokeWeight(5)
			// line(p.x, p.y + 10, p.x, p.y - 10)
			// line(p.x + 10, p.y, p.x - 10, p.y)
			cursor(CROSS)
		}
		this.points.forEach(p => p.draw())

	}

	mousePressedPre() {
		this.points.forEach(p => p.mousePressed());
	}

	mousePressed() {
		if (DraggableHandle.numPointsDragged === 0) {
			let m = mousePos();
			let closestEdgePoint = this.closestEdgePoint(20, m);
			if (closestEdgePoint) {
				let { p, index, dir } = closestEdgePoint;
				let s = 100;
				let np = new Point(p.x, p.y, -dir.x * s, -dir.y * s, dir.x * s, dir.y * s);
				this.points.splice(index + 1, 0, np);
			}
		}
	}
	mouseReleased() {
		this.points.forEach(p => p.mouseReleased());
	}

	outlinePoints(res) {
		let points = []
		for (let i = 0; i < this.points.length; i++) {
			let c = this.points[i];
			let n = this.points[(i + 1) % this.points.length];

			for (let j = 0; j < res; j++) {
				let t = j / res;
				let p = Shape.calculateCubicBezier(t, c.point.vec(), c.handle2.vec(), n.handle1.vec(), n.point.vec());
				points.push(p);
			}
		}
		return points;
	}

	lowPoly(res) {
		beginShape();
		this.outlinePoints(res).forEach(p => vertex(p.x, p.y));
		endShape(CLOSE);
	}

	smooth() {
		beginShape();
		vertex(this.points[0].point.x, this.points[0].point.y);
		for (let i = 1; i <= this.points.length; i++) {
			let c = this.points[i % this.points.length].point;
			let n = this.points[i % this.points.length].handle1;
			let p = this.points[i - 1].handle2;
			bezierVertex(p.x, p.y, n.x, n.y, c.x, c.y);
		}
		endShape(CLOSE);
	}

	closestEdgePoint(res, m) {
		let points = this.outlinePoints(res);
		for (let i = 0; i < points.length; i++) {
			let c = points[i];
			let n = points[(i + 1) % points.length];
			let d = distToSegmentSquared(m, c, n);
			if (d.d < 200 && d.t > 0 && d.t < 1) {
				let p = p5.Vector.lerp(c, n, d.t);
				let index = floor(i / res)
				return { p, index, dir: p5.Vector.sub(n, c).normalize() }
			}
		}
		return null;
	}

	static calculateCubicBezier(t, p0, p1, p2, p3) {
		let p01 = p5.Vector.lerp(p0, p1, t);
		let p12 = p5.Vector.lerp(p1, p2, t);
		let p23 = p5.Vector.lerp(p2, p3, t);
		let p012 = p5.Vector.lerp(p01, p12, t);
		let p123 = p5.Vector.lerp(p12, p23, t);
		let p0123 = p5.Vector.lerp(p012, p123, t);
		return p0123;
	}

	compress() {
		const output = [this.points[0].point.x, this.points[0].point.y];
		for (let i = 1; i <= this.points.length; i++) {
			let c = this.points[i % this.points.length].point;
			let n = this.points[i % this.points.length].handle1;
			let p = this.points[i - 1].handle2;
			output.push(p.x, p.y, n.x, n.y, c.x, c.y);
		}
		return output;
	}
}

class Point {
	static selectedPoint = null;
	static pointTypes = ["sym", "sym_ang", "none"];

	constructor(x, y, h1x, h1y, h2x, h2y, type) {
		this.point = new DraggableHandle(x, y)
		this.handle1 = new DraggableHandle(h1x, h1y, this.point)
		this.handle2 = new DraggableHandle(h2x, h2y, this.point)
		this.type = type || "sym";
	}

	draw() {
		stroke(50, 180, 255);
		strokeWeight(3);
		line(this.point.x, this.point.y, this.handle1.x, this.handle1.y)
		line(this.point.x, this.point.y, this.handle2.x, this.handle2.y)

		this.point.draw();
		this.handle1.draw();
		this.handle2.draw();

		stroke(0);
		strokeWeight(1);
		if (this.type === "sym") {
			line(this.point.x + 8, this.point.y, this.point.x - 8, this.point.y)
			ellipse(this.point.x, this.point.y, 4, 4)
		}
		if (this.type === "sym_ang") {
			line(this.point.x + 2, this.point.y + 7, this.point.x - 2, this.point.y - 7)
			ellipse(this.point.x + 1, this.point.y + 3, 4, 4)
		}
		if (this.type === "none") {
			line(this.point.x - 5, this.point.y, this.point.x + 5, this.point.y - 3)
			line(this.point.x - 5, this.point.y, this.point.x + 2, this.point.y + 4)
			ellipse(this.point.x - 5, this.point.y, 4, 4)
		}

		if (this.type === "sym") {
			if (this.handle1.dragging) {
				this.handle2.setPos(
					this.point.x - (this.handle1.x - this.point.x),
					this.point.y - (this.handle1.y - this.point.y),
				)
			}
			if (this.handle2.dragging) {
				this.handle1.setPos(
					this.point.x - (this.handle2.x - this.point.x),
					this.point.y - (this.handle2.y - this.point.y),
				)
			}
		}
		if (this.type === "sym_ang") {
			if (this.handle1.dragging) {
				let d1 = dist(this.point.x, this.point.y, this.handle1.x, this.handle1.y);
				let d2 = dist(this.point.x, this.point.y, this.handle2.x, this.handle2.y);
				this.handle2.setPos(
					this.point.x - (this.handle1.x - this.point.x) / d1 * d2,
					this.point.y - (this.handle1.y - this.point.y) / d1 * d2,
				)
			}
			if (this.handle2.dragging) {
				let d1 = dist(this.point.x, this.point.y, this.handle1.x, this.handle1.y);
				let d2 = dist(this.point.x, this.point.y, this.handle2.x, this.handle2.y);
				this.handle1.setPos(
					this.point.x - (this.handle2.x - this.point.x) / d2 * d1,
					this.point.y - (this.handle2.y - this.point.y) / d2 * d1,
				)
			}
		}
	}

	mousePressed() {
		this.point.mousePressed()
		this.handle1.mousePressed()
		this.handle2.mousePressed()
		if (this.point.dragging) {
			Point.selectedPoint = this;
		}
	}

	mouseReleased() {
		this.point.mouseReleased()
		this.handle1.mouseReleased()
		this.handle2.mouseReleased()
	}
}

class DraggableHandle {
	static numPointsDragged = 0;

	constructor(x, y, base) {
		this.r = 10;
		this.base = base
		this.offsetX = x
		this.offsetY = y
		if (base) {
			this.x = this.base.x + x;
			this.y = this.base.y + y;
		} else {
			this.x = x;
			this.y = y;
		}
		this.dragging = false;
	}

	draw() {
		if (this.dragging) {
			this.setPos(mousePos().x, mousePos().y);
		} else {
			if (this.base) {
				this.x = this.base.x + this.offsetX;
				this.y = this.base.y + this.offsetY;
			}
		}
		noStroke()
		let col = this.dragging ? color(100, 200, 255) : color(50, 180, 255);
		if (Point.selectedPoint && this === Point.selectedPoint.point) {
			col = color(0, 255, 50);
		}
		fill(col);
		ellipse(this.x, this.y, this.r * 2 * (this.dragging ? 1.3 : 1));
		if (dist(this.x, this.y, mousePos().x, mousePos().y) < this.r && DraggableHandle.numPointsDragged == 0) {
			cursor(HAND)
		}
	}

	setPos(x, y) {
		this.x = x;
		this.y = y;
		if (this.base) {
			this.offsetX = this.x - this.base.x;
			this.offsetY = this.y - this.base.y;
		} else {
			this.offsetX = this.x;
			this.offsetY = this.y;
		}
	}

	mousePressed() {
		if (dist(this.x, this.y, mousePos().x, mousePos().y) < this.r && DraggableHandle.numPointsDragged == 0) {
			this.dragging = true;
			DraggableHandle.numPointsDragged++;
		}
	}

	mouseReleased() {
		this.dragging = false;
		DraggableHandle.numPointsDragged = 0;
	}

	vec() {
		return createVector(this.x, this.y);
	}
}


const shapes = [];

function setup() {
	canvas = createCanvas(600, 600);
	document.getElementById("canvas-container").appendChild(canvas.elt);
	background(0);

	if (localStorage.getItem("shapes")) {
		shapes.push(...shapesFromString(localStorage.getItem("shapes")));
	}
}

function mousePos() {
	return createVector(mouseX - width / 2, mouseY - height / 2);
}

function draw() {
	cursor(ARROW)
	background("#282C34");
	translate(width / 2, height / 2);
	shapes.forEach(s => s.draw())
	localStorage.setItem("shapes", shapesToString());
	document.getElementById("code").innerText = `${JSON.stringify(shapes.map(s => s.compress()), null, 2)}`;
}

function mousePressed() {
	shapes.forEach(s => s.mousePressedPre())
	shapes.forEach(s => s.mousePressed())
}
function mouseReleased() {
	shapes.forEach(s => s.mouseReleased())
}

function keyPressed() {
	if (Point.selectedPoint) {
		if (key === "Backspace") {
			shapes.forEach(s => s.removePoint(Point.selectedPoint))
			for (let i = shapes.length - 1; i >= 0; i--) {
				if (shapes[i].points.length < 1) {
					shapes.splice(i, 1);
				}
			}
			Point.selectedPoint = null;
		}
		if (key === "s") {
			Point.selectedPoint.type = Point.pointTypes[(Point.pointTypes.indexOf(Point.selectedPoint.type) + 1) % Point.pointTypes.length];
		}
		if (key === "Escape") {
			Point.selectedPoint = null;
		}
	}
	if (key === "n") {
		let shape = new Shape();
		shape.addPoint(0, -50, 100, 0, -100, 0);
		shape.addPoint(-50, 25, -60, -80, 60, 80);
		shape.addPoint(50, 25, -60, 80, 60, -80);
		shapes.push(shape);
	}
	if (key === "Delete") {
		if (confirm("Are you sure you want to clear the canvas?")) {
			shapes.splice(0, shapes.length);
			Point.selectedPoint = null;
			DraggableHandle.numPointsDragged = 0;
		}
	}
}

function renderShape(data, sketch) {
	if (!sketch) sketch = window
	sketch.beginShape();
	sketch.vertex(data[0], data[1]);
	for (let i = 2; i < data.length; i += 6) {
		sketch.bezierVertex(data[i], data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5]);
	}
	sketch.endShape(CLOSE);
}

new p5(exampleRender)

function exampleRender(sketch) {
	sketch.setup = () => {
		canvas = sketch.createCanvas(600, 600);
		document.getElementById("canvas-container").appendChild(canvas.elt);
	}
	sketch.draw = () => {
		sketch.background(40, 44, 52);
		sketch.translate(sketch.width / 2, sketch.height / 2);
		sketch.strokeWeight(2);
		sketch.noFill()
		sketch.stroke("#ABB2BF");
		shapes.forEach(s => renderShape(s.compress(), sketch))
	}
}


function shapesToString() {
	return JSON.stringify({
		shapes: shapes.map(s => ({
			points: s.points.map(p => ({
				point: {
					x: p.point.x,
					y: p.point.y,
				},
				handle1: {
					xoff: p.handle1.offsetX,
					yoff: p.handle1.offsetY,
				},
				handle2: {
					xoff: p.handle2.offsetX,
					yoff: p.handle2.offsetY,
				},
				type: p.type,
			}))
		}))
	})
}

function shapesFromString(string) {
	let data = JSON.parse(string)
	let shapes = data.shapes.map(s => {
		let shape = new Shape();
		s.points.forEach(p => {
			shape.addPoint(p.point.x, p.point.y, p.handle1.xoff, p.handle1.yoff, p.handle2.xoff, p.handle2.yoff, p.type)
		})
		return shape;
	});
	return shapes
}

// This code is from https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
	var l2 = dist2(v, w);
	if (l2 == 0) return dist2(p, v);
	var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	t = Math.max(0, Math.min(1, t));
	return {
		d: dist2(p, {
			x: v.x + t * (w.x - v.x),
			y: v.y + t * (w.y - v.y)
		}),
		t: t,
	};
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w).d); }