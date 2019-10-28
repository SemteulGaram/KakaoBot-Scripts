const scriptName="DcObserver.js";
const VERSION = 'v1.0';

const config = {
  targetLogRoom: 'EXAMPLE_TARGET_FOR_LOG',
  whitelist: [],
  blacklist: [],
  defaultObserveDelay: 10000,
  taskFile: '/sdcard/katalkbot/config/DcObserver.json',
  TAG: 'Observer> '
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
      if (!ids[id]) return;
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

function inspect(obj, options, _deep) {
  options = options || {};
  if (options.maxDeep === undefined) {
    options.maxDeep = 3;
  }
  _deep = _deep || 0;

  if (options.maxDeep <= _deep) return '' + obj;
  if (typeof obj === 'object' || obj !== null) {
    if (Array.isArray(obj)) {
      var aryStr = '[';
      var first = true;
      for (var i in obj) {
        if (!first) objStr += ', ';
        objStr += ((typeof obj === 'object' || obj !== null)
          ? inspect(obj[key], options, ++_deep)
          : '' + obj[key]);
        first = false;
      }

      return aryStr + ']'
    } else {
      var objStr = '{';
      var first = true;
      for (var key in obj) {
        if (!first) objStr += ', ';
        objStr += key + ': ' + ((typeof obj === 'object' || obj !== null)
          ? inspect(obj[key], options, ++_deep)
          : '' + obj[key]);
        first = false;
      }

      return objStr + '}';
    }
  }
  return '' + obj;
}

function isValidScriptName() {
  const names = Api.getScriptNames();
  if (!Array.isArray(names)) {
    reportError(config.TAG + 'Api.getScriptNames() return value is not Array');
    return false;
  }

  if (names.indexOf(scriptName) === -1) {
    reportError(config.TAG + 'Script filename must be "' + scriptName + '"!'
      + '\nThis will crash intervals.\nScript not enabled');
    return false;
  }
  return true;
}

function isOn() {
  return Api.isOn(scriptName);
}

// ==========
// script area
// ==========
const local = {
  init: false,
  data: null,
  intervalUid: null
}

function sendLog() {
  if (Api.canReply(config.targetLogRoom))
    Api.sendChat(config.targetLogRoom, Array.prototype.slice.call(arguments).map(v => {
      return (typeof v === 'object' || v !== null) ? inspect(v) : '' + v;
    }).join(' '));
}

function reportError() {
  const log = Array.prototype.slice.call(arguments).map(v => {
    return (typeof v === 'object' || v !== null) ? inspect(v) : '' + v;
  }).join(' ');
  Log.error(log);
  sendLog.call(this, log);
}

function loadTask() {
  const content = FileStream.read(config.taskFile);
  if (content === null) {
    // init
    local.data = {
      // { gid: [GalleryId], pattern: [ 'match1', 'match2' ] }
      search: []
    }
    return;
  }
}
function saveTask() {
  if (data === null) return;
  try {
    FileStream.write(config.taskFile, JSON.stringify(local.data));
  } catch (err) {
    // TODO
    reportError('')
  }
}

function _dcObserving(galleryId, searchOptions) {
  //var s='target',
  //r=Array.prototype.slice.call(Utils.parse('https://gall.dcinside.com/mgallery/board/lists?id=gid').getElementsByClass('ub-word').toArray()).map(v => (''+v).match(/<\/em>(.*?)<\/a>/)[1]).filter(v => { return !!v.match(s) })
  //r.length > 0 ? '검색결과:\n' + r.join('\n') : s + ' 키워드 결과 없음'
}

function _runObservingSchedule() {
  if (local.intervalUid !== null) {
    clearTimeout(local.intervalUid);
    local.intervalUid = null;
  }

  // run multiple dcObserving
}

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
  // initialize handle
  if (!init) {
    if (!isValidScriptName()) {
      return;
    }
    loadTask();
    init = true;
  }

  // command handle
  // whitelist blacklist check
  if (room !== config.targetRoom) return;
  msg += '';
  if (msg[0] !== '/') return;
  const cmd = msg.split(' ');
  switch (cmd[0]) {
    case '/help':
      // TODO
      //replier.reply('');
      break;
  }
}
