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
        url: 'https://dl.sndup.net/kt6m/piano.mp3',
        name: 'Piano'
    },
    {
        url: 'https://dl.sndup.net/hkhr/soft.mp3',
        name: 'Soft'
    },
    {
        url: 'https://dl.sndup.net/rpg8/gentle.mp3',
        name: 'Gentle'
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
        // 预加载音乐
        currentMusic = new Audio();
        nextMusic = new Audio();
        
        // 设置音频属性
        currentMusic.src = musicList[0].url;
        nextMusic.src = musicList[1].url;
        currentMusic.volume = 0.3;
        nextMusic.volume = 0.3;
        
        // 设置音频为可以在静音状态下播放
        currentMusic.playsInline = true;
        nextMusic.playsInline = true;
        
        // 添加错误处理
        currentMusic.onerror = (e) => console.error("音乐加载错误:", e);
        nextMusic.onerror = (e) => console.error("音乐加载错误:", e);
        
    } catch (error) {
        console.error("音乐系统初始化失败:", error);
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
    musicChangeInterval = setInterval(async () => {
        await switchToNextMusic();
    }, 15000);
}

// 切换到下一首音乐
async function switchToNextMusic() {
    if (!nextMusic) return;

    // 准备新的下一首音乐
    const nextIndex = (currentMusicIndex + 2) % musicList.length;
    const newNextMusic = await preloadMusic(musicList[nextIndex].url);

    // 淡出当前音乐
    fadeOutMusic(currentMusic);
    
    // 淡入下一首音乐
    nextMusic.currentTime = 0;
    nextMusic.volume = 0;
    const playPromise = nextMusic.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            fadeInMusic(nextMusic);
        }).catch(error => {
            console.error("播放失败:", error);
        });
    }

    // 更新音乐引用
    currentMusic = nextMusic;
    nextMusic = newNextMusic;
    currentMusicIndex = (currentMusicIndex + 1) % musicList.length;
}

// 淡出音乐
function fadeOutMusic(audio) {
    if (!audio) return;
    
    const fadeInterval = setInterval(() => {
        if (audio.volume > 0.02) {
            audio.volume -= 0.02;
        } else {
            clearInterval(fadeInterval);
            audio.pause();
            audio.volume = 0.3;
        }
    }, 50);
}

// 淡入音乐
function fadeInMusic(audio) {
    if (!audio) return;
    
    audio.volume = 0;
    const fadeInterval = setInterval(() => {
        if (audio.volume < 0.3) {
            audio.volume += 0.02;
        } else {
            clearInterval(fadeInterval);
        }
    }, 50);
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
window.addEventListener('load', () => {
    initMusicSystem();
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
                
                // 检查是否可以移动到新方向
                if ((newDx === 0 && dx === 0) || (newDy === 0 && dy === 0)) {
                    if ((newDx !== -dx) && (newDy !== -dy)) {
                        dx = newDx;
                        dy = newDy;
                        if (!gameStarted) {
                            gameStarted = true;
                        }
                    }
                }
            });
        });
    });

    // 暂停按钮
    const pauseBtn = document.getElementById('pauseBtn');
    ['touchstart', 'mousedown'].forEach(eventType => {
        pauseBtn.addEventListener(eventType, (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (gameStarted) {
                isPaused = !isPaused;
                pauseBtn.textContent = isPaused ? '▶' : '⏸';
                
                if (isPaused) {
                    pauseBackgroundMusic();
                } else {
                    resumeBackgroundMusic();
                }
            }
        });
    });

    // 静音按钮
    const muteBtn = document.getElementById('muteBtn');
    ['touchstart', 'mousedown'].forEach(eventType => {
        muteBtn.addEventListener(eventType, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentMusic) {
                currentMusic.muted = !currentMusic.muted;
                muteBtn.textContent = currentMusic.muted ? '🔇' : '🔊';
                if (nextMusic) nextMusic.muted = currentMusic.muted;
            }
        });
    });

    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) {
        musicBtn.addEventListener('click', function() {
            console.log("音乐按钮被点击");  // 添加调试日志
            
            if (currentMusic) {
                if (currentMusic.paused) {
                    console.log("尝试播放音乐");
                    const playPromise = currentMusic.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log("音乐播放成功");
                                musicBtn.classList.remove('muted');
                                startMusicRotation();
                            })
                            .catch(error => {
                                console.error("音乐播放失败:", error);
                                musicBtn.classList.add('muted');
                            });
                    }
                } else {
                    console.log("暂停音乐");
                    currentMusic.pause();
                    nextMusic.pause();
                    musicBtn.classList.add('muted');
                }
            } else {
                console.log("音频对象未初始化");
            }
        });
    } else {
        console.error("未找到音乐按钮元素");
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