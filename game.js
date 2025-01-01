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

// 游戏主循环
function gameLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(function() {
        if (!gameStarted) {
            draw();
            return;
        }
        if (update()) {
            draw();
        }
    }, 1000/speed);
}

// 更新游戏状态
function update() {
    const newHead = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // 穿墙处理
    if (newHead.x < 0) newHead.x = tileCount - 1;
    if (newHead.x >= tileCount) newHead.x = 0;
    if (newHead.y < 0) newHead.y = tileCount - 1;
    if (newHead.y >= tileCount) newHead.y = 0;
    
    // 检查是否撞到自己
    for (let i = 0; i < snake.length; i++) {
        if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
            gameOver();
            return false;
        }
    }
    
    snake.unshift(newHead);
    
    // 检查是否吃到食物
    if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        speed = Math.min(12, 5 + Math.floor(score / 100));
        scoreElement.textContent = `分数: ${score}`;
        generateFood();
        playEatSound();
    } else {
        snake.pop();
    }
    
    rainbow = (rainbow + 1) % 360;
    return true;
}

// 绘制游戏画面
function draw() {
    // 创建清新的渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#E8F5E9');
    gradient.addColorStop(1, '#C8E6C9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        const hue = (rainbow + index * 15) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
            5
        );
        ctx.fill();
    });
    
    // 绘制食物
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 重置阴影效果
    ctx.shadowBlur = 0;
    
    // 如果游戏还没开始，显示提示信息
    if (!gameStarted) {
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按方向键开始游戏', canvas.width/2, canvas.height/2);
        ctx.font = '16px Arial';
        ctx.fillText('使用方向键控制蛇的移动', canvas.width/2, canvas.height/2 + 30);
        ctx.fillText('可以穿墙，撞到自己游戏结束', canvas.width/2, canvas.height/2 + 50);
    }
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
    pauseBackgroundMusic();
    alert(`游戏结束！得分：${score}`);
    snake = [{x: 10, y: 10}];
    dx = 0;
    dy = 0;
    score = 0;
    speed = 5;
    gameStarted = false;
    scoreElement.textContent = `分数: ${score}`;
    generateFood();
    resumeBackgroundMusic();
    gameLoop();
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

// 初始化音乐系统
async function initMusicSystem() {
    try {
        console.log("开始初始化音乐系统...");
        currentMusic = await preloadMusic(musicList[0].url);
        console.log("第一首音乐加载完成");
        nextMusic = await preloadMusic(musicList[1].url);
        console.log("第二首音乐加载完成");
        
        // 添加音乐加载完成的提示
        document.body.addEventListener('click', () => {
            if (currentMusic && currentMusic.paused) {
                startBackgroundMusic();
            }
        });

        startBackgroundMusic();
        startMusicRotation();
    } catch (error) {
        console.error("音乐初始化失败:", error);
    }
}

// 开始背景音乐
function startBackgroundMusic() {
    if (currentMusic) {
        console.log("尝试播放音乐...");
        const playPromise = currentMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("音乐开始播放");
            }).catch(error => {
                console.log("自动播放失败，等待用户交互:", error);
                // 添加点击事件监听器
                document.addEventListener('click', function playOnClick() {
                    currentMusic.play().then(() => {
                        console.log("用户交互后开始播放");
                    }).catch(err => {
                        console.log("播放失败:", err);
                    });
                    document.removeEventListener('click', playOnClick);
                }, { once: true });
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

// 修改初始化调用
window.addEventListener('load', () => {
    initMusicSystem();
    
    // 添加用户交互监听器来开始播放
    document.addEventListener('click', function startAudioOnClick() {
        if (currentMusic && currentMusic.paused) {
            startBackgroundMusic();
        }
        document.removeEventListener('click', startAudioOnClick);
    }, { once: true });
    
    gameLoop();
}); 

// 添加触摸事件处理
canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    if (!gameStarted) {
        gameStarted = true;
        return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > minSwipeDistance && dx !== -1) {
            dx = 1; dy = 0;
        } else if (deltaX < -minSwipeDistance && dx !== 1) {
            dx = -1; dy = 0;
        }
    } else {
        // 垂直滑动
        if (deltaY > minSwipeDistance && dy !== -1) {
            dx = 0; dy = 1;
        } else if (deltaY < -minSwipeDistance && dy !== 1) {
            dx = 0; dy = -1;
        }
    }
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

// 阻止双击缩放
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
});

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
            gameStarted = !gameStarted;
            pauseBtn.textContent = gameStarted ? '⏸' : '▶';
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
}

// 调整画布大小
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6);
    const scale = window.devicePixelRatio || 1;
    
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${maxWidth}px`;
    canvas.width = maxWidth * scale;
    canvas.height = maxWidth * scale;
    
    ctx.scale(scale, scale);
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