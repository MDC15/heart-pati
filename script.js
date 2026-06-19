let ps, stars = [], lastToggleTime = 0;
let bgImg = null; // background upload

class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.target = this.pos.copy();
        this.reset();
    }

    reset() {
        this.size = random(8, 16);
        this.petals = int(random(4, 8));
        this.petalShape = random(["ellipse", "circle", "pointed"]);
        this.color = color(random(200, 255), random(100, 180), random(200, 255));
        this.alpha = 255;
        this.velocity = p5.Vector.random2D().mult(random(0.1, 0.3));
    }

    update() {
        const dir = p5.Vector.sub(this.target, this.pos);
        this.velocity.add(dir.mult(0.02));
        this.velocity.mult(0.92);
        this.pos.add(this.velocity);
        this.alpha = max(100, this.alpha - 0.5);
    }

    drawPetal() {
        switch (this.petalShape) {
            case "ellipse":
                ellipse(0, this.size / 2, this.size / 2, this.size);
                break;
            case "circle":
                ellipse(0, this.size / 2, this.size, this.size);
                break;
            case "pointed":
                beginShape();
                vertex(0, 0);
                vertex(-this.size / 4, this.size);
                vertex(0, this.size / 1.5);
                vertex(this.size / 4, this.size);
                endShape(CLOSE);
                break;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        noStroke();
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        for (let i = 0; i < this.petals; i++) {
            this.drawPetal();
            rotate(TWO_PI / this.petals);
        }
        pop();
    }

    moveTo(vec) {
        this.target = vec.copy();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.inHeart = false;
        this.heartVectors = [];
    }

    addParticle(x, y) {
        if (this.particles.length < 600) this.particles.push(new Particle(x, y));
    }

    run() {
        this.particles.forEach(p => {
            p.update();
            p.show();
        });
    }

    generateHeartVectors() {
        this.heartVectors = [];
        const heartSize = min(width, height) / 4;

        for (let a = 0; a < TWO_PI; a += 0.02) { // mịn hơn
            const x = 16 * pow(sin(a), 3) * heartSize * 0.05;
            const y = -(13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a)) * heartSize * 0.05;
            this.heartVectors.push(createVector(x, y));
        }
    }

    regroupToHeart() {
        if (!this.heartVectors.length) this.generateHeartVectors();
        this.particles.forEach(p => p.moveTo(random(this.heartVectors)));
        this.inHeart = true;
    }

    randomScatter() {
        this.particles.forEach(p =>
            p.moveTo(createVector(random(-width / 2, width / 2), random(-height / 2, height / 2)))
        );
        this.inHeart = false;
    }
}

class Config {
    constructor() {
        this.text = "LOVE";
        this.textColor = [255, 100, 150];
        this.textGlowIntensity = 20;
        this.textSizeFactor = 0.18;
        this.backgroundColor = [0, 40];
        this.maxParticles = 600;
        this.maxStars = 200;
        this.toggleInterval = 3000;
    }
}

const config = new Config();

function setup() {
    createCanvas(windowWidth, windowHeight);
    ps = new ParticleSystem();

    // background stars
    for (let i = 0; i < config.maxStars; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            size: random(1.5, 2.8),
            alpha: random(80, 160),
            twinkleSpeed: random(0.005, 0.015),
            offsetX: random(-0.05, 0.05),
            offsetY: random(-0.05, 0.05)
        });
    }

    // particles
    for (let i = 0; i < config.maxParticles; i++) {
        ps.addParticle(random(-width / 2, width / 2), random(-height / 2, height / 2));
    }
}

function draw() {
    // vẽ background: nếu có ảnh upload thì vẽ ảnh, không thì màu mặc định
    if (bgImg) {
        image(bgImg, 0, 0, width, height);
    } else {
        background(...config.backgroundColor);
    }

    drawStars();

    translate(width / 2, height / 2);

    if (millis() - lastToggleTime > config.toggleInterval) {
        ps[ps.inHeart ? 'randomScatter' : 'regroupToHeart']();
        lastToggleTime = millis();
    }

    ps.run();

    if (ps.inHeart) drawText();
}

function drawStars() {
    noStroke();
    stars.forEach(s => {
        s.alpha += sin(frameCount * s.twinkleSpeed) * 0.5;
        s.x += s.offsetX;
        s.y += s.offsetY;

        if (s.x < 0 || s.x > width) s.offsetX *= -1;
        if (s.y < 0 || s.y > height) s.offsetY *= -1;

        fill(255, constrain(s.alpha, 80, 160));
        ellipse(s.x, s.y, s.size);
    });
}

function drawText() {
    const heartSize = min(width, height) / 4;
    const scaleFactor = 1 + 0.1 * sin(frameCount * 0.1);

    push();
    scale(scaleFactor);
    textAlign(CENTER, CENTER);
    textSize(heartSize * config.textSizeFactor);
    fill(...config.textColor, 160);
    text(config.text, 0, 0);

    for (let glow = 1; glow <= 4; glow++) {
        fill(...config.textColor, config.textGlowIntensity / glow);
        textSize(heartSize * config.textSizeFactor + glow * 2);
        text(config.text, 0, 0);
    }
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    ps.heartVectors = [];
    if (bgImg) bgImg.resize(width, height);
}

// ----- Upload background -----
document.getElementById('bgUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
        loadImage(evt.target.result, img => {
            bgImg = img;
            bgImg.resize(width, height);
        });
    };
    reader.readAsDataURL(file);
});
