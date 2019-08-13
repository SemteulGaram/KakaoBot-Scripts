const scriptName="ViseAlert.js";
const VERSION = 'v1.0';

const config = {
  targetRoom: 'EXAMPLE_TARGET',
  targetLogRoom: 'EXAMPLE_TARGET_FOR_LOG',
  callName: ['NICK_NAME', 'ALIAS_NAME', 'ANOTHOR_NAME'],
  callerName: ['NICK_NAME', 'ALIAS_NAME', 'ANOTHOR_NAME'],
  startHourMin: [23, 0],
  endHourMin: [1, 0],
  TAG: 'ViseAlert'
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
  status: 'NOTREADY'
}

function sendChat(msg) {
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

function isReady() {
  if (!Api.canReply(config.targetLogRoom)) {
    if (local.status !== 'NOTREADY1') {
      local.status = 'NOTREADY1';
      Log.info(config.TAG + '> "' + config.targetLogRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다');
    }
    return false;
  } else if (!Api.canReply(config.targetRoom)) {
    if (local.status !== 'NOTREADY2') {
      local.status = 'NOTREADY2';
      sendChat(config.TAG + '> "' + config.targetRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다');
    }
    return false;
  }
  return true
}

function doTask(callname, sender) {
  sendLog(config.TAG + '> ' + sender + ' call you: ' + callname);
}

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
  // ready script
  if (!isReady()) return;

  // Is target chat room
  if (room !== config.targetRoom) return;

  const current = new Date();
  const cHours = current.getHours();
  const cMinutes = current.getMinutes()
  const s = config.startHourMin;
  const e = config.endHourMin;

  // Is target time
  if (!((s[0] === e[0] ? s[1] > e[1] : s[0] > e[0]) ?
    ((s[0] === cHours ? s[1] <= cMinutes : s[0] <= cHours)
    || (e[0] === cHours ? e[1] >= cMinutes : e[0] >= cMinutes)
    : ((s[0] === cHours ? s[1] >= cMinutes : s[1] >= cHours)
    && (e[0] === cHours ? e[1] <= cMinutes : e[1] <= cMinutes))
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
}

function onStartCompile() {

}

function onCreate(savedInstanceState,activity) {

}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
