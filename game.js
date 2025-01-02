const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// 游戏基础设置
const gridSize = 20;
let tileCount;
let score = 0;
let snake = [{x: 10, y: 10}];
let food = {
    x: Math.floor(Math.random() * 20),
    y: Math.floor(Math.random() * 20)
};
let dx = 0;
let dy = 0;
let speed = 7;
let gameInterval;
let gameStarted = false;

// 触摸控制变量
let touchStartX = null;
let touchStartY = null;
const minSwipeDistance = 20;

// 音乐系统
let currentMusic = null;
let nextMusic = null;
let currentMusicIndex = 0;
const musicList = [
    { url: './music/qifengle.mp3' },
    { url: './music/ningxia.mp3' }
];

// 初始化游戏
async function initGame() {
    resizeCanvas();
    await initMusicSystem();
    gameLoop();
    gameStarted = true;
}

// 调整画布大小
function resizeCanvas() {
    // 获取容器大小
    const gameContainer = document.querySelector('.game-container');
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    // 计算可用空间中最大的正方形尺寸
    const size = Math.min(containerWidth * 0.9, containerHeight * 0.8);
    
    // 确保尺寸是 gridSize 的整数倍
    const adjustedSize = Math.floor(size / gridSize) * gridSize;
    
    // 设置 canvas 尺寸
    canvas.width = adjustedSize;
    canvas.height = adjustedSize;
    
    // 更新网格数量
    tileCount = adjustedSize / gridSize;
    
    // 确保蛇和食物在有效范围内
    snake = snake.map(segment => ({
        x: Math.min(segment.x, tileCount - 1),
        y: Math.min(segment.y, tileCount - 1)
    }));
    
    food = {
        x: Math.min(food.x, tileCount - 1),
        y: Math.min(food.y, tileCount - 1)
    };
    
    draw();
}

// 游戏主循环
function gameLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        if (gameStarted && update()) {
            draw();
        }
    }, 1000/speed);
}

// 更新游戏状态
function update() {
    if (!gameStarted) return false;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 更新边界检测逻辑
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;
    
    // 检查自身碰撞
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return false;
        }
    }
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = `分数: ${score}`;
        generateFood();
        speed = Math.min(speed + 0.5, 15);
    } else {
        snake.pop();
    }
    
    return true;
}

// 绘制游戏画面
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蛇
    ctx.fillStyle = 'green';
    snake.forEach(segment => {
        ctx.fillRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize - 1,
            gridSize - 1
        );
    });
    
    // 绘制食物
    ctx.fillStyle = 'red';
    ctx.fillRect(
        food.x * gridSize,
        food.y * gridSize,
        gridSize - 1,
        gridSize - 1
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
    alert(`游戏结束！得分：${score}`);
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    speed = 7;
    scoreElement.textContent = `分数: ${score}`;
}

// 触摸控制
function handleTouchStart(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    
    if (!gameStarted) {
        gameStarted = true;
        dx = 1;  // 开始时向右移动
        dy = 0;
        gameLoop();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (deltaX > 0 && dy !== 0) { // 向右滑动
                dx = 1;
                dy = 0;
            } else if (deltaX < 0 && dy !== 0) { // 向左滑动
                dx = -1;
                dy = 0;
            }
        } else {
            // 垂直滑动
            if (deltaY > 0 && dx !== 0) { // 向下滑动
                dx = 0;
                dy = 1;
            } else if (deltaY < 0 && dx !== 0) { // 向上滑动
                dx = 0;
                dy = -1;
            }
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    touchStartX = null;
    touchStartY = null;
}

// 移除之前的事件监听器，添加新的事件监听器
document.removeEventListener('touchstart', handleTouchStart);
document.removeEventListener('touchmove', handleTouchMove);
document.removeEventListener('touchend', handleTouchEnd);

// 添加到整个文档
document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: false });

// 音乐系统
async function initMusicSystem() {
    try {
        currentMusic = new Audio();
        nextMusic = new Audio();
        
        currentMusic.autoplay = false;
        currentMusic.loop = false;
        nextMusic.autoplay = false;
        nextMusic.loop = false;
        
        currentMusic.playsInline = true;
        nextMusic.playsInline = true;
        
        currentMusic.src = musicList[0].url;
        nextMusic.src = musicList[1].url;
        currentMusic.volume = 0.3;
        nextMusic.volume = 0.3;
        
        await currentMusic.load();
        await nextMusic.load();
        
        // 等待用户交互后再开始播放音乐
        document.addEventListener('touchstart', () => {
            startBackgroundMusic();
        }, { once: true });
        
        return true;
    } catch (error) {
        console.error("音乐系统初始化失败:", error);
        return false;
    }
}

function startBackgroundMusic() {
    if (currentMusic) {
        currentMusic.play().then(() => {
            startMusicRotation();
        }).catch(error => {
            console.error("播放音乐失败:", error);
        });
    }
}

function startMusicRotation() {
    if (!currentMusic) return;
    
    currentMusic.onended = async () => {
        // 确保当前音乐停止
        currentMusic.pause();
        currentMusic.currentTime = 0;
        
        // 切换音乐
        [currentMusic, nextMusic] = [nextMusic, currentMusic];
        currentMusicIndex = (currentMusicIndex + 1) % musicList.length;
        nextMusic.src = musicList[(currentMusicIndex + 1) % musicList.length].url;
        await nextMusic.load();
        
        try {
            await currentMusic.play();
        } catch (error) {
            console.error("切换音乐失败:", error);
        }
    };
}

// 阻止默认滚动行为
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// 初始化游戏
window.addEventListener('load', initGame);
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);