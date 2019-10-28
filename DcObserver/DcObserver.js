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
      + '\nIf not, it will crash intervals.\nScript not enabled');
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
  intervalUid: null,
  interaction: {}
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
  if (content == null) {
    // init
    local.data = {
      // { gid: [GalleryId], pattern: [ 'match1', 'match2' ] }
      search: []
    }
    return;
  }
  local.data = content;
  if (local.data.search == undefined) {
    reportError(config.TAG + 'TaskFile search data missing!');
    local.data.search = {};
  }
}

function saveTask() {
  if (local.data === null) return;
  try {
    FileStream.write(config.taskFile, JSON.stringify(local.data));
  } catch (err) {
    reportError(config.TAG + 'Can not save TaskFile', err);
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

  // TODO: run multiple dcObserving
}

function _checkAndAddTask(task, room) {
  try {
    Utils.parse('https://gall.dcinside.com/mgallery/board/lists?id='
      + encodeURIComponent(task.gid))
  } catch (err) {
    if (err != null && err.message && err.message.match('Status=404')) {
      Api.replyRoom(room, config.TAG
        + '연결 요청 응답 404.\n존재하지 않는 갤러리:\n' + task.gid);
      return;
    }
    Api.replyRoom(room, config.TAG + '알 수 없는 연결 오류. 등록 실패\n' + err);
    return;
  }

  local.data.search.push(task);
  saveTask();
  Api.replyRoom(room, config.TAG + '연결 성공. 패턴 등록 완료')
}

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId) {
  // initialize handle
  if (!local.init) {
    if (!isValidScriptName()) {
      return;
    }
    loadTask();
    local.init = true;
  }

  // command handle
  // TODO: whitelist blacklist check
  msg += '';
  const uid = room + '|' + sender + '|' + ImageDB.getProfileImage();

  if (local.interaction[uid]) {
    const inter = local.interaction[uid];
    if (msg.split(' ')[0] === '/cancel') {
      delete local.interaction[uid];
      replier.reply(config.TAG + '취소됨');
      return;
    }
    switch(inter.type) {
      case 'addObserver|1':
        // comand part
        if (msg[0] === '/') {
          var cmd = msg.split(' ');
          switch(cmd[0]) {
            default:
              replier.reply(config.TAG + '유효하지 않은 명령어:\n' + msg);
          }
          break;
        }

        replier.reply(config.TAG + '추가될 갤러리 ID:\n' + msg
          + '\n\n제목에서 감지할 단어 입력하세요'
          + '\n/cancel 작업 취소');

        inter.detail = {};
        inter.detail.gid = msg;
        inter.detail.pattern = [];
        inter.type = 'addObserver|2';
        break;

      case 'addObserver|2':
        // comand part
        if (msg[0] === '/') {
          var cmd = msg.split(' ');
          switch(cmd[0]) {
            case '/end':
              if (inter.detail.pattern.length === 0) {
                replier.reply(config.TAG + '검색할 패턴이 없으므로 완료할 수 없습니다'
                  + '\n\n계속 단어를 입력하거나\n/cancel 작업 취소');
                break;
              }
              _checkAndAddTask({
                gid: inter.detail.gid,
                pattern: inter.detail.pattern
              }, room);
              delete local.interaction[uid];
              break;
            default:
              replier.reply(config.TAG + '유효하지 않은 명령어:\n' + msg);
          }
          break;
        }

        inter.detail.pattern.push(msg);
        replier.reply(config.TAG + '다음 단어가 제목에 모두 포함되면 감지됨:'
          + '\n' + inter.detail.pattern.join(', ')
          + '\n\n계속 단어를 입력하거나\n/end 종료 혹은\n/cancel 작업 취소');
        break;
      default:
    }
    // update interaction instance when yet deleted
    if (local.interaction[uid]) local.interaction[uid] = inter;
    return;
  }

  if (msg[0] !== '/') return;
  var cmd = msg.split(' ');
  switch (cmd[0]) {
    case '/help':
      // TODO
      //replier.reply('');
      break;
    case '/addObserver':
      local.interaction[uid] = {
        type: 'addObserver|1'
      };
      replier.reply(config.TAG + '갤러리 ID를 입력하세요'
        + '\n\n(예시: 갤러리 페이지 주소의 https://gall.dcinside.com/mgallery/board/lists?id=[아이디] 부분의 아이디를 입력하세요)'
        + '\n\n/cancel 작업 취소');
      break;
    default:
      replier.reply(config.TAG + '유효하지 않은 명령어:\n' + msg);
  }
}