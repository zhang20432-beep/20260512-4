let capture;
let faceMesh; // 更改為 faceMesh
let handPose; // 新增手勢辨識
let faces = []; // 更改為 faces
let hands = []; // 新增手部資料
let earringImages = []; // 存儲 5 種耳環圖片
let currentEarring = null; // 當前選擇的耳環

function preload() {
  // 預載入 pic/acc/ 目錄下的耳環圖片
  // 檔名分別為 acc1_ring, acc2_pearl, acc3_tassel, acc4_jade, acc5_phoenix
  earringImages[0] = loadImage('pic/acc/acc1_ring.png');
  earringImages[1] = loadImage('pic/acc/acc2_pearl.png');
  earringImages[2] = loadImage('pic/acc/acc3_tassel.png');
  earringImages[3] = loadImage('pic/acc/acc4_jade.png');
  earringImages[4] = loadImage('pic/acc/acc5_phoenix.png');
  // 預設顯示第一個
  currentEarring = earringImages[0];
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  
  // 處理攝影機載入失敗的情況
  capture.elt.onerror = (err) => {
    console.error("攝影機載入錯誤:", err);
    noLoop(); // 停止繪製
  };

  capture.size(640, 480); 
  capture.hide(); // 隱藏預設的影片元件

  // 檢查 ml5 是否存在
  if (typeof ml5 === 'undefined') {
    console.error("ml5 函式庫載入失敗，請檢查網路或 index.html 中的連結");
    return;
  }

  // 初始化 ml5 faceMesh 辨識模型
  faceMesh = ml5.faceMesh(capture, { flipped: false }, modelLoaded); // 更改為 faceMesh

  // 初始化手勢辨識模型
  handPose = ml5.handPose(capture, { flipped: false }, () => console.log("手勢模型載入完成"));
}

function modelLoaded() {
  console.log("模型載入完成");
  // 使用 detectStart 進行持續偵測，這會不斷更新 faces 資料
  faceMesh.detectStart(capture, gotFaces);
  // 同時開始偵測手勢
  handPose.detectStart(capture, gotHands);
}

// 處理臉部辨識結果
function gotFaces(results) {
  // ml5.faceMesh v1 的 detectStart 回傳結果直接是陣列
  faces = results;
}

// 處理手勢辨識結果
function gotHands(results) {
  hands = results;
}

function draw() {
  background('#e7c6ff');

  // 1. 在整個畫布置中上方顯示文字
  fill(0);
  noStroke();
  textSize(24);
  textAlign(CENTER, TOP); 
  text("414730514張OO", width / 2, 30);
  text("作品為影像辨識_耳環臉譜", width / 2, 65);

  // 計算顯示影像的寬高（畫布寬高的 50%）
  let displayW = width * 0.5;
  let displayH = height * 0.5;

  // 檢查攝影機是否準備好，若沒準備好則顯示提示
  if (capture.width === 0) {
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("正在啟動攝影機中...\n(若長時間沒反應，請檢查瀏覽器權限或使用 Live Server)", width / 2, height / 2);
    return;
  }

  // 2. 判斷手勢決定耳環款式
  if (hands.length > 0) {
    let count = 0;
    let hand = hands[0];
    
    // 簡單判斷指尖是否高於關節 (Index, Middle, Ring, Pinky)
    if (hand.keypoints[8].y < hand.keypoints[6].y) count++;
    if (hand.keypoints[12].y < hand.keypoints[10].y) count++;
    if (hand.keypoints[16].y < hand.keypoints[14].y) count++;
    if (hand.keypoints[20].y < hand.keypoints[18].y) count++;
    // 大拇指檢測 (判斷指尖與食指基部的距離)
    if (dist(hand.keypoints[4].x, hand.keypoints[4].y, hand.keypoints[5].x, hand.keypoints[5].y) > 
        dist(hand.keypoints[3].x, hand.keypoints[3].y, hand.keypoints[5].x, hand.keypoints[5].y)) count++;

    if (count >= 1 && count <= 5) {
      currentEarring = earringImages[count - 1];
    }
  }

  push();
  translate(width / 2, height / 2); // 移動到畫布中心
  scale(-1, 1); // 水平翻轉達成鏡像效果
  imageMode(CENTER);
  image(capture, 0, 0, displayW, displayH); // 繪製攝影機影像

  // 3. 如果辨識到臉部，繪製耳環
  if (faces.length > 0 && currentEarring) {
    for (let face of faces) {
      // 根據 MediaPipe Face Mesh 的關鍵點索引，177 為右耳垂，361 為左耳垂
      // 這些索引是從模型角度看的，由於我們翻轉了畫面，所以視覺上的左右會相反
      // 視覺上在畫面左側的耳垂 (模型的右耳垂)
      let rightEarlobe = face.keypoints[177]; 
      // 視覺上在畫面右側的耳垂 (模型的左耳垂)
      let leftEarlobe = face.keypoints[361]; 

      let earringSize = 60; // 設定耳環圖片顯示的大小
      let moveRatio = 0.15; // 移動比率 (15%)
      let offX = earringSize * moveRatio;
      let offY = earringSize * moveRatio;

      // 繪製右耳耳環 (視覺上的左側)
      if (rightEarlobe) {
        let x = map(rightEarlobe.x, 0, capture.width, -displayW / 2, displayW / 2);
        let y = map(rightEarlobe.y, 0, capture.height, -displayH / 2, displayH / 2);
        
        // 往左(外)往上移動
        image(currentEarring, x - offX, y - offY, earringSize, earringSize);
      }

      // 繪製左耳耳環 (視覺上的右側)
      if (leftEarlobe) {
        let x = map(leftEarlobe.x, 0, capture.width, -displayW / 2, displayW / 2);
        let y = map(leftEarlobe.y, 0, capture.height, -displayH / 2, displayH / 2);
        
        // 往右(外)往上移動
        image(currentEarring, x + offX, y - offY, earringSize, earringSize);
      }
    }
  }

  // 移除所有水泡相關的程式碼
  // 3. 更新並繪製所有水泡
  // for (let i = bubbles.length - 1; i >= 0; i--) {
  //   bubbles[i].update();
  //   bubbles[i].display();
  //   // 如果水泡跑出影像上方或壽命結束，則移除（破掉）
  //   if (bubbles[i].isFinished(displayH)) {
  //     bubbles.splice(i, 1);
  //   }
  // }

  pop();
}

// 移除水泡類別
// class Bubble {
//   constructor(x, y) {
//     this.x = x;
//     this.y = y;
//     this.size = random(5, 15);
//     this.speedY = random(1, 3);
//     this.alpha = 200;
//   }

//   update() {
//     this.y -= this.speedY; // 往上串升
//     this.alpha -= 1.5;     // 逐漸變透明
//   }

//   display() {
//     stroke(255, this.alpha);
//     strokeWeight(1);
//     fill(255, 255, 0, this.alpha * 0.5); // 半透明黃色
//     circle(this.x, this.y, this.size);
//   }

//   isFinished(imgH) {
//     // 當水泡太透明，或超過中央影像範圍上方一定距離時視為破掉
//     return this.alpha < 0 || this.y < -imgH / 2 - 20;
//   }
// }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
