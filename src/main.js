import './style.css'
import lugarBg from './assets/world/lugar.png'

class Game {
    constructor() {
        this.worldWidth = window.innerWidth; 
        this.playerPos = 780; 
        this.velocity = 0;
        this.walkSpeed = 7; 
        this.facing = 1;
        this.keys = {};
        this.initialized = false;
        
        this.joystick = {
            active: false,
            originX: 0, originY: 0,
            offsetX: 0, offsetY: 0,
            maxRadius: 60
        };

        this.els = {
            player: document.getElementById('player'),
            world: document.getElementById('world'),
            ents: document.getElementById('entities-layer'),
            objs: document.getElementById('objects-layer'),
            moneyDisplay: document.getElementById('money-display'),
            joyWrapper: document.getElementById('joystick-wrapper'),
            joyStick: document.getElementById('joystick-stick')
        };
        
        this.init();
    }
    
    init() {
        this.els.world.style.backgroundImage = `url(${lugarBg})`;
        this.setupEventListeners();
        this.calculateBounds();
        this.gameLoop();
        
        window.addEventListener('resize', () => {
            this.calculateBounds();
        });
    }

    calculateBounds() {
        const bgImg = new Image();
        bgImg.src = lugarBg;
        bgImg.onload = () => {
            const h = window.innerHeight;
            const ar = bgImg.width / bgImg.height;
            this.worldWidth = h * ar;
            this.els.world.style.width = `${this.worldWidth}px`;
            this.buildObjects();
            this.initialized = true;
        };
        
        // Immediate update for screen rotations
        const h = window.innerHeight;
        this.els.world.style.width = `${h * (this.worldWidth/h || 1)}px`;
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', e => { this.keys[e.code] = true; });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        const lockOrientation = () => {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {
                    // Fail silently as many browsers block this or need full-screen
                });
            }
        };

        const startJoy = (e) => {
            lockOrientation(); // Attempt lock on first interaction
            const touch = e.touches ? e.touches[0] : e;
            const rect = document.getElementById('joystick-base').getBoundingClientRect();
            this.joystick.originX = rect.left + rect.width / 2;
            this.joystick.originY = rect.top + rect.height / 2;
            this.joystick.active = true;
        };

        const moveJoy = (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            let dx = touch.clientX - this.joystick.originX;
            let dy = touch.clientY - this.joystick.originY;
            
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance > this.joystick.maxRadius) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * this.joystick.maxRadius;
                dy = Math.sin(angle) * this.joystick.maxRadius;
            }

            this.joystick.offsetX = dx;
            this.joystick.offsetY = dy;
            this.els.joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
            
            const threshold = 15;
            this.keys['KeyD'] = dx > threshold;
            this.keys['KeyA'] = dx < -threshold;
        };

        const stopJoy = () => {
            this.joystick.active = false;
            this.els.joyStick.style.transform = `translate(0px, 0px)`;
            this.keys['KeyD'] = false;
            this.keys['KeyA'] = false;
        };

        this.els.joyWrapper.addEventListener('touchstart', startJoy, { passive: false });
        window.addEventListener('touchmove', moveJoy, { passive: false });
        window.addEventListener('touchend', stopJoy);
        this.els.joyWrapper.addEventListener('mousedown', startJoy);
        window.addEventListener('mousemove', moveJoy);
        window.addEventListener('mouseup', stopJoy);
    }
    
    buildObjects() {
        this.els.objs.innerHTML = '';
        const cabinX = 780; 
        const cabin = document.createElement('div');
        cabin.className = 'player-cabin';
        cabin.style.left = `${cabinX - 130}px`; 
        this.els.objs.appendChild(cabin);
    }
    
    gameLoop() {
        if (!this.initialized) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }

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
        
        this.els.player.style.left = `${this.playerPos}px`;

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
