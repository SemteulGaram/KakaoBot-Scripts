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


// script enable (run on browser console)
var targetScriptName = '[SCRIPT_NAME].js';
console.log('Api.reload("' + targetScriptName + '");Api.on("' + targetScriptName + '");');
