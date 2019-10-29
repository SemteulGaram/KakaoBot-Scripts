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

jsoup

getElementsByIndexLessThan
parent
select
isBlock
elementsMatchingOwnText
classNames
getElementsMatchingText
cssSelector
getElementsByAttributeValueMatching
children
previousSibling
block
text
id
appendText
getElementsByIndexGreaterThan
elementsByAttributeValueContaining
insertChildren
val
appendChild
childNodes
hasClass
hasAttr
is
elementsByAttributeValueMatching
nextElementSibling
siblingNodes
getAllElements
normalName
previousElementSiblings
elementsByIndexLessThan
siblingElements
getElementsByAttributeValueEnding
replaceWith
nodeName
elementsByAttributeValueNot
getElementById
getElementsByAttributeValueContaining
wait
dataNodes
elementsByTag
elementsByIndexEquals
className
childNodesCopy
elementsByClass
notify
elementsByAttribute
after
appendElement
getElementsByAttribute
firstElementSibling
allElements
selectFirst
getElementsContainingOwnText
outerHtml
hasText
childNode
lastElementSibling
filter
elementsMatchingText
setBaseUri
toggleClass
elementsByIndexGreaterThan
elementsByAttributeStarting
prependElement
equals
attributes
childNodeSize
toString
getElementsByIndexEquals
wrap
dataset
hasParent
getClass
data
before
shallowClone
prepend
elementsByAttributeValueEnding
getElementsContainingText
elementSiblingIndex
nextSibling
elementsByAttributeValue
empty
unwrap
getElementsByAttributeValueStarting
getElementsByAttributeStarting
html
tag
wholeText
addClass
prependText
elementsContainingOwnText
removeClass
parentNode
hasSameValue
traverse
textNodes
elementsByAttributeValueStarting
getElementsByClass
getElementsByAttributeValueNot
nextElementSiblings
ownerDocument
absUrl
child
parents
clearAttributes
notifyAll
ownText
elementById
remove
hashCode
root
appendTo
attr
class
getElementsByAttributeValue
elementsContainingText
removeAttr
siblingIndex
previousElementSibling
tagName
prependChild
getElementsMatchingOwnText
baseUri
clone
getElementsByTag
append
