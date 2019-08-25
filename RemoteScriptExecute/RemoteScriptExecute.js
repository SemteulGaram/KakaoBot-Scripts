const scriptName = "RemoteScriptExecute.js";
const VERSION = 'v1.6';

const config = {
  targetRoom: 'EXAMPLE_TARGET',
  commandExecute: '/rse',
  evalPrefix: ''
};

const local = {};

config.commandExecute += ' ';

function sendChat(msg) {
  Api.replyRoom(config.targetRoom, msg);
}

var __rseDebug = Log.debug;
var __rseInfo = Log.info;
var __rseError = Log.error;
Log.debug = function() {
  sendChat(Array.prototype.join.call(arguments, " "));
  __rseDebug.apply(Log, arguments);
};
Log.d = Log.debug;
Log.info = function() {
  sendChat(Array.prototype.join.call(arguments, " "));
  __rseInfo.apply(Log, arguments);
};
Log.i = Log.info;
Log.error = function() {
  sendChat(Array.prototype.join.call(arguments, " "));
  __rseError.apply(Log, arguments);
};
Log.e = Log.error;

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
  // Is target data chat room
  if (room !== config.targetRoom) return;

  if (msg.length >= config.commandExecute.length && msg.substring(0, config.commandExecute.length) === config.commandExecute) {
    const content = msg.substring(config.commandExecute.length, msg.length);
    try {
      replier.reply(eval(config.evalPrefix + content) || 'OK');
    } catch (err) {
      replier.reply('[ERROR LINE: ' + err.lineNumber + ']\n' + err);
    }
  }
}

function onStartCompile() {}
function onCreate(savedInstanceState,activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
