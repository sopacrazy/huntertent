import './style.css'
import lugar1 from './assets/world/lugar.png'
import lugar2 from './assets/world/lugar2.png'

class Game {
    constructor() {
        this.worldWidth = window.innerWidth; 
        this.playerPos = 250; 
        this.velocity = 0;
        this.walkSpeed = 4.5;
        this.facing = 1;
        this.keys = {};
        this.initialized = false;
        
        this.npcPos = 0; 
        this.isDialogueOpen = false;
        this.nearNPC = false;

        this.joystick = {
            active: false,
            originX: 0, originY: 0,
            offsetX: 0, offsetY: 0,
            maxRadius: 60
        };

        this.els = {
            app: document.getElementById('game-app'),
            player: document.getElementById('player'),
            world: document.getElementById('world'),
            ents: document.getElementById('entities-layer'),
            objs: document.getElementById('objects-layer'),
            moneyDisplay: document.getElementById('money-display'),
            joyWrapper: document.getElementById('joystick-wrapper'),
            joyStick: document.getElementById('joystick-stick'),
            actionBtn: document.getElementById('action-btn-wrapper'),
            dialogueBox: document.getElementById('dialogue-box')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.calculateBounds();
        this.gameLoop();
        
        window.addEventListener('resize', () => this.calculateBounds());
    }

    async calculateBounds() {
        const loadImg = (src) => new Promise(res => {
            const img = new Image();
            img.src = src;
            img.onload = () => res(img);
        });

        const [img1, img2] = await Promise.all([loadImg(lugar1), loadImg(lugar2)]);
        const h = this.els.app.clientHeight;
        const scale = 1.35; 

        // AJUSTE MANUAL DAS IMAGENS (Se houver cortes ou erros de encaixe)
        // Y: Positivo sobe, Negativo desce | X: Ajusta a distância entre elas
        const offsetLugar2 = { x: -500, y: 7 }; 

        const ar1 = img1.width / img1.height;
        const width1 = (h * scale) * ar1;

        const ar2 = img2.width / img2.height;
        const width2 = (h * scale) * ar2;

        this.worldWidth = width1 + width2 + offsetLugar2.x;
        this.els.world.style.width = `${this.worldWidth}px`;

        // BUILD TILES
        this.els.world.innerHTML = `
            <div id="objects-layer"></div>
            <div id="entities-layer"></div>
            <div class="world-tile" style="width: ${width1}px; left: 0; background-image: url(${lugar1})"></div>
            <div class="world-tile" style="width: ${width2}px; left: ${width1 + offsetLugar2.x}px; top: ${-offsetLugar2.y}px; background-image: url(${lugar2})"></div>
        `;

        // RE-ASSIGN LAYERS AFTER INNERHTML WIPE
        this.els.objs = document.getElementById('objects-layer');
        this.els.ents = document.getElementById('entities-layer');
        this.els.ents.appendChild(this.els.player);

        this.buildObjects();
        this.updateCamera(); 
        
        setTimeout(() => {
            this.els.world.classList.add('ready');
            this.initialized = true;
        }, 100);
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', e => { 
            this.keys[e.code] = true; 
            if (e.code === 'KeyE') this.tryInteract();
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        this.els.actionBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.tryInteract();
        });

        this.els.dialogueBox.addEventListener('touchstart', () => {
            if (this.isDialogueOpen) this.closeDialogue();
        });

        const startJoy = (e) => {
            if (this.isDialogueOpen) return;
            const touch = e.touches ? e.touches[0] : e;
            const rect = document.getElementById('joystick-base').getBoundingClientRect();
            this.joystick.originX = rect.left + rect.width / 2;
            this.joystick.originY = rect.top + rect.height / 2;
            this.joystick.active = true;
        };

        const moveJoy = (e) => {
            if (!this.joystick.active || this.isDialogueOpen) return;
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

    tryInteract() {
        if (this.isDialogueOpen) {
            this.closeDialogue();
        } else if (this.nearNPC) {
            this.openDialogue();
        }
    }

    openDialogue() {
        this.isDialogueOpen = true;
        this.els.dialogueBox.classList.remove('hidden');
        this.velocity = 0;
        this.keys = {}; 
    }

    closeDialogue() {
        this.isDialogueOpen = false;
        this.els.dialogueBox.classList.add('hidden');
    }
    
    buildObjects() {
        this.els.objs.innerHTML = '';
        
        // NPC VENDEDOR (Moved to the end of the NEW total map)
        this.npcPos = this.worldWidth - 500;
        const npc = document.createElement('div');
        npc.className = 'npc';
        npc.id = 'npc-vendedor';
        npc.style.left = `${this.npcPos}px`;
        npc.innerHTML = `
            <div class="npc-idle" style="transform: scaleX(-1)"></div>
            <div id="npc-prompt" class="interact-prompt hidden">E</div>
        `;
        this.els.objs.appendChild(npc);
    }

    updateCamera() {
        const vw = this.els.app.clientWidth;
        let camX = this.playerPos - vw / 2;
        const maxCamX = Math.max(0, this.worldWidth - vw);
        camX = Math.max(0, Math.min(camX, maxCamX));
        this.els.world.style.transform = `translateX(${-camX}px)`;
    }
    
    gameLoop() {
        if (!this.initialized) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }

        const dist = Math.abs(this.playerPos - this.npcPos);
        const prompt = document.getElementById('npc-prompt');
        if (dist < 150) {
            this.nearNPC = true;
            if (prompt) prompt.classList.remove('hidden');
            this.els.actionBtn.classList.remove('hidden');
        } else {
            this.nearNPC = false;
            if (prompt) prompt.classList.add('hidden');
            this.els.actionBtn.classList.add('hidden');
        }

        let dir = 0;
        if (!this.isDialogueOpen) {
            if (this.keys.ArrowRight || this.keys.KeyD) dir += 1;
            if (this.keys.ArrowLeft || this.keys.KeyA) dir -= 1;
        }
        
        if (dir !== 0) {
            this.velocity = dir * this.walkSpeed;
            this.facing = dir;
            this.els.player.style.transform = `translateX(-50%) scaleX(${dir})`;
            this.els.player.classList.add('moving');
        } else {
            this.velocity = 0;
            this.els.player.classList.remove('moving');
        }
        
        if (!this.isDialogueOpen) {
            this.playerPos += this.velocity;
            const margin = 50;
            if (this.playerPos < margin) this.playerPos = margin;
            if (this.playerPos > this.worldWidth - margin) this.playerPos = this.worldWidth - margin;
            this.els.player.style.left = `${this.playerPos}px`;
        }

        this.updateCamera();
        requestAnimationFrame(() => this.gameLoop());
    }
}

new Game();
