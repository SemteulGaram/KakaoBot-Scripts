const scriptName="ViseAlert-Client.js";
const VERSION = 'v1.0';

const config = {
  targetRoom: 'EXAMPLE_TARGET',
  targetLogRoom: 'EXAMPLE_TARGET_FOR_LOG',
  targetDataRoom: 'EXAMPLE_TARGET_FOR_DATA_LINK',
  scriptDataTag: 'VA|',
  TAG: 'ViseAlert> '
};

const BroadcastReceiver = android.content.BroadcastReceiver;
const IntentFilter = android.content.IntentFilter;
const Intent = android.content.Intent;

const local = {
  status: 'NOTREADY',
  lastSleep: Date.now(),
  lastAwake: Date.now()
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

const phoneUnlockReceiver = new JavaAdapter(BroadcastReceiver, {
  onReceive: function(context, intent) {
    try {
      // if (!isOn()) return; No Need to block
      if (intent.getAction().equals(Intent.ACTION_USER_PRESENT)) {
        local.lastAwake = Date.now();
      } else if (intent.getAction().equals(Intent.ACTION_SCREEN_OFF)) {
        local.lastSleep = Date.now();
      }
    } catch (err) {
      Log.error(err);
    }
  }
});

const receiverFilter = new IntentFilter();
receiverFilter.addAction(Intent.ACTION_USER_PRESENT);
receiverFilter.addAction(Intent.ACTION_SCREEN_OFF);

Api.getContext().registerReceiver(phoneUnlockReceiver, receiverFilter);

function isReady() {
  if (!Api.canReply(config.targetLogRoom)) {
    if (local.status !== 'NOTREADY1') {
      local.status = 'NOTREADY1';
      Log.info(config.TAG + '"' + config.targetLogRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다');
    }
    return false;
  } else if (!Api.canReply(config.targetRoom)) {
    if (local.status !== 'NOTREADY2') {
      local.status = 'NOTREADY2';
      sendChat(config.TAG + '"' + config.targetRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다');
    }
    return false;
  } else if (!Api.canReply(config.targetDataRoom)) {
    if (local.status !== 'NOTREADY3') {
      local.status = 'NOTREADY3';
      sendChat(config.TAG + '"' + config.targetDataRoom
      + '" 채팅방으로 부터 메시지를 수신해야 업데이트가 시작됩니다');
    }
    return false;
  }
  return true
}

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
  if (!isOn()) {
    Log.error(scriptName + '스크립트가 메시지를 수신했지만 비활성화 상태로 표시됩니다.'
      + '\nscriptName을 확인해주세요.', true);
    Api.makeNoti(scriptName, '스크립트가 메시지를 수신했지만 비활성화 상태로 표시됩니다.'
      + '\nscriptName을 확인해주세요.', 7101);
    return;
  }
  // ready script
  if (!isReady()) return;

  // Is target data chat room
  if (room !== config.targetDataRoom) return;
  
  if (msg.length >= config.scriptDataTag.length && msg.substring(0, config.scriptDataTag.length) === config.scriptDataTag) {
    const content = msg.substring(config.scriptDataTag.length, msg.length);
    
    try {
      const data = JSON.parse(content);
      if (data.t === 1) { // getAwakeInfo
        sendData({
          t: 1,  // type: getAwakeInfo response
          i: data.i,  // id
          a: (local.lastAwake >= local.lastSleep ? 1 : 0),  // isAwake
          l: Date.now() - local.lastSleep // last sleep lapse
        });
      }
    } catch (err) {
      sendLog(err);
    }
  }
}

function onStartCompile() {
  Api.getContext().unregisterReceiver(phoneUnlockReceiver);
}

function onCreate(savedInstanceState,activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}