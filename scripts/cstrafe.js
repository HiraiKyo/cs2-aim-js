import { CSPlayerPawn, Instance } from "cs_script/point_script";

// ストッピング精度検証ツール
// Counter-strafe timing analyzer

// プレイヤーごとの状態管理
var playerStates = {};

// プレイヤーの状態を初期化
function getPlayerState(slot) {
  if (!playerStates[slot]) {
    playerStates[slot] = {
      // 水平方向（A, D）の状態
      horizontal: {
        heldKeys: new Set(),
        pressTimes: {},
        csReleaseKey: null,
        csReleaseTime: null,
        csPressKey: null,
        csPressTime: null,
        overlapStartTime: null
      },
      // 統計情報
      stats: {
        totalShots: 0,
        counterStrafes: 0,
        overlaps: 0,
        badShots: 0
      }
    };
  }
  return playerStates[slot];
}

// 現在のタイムスタンプを取得（ミリ秒）
function getTimestamp() {
  return Instance.GetTime() * 1000;
}

// キーが押された時の処理
function onKeyPress(state, key, timestamp) {
  var axis = state.horizontal;
  var otherKey = (key === "A") ? "D" : "A";
  
  axis.heldKeys.add(key);
  axis.pressTimes[key] = timestamp;
  
  // 両方のキーが同時に押されている場合（Overlap検出）
  if (axis.heldKeys.has(otherKey) && axis.overlapStartTime === null) {
    axis.overlapStartTime = timestamp;
  }
  
  // カウンターストレイフの検出
  if (axis.csReleaseKey === otherKey && axis.csPressTime === null) {
    axis.csPressKey = key;
    axis.csPressTime = timestamp;
  }
}

// キーが離された時の処理
function onKeyRelease(state, key, timestamp) {
  var axis = state.horizontal;
  
  axis.heldKeys.delete(key);
  axis.csReleaseKey = key;
  axis.csReleaseTime = timestamp;
  axis.csPressKey = null;
  axis.csPressTime = null;
  
  // Overlapが終了
  if (axis.overlapStartTime !== null && axis.heldKeys.size < 2) {
    axis.overlapStartTime = null;
  }
}

// 射撃時の分類
function classifyShot(state, shotTime) {
  var axis = state.horizontal;
  var result = {
    label: "Bad",
    csTime: null,
    shotDelay: null,
    overlapTime: null
  };
  
  // Overlap検出
  if (axis.overlapStartTime !== null) {
    // カウンターストレイフがOverlapの後に発生した場合は除外
    if (!(axis.csPressTime !== null && 
          axis.csReleaseTime !== null && 
          axis.csReleaseTime > axis.overlapStartTime && 
          axis.csPressTime > axis.csReleaseTime)) {
      result.label = "Overlap";
      result.overlapTime = shotTime - axis.overlapStartTime;
      resetAxis(axis);
      return result;
    }
  }
  
  // Counter-strafe検出
  if (axis.csPressTime !== null && 
      axis.csReleaseTime !== null && 
      axis.csPressTime > axis.csReleaseTime) {
    var csTime = axis.csPressTime - axis.csReleaseTime;
    var shotDelay = shotTime - axis.csPressTime;
    
    // 有効なカウンターストレイフかチェック
    if (shotDelay <= 230 && !(csTime > 215 && shotDelay > 215)) {
      result.label = "Counter-strafe";
      result.csTime = csTime;
      result.shotDelay = shotDelay;
    } else {
      result.label = "Bad";
      result.csTime = csTime;
      result.shotDelay = shotDelay;
    }
    
    resetAxis(axis);
    return result;
  }
  
  resetAxis(axis);
  return result;
}

// 軸の状態をリセット
function resetAxis(axis) {
  axis.csReleaseKey = null;
  axis.csReleaseTime = null;
  axis.csPressKey = null;
  axis.csPressTime = null;
  axis.overlapStartTime = null;
}

// 結果を表示
function displayResult(slot, result, state, playerPawn) {
  state.stats.totalShots++;
  
  // 画面上部に表示する情報
  var screenText = "Shot #" + state.stats.totalShots + " - " + result.label;
  var detailText = "";
  var color = { r: 255, g: 255, b: 255 };
  
  if (result.label === "Counter-strafe") {
    state.stats.counterStrafes++;
    screenText += "\nCS: " + result.csTime.toFixed(0) + "ms | Shot: " + result.shotDelay.toFixed(0) + "ms";
    color = { r: 34, g: 139, b: 34 }; // 緑
  } else if (result.label === "Overlap") {
    state.stats.overlaps++;
    screenText += "\nOverlap: " + result.overlapTime.toFixed(0) + "ms";
    color = { r: 255, g: 140, b: 0 }; // オレンジ
  } else {
    state.stats.badShots++;
    if (result.csTime !== null && result.shotDelay !== null) {
      screenText += "\nCS: " + result.csTime.toFixed(0) + "ms | Shot: " + result.shotDelay.toFixed(0) + "ms";
    }
    color = { r: 204, g: 0, b: 0 }; // 赤
  }
  
  screenText += "\nStats: " + state.stats.counterStrafes + " / " + state.stats.overlaps + " / " + state.stats.badShots;
  
  // 画面上に表示（開発環境のみ動作）
  Instance.DebugScreenText({
    text: screenText,
    x: 0.5,
    y: 0.3,
    duration: 3,
    color: color
  });
  
  // チャット風のメッセージを作成
  var chatMessage = "[cStrafe] Shot #" + state.stats.totalShots + ": " + result.label;
  if (result.label === "Counter-strafe") {
    chatMessage += " (CS: " + result.csTime.toFixed(0) + "ms, Shot: " + result.shotDelay.toFixed(0) + "ms)";
  } else if (result.label === "Overlap") {
    chatMessage += " (Overlap: " + result.overlapTime.toFixed(0) + "ms)";
  } else if (result.csTime !== null && result.shotDelay !== null) {
    chatMessage += " (CS: " + result.csTime.toFixed(0) + "ms, Shot: " + result.shotDelay.toFixed(0) + "ms)";
  }
  
  // チャット欄に表示するため、point_clientcommandエンティティを使用
  // プレイヤーにメッセージを送信
  var controller = playerPawn.GetPlayerController();
  if (controller) {
    // say コマンドでチャットに表示
    Instance.EntFireAtName({
      name: "!self",
      input: "Command",
      value: 'say "' + chatMessage + '"',
      caller: controller,
      delay: 0
    });
  }
  
  // コンソールにも出力
  Instance.Msg(chatMessage);
}

// ===== イベントハンドラ =====

Instance.OnScriptInput("A_Pressed", (data) => {
  if(!(data.caller instanceof CSPlayerPawn)) {
    return;
  }

  var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
  if (slot === undefined) {
    return;
  }

  var state = getPlayerState(slot);
  var timestamp = getTimestamp();
  onKeyPress(state, "A", timestamp);
});

Instance.OnScriptInput("A_Released", (data) => {
  if(!(data.caller instanceof CSPlayerPawn)) {
    return;
  }

  var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
  if (slot === undefined) {
    return;
  }

  var state = getPlayerState(slot);
  var timestamp = getTimestamp();
  onKeyRelease(state, "A", timestamp);
});

Instance.OnScriptInput("D_Pressed", (data) => {
  if(!(data.caller instanceof CSPlayerPawn)) {
    return;
  }

  var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
  if (slot === undefined) {
    return;
  }

  var state = getPlayerState(slot);
  var timestamp = getTimestamp();
  onKeyPress(state, "D", timestamp);
});

Instance.OnScriptInput("D_Released", (data) => {
  if(!(data.caller instanceof CSPlayerPawn)) {
    return;
  }

  var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
  if (slot === undefined) {
    return;
  }

  var state = getPlayerState(slot);
  var timestamp = getTimestamp();
  onKeyRelease(state, "D", timestamp);
});

Instance.OnScriptInput("Fire_Pressed", (data) => {
  if(!(data.caller instanceof CSPlayerPawn)) {
    return;
  }

  var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
  if (slot === undefined) {
    return;
  }

  var state = getPlayerState(slot);
  var timestamp = getTimestamp();
  var result = classifyShot(state, timestamp);
  displayResult(slot, result, state, data.caller);
});

Instance.OnScriptInput("Fire_Released", (data) => {
  if(!(data.caller instanceof CSPlayerPawn)) {
    return;
  }

  var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
  if (slot === undefined) {
    return;
  }
});