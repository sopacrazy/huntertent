import './style.css'
import lugarBg from './assets/world/lugar.png'

class Game {
    constructor() {
        this.worldWidth = window.innerWidth; 
        this.playerPos = 200; 
        this.velocity = 0;
        this.walkSpeed = 5; 
        this.groundLevel = 34.5;
        this.facing = 1;
        this.entities = []; 
        this.keys = {};
        
        this.els = {
            player: document.getElementById('player'),
            world: document.getElementById('world'),
            ents: document.getElementById('entities-layer'),
            objs: document.getElementById('objects-layer'),
            moneyDisplay: document.getElementById('money-display'),
            btnLeft: document.getElementById('btn-left'),
            btnRight: document.getElementById('btn-right')
        };
        
        this.init();
    }
    
    init() {
        this.els.world.style.backgroundImage = `url(${lugarBg})`;
        this.setupEventListeners();
        this.calculateBounds();
        this.gameLoop();
    }

    calculateBounds() {
        const bgImg = new Image();
        bgImg.src = lugarBg;
        bgImg.onload = () => {
            const h = this.els.world.clientHeight || window.innerHeight;
            const ar = bgImg.width / bgImg.height;
            this.worldWidth = h * ar;
            this.els.world.style.width = `${this.worldWidth}px`;
            this.buildObjects();
        };
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', e => { this.keys[e.code] = true; if (e.code === 'Space') this.shoot(); if (e.code === 'KeyE') this.interact(); });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        const addTouch = (el, k) => {
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[k] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[k] = false; });
        };
        addTouch(this.els.btnLeft, 'KeyA');
        addTouch(this.els.btnRight, 'KeyD');
    }
    
    buildObjects() {
        this.els.objs.innerHTML = '';
        this.els.ents.innerHTML = '';
        this.els.ents.appendChild(this.els.player);
        
        // House moved further left (after the entrance)
        const cabinX = 650; 
        const cabin = document.createElement('div');
        cabin.className = 'player-cabin';
        cabin.style.left = `${cabinX - 130}px`; 
        this.els.objs.appendChild(cabin);
        this.playerPos = cabinX + 100;
        
        for(let i=0; i<8; i++) this.spawnAnimal(Math.random() * (this.worldWidth - 500) + 400);
    }
    
    spawnAnimal(x) {
        const el = document.createElement('div');
        el.className = `entity skunk`;
        el.style.left = `${x}px`;
        el.style.bottom = `${this.groundLevel}%`;
        this.els.ents.appendChild(el);
        this.entities.push({ el, x, vx: (Math.random() - 0.5) * 2 });
    }

    gameLoop() {
        let dir = 0;
        if (this.keys.ArrowRight || this.keys.KeyD) dir += 1;
        if (this.keys.ArrowLeft || this.keys.KeyA) dir -= 1;
        
        if (dir !== 0) {
            this.velocity = dir * this.walkSpeed;
            this.facing = dir;
            this.els.player.style.transform = `translateX(-50%) scaleX(${dir})`;
            this.els.player.classList.add('moving');
        } else {
            this.velocity = 0;
            this.els.player.classList.remove('moving');
        }
        
        this.playerPos += this.velocity;
        const margin = 20;
        if (this.playerPos < margin) this.playerPos = margin;
        if (this.playerPos > this.worldWidth - margin) this.playerPos = this.worldWidth - margin;
        this.els.player.style.left = `${this.playerPos}px`;

        for (let ent of this.entities) {
            ent.x += ent.vx;
            if (ent.x < 100 || ent.x > this.worldWidth - 100) ent.vx *= -1;
            ent.el.style.left = `${ent.x}px`;
        }

        const vw = window.innerWidth;
        let camX = this.playerPos - vw / 2;
        const maxCamX = Math.max(0, this.worldWidth - vw);
        camX = Math.max(0, Math.min(camX, maxCamX));
        this.els.world.style.transform = `translateX(${-camX}px)`;
        
        this.els.moneyDisplay.innerText = "0";
        requestAnimationFrame(() => this.gameLoop());
    }

    shoot() {}
    interact() {}
}

new Game();
