document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    const changeModeBtn = document.getElementById('change-mode');
    const changeColorBtn = document.getElementById('change-color');

    // 设置画布大小为窗口大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 配置选项
    const config = {
        particleCount: 150,
        particleSize: {
            min: 1,
            max: 6
        },
        speed: {
            min: 0.1,
            max: 0.8
        },
        connectionDistance: 180,
        mouseRadius: 150,
        colorSchemes: [
            // 彩虹色
            ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8a2be2', '#ff00ff'],
            // 蓝紫色调
            ['#00ffff', '#0099ff', '#0033ff', '#3300ff', '#9900ff', '#ff00ff'],
            // 单色调
            ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
            // 暖色调
            ['#ff6b6b', '#ff9f1c', '#ffbf69', '#ffd166', '#f7fff7'],
            // 冷色调
            ['#4ecdc4', '#1a535c', '#3d5a80', '#98c1d9', '#e0fbfc']
        ],
        currentColorScheme: 0,
        mode: 'connect', // 'connect', 'repel', 'follow', 'fireworks', 'vortex'
        backgroundGradient: true,
        particleShape: 'circle', // 'circle', 'square', 'triangle', 'star'
        pulseEffect: true,
        trailEffect: false
    };

    // 鼠标位置
    const mouse = {
        x: undefined,
        y: undefined,
        radius: config.mouseRadius,
        isPressed: false
    };

    // 监听鼠标移动
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // 监听鼠标按下和释放
    window.addEventListener('mousedown', () => {
        mouse.isPressed = true;
        if (config.mode === 'fireworks') {
            createFireworks(mouse.x, mouse.y);
        }
    });

    window.addEventListener('mouseup', () => {
        mouse.isPressed = false;
    });

    // 监听触摸事件
    window.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        mouse.isPressed = true;
        if (config.mode === 'fireworks') {
            createFireworks(mouse.x, mouse.y);
        }
    });

    window.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
    });

    window.addEventListener('touchend', () => {
        mouse.isPressed = false;
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    // 监听模式切换按钮
    changeModeBtn.addEventListener('click', () => {
        const modes = ['connect', 'repel', 'follow', 'fireworks', 'vortex'];
        const currentIndex = modes.indexOf(config.mode);
        config.mode = modes[(currentIndex + 1) % modes.length];
        changeModeBtn.textContent = `模式: ${getModeName(config.mode)}`;
        
        // 如果切换到烟花模式，重新初始化粒子
        if (config.mode === 'fireworks') {
            particles = [];
        } else {
            init();
        }
    });

    // 监听颜色切换按钮
    changeColorBtn.addEventListener('click', () => {
        config.currentColorScheme = (config.currentColorScheme + 1) % config.colorSchemes.length;
        init();
    });

    // 获取模式名称
    function getModeName(mode) {
        switch(mode) {
            case 'connect': return '连接';
            case 'repel': return '排斥';
            case 'follow': return '跟随';
            case 'fireworks': return '烟花';
            case 'vortex': return '漩涡';
            default: return mode;
        }
    }

    // 粒子类
    class Particle {
        constructor(x, y, isFirework = false) {
            this.x = x || Math.random() * canvas.width;
            this.y = y || Math.random() * canvas.height;
            this.size = Math.random() * (config.particleSize.max - config.particleSize.min) + config.particleSize.min;
            this.baseSize = this.size;
            this.speedX = (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min;
            this.speedY = (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min;
            this.color = config.colorSchemes[config.currentColorScheme][
                Math.floor(Math.random() * config.colorSchemes[config.currentColorScheme].length)
            ];
            this.alpha = 1;
            this.isFirework = isFirework;
            this.life = isFirework ? Math.random() * 50 + 50 : Infinity;
            this.angle = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            this.pulseDirection = Math.random() > 0.5 ? 1 : -1;
            this.pulseSpeed = Math.random() * 0.05 + 0.01;
            this.trail = [];
            this.maxTrailLength = 5;
        }

        // 更新粒子位置
        update() {
            // 如果是烟花粒子，减少生命值
            if (this.isFirework) {
                this.life--;
                this.alpha = this.life / 100;
                if (this.life <= 0) {
                    return false;
                }
                // 烟花粒子受重力影响
                this.speedY += 0.03;
            }

            // 基本移动
            this.x += this.speedX;
            this.y += this.speedY;

            // 保存轨迹
            if (config.trailEffect && !this.isFirework) {
                this.trail.push({x: this.x, y: this.y});
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }

            // 边界检测
            if (!this.isFirework) {
                if (this.x > canvas.width) {
                    this.x = 0;
                } else if (this.x < 0) {
                    this.x = canvas.width;
                }
                if (this.y > canvas.height) {
                    this.y = 0;
                } else if (this.y < 0) {
                    this.y = canvas.height;
                }
            }

            // 脉冲效果
            if (config.pulseEffect && !this.isFirework) {
                this.size += this.pulseDirection * this.pulseSpeed;
                if (this.size > this.baseSize * 1.5 || this.size < this.baseSize * 0.5) {
                    this.pulseDirection *= -1;
                }
            }

            // 鼠标交互
            if (mouse.x !== undefined && mouse.y !== undefined && !this.isFirework) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    switch(config.mode) {
                        case 'repel':
                            // 排斥效果
                            const angle = Math.atan2(dy, dx);
                            const force = (mouse.radius - distance) / mouse.radius;
                            this.speedX -= Math.cos(angle) * force * 0.2;
                            this.speedY -= Math.sin(angle) * force * 0.2;
                            break;
                        case 'follow':
                            // 跟随效果
                            this.x += dx * 0.05;
                            this.y += dy * 0.05;
                            break;
                        case 'vortex':
                            // 漩涡效果
                            const vortexAngle = Math.atan2(dy, dx);
                            this.speedX += Math.sin(vortexAngle) * 0.1;
                            this.speedY -= Math.cos(vortexAngle) * 0.1;
                            break;
                    }
                }
            }

            // 限制速度
            if (!this.isFirework) {
                const maxSpeed = 2;
                const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                if (speed > maxSpeed) {
                    this.speedX = (this.speedX / speed) * maxSpeed;
                    this.speedY = (this.speedY / speed) * maxSpeed;
                }
            }

            return true;
        }

        // 绘制粒子
        draw() {
            // 绘制轨迹
            if (config.trailEffect && this.trail.length > 1 && !this.isFirework) {
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                }
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size / 2;
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.alpha;

            // 根据形状绘制粒子
            switch(config.particleShape) {
                case 'square':
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                    break;
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size);
                    ctx.lineTo(this.size, this.size);
                    ctx.lineTo(-this.size, this.size);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    break;
                case 'star':
                    drawStar(0, 0, 5, this.size/2, this.size, this.color);
                    break;
                default: // circle
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
            }

            ctx.restore();
            
            // 更新旋转角度
            this.angle += this.rotationSpeed;
        }
    }

    // 绘制星形
    function drawStar(cx, cy, spikes, innerRadius, outerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    // 创建烟花效果
    function createFireworks(x, y) {
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            const fireworkParticle = new Particle(x, y, true);
            fireworkParticle.speedX = Math.cos(angle) * speed;
            fireworkParticle.speedY = Math.sin(angle) * speed;
            particles.push(fireworkParticle);
        }
    }

    // 粒子数组
    let particles = [];

    // 初始化粒子
    function init() {
        particles = [];
        if (config.mode !== 'fireworks') {
            for (let i = 0; i < config.particleCount; i++) {
                particles.push(new Particle());
            }
        }
    }

    // 连接粒子
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                if (particles[i].isFirework || particles[j].isFirework) continue;
                
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.connectionDistance) {
                    const opacity = 1 - (distance / config.connectionDistance);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // 绘制背景渐变
    function drawBackground() {
        if (config.backgroundGradient) {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(1, '#222244');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // 动画循环
    function animate() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        drawBackground();
        
        // 更新并绘制所有粒子
        for (let i = particles.length - 1; i >= 0; i--) {
            const isAlive = particles[i].update();
            if (!isAlive) {
                particles.splice(i, 1);
            } else {
                particles[i].draw();
            }
        }

        // 如果是连接模式，连接粒子
        if (config.mode === 'connect') {
            connectParticles();
        }

        // 如果是烟花模式，随机创建烟花
        if (config.mode === 'fireworks' && Math.random() < 0.02) {
            createFireworks(
                Math.random() * canvas.width,
                Math.random() * canvas.height * 0.5
            );
        }

        requestAnimationFrame(animate);
    }

    // 设置初始按钮文本
    changeModeBtn.textContent = `模式: ${getModeName(config.mode)}`;

    // 初始化并开始动画
    init();
    animate();
});
