Api.getContext()
Api.reload() // 모두 재로드
Api.reload('target.js') // 타겟 재로드
Api.prepare('target.js') //존재 안하면 0, 컴파일하면 1, 이미 되어있으면 2
Api.unload('target.js') // 준비 해제
Api.off()
Api.off('target.js')
Api.on()
Api.on('target.js')
Api.isOn('target.js')
Api.isCompiled('target.js')
Api.isCompiling('target.js')
Api.getScriptNames()
Api.replyRoom(room, message, hideToast = false)
Api.canReply(room)
Api.showToast(title, content)
Api.makeNoti(title, content, id)
Api.papagoTranslate(sourceLang, targetLang, content, errorToString = false)
Api.gc()

Utils.getWebText(url)
Utils.parse(url)

Log.error(string, viewToast=false)
Log.info(string)
Log.debug(string)

AppData.putInt/Boolean/String(stringKey, value)
AppData.getInt/Boolean/String(stringKey)
AppData.clear()
AppData.remove(stringKey)

DataBase.setDataBase(fileName, content)
DataBase.getDataBase(fileName)
DataBase.removeDataBase(fileName)
DataBase.appendDataBase(fileName, content)

Bridge.getScopeOf(scriptName)
Bridge.isAllowed(scriptName)

Device.getBuild()
Device.getAndroidVersionCode()
//...

FileStream.read(path)
FileStream.write(path, content)
FileStream.append(path, content)
FileStream.remove(path)
