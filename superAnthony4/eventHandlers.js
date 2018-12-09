// eventHandlers.js @ https://github.com/samsuanchen/superAnthony3
function backup(){ // in js console, paste the output to inport more actions
	for(act in actions)
		console.log('localStorage.setItem(`anthony4_'
			+ act + '`,`'
			+ localStorage.getItem('anthony4_站0').replace(/"(\d+)"/g,'$1')
			+ '`);'
		);
}
function save(key){
	key = key || iFile.value;
	var inputs = document.getElementsByClassName("number");
	var json={};for(i=0;i<inputs.length;i++){e=inputs[i];json[e.id]=e.value};
	localStorage.setItem("anthony4_"+key, JSON.stringify(json));
	preloadState();
}
function load(key){
	if( ! key ) key = iFile.value;
	else iFile.value = key;
	key = key || iFile.value;
	var json = actions[key];
	for(var id in json){
		eval(id+'.value='+json[id]);
	};
	var m = key.match(/\d+$/);
	if(m) iIndex.value = m[0];
	delayTime = n1 = undefined, iDirect.value = 0;
	drawAnthony(0);
}
function onScriptPasted(){
	setTimeout( function(){ // 兩個以上 (含兩個) 空白, 第一個自動替換為換行
		f.eval(input.value.replace(/ ( +)/g,function(_,m){return "\n"+m;}));
		input.value = "";
	}, 0)
}
function onScriptKeyUp(){
	if(event.key == "Enter") onEvalClick();
}
function onEvalClick(){
	f.eval(input.value);
	input.value = "";
}
function toAuto(){
	if(bAuto.innerHTML == "自動"){
		bAuto.innerHTML = "暫停";
		for( var i = 0, Ii; i < II.length; i++ )
			Ii = II[i], Ii.setAttribute( 'disabled', true );
		for( var i = 0, Bi; i < BB.length; i++ )
			Bi = BB[i], Bi.setAttribute( 'disabled', true );
		bAuto.removeAttribute( 'disabled' );
		iPrint.removeAttribute( 'disabled' );
	} else {
		bAuto.innerHTML = "自動";
		for( var i = 0, Ii; i < II.length; i++ )
			Ii = II[i], Ii.removeAttribute( 'disabled' );
		for( var i = 0, Bi; i < BB.length; i++ )
			Bi = BB[i], Bi.removeAttribute( 'disabled' );
		toCurr();
	}
}
function incVal(){
	var incElement = event.path[0], m = incElement.id.match( /(Ang\d+)$/ );
	if( !m ) return;
	var id = 'iVal' + m[0], valElement = document.getElementById( id );
	var v = parseInt( valElement.value ) + parseInt( iDelta.value );
	actions[iFile.value][id] = valElement.value = v;
	drawAnthony(0);
}
function decVal(){
	var incElement = event.path[0], m = incElement.id.match( /(Ang\d+)$/ );
	if( !m ) return;
	var id = 'iVal' + m[0], valElement = document.getElementById( id );
	var v = parseInt( valElement.value ) - parseInt( iDelta.value );
	actions[iFile.value][id] = valElement.value = v;
	drawAnthony(0);
}
function toChangeVal(){
	if(bAuto.innerHTML != "自動") return;
	var curElement = event.path[0];
	actions[iFile.value][curElement.id] = parseInt( curElement.value );
	drawAnthony(0);
}
function toCurr(){
	var json = actions[iFile];
	for(var a in json){
		eval(a+'.value='+json[a]);
	};
	drawAnthony(0);
}
function toPrev(){
	var m=iFile.value.match(/(\D+)(\d*)$/);
	if( ! m ) return;
	var i=m[2]?parseInt(m[2]):0;
	if( i == 0 ) return;
	i--;
	var action=m[1]+i;
	var json = actions[action];
	for(var a in json){
		eval(a+'.value='+json[a]);
	};
	iFile.value = action;
	iIndex.value = i;
	drawAnthony(0);
}
function toNext(){
	var m=iFile.value.match(/(\D+)(\d*)$/);
	if( ! m ) return;
	var i = m[2] ? parseInt(m[2]) : 0;
	i++;
	var action=m[1]+i;
	var json = actions[action];
	if( ! json ) return;
	for(var a in json){
		eval(a+'.value='+json[a]);
	};
	iFile.value = action;
	iIndex.value = i;
	drawAnthony(0);
}