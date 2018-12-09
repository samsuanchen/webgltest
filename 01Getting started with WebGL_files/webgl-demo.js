var gl; // 一個WebGL的全域變數
function main() {
  var canvas = document.getElementById("glcanvas");

  // 初始化 GL 背景資料
  gl = initWebGL(canvas);
  
  // 只在 WebGL 可取得且運行時繼續
  if (!gl) {
    return;
  }

  // 設定清除色為黑，完全不透明
  gl.clearColor(0.5, 0.5, 0.5, 1.0);
  // 開啟景深測試
  gl.enable(gl.DEPTH_TEST);
  // 近物存在使遠物模糊
  gl.depthFunc(gl.LEQUAL);
  // 清除色彩以及景深緩衝區
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
function initWebGL(canvas) {
  gl = null;
  
  // 嘗試獲得標準背景資料。如果失敗，退而獲取試驗版本
  gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  
  // 如果再次失敗則放棄
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  
  return gl;
}
main();