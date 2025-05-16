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
        particleCount: 100,
        particleSize: {
            min: 1,
            max: 5
        },
        speed: {
            min: 0.1,
            max: 0.5
        },
        connectionDistance: 150,
        mouseRadius: 120,
        colorSchemes: [
            ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8a2be2', '#ff00ff'],
            ['#00ffff', '#0099ff', '#0033ff', '#3300ff', '#9900ff', '#ff00ff'],
            ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
            ['#ff6b6b', '#4ecdc4', '#1a535c', '#ff9f1c', '#f7fff7']
        ],
        currentColorScheme: 0,
        mode: 'connect', // 'connect', 'repel', 'follow'
    };

    // 鼠标位置
    const mouse = {
        x: undefined,
        y: undefined,
        radius: config.mouseRadius
    };

    // 监听鼠标移动
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    // 监听模式切换按钮
    changeModeBtn.addEventListener('click', () => {
        const modes = ['connect', 'repel', 'follow'];
        const currentIndex = modes.indexOf(config.mode);
        config.mode = modes[(currentIndex + 1) % modes.length];
        changeModeBtn.textContent = `模式: ${getModeName(config.mode)}`;
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
            default: return mode;
        }
    }

    // 粒子类
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * (config.particleSize.max - config.particleSize.min) + config.particleSize.min;
            this.speedX = (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min;
            this.speedY = (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min;
            this.color = config.colorSchemes[config.currentColorScheme][
                Math.floor(Math.random() * config.colorSchemes[config.currentColorScheme].length)
            ];
        }

        // 更新粒子位置
        update() {
            // 基本移动
            this.x += this.speedX;
            this.y += this.speedY;

            // 边界检测
            if (this.x > canvas.width || this.x < 0) {
                this.speedX = -this.speedX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.speedY = -this.speedY;
            }

            // 鼠标交互
            if (mouse.x !== undefined && mouse.y !== undefined) {
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
                        // 'connect' 模式不需要在这里处理
                    }
                }
            }

            // 限制速度
            const maxSpeed = 2;
            const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
            if (speed > maxSpeed) {
                this.speedX = (this.speedX / speed) * maxSpeed;
                this.speedY = (this.speedY / speed) * maxSpeed;
            }
        }

        // 绘制粒子
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // 粒子数组
    let particles = [];

    // 初始化粒子
    function init() {
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // 连接粒子
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.connectionDistance) {
                    const opacity = 1 - (distance / config.connectionDistance);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 更新并绘制所有粒子
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        // 如果是连接模式，连接粒子
        if (config.mode === 'connect') {
            connectParticles();
        }

        requestAnimationFrame(animate);
    }

    // 设置初始按钮文本
    changeModeBtn.textContent = `模式: ${getModeName(config.mode)}`;

    // 初始化并开始动画
    init();
    animate();
});
