const scriptName="ViseAlert-Receiver.js";
const VERSION = 'v1.0';

const config = {
  targetRoom: 'EXAMPLE_TARGET',
  targetLogRoom: 'EXAMPLE_TARGET_FOR_LOG',
  targetDataRoom: 'EXAMPLE_TARGET_FOR_DATA_LINK',
  scriptDataTag: 'VA|',
  requestTimeout: 5000,
  waitResponseTime: 10000,
  callCooltime: 300000,
  callName: ['NICK_NAME', 'ALIAS_NAME', 'ANOTHOR_NAME'],
  callerName: ['NICK_NAME', 'ALIAS_NAME', 'ANOTHOR_NAME'],
  startHourMin: [23, 0],
  endHourMin: [1, 0],
  afkTime: 1800000
  TAG: 'ViseAlert> '
};

// setInterval in Rhino: https://stackoverflow.com/a/22337881
;(function(global) {
  var timer = new java.util.Timer();
  var counter = 1;
  var ids = {};

  global.setTimeout = function(fn, delay) {
      var id = counter;
      counter += 1;
      ids[id] = new JavaAdapter(java.util.TimerTask, { run : fn });
      timer.schedule(ids[id], delay);
      return id;
  };

  global.clearTimeout = function(id) {
      ids[id].cancel();
      timer.purge();
      delete ids[id];
  };

  global.setInterval = function(fn, delay) {
      var id = counter;
      counter += 1;
      ids[id] = new JavaAdapter(java.util.TimerTask, { run : fn });
      timer.schedule(ids[id], delay, delay);
      return id;
  };

  global.clearInterval = global.clearTimeout;

  // exports object in case of "isCommonJS"
  global.exports = {};

})(this);

const local = {
  status: 'NOTREADY',
  requestId: 0,
  requestAt: 0,
  requestTimeoutUid: null,
  lastData: {},
  lastRequestAt: 0
}

function isOn() {
  return Api.isOn(scriptName);
}

function sendChat(msg) {
  if (Api.canReply(config.targetRoom))
    Api.replyRoom(config.targetRoom, '' + msg);
}

function sendLog(msg, isError, showToast) {
  msg = '' + msg;
  if (isError) {
    Log.error(msg, !!showToast);
  } else {
    Log.info(msg);
  }
  if (Api.canReply(config.targetLogRoom))
    Api.replyRoom(config.targetLogRoom, msg);
}

function sendData(obj) {
  if (Api.canReply(config.targetDataRoom))
    Api.replyRoom(config.targetDataRoom, config.scriptDataTag + JSON.stringify(obj));
}

function isReady() {
  if (!Api.canReply(config.targetLogRoom)) {
    if (local.status !== 'NOTREADY1') {
      local.status = 'NOTREADY1';
      Log.info('VAR> "' + config.targetLogRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다');
    }
    return false;
  } else if (!Api.canReply(config.targetRoom)) {
    if (local.status !== 'NOTREADY2') {
      local.status = 'NOTREADY2';
      sendLog('VAR> "' + config.targetRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다', true, true);
    }
    return false;
  } else if (!Api.canReply(config.targetDataRoom)) {
    if (local.status !== 'NOTREADY3') {
      local.status = 'NOTREADY3';
      sendLog('VAR> "' + config.targetDataRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다', true, true);
    }
    return false;
  }
  return true
}

function isRequestExpired() {
  return !local.requestAt || (local.requestAt + config.requestTimeout) < Date.now())
}

function hasRequestTimeout() {
  return !!local.requestTimeoutUid;
}

function setRequestTimeout() {
  if (hasRequestTimeout()) return;
  local.requestTimeoutUid = setTimeout(_doRequestTimeout, config.requestTimeout);
}

function clearRequestTimeout() {
  if (!hasRequestTimeout()) return;
  clearTimeout(local.requestTimeoutUid);
  local.requestTimeoutUid = null;
}

function _doRequestTimeout() {
  clearRequestTimeout();
  try {
    if (!isOn()) return;
    local.requestId++;  // 만약 응답이 나중에 돌아오더라도 무시되게 Id를 넘겨버림
    sendChat(config.TAG + '"' + local.lastData.callname + '"' + '카카오톡으로부터 응답이 없습니다.');
    // TODO: Alternative task
  } catch (err) {
    sendLog(err, true, true);
  }
}

function doTask(callname, sender) {
  // Handle cooltime
  const now = Date.now();
  if (now - local.lastRequestAt < config.callCooltime) {
    Log.debug('VAR>doTask> ignore by cooltime');
    return;
  }
  local.lastRequestAt = now;
  
  // Handle previous timeout
  if (hasRequestTimeout()) {
    if (isRequestExpired()) _doRequestTimeout();
    return;
  }
  
  // set last request data
  local.lastData = { callname, sender };
  const id = ++local.requestId;
  
  // send request
  sendData({
    t: 1,
    i: id
  });
}

function handleResponse (content) {
  try {
    const data = JSON.parse(content);
    if (data.t === 1  // getAwakeInfo
      && data.i === local.requestId) {
      
      clearRequestTimeout();
      if (!data.a && data.l > config.afkTime) {
        // sendChat(config.TAG + '조건을 만족했습니다'
      }
    }
  } catch (err) {
    sendLog(err, true, true);
  }
}

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
  if (!isOn()) {
    Log.error('VAR> ' + scriptName + '스크립트가 메시지를 수신했지만 비활성화 상태로 표시됩니다.'
      + '\nscriptName을 확인해주세요.', true);
    Api.makeNoti('VAR> ' + scriptName, '스크립트가 메시지를 수신했지만 비활성화 상태로 표시됩니다.'
      + '\nscriptName을 확인해주세요.', 7101);
    return;
  }
  // ready script
  if (!isReady()) return;

  // Is target chat room
  if (room === config.targetRoom) {
    // Is last request handle?
    // TODO: last request handle

    const current = new Date();
    const cHours = current.getHours();
    const cMinutes = current.getMinutes()
    const s = config.startHourMin;
    const e = config.endHourMin;

    // Is target time
    if (!((s[0] === e[0] ? s[1] > e[1] : s[0] > e[0]) ?
      ((s[0] === cHours ? s[1] <= cMinutes : s[0] <= cHours)
      || (e[0] === cHours ? e[1] >= cMinutes : e[0] >= cHours))
      : ((s[0] === cHours ? s[1] >= cMinutes : s[1] >= cHours)
      && (e[0] === cHours ? e[1] <= cMinutes : e[1] <= cHours))
      )) return;

    for (var i in config.callerName) {
      // Is target caller name
      if (config.callerName[i] !== sender) continue;

      for (var i in config.callName) {
        // Is target call name
        if (!msg.match(config.callName[i])) continue;

        const cCallName = config.callName[i];
        doTask(cCallName, sender);
        return;
      }
    }
  } else if (room === config.targetDataRoom) {
    // Check valid data
    if (msg.length >= config.scriptDataTag.length && msg.substring(0, config.scriptDataTag.length) === config.scriptDataTag) {
      handleResponse(msg.substring(config.scriptDataTag.length, msg.length));
    }
  }
}

function onStartCompile() {

}

function onCreate(savedInstanceState,activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}