const scriptName = "RemoteScriptExecute.js";
const VERSION = 'v1.2';

const config = {
  targetRoom: 'EXAMPLE_TARGET',
  commandExecute: '/rse',
  evalPrefix: 'var _debug=Log.debug,_info=Log.info,_error=Log.error;'
    + 'Log.debug=function(){sendChat(Array.prototype.join.call(arguments, " "));_debug.apply(Log, arguments)};'
    + 'Log.info=function(){sendChat(Array.prototype.join.call(arguments, " "));_info.apply(Log, arguments)};'
    + 'Log.error=function(){sendChat(Array.prototype.join.call(arguments, " "));_error.apply(Log, arguments)};'
};

function sendChat(msg) {
  Api.replyRoom(config.targetRoom, msg);
}

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
  // Is target data chat room
  if (room !== config.targetRoom) return;

  if (msg.length >= config.commandExecute.length && msg.substring(0, config.commandExecute.length) === config.commandExecute) {
    const content = msg.substring(config.commandExecute.length, msg.length);
    try {
      replier.reply(eval(config.evalPrefix + content) + '\nFINISHED');
    } catch (err) {
      replier.reply('[RSE ERROR LINE: ' + err.lineNumber + ']\n' + err);
    }
  }
}

function onStartCompile() {}
function onCreate(savedInstanceState,activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
