// new script injector v1 (__DEPRECATED__: long script ignored)
// script flatter (run on browser console)
var targetScriptName = '[SCRIPT_NAME].js';
var content = `
place your script here
`;

console.log('var c="'
  + content.replace('\\', '\\\\')
    .replace('"', '\\"')
    .split('\n').join('\\n')
  + '";FileStream.write("/sdcard/katalkbot/'
  + targetScriptName + '", c);');


// new script injector v2
// script flatter (run on browser console)
var targetScriptName = '[SCRIPT_NAME].js';
var url = '[EX: GITHUB_RAW_URL]';

console.log(`var jsoup=Utils.parse("${ url }");`
  + `var content=""+jsoup.getElementsByTag("body").toArray()[0].wholeText();`
  + `FileStream.write("/sdcard/katalkbot/${ targetScriptName }", content);`);

// script enable (run on browser console)
var targetScriptName = '[SCRIPT_NAME].js';
console.log('Api.reload("' + targetScriptName + '");Api.on("' + targetScriptName + '");');

// script config editor
var c=FileStream.read('/sdcard/katalkbot/[SCRIPT_NAME].js');
FileStream.write('/sdcard/katalkbot/[SCRIPT_NAME].js',
c.replace(/targetRegex: (.*),\n/, 'targetRegex: value,\n'));
