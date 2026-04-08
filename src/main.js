import './style.css'
import lugarBg from './assets/world/lugar.png'

class Game {
    constructor() {
        this.worldWidth = window.innerWidth; 
        this.playerPos = 650; 
        this.velocity = 0;
        this.walkSpeed = 6; 
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
        
        window.addEventListener('resize', () => this.calculateBounds());
    }

    calculateBounds() {
        const bgImg = new Image();
        bgImg.src = lugarBg;
        bgImg.onload = () => {
            const h = this.els.world.clientHeight || 640;
            const ar = bgImg.width / bgImg.height;
            this.worldWidth = h * ar;
            this.els.world.style.width = `${this.worldWidth}px`;
            this.buildObjects();
        };
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', e => { this.keys[e.code] = true; });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        const addTouch = (el, k) => {
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[k] = true; }, { passive: false });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[k] = false; }, { passive: false });
        };
        addTouch(this.els.btnLeft, 'KeyA');
        addTouch(this.els.btnRight, 'KeyD');
    }
    
    buildObjects() {
        this.els.objs.innerHTML = '';
        
        // Remove everything but player
        const existingEntities = this.els.ents.querySelectorAll('.entity:not(.player-container)');
        existingEntities.forEach(e => e.remove());
        this.entities = [];
        
        if (this.els.player && !this.els.ents.contains(this.els.player)) {
            this.els.ents.appendChild(this.els.player);
        }

        const cabinX = 1070; 
        const cabin = document.createElement('div');
        cabin.className = 'player-cabin';
        cabin.style.left = `${cabinX - 130}px`; 
        this.els.objs.appendChild(cabin);
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
        const margin = 50;
        if (this.playerPos < margin) this.playerPos = margin;
        if (this.playerPos > this.worldWidth - margin) this.playerPos = this.worldWidth - margin;
        
        if (this.els.player) {
            this.els.player.style.left = `${this.playerPos}px`;
        }

        const vw = window.innerWidth;
        let camX = this.playerPos - vw / 2;
        const maxCamX = Math.max(0, this.worldWidth - vw);
        camX = Math.max(0, Math.min(camX, maxCamX));
        this.els.world.style.transform = `translateX(${-camX}px)`;
        
        if(this.els.moneyDisplay) this.els.moneyDisplay.innerText = "0";
        requestAnimationFrame(() => this.gameLoop());
    }
}

new Game();
