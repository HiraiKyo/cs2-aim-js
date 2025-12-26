import { CSPlayerPawn, Instance } from "cs_script/point_script";

var playerStates = {};


function getPlayerState(slot) {
  if (!playerStates[slot]) { //init
    playerStates[slot] = {
      inputs: {
        W: {
          pressedAt: null,
          releasedAt: null
        },
        S: {
          pressedAt: null,
          releasedAt: null
        },
        A: {
          pressedAt: null,
          releasedAt: null
        },
        D: {
          pressedAt: null,
          releasedAt: null
        }
      },
      result: {
        playerSpeed: 0,
        horizontalOverlapTime: 0,
        verticalOverlapTime: 0,
        cstrafeHoldTime: 0,
        shotTimeAfterCstrafeRelease: 0,
        status: null, // "fine", "overlapped", "bad", "unknown"
        error: {
          code: null,
          message: null
        }
      },
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

function analyzeCounterStrafe(slot, shotTime) {
  var state = getPlayerState(slot);
  // horizontal key analyzation
  var leftPressedAt = state.inputs[scriptInputs.A.key].pressedAt;
  var leftReleasedAt = state.inputs[scriptInputs.A.key].releasedAt;
  var rightPressedAt = state.inputs[scriptInputs.D.key].pressedAt;
  var rightReleasedAt = state.inputs[scriptInputs.D.key].releasedAt;
  
  try {
    // プレイヤーの移動速度を取得
    var player = Instance.GetPlayerController(slot);
    var pawn = player?.GetPlayerPawn();
    var velocity = pawn?.GetLocalVelocity();
    var angle = pawn?.GetLocalAngles();
    Instance.Msg(`[cStrafe] Velocity: x=${velocity.x}, y=${velocity.y}, z=${velocity.z}`);
    Instance.Msg(`[cStrafe] Angle: pitch=${angle.pitch}, yaw=${angle.yaw}, roll=${angle.roll}`);
    var localVelocity = transformVelocityToStrafeDirection(velocity, angle);
    var strafeSpeed = localVelocity.y;
    state.result.playerSpeed = strafeSpeed;

    if (leftPressedAt < rightPressedAt) { // leftmove cstrafe
      state.result.horizontalOverlpTime = leftReleasedAt - rightPressedAt;
      if (!rightReleasedAt) {
        state.result.cstrafeHoldTime = shotTime - rightPressedAt;
        state.result.shotTimeAfterCstrafeRelease = 0;
      } else {
        state.result.cstrafeHoldTime = rightReleasedAt - rightPressedAt;
        state.result.shotTimeAfterCstrafeRelease = shotTime - rightReleasedAt;
      }
    } else if (rightPressedAt < leftPressedAt) { // rightmove cstrafe
      state.result.horizontalOverlapTime = rightReleasedAt - leftPressedAt;
      if (!leftReleasedAt) {
        state.result.cstrafeHoldTime = shotTime - leftPressedAt;
        state.result.shotTimeAfterCstrafeRelease = 0;
      } else {
        state.result.cstrafeHoldTime = leftReleasedAt - leftPressedAt;
        state.result.shotTimeAfterCstrafeRelease = shotTime - leftReleasedAt;
      }
    } else {
      state.result.error = {
        code: "NO_HORIZONTAL_CSTRAFE",
        message: "No horizontal counter-strafe detected."
      }
      state.result.status = "unknown";
      return;
    }

    // evaluation
    if (strafeSpeed > 80) {
      state.result.status = "early";
      return;
    }
    if (strafeSpeed < -80) {
      state.result.status = "toolong";
      return;
    }
    if (state.result.horizontalOverlapTime > 0) {
      state.result.status = "overlapped";
      return;
    }
    if (state.result.shotTimeAfterCstrafeRelease > 20) {
      state.result.status = "toolatetoshoot";
      return;
    }
    state.result.status = "fine";
  } catch (e) {
    Instance.Msg("[cStrafe] Error analyzing counter-strafe: " + e.message);
    state.result.error = {
      code: "ANALYSIS_ERROR",
      message: e.message
    }
  }
}

var Colors = {
  fine: { r: 0, g: 255, b: 0, a: 255 }, // Green
  overlapped: { r: 255, g: 255, b: 0, a: 255 }, // Yellow
  bad: { r: 255, g: 0, b: 0, a: 255 }, // Red
  early: { r: 255, g: 0, b: 0, a: 255 }, // Red
  toolong: { r: 255, g: 0, b: 0, a: 255 }, // Red
  toolatetoshoot: { r: 128, g: 0, b: 128, a: 255 }, // Purple
  unknown: { r: 255, g: 255, b: 255, a: 255 } // White
}
var StatusSymbols = {
  fine: "✓",
  overlapped: "⚠",
  bad: "✗",
  early: "◄",
  toolong: "►►",
  toolatetoshoot: "⬤",
  unknown: "?"
}
function displayResult(slot) {
  var state = getPlayerState(slot);
  var result = state.result;
  var screenText = `${result.status}, ${result.playerSpeed.toFixed(2)} units/s, ${result.horizontalOverlapTime}ms, ${result.cstrafeHoldTime}ms, ${result.shotTimeAfterCstrafeRelease}ms`;
  var color = 
    result.status in Colors ?
    Colors[result.status] :
    Colors["unknown"];

    // コンソールに出力
  Instance.Msg(screenText);

  // 画面上に表示（開発環境のみ動作）
  Instance.DebugScreenText({
    text: screenText,
    x: 320,
    y: 160,
    duration: 3,
    color: color
  });

  // チャットに表示
  Instance.ServerCommand(`say ${StatusSymbols[result.status]} ${screenText}\x01`);
}

function onKeyPress(slot, alias, timestamp) {
  if (alias === "Fire") {
    analyzeCounterStrafe(slot, timestamp);
    displayResult(slot)
    return;
  }
  var state = getPlayerState(slot);
  state["inputs"][alias].pressedAt = timestamp;
  state["inputs"][alias].releasedAt = null;
}

function onKeyRelease(slot, alias, timestamp) {
  if (alias === "Fire") {
    return;
  };
  
  var state = getPlayerState(slot);
  state["inputs"][alias].releasedAt = timestamp;
}

/** Utils */
function getTimestamp() {
  return Instance.GetGameTime() * 1000;
}

/**
 * @param {{ x: number, y: number, z: number }} velocity 
 * @param {{ pitch: number, yaw: number, roll: number }} angle 
 */
function transformVelocityToStrafeDirection(velocity, angle) {
  // 座標系変換
  var rad = angle.yaw * (Math.PI / 180);
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);

  var x = velocity.x * cos + velocity.y * sin;
  var y = -velocity.x * sin + velocity.y * cos;
  var z = velocity.z;

  return { x, y, z };
}

// ===== イベントハンドラ =====
var scriptInputs = {
  W: {
    pressed: "W_Pressed",
    released: "W_Released",
    key: "W"
  },
  S: {
    pressed: "S_Pressed",
    released: "S_Released",
    key: "S"
  },
  A: {
    pressed: "A_Pressed",
    released: "A_Released",
    key: "A"
  },
  D: {
    pressed: "D_Pressed",
    released: "D_Released",
    key: "D"
  },
  Fire: {
    pressed: "Fire_Pressed",
    released: "Fire_Released",
    key: "MOUSE1"
  }
}

for (const [key, input] of Object.entries(scriptInputs)) {
  Instance.OnScriptInput(input.pressed, (data) => {
    // Instance.Msg("Script Input Received: " + input.pressed);
    if(!(data.caller instanceof CSPlayerPawn)) {
      return;
    }
    var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
    if (slot === undefined) {
      return;
    }
    var timestamp = getTimestamp();
    onKeyPress(slot, key, timestamp);
  });
  Instance.OnScriptInput(input.released, (data) => {
    // Instance.Msg("Script Input Received: " + input.released);
    if(!(data.caller instanceof CSPlayerPawn)) {
      return;
    }
    var slot = data.caller.GetPlayerController()?.GetPlayerSlot();
    if (slot === undefined) {
      return;
    }
    var state = getPlayerState(slot);
    var timestamp = getTimestamp();
    onKeyRelease(slot, key, timestamp);
  });
}