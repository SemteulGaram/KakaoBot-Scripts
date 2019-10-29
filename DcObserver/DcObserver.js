const scriptName="DcObserver.js";
const VERSION = 'v1.0';

const config = {
  TAG: 'Observer> ',
  targetLogRoom: 'EXAMPLE_TARGET_FOR_LOG',
  whitelist: [],
  blacklist: [],
  defaultObserveDelay: 10000,
  taskFile: '/sdcard/katalkbot/config/DcObserver.json',
  connectionRetryCount: 10
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
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      var aryStr = '[';
      var first = true;
      for (var i in obj) {
        if (!first) objStr += ', ';
        objStr += ((typeof obj === 'object' && obj !== null)
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
        objStr += key + ': ' + ((typeof obj === 'object' && obj !== null)
          ? inspect(obj[key], options, ++_deep)
          : '' + obj[key]);
        first = false;
      }

      return objStr + '}';
    }
  }
  return '' + obj;
}

function generateUid() {
  var uid = parseInt(Math.random()*0xFFFFFFFF).toString(16);
  while (uid.length < 8) uid = '0' + uid;
  return uid;
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
  init: false, // first run detect
  data: null, // task data
  intervalUid: null, // loop id
  lastUpdateAt: null, // loop missing solution
  interaction: {}, // user command interaction data,
  connectionFailCount: {}, // message is sent when config.connectionRetryCount is exceeded (key: galleryId)
  dcObservingLastStatus: {}, // cache of last status (key: galleryId)
  dcObservingCache: {} // copy of last list to detect new item (key: task.uid)
}

function sendLog() {
  if (Api.canReply(config.targetLogRoom))
    Api.replyRoom(config.targetLogRoom, Array.prototype.slice.call(arguments).map(v => {
      return (typeof v === 'object' && v !== null) ? inspect(v) : '' + v;
    }).join(' '));
}

function reportError() {
  const log = Array.prototype.slice.call(arguments).map(v => {
    return (typeof v === 'object' && v !== null) ? inspect(v) : '' + v;
  }).join(' ');
  Log.error(log);
  sendLog(log);
}

function loadTask() {
  const content = FileStream.read(config.taskFile);
  if (content == null) {
    // init
    local.data = {
      // { uid: [RandomString], targetRoom: [ChatRoom], gid: [GalleryId], isMinor: [isMinorGallery] pattern: [ 'match1', 'match2' ] }
      search: []
    }
    return;
  }
  local.data = JSON.parse(content);
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
    reportError(config.TAG + 'Can not save TaskFile\n' + inspect(err));
  }
}

function startTaskLoop() {
  stopTaskLoop();

  const task = function () {
    try {
      if (!isOn()) {
        return Log.debug(config.TAG + 'task loop terminated due to script disable');
      }
      _runObservingSchedule();
    } catch (err) {
      reportError(config.TAG + '작업 루프에서 핸들링 되지 않은 오류 발생'
        + '\n' + inspect(err));
    }
  }

  local.intervalUid = setTimeout(task.bind(this), config.defaultObserveDelay);
}

function stopTaskLoop() {
  if (local.intervalUid) clearTimeout(local.intervalUid);
  local.intervalUid = null;
}

function _dcObserving(galleryId, isMinor, taskList) {
  // ensure
  local.connectionFailCount[galleryId] = local.connectionFailCount[galleryId] || 0;
  local.dcObservingLastStatus[galleryId] = local.dcObservingLastStatus[galleryId] || null;

  // canReply check
  const filteredTaskList = taskList.filter(task => Api.canReply(task.targetRoom));
  if (taskList.length === 0) {
    if (local.dcObservingLastStatus[galleryId] !== 'ERRCANTREPLYALL') {
      local.dcObservingLastStatus[galleryId] = 'ERRCANTREPLYALL';
      reportError(config.TAG + '"' + galleryId + '" 갤러리의 알림을 받을 채팅방 모두에 답장을 할 수 없습니다.'
        + '\n' + taskList.map(v => { return v.targetRoom }).join(', ')
        + '\n해당 채팅방에서 메시지를 한번씩 수신하면 시작합니다');
    }
    return;
  }

  var jsoup = null;
  try {
    const url = (isMinor
      ? 'https://gall.dcinside.com/mgallery/board/lists?id='
      : 'https://gall.dcinside.com/board/lists?id=') + encodeURIComponent(galleryId);
    jsoup = Utils.parse(url);
  } catch (err) {
    if (++local.connectionFailCount[galleryId] == config.connectionRetryCount) {
      reportError(config.TAG + '연결 실패 횟수 '
        + local.connectionFailCount[galleryId] + '회 초과.\n"' + galleryId
        + '" 갤러리에 대해 옵저빙이 진행되지 않고 있습니다...\n\n마지막 오류:' + inspect(err));
    } else {
      Log.info(config.TAG + 'ConnectionFail----------\nURL:' + url
        + '\nAttempt: ' + local.connectionFailCount[galleryId] + '\nerr' + inspect(err));
    }
    return;
  }
  // reset count when success
  local.connectionFailCount[galleryId] = 0;

  // parse title elements
  const titleElements = Array.prototype.slice.call(jsoup.getElementsByClass('ub-word').toArray());
  const titleAndLinks = titleElements
    .map(v => {
      const title = v.wholeText().replace('\n', '');
      const href = 'https://gall.dcinside.com' + v.getElementsByTag('a').toArray()[0].attr('href');

      return [
        title,
        href
      ];
    });

  if (titleAndLinks.length === 0) {
    if (local.dcObservingLastStatus[galleryId] !== 'ERRTITLELISTEMPTY') {
      local.dcObservingLastStatus[galleryId] = 'ERRTITLELISTEMPTY';
      reportError(config.TAG + '"' + galleryId + '" 갤러리 포스트 목록 빔.'
        + '\n마이너 갤러리를 혼동하였거나 캅챠가 예상됨.');
    }
    return;
  }

  // reset status when success
  local.dcObservingLastStatus[galleryId] = null;

  var task = null;
  for (var i in filteredTaskList) {
    task = filteredTaskList[i];
    // TODO: task valid test
    const matchedTitles = titleAndLinks.filter(v => {
      var match = true;
      for (var j in task.pattern) {
        if (!v[0].includes(task.pattern[j])) {
          match = false;
          break;
        }
      }
      return match;
    });

    // first run ignored
    if (local.dcObservingCache[task.uid] != null) {
      for (var j in matchedTitles) {
        // new post detected
        if (local.dcObservingCache[task.uid].indexOf(matchedTitles[j][1]) === -1) {
          if (Api.canReply(task.targetRoom)) Api.replyRoom(task.targetRoom,
            config.TAG + '@게시글알림 [' + task.uid
              + ']\n' + task.pattern.join(', ')
              + '\n위 조건에 맞는 새 게시글이 등록되었습니다.'
              + '\n\n' + matchedTitles[j][0]
              + '\n' + matchedTitles[j][1]);
        }
      }
    }

    local.dcObservingCache[task.uid] = matchedTitles.map(v => v[1]);
  }
}

function _runObservingSchedule() {
  stopTaskLoop();

  // valid check
  if (!local.data || !local.data.search) {
    reportError(config.TAG
      + '_runObservingSchedule> 데이터가 로드되거나 초기화되지 못한 상태에서 작업 루프가 시작됨.'
      + '\n작업 루프가 강제로 중지됩니다');
    return;
  }

  // merge requests from the same gallery
  // { "[galleryId]": [[Task], [Task], ...], "[galleryId2]": ... }
  const requestList = new Map();
  var task = null;
  var list = null;
  for (var i in local.data.search) {
    task = local.data.search[i];
    list = requestList.get(task.gid);
    if (list === undefined) list = [];
    list.push(task);
    requestList.set(task.gid, list);
  }

  // do request
  const requestGalleryIds = Array.from(requestList.keys());
  for (var i in requestGalleryIds) {
    _dcObserving(requestGalleryIds[i], requestList.get(requestGalleryIds[i])[0].isMinor, requestList.get(requestGalleryIds[i]));
  }

  startTaskLoop();
}

function _checkAndAddTask(task) {
  try {
    Utils.parse((task.isMinor
      ? 'https://gall.dcinside.com/mgallery/board/lists?id='
      : 'https://gall.dcinside.com/board/lists?id=')
      + encodeURIComponent(task.gid));
  } catch (err) {
    if (err != null && err.message && err.message.match('Status=404')) {
      Api.replyRoom(task.targetRoom, config.TAG
        + '연결 요청 응답 404.\n존재하지 않는 갤러리:\n' + task.gid);
      return;
    }
    Api.replyRoom(task.targetRoom, config.TAG + '알 수 없는 연결 오류. 등록 실패\n' + inspect(err));
    return;
  }

  local.data.search.push(task);
  saveTask();
  Api.replyRoom(task.targetRoom, config.TAG + 'ID[' + task.uid
    + ']\n연결 성공. 패턴 등록 완료');
}

function userInteraction(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId, uid) {
  // alias
  const inter = local.interaction[uid];

  // cancel command handle
  if (msg.split(' ')[0] === '/cancel') {
    delete local.interaction[uid];
    replier.reply(config.TAG + '취소됨');
    return true;
  }

  // interaction type switch
  switch(inter.type) {
    case 'addObserver|1':
      // command handle
      if (msg[0] === '/') {
        var cmd = msg.split(' ');
        switch(cmd[0]) {
          default:
            replier.reply(config.TAG + '유효하지 않은 명령어:\n' + msg
              + '\n/cancel 현 작업 취소');
        }
        break;
      }

      // new pattern
      replier.reply(config.TAG + '추가될 갤러리 ID:\n' + msg
        + '\n\n갤러리가 일반 갤러리면 "일반"'
        + '\n마이너 갤러리면 "마이너"'
        + '\n를 입력해주세요'
        + '\n/cancel 작업 취소');

      inter.detail = {};
      inter.detail.gid = msg;
      inter.detail.pattern = [];
      inter.type = 'addObserver|2';
      break;

    case 'addObserver|2':
      // command handle
      if (msg[0] === '/') {
        var cmd = msg.split(' ');
        switch(cmd[0]) {
          default:
            replier.reply(config.TAG + '유효하지 않은 명령어:\n' + msg
              + '\n/cancel 현 작업 취소');
        }
        break;
      }

      if (['일반', '마이너'].indexOf(msg) === -1) {
        replier.reply(config.TAG + '"일반", "마이너" 둘 중 하나를 입력해주세요'
          + '\n/cancel 작업 취소');
      } else {
        // minor gallery detect
        const isMinor = msg === '마이너';
        replier.reply(config.TAG + inter.detail.gid  + ' 갤러리를 "' + msg + '" 타입으로 등록합니다.'
          + '\n\n제목에서 감지할 단어 입력하세요'
          + '\n/cancel 작업 취소');

        inter.detail.isMinor = isMinor;
        inter.type = 'addObserver|3';
      }
      break;

    case 'addObserver|3':
      // command handle
      if (msg[0] === '/') {
        var cmd = msg.split(' ');
        switch(cmd[0]) {
          case '/end':
            // valid check
            if (inter.detail.pattern.length === 0) {
              replier.reply(config.TAG + '검색할 패턴이 없으므로 완료할 수 없습니다'
                + '\n\n계속 단어를 입력하거나\n/cancel 작업 취소');
              break;
            }
            // task add request
            const rid = generateUid()
            _checkAndAddTask({
              uid: rid,
              targetRoom: room,
              gid: inter.detail.gid,
              isMinor: inter.detail.isMinor,
              pattern: inter.detail.pattern
            }, room);
            // delete interaction
            delete local.interaction[uid];
            break;

          default:
            replier.reply(config.TAG + '유효하지 않은 명령어:\n' + msg
              + '\n/cancel 현 작업 취소');
        }
        break;
      }

      inter.detail.pattern.push(msg);
      replier.reply(config.TAG + '다음 단어가 제목에 모두 포함되면 감지됨:'
        + '\n' + inter.detail.pattern.join(', ')
        + '\n\n계속 단어를 입력하거나\n/end 종료 혹은\n/cancel 작업 취소');
      break;

    default:
      reportError('Invalid task type: ' + inter.type);
      delete local.interaction[uid];
      replier.reply(config.TAG + '알 수 없는 내부 인터렉션 오류.\n관리자에게 보고됩니다.\n\n작업이 자동으로 취소되었습니다.');
  }
  // update interaction instance when yet deleted
  if (local.interaction[uid]) local.interaction[uid] = inter;
  return true;
}

// TODO: loop dead detect
function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId) {
  // initialize handle
  if (!local.init) {
    if (!isValidScriptName()) {
      Log.error(config.TAG + 'invalid script name detected');
      return;
    }
    loadTask();
    startTaskLoop();
    local.init = true;
    Log.info(config.TAG + 'initialized');
  }

  // command handle
  // TODO: whitelist blacklist check
  msg += '';
  const uid = room + '|' + sender + '|' + ImageDB.getProfileImage();

  // user interact handle
  if (local.interaction[uid]) {
    Log.debug(config.TAG + 'user interaction - ' + room + '/' + sender + '/' + msg);
    if (userInteraction(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId, uid)) return;
  }

  if (msg[0] !== '/') return;
  var cmd = msg.split(' ');
  switch (cmd[0]) {
    case '/help':
      replier.reply('[DcObserver 도움말]'
        + '\n/addObserver - 제목 키워드 알림 추가');
      break;
    case '/addObserver':
      local.interaction[uid] = {
        type: 'addObserver|1'
      };
      replier.reply(config.TAG + '갤러리 ID를 입력하세요'
        + '\n\n(예시: 갤러리 페이지 주소의 https://gall.dcinside.com/board/lists?id=[아이디] 부분의 아이디를 입력하세요)'
        + '\n\n/cancel 작업 취소');
      break;
  }
}
