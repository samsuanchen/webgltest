// OneWordVM.js @ https://github.com/samsuanchen/superAnthony3
const OneWordVM = function () {
const f = {}; 				// the virtual machine
f.dStk = [];				// the data stack
f.rStk = [];				// the return stack
f.ram = [10, 0, 0];			// the ram to keep variables
f.base = 0;					// the system variable word "base" at ram 0 to encode/decode number digits
f.toIn = 1;					// the system variable word ">in" at ram 1 to interpret/compile forth scripte
f.tracing = 2;				// the system variable word "tracing" at ram 2 as a flag of tracing colon word
f.callingLevel = 0;			// colon word calling level 
f.compiling = false; 		// the switching flag of compiling or interpreting
f.token = ""; 				// the working token
f.tib = ""; 		 		// the terminal input buffer
f.tob = "";					// the terminal output buffer
f.print = function( msg ){	// print message
	console.log( msg );
}
f.panic = function( msg ){	// print given message and system info
	var m = {};
	m.msg = msg, m.token = f.token, m.base = f.ram[f.base];
	m.word = f.word, m.dStk = f.dStk;
	if( f.last ) m.last = f.last.name;
	m.compiling = f.compiling;
	if( f.head ) m.head = f.head.name, m.ip = f.head.ip, m.rStk = f.rStk;
	m.toIn = f.ram[f.toIn], m.tib = f.tib.substr( 0, 100 );
	if( f.tib.substr(100) ) m.tib +'...';
	m = JSON.stringify( m, null, 2 );
	if( f.ram[f.tracing] ) window.alert(m);
	f.print(m);
	exit;
}
f.cr = function( msg ){		// type message to terminal output buffer
	f.print( f.tob + ( msg || '' ) ), f.tob = '';
}
f.emit = function( charCode ){// emit a char to terminal output buffer
	if( charCode == 13 )
		f.cr();
	else
		f.tob += String.fromCharCode( charCode );
}
f.type = function( msg ){	// type message to terminal output buffer
	f.tob += msg;
	var lineFeed = String.fromCharCode( 10 ), lines = f.tob.split(lineFeed);
	f.tob = lines.pop();	// the last line is not printed
	if( lines.length ) f.print( lines.join( lineFeed ) );
}
f.compileOffset = function(n){// compile number to colon parm list
	if( f.ram[f.tracing] )
		f.traceInfo( 'compile ' + f.last.parm.length + ' offset ' + f.dotR( n ) );
	f.compile(n);
}
f.compileNumber = function(n){// compile number to colon parm list
	if( f.ram[f.tracing] )
		f.traceInfo('compile ' + f.last.parm.length + ' doLit ' + f.dotR( n ) );
	f.compile( f.dict.doLit ), f.compile( n );
}
f.numberToStack = function(n){// push number to data stack
	if( f.ram[f.tracing] )
		f.traceInfo( 'push number ' + f.dotR( n ) + ' to data stack', 1 );
	f.dStk.push(n);
}
f.executeWord = function( w ){// execute a word
	if( f.ram[f.tracing] ){
		f.traceInfo( 'execute '+(f.head ? ( ( f.head.ip - 1 ) + ' ' ) : '' ) + ' W'+w.id+' ' + w.name, 1 );
	}
	f.word=w, w.code();
}
f.compileWord = function( w ){// compile a word into colon parm-list
	if( f.ram[f.tracing] )
		f.traceInfo('compile '+f.last.parm.length+' word '+w.name);
	f.compile( w );
}
f.doCon = function(){		// constant word handler
	f.dStk.push(f.word.parm);
}
f.doVar = function(){		// variable word handler
	f.dStk.push(f.word.parm);
}
f.doVal = function(){		// value word handler
	f.dStk.push(f.word.parm);
}
f.doCol = function(){		// colon word handler
	var w = f.word; f.rStk.push( f.head ), w.ip = 0, f.head = w, f.callingLevel++;
	while( f.head )
		f.executeWord( f.head.parm[f.head.ip++] );
}
f.doRet = function(){		// return from calling colon word
	f.head = f.rStk.pop(), f.callingLevel--;
}
f.noop = function(){		// no operation
}
f.branch = function(){		// branch to relative ip addr in the cell pointed by ip
	f.head.ip += f.head.parm[f.head.ip];
}
f.zBranch = function( n ){		// branch to relative ip addr if TOS is 0 or undefined
	if( n ) f.head.ip++;
	else f.head.ip += f.head.parm[f.head.ip];
}
f.doFor = function( n ){	// push the loop counter for-next to return stack
	f.rStk.push( n );
}
f.doNext = function(){		// dec counter and loop back to relative ip addr if counter is 0
	var r = f.rStk, t = r.length - 1, counter = -- r[t];
	if( counter < 0 ) f.head.ip++, r.pop();
	else f.head.ip += f.head.parm[f.head.ip];
}
f.compile = function( w ){	// compile a word into colon word-list
	f.last.parm.push( w );
}
function adjustName( name ){
	return name.replace( /[.+*|{}()\\[\]$^]/g, function(c){ return '\\'+c; } );
}
f.createWord = function( name, code, tag, value ){ // 
	var p = RegExp(
		adjustName(f.word.name) + '\\s+' +
		adjustName(name) + '[^\\0]+?\\s*$'
	);
	var toIn=f.ram[f.toIn], t=f.tib.substr(0,toIn), m=t.match(p);
	if( m == undefined )
		console.log('( m == undefined ) in createWord()');
	var srcBgn = toIn-m[0].length;
	if( f.ram[f.tracing] ) f.traceInfo( 'create a new word ' + name );
	if( ! name )
		f.panic("name not given to createWord()");
	var w = f.dict[name];
	if( w ) f.print('reDef '+name+' same as W'+w.id);
	w = f.last = { id: Object.keys( f.dict ).length, name: name };
	w.definedBy = f.word.name;
	w.srcBgn = srcBgn;
	if( code ) w.code = code;
	if( tag ) w[tag] = value;
	return w;
}
f.addWord = function( w ){ // add given forth word into dictionary
	f.dict[w.name] = w;
	w.src = f.tib.substring(f.last.srcBgn,f.ram[f.toIn]).trim();
	w.srcEnd = f.last.srcBgn + w.src.length;
	w.iInp = f.nInp - 1;
}
f.getToken = function( delimiter ) { // parse next token from tib by given delimiter
	var delimiter = delimiter || ' ';
	var m, t = f.tib.substr( f.ram[f.toIn] );
	if( delimiter != ' ' ){
		if( delimiter ==')' ) delimiter = '\\'+delimiter;
		var regexp = RegExp('^\\s*([^\0]*?)'+delimiter+'\\s*');
		m = t.match( regexp );
		if( m ) {
			f.ram[f.toIn] += m[0].length;  return m[1]; 
		}
		if( delimiter != '\n') return;
		f.ram[f.toIn] += t.length; return t;
	}
	m = t.match( /^[\s]*(\S+)\s?/ );
	if( !m ) return;
	f.ram[f.toIn] += m[0].length;
	return m[1];
}
f.getTokenx = function( delimiter0, delimiter1 ) { // parse next token from tib between two delimiters
	if( delimiter0.match( /^[()]$/ ) ) delimiter0 = '\\'+delimiter0;
	if( delimiter1.match( /^[()]$/ ) ) delimiter1 = '\\'+delimiter1;
	var t = f.tib.substr( f.ram[f.toIn] );
	var regexp = RegExp('^\\s*'+delimiter0+'(\\s.+?\\s)'+delimiter1+'(\\s|$)');
	var m = t.match( regexp );
	if( ! m ) return undefined;
	f.ram[f.toIn] += m[0].length;
	return m[1].trim();
}
f.toString = function( number, base ){
	if( isNaN(number) ) {
		const type = typeof(number);
		if( type == "string" ) return number;
		if( type == "object" ){
			const x = JSON.stringify(number);
			if( x == "" || x == "{}" ) return "" +number;
			return x;
		}
		f.panic( "unable convert " + number + " to string" ); return; }
	return number.toString( base || f.ram[f.base] );
}
f.dotR = function( n, width, leadingChr, base ){
	base = base || f.ram[f.base]; var sign;
	leadingChr = leadingChr || ' ';
	width = width || 1;
	if( isNaN(n) || typeof( n ) == 'string' ){
		if( n && n.name ) n = n.name;
		else n = JSON.stringify( n );
	} else {
		if( n < 0 && leadingChr != ' ' ) sign = '-', n = -n;
		n = n.toString( base );
	}
	if( sign ) width--;
	n += '';
	while( n.length < width ) n = leadingChr + n;
	if( sign ) n = sign + n;
	return n;
}
f.d9 = function( n ){
	return f.dotR( n, 9, ' ', 10 );
}
f.d04 = function( n ){
	return f.dotR( n, 4, '0', 10 );
}
f.traceInfo = function( msg, indent ) {
	const D = f.dStk, dt = D.length-1, dT = D[dt], dN = D[dt-1],
		  R = f.rStk, rt = R.length-1, rT = R[rt], rN = R[rt-1];
	var t = 'tib:' + f.d04( f.ram[f.toIn] ) +
			' D ' + D.length + ' ['+f.d9( dN ) + ',' + f.d9( dT ) + ']' +
			' R ' + R.length + ' ['+f.d9( rN ) + ',' + f.d9( rT ) + '] ';
	if( indent ) for(var i=0; i < f.callingLevel; i++) t+='| ';
	f.print( t + msg );
}
f.isNotADigit = function( asciiCode, base ){
	if( asciiCode < 0x30 ) return true;
	if( asciiCode >= 0x61 && asciiCode <= 0x7a ) asciiCode ^= 0x20;
	var i = asciiCode - ( asciiCode <= 0x39 ? 0x30 : ( 0x41 - 10 ) );
	return i < 0 || i >= base;
}
f.isNotANumber = function ( n ) {
	if( f.ram[f.base] == 10 ) return isNaN( n );
	if( typeof(n) == "number" ) return false;
	if( typeof(n) != "string" ) return true;
	for ( var i=0; i<n.length; i++ ) if( f.isNotADigit( n.charCodeAt( i ), f.ram[f.base] ) ) return true;
	return false;
}
f.psee = function (w){ // 
  var src=w.src, definedBy=w.definedBy, n; 
  if(definedBy=='alias'){ 
   var L=Object.keys(f.dict).sort( function(a,b){ 
    return f.dict[a].id-f.dict[b].id; 
   }).slice(0,w.id); 
   for(var i=L.length-1; i>=0; i--){ 
    n=f.dict[L[i]]; 
    if(n.code==w.code) break; 
   } 
   if(i>=0) src="' "+n.name+" "+src; 
  } else if(definedBy=='constant' || definedBy=='value'){ 
   var m=w.code.toString().match(/function\(\)\{f\.dStk\.push\((.+)\);\}/);
   src=(m?m[1]:JSON.stringify(w.parm))+" "+src; 
  } 
  if(w.immediate) src+=" immediate"; 
  if(w.compileOnly) src+=" compile-only"; 
  f.print('W'+w.id+' '+src);
}
f.code = function(){
	var name = f.getToken(), args = f.getTokenx( '(', ')' ), js = f.getToken( 'end-code' );

	var w = f.createWord( name );

	if( args ){
		code += "// " + args + ";\n";
		
		var a = args.split( /\s*--\s*/ );			//  split input/output
		var ai = a[0].split( /\s+/ );				//  input args
		var ao = a[1] ? a[1].split( /\s+/ ) : a[1];	// output args
		var vi = {};								//  input var names
		var vo = {};								// output var names
		var vt = [];								//  input var from f.tib
		var vd = [];								//  input var from f.dStk
		
		var ni, lst = ai;
		ai.forEach( function(ni){
			m = ni.match( /^((.*?)<)?([a-zA-Z][a-zA-Z0-9]*)(>(.*?))?$/ );
			if( ! m ) return;
			vi[m[3]]=true; 
			if( m[2] && m[5] )
				vt.push( m[3] + "=f.getTokenx('" + m[2] + "','" + m[5] + "')" );
			else if( m[5] )
				vt.push( m[3] + "=f.getToken('" + m[5] + "')" );
			else if( m[4] )
				vt.push( m[3] + "=f.getToken()" );
			else
				vd.push( ni + "=f.dStk.pop()" );
		});
		var s; while( s = vd.pop() ) vt.push( s );
		if( ao ){
			ao.forEach( no => {
				m = no.match(/^(i:)?([a-zA-Z][a-zA-Z0-9]*)$/);
				if( m ) {
					if ( ! vi[m[2]] )
						vo[m[2]] = true;
				}
			} );
		}
		Object.keys(vo).forEach( no => vt.push(no) );
	} // else
	  // console.log('(! args) in code()');
	
	var _fun_;
	var code = "_fun_ = function(){\n";
	if( args ){ // before js
		if( vt.length )
			code += "var " + vt.join() + ";\n";
	}
	code += js;
	if( args ){ // after js
		code += ( ao ? ( "\n" + ao.map( function(no){
			var s = '', m = no.match(/^(i:)?(.+)$/);
			if( m[1] )
				s += "if(!f.compiling)";
			s += "f.dStk.push(" + m[2] + ")";
			return s;
		}).join(";") ) : "" );
	}
	code += "\n}";

	try {
		eval( code ); w.code = _fun_, f.addWord( w );
	} catch ( err ) {
		f.print( 'eval("' + code + '")' );
		f.panic( err )
	}
}
var w={
	id: 0,
	name: 'code',
	code: f.code };
var src=w.code.toString();
w.src='code '+w.name+src.substr(11,src.length-13)+'end-code';
w.definedBy = 'code';
f.dict = {	// So far the word "code" is the only word in dictionary.
			// New words can be defined by "code" in javascript via f.eval() later.
	"code": w
};
f.inps = [], f.nInp = 0;
f.toData = function( token ) {
	var data, n;
	if( f.isNotANumber( token ) ) {
		if( ! isNaN( token ) )
			f.panic( "not number of base "+f.ram[f.base]+" '" + token + "'" );
		var code = "n=" + token;
		try {
			eval( code );					//	a. data is js object
		} catch ( err ) {
			f.panic( "unDef "+token );
		}
	} else if( m = token.match(/^0x(.+)$/) )//	b. data is hex integer
		n = parseInt( m[1], 16 );
	else if( token.indexOf( '.' )<0 )		//	c. data is integer of any base
		n = parseInt( token, f.ram[f.base] );
	else									//	d. data is decimal float number
		n = parseFloat( token );
	return n
}
f.eval = function(tib) { // evaluate given script in tib
	tib = tib || f.defaultScript;
	f.inps.push(tib);
	f.cr("inp "+(f.nInp++)+" > `"+tib+"`");
	f.tib = tib || "", f.ram[f.toIn] = 0, f.rStk=[], f.compiling = f.errorMessage = false;
	var token;
	while( f.token = token = f.getToken() ){
		var w, n;
		if( f.word = w = f.dict[f.token] ){
			if( w.immediate || ! f.compiling ){		// 1. execute other type word
				f.executeWord(w);
			} else									// 2. compile word
				f.compileWord(w);
		} else {
			var n = f.toData( token );
			if( n == undefined )					// 3. abort if token is not data
				f.panic( "unDef "+token );
			if( f.compiling )						// 4. compile data into colon definition
				f.compileNumber( n );
			else 									// 5. push data onto data stack
				f.numberToStack( n );
		}
	}
}
f.print( "javascript oneWordVm 20181111 samsuanchen@gmail.com" );
f.defaultScript = `
 code constant ( n <name> -- ) f.addWord( f.createWord( name, f.doCon, "parm", n ) ); end-code 
 code variable ( <name> -- ) f.addWord( f.createWord( name, f.doVar, "parm", f.ram.length ) ); f.ram.push( 0 ); end-code 
 code value ( n <name> -- ) f.addWord( f.createWord( name, f.doVal, "parm", n ) ); end-code 
 code immediate ( -- ) f.last.immediate = true; end-code 
 code compile-only ( -- ) f.last.compileOnly = true; end-code 
 code : ( <name> -- ) f.createWord( name, f.doCol, "parm", [] ), f.compiling = true; end-code 
 code ; ( -- ) f.compileWord( f.dict.doRet ), f.addWord( f.last ), f.compiling = false; end-code immediate compile-only 
 code doLit ( -- n ) n=f.head.parm[f.head.ip++]; end-code compile-only 
 code doStr ( -- str ) str=f.head.parm[f.head.ip++]; end-code compile-only 
 code doRet ( -- ) f.doRet(); end-code compile-only 
 code exit ( -- ) f.doRet(); end-code compile-only 
 code ?exit ( flag -- ) if( flag ) f.doRet(); end-code compile-only 
 code doFor ( n -- ) f.doFor(n); end-code compile-only 
 code doNext ( -- ) f.doNext(); end-code compile-only 
 code doIf ( n -- ) f.zBranch(n); end-code compile-only 
 code doElse ( -- ) f.branch(); end-code compile-only 
 code doThen ( -- ) f.noop(); end-code compile-only 
 code doBegin ( -- ) f.noop(); end-code compile-only 
 code doAgain ( -- ) f.branch(); end-code compile-only 
 code doUntil ( n -- ) f.zBranch(n); end-code compile-only 
 code doWhile ( n -- ) f.zBranch(n); end-code compile-only 
 code doRepeat ( -- ) f.branch(); end-code compile-only 
 code ( ( <str>) -- ) end-code immediate 
 code \\ ( <str>\\n -- ) end-code immediate \\ ignore string until end of line
 code cr ( -- ) f.cr(); end-code 
 code space ( -- ) f.emit( 0x20 ); end-code 
 code spaces ( n -- ) for(var i=0; i<n; i++) f.emit( 0x20 ); end-code 
 code emit ( charCode -- ) f.emit( charCode ); end-code
 code type ( obj -- ) f.type( obj ); end-code 
 code .( ( <str>) -- ) f.type( str ); end-code 
 code . ( n -- ) f.type( f.toString( n )+" " ); end-code 
 code .r ( n w -- ) f.type( f.dotR( n, w, " " ) ); end-code 
 code .0r ( n w -- ) f.type( f.dotR( n, w, "0" ) ); end-code 
 code + ( a b -- a+b ) end-code 
 code - ( a b -- a-b ) end-code 
 code * ( a b -- a*b ) end-code 
 code / ( a b -- a/b ) end-code 
 code mod ( a b -- a%b ) end-code 
 code ** ( a b -- a**b ) end-code 
 code drop ( n -- ) end-code 
 code nip ( a b -- b ) end-code 
 code dup ( n -- n n ) end-code 
 code over ( a b -- a b a ) end-code 
 code pick // ( ni .. n1 n0 i -- ni .. n1 n0 ni ) 
	var d = f.dStk, t = d.length - 1, i = d[t]; d[t] = d[t-1-i];
	end-code 
 code swap ( a b -- b a ) end-code 
 code rot ( a b c -- b c a ) end-code 
 code -rot ( a b c -- c a b ) end-code 
 code roll // ( ni .. n1 n0 i -- .. n1 n0 ni )
	var d=f.dStk, t=d.length-2, i=d.pop(), ni=d[t-i]; while(i){ d[t-i]=d[t-i+1]; i--; } d[t]=ni;
	end-code 
 code base ( -- addr ) addr=f.base; end-code 
 code >in ( -- addr ) addr=f.toIn; end-code 
 code tracing ( -- addr ) addr=f.tracing; end-code 
 code @ ( addr -- value ) value=f.ram[addr]; end-code 
 code ! ( value addr -- ) f.ram[addr]=value; end-code 
 code ] ( -- ) f.compiling=true; end-code 
 code [ ( -- ) f.compiling=false; end-code 
 code token ( <token> -- str ) str=token; end-code 
 code , ( n -- ) f.compileOffset(n); end-code 
 code word, ( w -- ) f.compileWord(w); end-code 
 code compile ( -- ) f.compileWord(f.head.parm[f.head.ip++]); end-code 
 code literal ( n -- ) f.compileNumber(n); end-code immediate 
 code execute ( w -- ) f.executeWord(w); end-code 
 code find ( str -- w ) w=f.dict(str); end-code 
 code ' ( <name> -- w ) w=f.dict[name]; end-code 
 code words ( -- )
	f.cr(
		Object.keys( f.dict )
		.sort( (a,b) => f.dict[a].id-f.dict[b].id )
		.map( name => "W" + f.dict[name].id + " " + name )
		.join( " " )
	);
	end-code 
 code (see) ( w -- ) 
  var inp=f.inps[w.iInp], src;
  if(w.srcBgn)
	src=inp.substring(w.srcBgn,w.srcEnd);
  else
	src='code '+w.name+w.code.toString().match(/^function\(\)\{([^\0]+)\}$/)[1]+'end-code';
  var definedBy=w.definedBy, n; 
  if(definedBy=='alias'){ 
   var L=Object.keys(f.dict).sort( function(a,b){ 
    return f.dict[a].id-f.dict[b].id; 
   }).slice(0,w.id); 
   for(var i=L.length-1; i>=0; i--){ 
    n=f.dict[L[i]]; 
    if(n.code==w.code) break; 
   } 
   if(i>=0) src="' "+n.name+" "+src; 
  } else if(definedBy=='constant' || definedBy=='value'){  
   var m=w.code.toString().match(/function\\(\\)\\{f\\.dStk\\.push\\((.+)\\);\\}/);
   src=(m?m[1]:JSON.stringify(w.parm))+" "+src; 
  } 
  if(w.immediate) src+=" immediate"; 
  if(w.compileOnly) src+=" compile-only"; 
  f.print('W'+w.id+' '+src); 
 end-code 
 code seeAll ( -- )
	Object.keys(f.dict)
	.sort( (a,b) => f.dict[a].id-f.dict[b].id )
	.forEach( name => f.psee( f.dict[name] ) ); 
	end-code 
 code alias ( w <name> -- )
	var n = f.createWord( name, w.code );
	if( w.parm ) n.parm = w.parm;
	f.addWord( n );
	end-code 
 code > ( a b -- a>b ) end-code
 code < ( a b -- a<b ) end-code
 code >= ( a b -- a>=b ) end-code
 code <= ( a b -- a<=b ) end-code
 code = ( a b -- a=b ) end-code
 code <> ( a b -- a!=b ) end-code
 code 1+ ( n -- n+1 ) end-code
 code 1- ( n -- n-1 ) end-code
 code 2+ ( n -- n+2 ) end-code
 code 2- ( n -- n-2 ) end-code
 code 2dup ( a b -- a b a b ) end-code
 code 2drop ( a b -- ) end-code
 code 3drop ( a b c -- ) end-code
 code 2over ( a b c d -- a b c d a b ) end-code
 code depth ( -- n ) n=f.dStk.length; end-code
 code r@ ( -- n ) n=f.rStk[f.rStk.length-1]; end-code
 ' r@ alias i
 code r> ( -- n ) n=f.rStk.pop(); end-code
 code >r ( n -- ) f.rStk.push(n); end-code
 code here ( -- n ) n=f.last.parm.length; end-code 
 code compileTo ( n a -- ) f.last.parm[a]=n; end-code 
 code bl ( -- 32 ) end-code 
 code quote ( -- 34 ) end-code 
 code word ( delimiter -- str ) str=f.getToken(delimiter); end-code
 code (to) ( n w -- ) if(w.definedBy!=='value')f.panic('cannot set value to '+w.name); w.parm=n; end-code
 code (+to) ( n w -- ) if(w.definedBy!=='value')f.panic('cannot add value to '+w.name); w.parm+=n; end-code
 code compiling ( -- flag ) flag=f.compiling; end-code 
 code ." ( <str>" -- ) f.compile(f.dict.doStr); f.compile(str); f.compile(f.dict.type); end-code immediate 
 code $" ( <str>" -- i:str )
	if(f.compiling) f.compile(f.dict.doStr), f.compile(str);
	end-code immediate 
	
 : see ( <name> -- ) ' (see) ; 
 : ? ( addr -- ) @ . ; 
 : on ( addr -- ) 1 swap ! ; 
 : off ( addr -- ) 0 swap ! ; 
 : (trace) ( w -- ) tracing on execute tracing off ; 
 : trace ( <word> -- ) ' (trace) ; 
 : hex ( -- ) 16 base ! ;
 : decimal ( -- ) 10 base ! ; 
 : h. ( number -- ) base @ swap hex . base ! ; 
 : h.r ( number n -- ) base @ -rot hex .r base ! ; 
 : h.0r ( number n -- ) base @ -rot hex .0r base ! ; 
 : forward, ( a -- ) here over - swap compileTo ; 
 : backward, ( a -- ) here - , ; 
 : for ( -- a ) compile doFor here ; immediate 
 : next ( a -- ) compile doNext backward, ; immediate 
 : if ( -- a ) compile doIf here 0 , ; immediate 
 : else ( a -- b ) compile doElse here 0 , swap forward, ; immediate 
 : then ( a -- ) compile doThen forward, ; immediate 
 : begin ( -- a ) compile doBegin here ; immediate 
 : again ( a -- ) compile doAgain backward, ; immediate 
 : until ( a -- ) compile doUntil backward, ; immediate 
 : while ( a -- a b ) compile doWhile here 0 , ; immediate 
 : repeat ( a b -- ) compile doRepeat swap backward, forward, ; immediate 
 : t9 ( n -- ) 8 for dup 9 i - * 3 .r next drop cr ; 
 : t99 ( -- ) 1 begin dup 10 < while dup t9 1+ repeat drop ; 
 : [compile] ( <name> -- ) ' , ; immediate 
 : to ( n <name> -- ) ' compiling if [compile] literal compile (to) else (to) then ; immediate 
 : +to ( n <name> -- ) ' compiling if [compile] literal compile (+to) else (+to) then ; immediate 
 : .s depth if depth 1- for r@ pick . next else ." empty " then cr ;
 
 .( enter "words" should print the following: ) cr 
 words
 .( input "hex 1Ff 1+ decimal ." should print the following "512" ) cr 
 hex 1Ff 1+ decimal . cr 
 .( enter "0x1234 8 h.0r" should print the following "00001234" ) cr 
 0x1234 8 h.0r cr 
 .( enter "t99" should print the following: ) cr
 t99 
`
return f;
}
const f = new OneWordVM();