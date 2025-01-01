const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let snake = [
    {x: 10, y: 10},
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let dx = 0;
let dy = 0;
let speed = 5;
let gameInterval;
let gameStarted = false;
let rainbow = 0;

// 音乐系统相关变量
let currentMusic = null;
let nextMusic = null;
let currentMusicIndex = 0;
let musicChangeInterval;

// 音乐列表
const musicList = [
    {
        url: './music/qifengle.mp3',
        duration: 0
    },
    {
        url: './music/ningxia.mp3',
        duration: 0
    }
];

// 添加触摸控制变量
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30;

// 添加游戏状态变量
let isPaused = false;

// 游戏主循环
function gameLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        if (!isPaused) {
            if (update()) {
                draw();
            }
        }
    }, 1000/speed);
}

// 更新游戏状态
function update() {
    if (!gameStarted || isPaused) return false;

    // 计算新的头部位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 边界检查
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;
    
    // 检查是否撞到自己
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return false;
        }
    }
    
    // 移动蛇
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').textContent = `分数: ${score}`;
        generateFood();
        speed = Math.min(speed + 0.5, 15); // 增加速度，但限制最大速度
    } else {
        snake.pop();
    }
    
    return true;
}

// 绘制游戏画面
function draw() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算格子大小
    const gridSize = Math.floor(canvas.width / tileCount);
    
    // 绘制蛇
    ctx.fillStyle = 'green';
    snake.forEach(segment => {
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });
    
    // 绘制食物
    ctx.fillStyle = 'red';
    ctx.fillRect(
        food.x * gridSize + 1,
        food.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
    );
}

// 生成食物
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

// 游戏结束
function gameOver() {
    gameStarted = false;
    isPaused = false;
    alert(`游戏结束！得分：${score}`);
    // 重置游戏
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    speed = 7;
    document.getElementById('score').textContent = `分数: ${score}`;
    document.getElementById('pauseBtn').textContent = '⏸';
}

// 预加载音乐
function preloadMusic(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.volume = 0.3;
        audio.preload = 'auto';
        
        audio.addEventListener('canplaythrough', () => {
            resolve(audio);
        });
        
        audio.addEventListener('error', () => {
            reject(new Error(`Failed to load: ${url}`));
        });
        
        audio.src = url;
    });
}

// 修改初始化音乐系统
async function initMusicSystem() {
    try {
        console.log("初始化音乐系统...");
        
        currentMusic = new Audio();
        nextMusic = new Audio();
        
        // iOS Safari 特殊设置
        currentMusic.playsInline = true;
        nextMusic.playsInline = true;
        currentMusic.preload = 'auto';
        nextMusic.preload = 'auto';
        
        // 允许在静音状态下播放
        currentMusic.muted = false;
        nextMusic.muted = false;
        
        currentMusic.src = musicList[0].url;
        nextMusic.src = musicList[1].url;
        currentMusic.volume = 0.3;
        nextMusic.volume = 0.3;
        
        // 加载音频
        await currentMusic.load();
        await nextMusic.load();
        
        return true;
    } catch (error) {
        console.error("音乐系统初始化失败:", error);
        return false;
    }
}

// 修改开始背景音乐函数
function startBackgroundMusic() {
    if (currentMusic) {
        console.log("尝试播放音乐...");
        // 确保音频已加载
        currentMusic.load();
        
        const playPromise = currentMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("音乐开始播放");
                startMusicRotation(); // 开始音乐轮换
            }).catch(error => {
                console.error("播放失败:", error);
                // 添加用户交互监听
                const startAudio = () => {
                    currentMusic.play()
                        .then(() => {
                            console.log("用户交互后开始播放");
                            startMusicRotation();
                            // 移除所有事件监听
                            document.removeEventListener('touchstart', startAudio);
                            document.removeEventListener('click', startAudio);
                        })
                        .catch(err => console.error("播放失败:", err));
                };
                
                // 同时监听触摸和点击事件
                document.addEventListener('touchstart', startAudio);
                document.addEventListener('click', startAudio);
            });
        }
    }
}

// 开始音乐轮换
function startMusicRotation() {
    if (!currentMusic) return;
    
    currentMusic.onended = async () => {
        console.log("当前音乐播放结束，切换到下一首");
        
        // 交换当前音乐和下一首音乐
        [currentMusic, nextMusic] = [nextMusic, currentMusic];
        currentMusicIndex = (currentMusicIndex + 1) % musicList.length;
        
        // 设置下一首音乐
        nextMusic.src = musicList[(currentMusicIndex + 1) % musicList.length].url;
        
        try {
            await currentMusic.play();
            console.log("切换到下一首音乐成功");
        } catch (error) {
            console.error("切换音乐失败:", error);
        }
    };
}

// 暂停背景音乐
function pauseBackgroundMusic() {
    if (currentMusic) {
        currentMusic.pause();
    }
    clearInterval(musicChangeInterval);
}

// 继续播放背景音乐
function resumeBackgroundMusic() {
    if (currentMusic) {
        currentMusic.play().catch(error => {
            console.log("需要用户交互才能继续播放");
        });
        startMusicRotation();
    }
}

// 键盘控制
document.addEventListener('keydown', function(e) {
    if (!gameStarted && 
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
         e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        gameStarted = true;
    }

    switch(e.key) {
        case 'ArrowUp':
            if (e.ctrlKey && currentMusic) {
                const newVolume = Math.min(1, currentMusic.volume + 0.1);
                currentMusic.volume = newVolume;
                if (nextMusic) nextMusic.volume = newVolume;
                e.preventDefault();
            } else if (dy !== 1) {
                dx = 0; dy = -1;
            }
            break;
        case 'ArrowDown':
            if (e.ctrlKey && currentMusic) {
                const newVolume = Math.max(0, currentMusic.volume - 0.1);
                currentMusic.volume = newVolume;
                if (nextMusic) nextMusic.volume = newVolume;
                e.preventDefault();
            } else if (dy !== -1) {
                dx = 0; dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
        case ' ':
            if (gameStarted) {
                gameStarted = false;
                pauseBackgroundMusic();
            } else {
                gameStarted = true;
                resumeBackgroundMusic();
            }
            break;
        case 'm':
            if (currentMusic) {
                currentMusic.muted = !currentMusic.muted;
                if (nextMusic) nextMusic.muted = currentMusic.muted;
            }
            break;
    }
});

// 修改页面加载事件
window.addEventListener('load', async () => {
    console.log("页面加载完成");
    await initMusicSystem();
    resizeCanvas();
    initControls();
    gameLoop();
    
    // 添加多个用户交互事件来触发音频播放
    const startAudioOnInteraction = () => {
        if (currentMusic && currentMusic.paused) {
            startBackgroundMusic();
        }
    };
    
    // 监听多种交互事件
    document.addEventListener('touchstart', startAudioOnInteraction, { once: true });
    document.addEventListener('click', startAudioOnInteraction, { once: true });
    document.addEventListener('keydown', startAudioOnInteraction, { once: true });
});

// 添加触摸事件处理
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    e.preventDefault();
}, { passive: false });

// 禁用双击缩放
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

// 修改按钮事件处理
document.getElementById('upBtn').addEventListener('touchstart', (e) => {
    if (dy !== 1) { dx = 0; dy = -1; }
    if (!gameStarted) gameStarted = true;
    e.preventDefault();
}, { passive: false });

document.getElementById('downBtn').addEventListener('touchstart', (e) => {
    if (dy !== -1) { dx = 0; dy = 1; }
    if (!gameStarted) gameStarted = true;
    e.preventDefault();
}, { passive: false });

document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
    if (dx !== 1) { dx = -1; dy = 0; }
    if (!gameStarted) gameStarted = true;
    e.preventDefault();
}, { passive: false });

document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
    if (dx !== -1) { dx = 1; dy = 0; }
    if (!gameStarted) gameStarted = true;
    e.preventDefault();
}, { passive: false });

document.getElementById('pauseBtn').addEventListener('touchstart', (e) => {
    gameStarted = !gameStarted;
    if (gameStarted) {
        resumeBackgroundMusic();
    } else {
        pauseBackgroundMusic();
    }
    e.preventDefault();
}, { passive: false });

// 阻止 iOS 的默认行为
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// 修改按钮事件处理
function initControls() {
    const musicBtn = document.getElementById('musicBtn');
    if (!musicBtn) {
        console.error("未找到音乐按钮");
        return;
    }

    // 检测是否是 iOS 设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    console.log("是否为iOS设备:", isIOS);

    // 针对 iOS 的特殊处理
    if (isIOS) {
        document.addEventListener('touchstart', function() {
            // iOS 需要用户交互才能播放音频
            if (currentMusic) {
                currentMusic.load();
            }
            if (nextMusic) {
                nextMusic.load();
            }
        }, { once: true });
    }

    musicBtn.addEventListener('click', async function(event) {
        // 防止事件冒泡
        event.preventDefault();
        event.stopPropagation();
        
        console.log("音乐按钮被点击");
        
        if (!currentMusic) {
            console.log("重新初始化音乐系统");
            const initialized = await initMusicSystem();
            if (!initialized) {
                console.error("音乐系统初始化失败");
                return;
            }
        }
        
        try {
            if (currentMusic.paused) {
                console.log("尝试播放音乐");
                await currentMusic.play();
                console.log("音乐播放成功");
                musicBtn.classList.remove('muted');
                startMusicRotation();
            } else {
                console.log("暂停音乐");
                currentMusic.pause();
                nextMusic.pause();
                musicBtn.classList.add('muted');
            }
        } catch (error) {
            console.error("音乐控制失败:", error);
            // iOS 特殊处理
            if (isIOS) {
                currentMusic.load();
                try {
                    await currentMusic.play();
                    musicBtn.classList.remove('muted');
                    startMusicRotation();
                } catch (iosError) {
                    console.error("iOS音乐播放失败:", iosError);
                    musicBtn.classList.add('muted');
                }
            }
        }
    });

    // 添加音频状态变化监听
    if (currentMusic) {
        currentMusic.addEventListener('playing', () => {
            console.log("音乐开始播放");
            musicBtn.classList.remove('muted');
        });

        currentMusic.addEventListener('pause', () => {
            console.log("音乐已暂停");
            musicBtn.classList.add('muted');
        });

        currentMusic.addEventListener('ended', () => {
            console.log("音乐已结束");
            // 不需要在这里修改按钮状态，因为会自动切换到下一首
        });
    }
}

// 修改画布大小调整函数
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6);
    
    // 设置画布大小为偶数，避免半像素问题
    const size = Math.floor(maxSize / tileCount) * tileCount;
    
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = size;
    canvas.height = size;
    
    // 重新绘制
    draw();
}

// 页面加载和方向变化时调整大小
window.addEventListener('load', () => {
    resizeCanvas();
    initControls();
    initMusicSystem();
    gameLoop();
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// 修改方向控制，防止快速按键导致的自撞
let lastUpdate = 0;
const minUpdateInterval = 50; // 最小更新间隔（毫秒）

function changeDirection(newDx, newDy) {
    const now = Date.now();
    if (now - lastUpdate < minUpdateInterval) {
        return; // 如果间隔太短，忽略这次方向改变
    }
    
    // 防止反向移动
    if ((newDx === 0 && dx === 0) || (newDy === 0 && dy === 0)) {
        if ((newDx !== -dx) && (newDy !== -dy)) {
            dx = newDx;
            dy = newDy;
            lastUpdate = now;
            
            if (!gameStarted) {
                gameStarted = true;
                isPaused = false;
            }
        }
    }
}

// 修改方向按钮的事件处理
const buttons = {
    upBtn: { dx: 0, dy: -1 },
    downBtn: { dx: 0, dy: 1 },
    leftBtn: { dx: -1, dy: 0 },
    rightBtn: { dx: 1, dy: 0 }
};

Object.entries(buttons).forEach(([id, { dx: newDx, dy: newDy }]) => {
    const button = document.getElementById(id);
    ['touchstart', 'mousedown'].forEach(eventType => {
        button.addEventListener(eventType, (e) => {
            e.preventDefault();
            e.stopPropagation();
            changeDirection(newDx, newDy);
        });
    });
});