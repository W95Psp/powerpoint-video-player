#!/usr/bin/env node
let [input, ...slides_skip] = process.argv.slice(2);
console.error('input=', input);
slides_skip = slides_skip.map(x => x.match(/^(\d+)-(\d+)$/).slice(1)).map(([position, number]) => ({position: +position, number: +number}));
if(!input || slides_skip.find(x => !x || isNaN(x.position) || isNaN(x.position)))
    throw "Error, wrong argument(s). Call like this: `input.mp4 23-5 42-3` to skip 5 slides at slide 23 and 3 at slide 42.";

if(!require('fs').existsSync(input))
    throw "File "+input+" does not exists!";

let r = require('child_process').execSync(`ffmpeg -i ${input} -vf mpdecimate -loglevel debug -f null - 2>&1`);
r = (r+'').split('\n').filter(x => x.match(/^\[Parsed_mpdecimate.*\] .* drop_count:.+$/))
    .map(x => [...x.match(/(drop|keep) pts:\d+ pts_time:([^ ]+)/)].slice(1,3));

let out = [];
let currentState, currentTimecode;
for(let [state, timecode] of r){
    if(state != currentState){
	if(state == 'drop') out.push([+currentTimecode, +timecode]);
	else                currentTimecode = timecode;
    }
    currentState = state;
}

let clientCode = (times, skips) => {
    for(let {position, number} of skips){
	times[position][1] = times[position+number][1];
	times.splice(position + 1, number, ...new Array(number).fill(0).map(_ => false));
    }
    times = times.filter(x => x!==false);

    let g = () => document.getElementById('p');
    let oldElem = null;
    let overlayLogic = cur => {
	let elem = document.querySelector('#overlays > div[data-frame="'+cur+'"]');
	oldElem && (oldElem.className = '');
	elem && (elem.className = 'show');
	oldElem = elem;
    };
    let gethash = () => +window.location.hash.slice(1);
    let moveAtEndOf = (specCur = cur) => (overlayLogic(specCur), g().currentTime = times[specCur][1]);

    let cur = gethash();
    moveAtEndOf();

    window.onhashchange = () => gethash() == +cur || (cur = gethash(), moveAtEndOf());

    let playAtCur = async () => {
	let pcur = cur;
	overlayLogic(pcur);
	g().currentTime = times[pcur][0];
	await g().play();
	setTimeout( () => (g().pause(), moveAtEndOf(pcur))
		    , 1000 * (times[pcur][1] - times[pcur][0])   );
    };
    let icur = d => {
	if(cur + d < times.length && cur + d >= 0)
	    cur+=d;
	window.location.hash = cur;
    }
    document.body.addEventListener("click", function(event) {
	icur(+1); playAtCur();
    });
    let composeNum = null;
    let composeNumTO = null;
    document.body.addEventListener("keyup", function(event) {
	if(event.keyCode == 37)
	  { icur(-1); moveAtEndOf(); return false; };
	if(event.keyCode == 39)
	  { icur(+1); playAtCur();   return false; };
	let n = event.keyCode - 48;
	if(n >= 0 && n <= 9){
	    composeNum = (composeNum || 0) * 10 + n;
	    clearTimeout(composeNumTO);
	    composeNumTO = setTimeout(() => (composeNum=null), 1000);
	}
	if(event.keyCode == 13 && composeNum !== null)
	    (window.location.hash = cur = composeNum, moveAtEndOf());
    });
};

let overlays = '';
try{
    overlays = require('fs').readFileSync('overlays.html')+'';
}catch(e){console.error(e);}

console.log(`
<body>
<video id="p"><source src="${input}" type="video/mp4"></video>
<div id='overlays'>${overlays}</div>
</body>
<script>(${clientCode.toString()})(${JSON.stringify(out)}, ${JSON.stringify(slides_skip)});</script>
<style>
  body{ position:absolute;
        height:100%;
        width:100%;
        overflow: hidden;  }
  body video {
    max-width: 100%;
    max-height: 100%;
    min-width: 100%;
    min-height: 100%; }
  #overlays div.show {
    display: block;
  }
  #overlays div {
    position: absolute;
    display: none;
    height:100%;
    width:100%;
    left: 0px;
    top: 0px;
  }
  #overlays {
    position: absolute;
    height:100%;
    width:100%;
    left: 0px;
    top: 0px;
  }
</style>
`);
