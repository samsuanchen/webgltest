const vm = {}; 					// the working virtual machine
vm.dStk = [];					// data stack
vm.rStk = [];					// return stack
vm.ram = [10, 0, 0];			// variables
vm.base = 0;					// vm.ram[0]
vm.toIn = 1;					// vm.ram[1]
vm.tracing = 2;					// vm.ram[2]
vm.callingLevel = 0;			// colon word calling
vm.compiling = false; 			// the switching flag of compiling or interpreting
vm.token = ""; 					// the working token
vm.tib = ""; 		 			// the terminal input buffer
vm.tob = "";					// the terminal output buffer
function UserException(message) {
   this.message = message;
   this.name = 'UserException';
   throw message;
}
vm.print = function( msg ){		// print message
	console.log( msg );
}
vm.panic = function( msg ){		// print message and return vm.error
	vm.error = { msg: msg,
		base: vm.ram[vm.base], tib: vm.tib, toIn: vm.ram[vm.toIn], last: vm.last,
		token: vm.token, word: vm.word, compiling: vm.compiling, head: vm.head,
		dStk: vm.dStk, rStk: vm.rStk
	}
	if( vm.ram[vm.tracing] ) window.alert("??? "+msg+" ???\n"+JSON.stringify(vm.error,null,2));
	throw new UserException(msg);
}
vm.cr = function( msg ){		// type message to terminal output buffer
	vm.print( vm.tob + ( msg || '' ) ), vm.tob = '';
}
vm.emit = function( charCode ){	// type message to terminal output buffer
	vm.print( vm.tob + msg ), vm.tob = '';
	if( charCode == 13 )
		vm.cr();
	else
		vm.tob += String.fromCharCode( charCode );
}
vm.type = function( msg ){		// type message to terminal output buffer
	vm.tob += msg;
	var lineFeed = String.fromCharCode( 10 ), lines = vm.tob.split(lineFeed);
	vm.tob = lines.pop();		// the last line is not printed
	if( lines.length ) vm.print( lines.join( lineFeed ) );
}
vm.compileOffset = function(n){	// compile number to colon parm list
	if( vm.ram[vm.tracing] )
		vm.traceInfo( 'compile ' + vm.last.parm.length + ' offset ' + vm.dotR( n ) );
	vm.compile(n);
}
vm.compileNumber = function(n){	// compile number to colon parm list
	if( vm.ram[vm.tracing] )
		vm.traceInfo('compile ' + vm.last.parm.length + ' doLit ' + vm.dotR( n ) );
	vm.compile( vm.dict.doLit ), vm.compile( n );
}
vm.numberToStack = function(n){	// push number to data stack
	if( vm.ram[vm.tracing] )
		vm.traceInfo( 'push number ' + vm.dotR( n ) + ' to data stack', 1 );
	vm.dStk.push(n);
}
vm.executeWord = function( w ){	// execute word
	if( vm.ram[vm.tracing] ){
		vm.traceInfo( 'execute '+(vm.head ? ( ( vm.head.ip - 1 ) + ' ' ) : '' ) + 'word ' + w.name, 1 );
	}
	vm.word=w, w.code();
}
vm.compileWord = function( w ){// compile word to colon parm-list
	if( vm.ram[vm.tracing] )
		vm.traceInfo('compile '+vm.last.parm.length+' word '+w.name);
	vm.compile( w );
}
vm.doCon = function(){			// constant word handler
	vm.dStk.push(vm.word.parm);
}
vm.doVar = function(){			// variable word handler
	vm.dStk.push(vm.word.parm);
}
vm.doVal = function(){			// value word handler
	vm.dStk.push(vm.word.parm);
}
vm.doCol = function(){			// colon word handler
	var w = vm.word; vm.rStk.push( vm.head ), w.ip = 0, vm.head = w, vm.callingLevel++;
	while( vm.head )
		vm.executeWord( vm.head.parm[vm.head.ip++] );
}
vm.doRet = function(){			// return from calling colon word
	vm.head = vm.rStk.pop(), vm.callingLevel--;
}
vm.noop = function(){			// no operation
}
vm.branch = function(){			// branch to relative ip addr in the cell pointed by ip
	vm.head.ip += vm.head.parm[vm.head.ip];
}
vm.zBranch = function(){		// branch to relative ip addr if TOS is 0 or undefined
	if( vm.dStk.pop() ) vm.head.ip++;
	else vm.head.ip += vm.head.parm[vm.head.ip];
}
vm.doFor = function(){			// push the loop counter for-next to return stack
	vm.rStk.push(vm.dStk.pop());
}
vm.doNext = function(){			// dec counter and loop back to relative ip addr if counter is 0
	var r = vm.rStk, t = r.length - 1, counter = -- r[t];
	if( counter < 0 ) vm.head.ip++, r.pop();
	else vm.head.ip += vm.head.parm[vm.head.ip];
}
vm.compile = function( w ) {	// compile a word into colon word-list
	vm.last.parm.push( w );
}
vm.createWord = function( code, tag, value ){
	var name = vm.getToken();
	if( vm.ram[vm.tracing] ) vm.traceInfo( 'create a new word ' + name );
	if( ! name ) {
		vm.panic("expect a name of new word");
		return;
	}
	var w = vm.last = { id: Object.keys( vm.dict ).length, name: name }
	if( code ) w.code = code;
	if( tag ) w[tag] = value;
	return w;
}
vm.addWord = function(w){
	vm.dict[w.name] = w;
}
vm.getToken = function( delimiter ) { 	// get next token from tib
	delimiter = delimiter || ' ';
	if( typeof( delimiter ) == 'number' ) delimiter = String.fromCharCode( delimiter );
	else if( typeof( delimiter ) != 'string' ) panic( 'invalid delimiter to getToken' );
	var m, t = vm.tib.substr( vm.ram[vm.toIn] );
	if( delimiter != ' ' ){
		delimiter = delimiter.charAt(0);
		if( delimiter ==')' ) delimiter = '\\'+delimiter;
		var regexp = RegExp('^\\s*(.+?)'+delimiter+'(\\s|$)');
		m = t.match( regexp );
		if( m ) {
			vm.ram[vm.toIn] += m[0].length;  return m[1]; 
		}
		vm.ram[vm.toIn] += t.length; return t.substr(1);
	}
	m = t.match( /^\s*(\S+)\s?/ );
	if( !m ) return;
	vm.ram[vm.toIn] += m[0].length;
	return m[1];
}
vm.toString = function( number, base ){
	if( isNaN(number) ) {
		const type = typeof(number);
		if( type == "string" ) return number;
		if( type == "object" ){
			const x = JSON.stringify(number);
			if( x == "" || x == "{}" ) return "" +number;
			return x;
		}
		vm.panic( "unable convert to string " + number ); return; }
	return number.toString( base || vm.ram[vm.base] );
}
vm.dotR = function( n, width, leadingChr, base ){
	base = base || vm.ram[vm.base]; var sign;
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
vm.d9 = function( n ){
	return vm.dotR( n, 9, ' ', 10 );
}
vm.d04 = function( n ){
	return vm.dotR( n, 4, '0', 10 );
}
vm.traceInfo = function( msg, indent ) {
	const D = vm.dStk, dt = D.length-1, dT = D[dt], dN = D[dt-1],
		  R = vm.rStk, rt = R.length-1, rT = R[rt], rN = R[rt-1];
	const t = 'tib:' + vm.d04( vm.ram[vm.toIn] ) +
			' D ' + D.length + ' ['+vm.d9( dN ) + ',' + vm.d9( dT ) + ']' +
			' R ' + R.length + ' ['+vm.d9( rN ) + ',' + vm.d9( rT ) + '] ';
	if( indent ) for(var i=0; i < vm.callingLevel; i++) t+='| ';
	vm.print( t + msg );
}
vm.isNotADigit = function( asciiCode, base ){
	if( asciiCode < 0x30 ) return true;
	if( asciiCode >= 0x61 && asciiCode <= 0x7a ) asciiCode ^= 0x20;
	var i = asciiCode - ( asciiCode <= 0x39 ? 0x30 : ( 0x41 - 10 ) );
	return i < 0 || i >= base;
}
vm.isNotANumber = function ( n ) {
	if( vm.ram[vm.base] == 10 ) return isNaN( n );
	if( typeof(n) == "number" ) return false;
	if( typeof(n) != "string" ) return true;
	for ( var i=0; i<n.length; i++ ) if( vm.isNotADigit( n.charCodeAt( i ), vm.ram[vm.base] ) ) return true;
	return false;
}
vm.eval = function(tib) { // evaluate given script in tib
	vm.tib = tib || "", vm.ram[vm.toIn] = 0, vm.rStk=[], vm.compiling = vm.error = false;
	var token;
	while( vm.token = token = vm.getToken() ){ var w, n;
		if( w = vm.dict[vm.token] ){
			vm.word = w;
			if( w.immediate || ! vm.compiling )
				vm.executeWord(w);					// 1. execute the word
			else
				vm.compileWord(w);			// 2. compile the word
		} else {
			if( token.charAt(0) == '$' )
				n = parseInt( token.substr(1), 16 );	// int number of hex
			else if( vm.isNotANumber( token ) ) {
				if( !isNaN( token ) ) vm.panic( "not in demimal mode '" + token + "'" );
				var code = "n=" + token;
				try {
					eval( code );
				} catch ( err ) {
					vm.panic( "unDef "+token );					// alert undefined
					break;
				}
			} else if( token.indexOf( '.' )<0 )
				n = parseInt( token, vm.ram[vm.base] ); // int number
			else
				n = parseFloat( token );				// float number
			if( vm.compiling )
				vm.compileNumber( n );			// 3. compile the number
			else
				vm.numberToStack( n ); 		// 4. push the number onto data stack
		}
		if( vm.error ) break;
	}
}
vm.dict = {	// The word "code" so far is the only word in dictionary.
			// Many new words defined by "code" in java script via vm.eval() later.
	"code": { id: 0, name: 'code', code: function(){ // ( <namw> -- )
		const w = vm.createWord(),
			t = vm.tib.substr(vm.ram[vm.toIn]),
			m = t.match(/^\s*(\(\s.+?\s\)\s)?(.*?)end-code/);
		if( name == 'word' )
			console.log( " name == 'word' " );
		if( ! m ){
			vm.panic( "expect 'end-code'" );
			return;
		}
		vm.ram[vm.toIn] += m[0].length;
		var _fun_;
		const code = "_fun_ = function(){" + (m[1] ? ("// " + m[1]) : "") + "\n\t" + m[2] + "}";
		try {
			eval( code ); w.code = _fun_, vm.addWord( w );
		} catch ( err ) {
			vm.print( 'eval("' + code + '")' );
			vm.panic( err )
		}
	} }
};

vm.init = function( script ){
	vm.print( "jfvm 20180715 samsuanchen@gmail.com" );
	vm.eval( script );
}

vm.init(`
 code immediate ( -- ) vm.last.immediate = true; end-code 
 code compile-only ( -- ) vm.last.compileOnly = true; end-code 
 code constant ( n <name> -- ) vm.addWord( vm.createWord( vm.doCon, "parm", vm.dStk.pop() ) ); end-code 
 code variable ( <name> -- ) vm.addWord( vm.createWord( vm.doVar, "parm", vm.ram.length ) ); vm.ram.push( 0 ); end-code 
 code value ( n <name> -- ) vm.addWord( vm.createWord( vm.doVal, "parm", vm.dStk.pop() ) ); end-code 
 code : ( <name> -- ) vm.createWord( vm.doCol, "parm", [] ), vm.compiling = true; end-code 
 code ; ( -- ) vm.compileWord( vm.dict.doRet ), vm.addWord( vm.last ), vm.compiling = false; end-code immediate
 code doLit ( -- n ) vm.dStk.push( vm.head.parm[vm.head.ip++] ); end-code 
 code doStr ( -- n ) vm.dStk.push( vm.head.parm[vm.head.ip++] ); end-code 
 code doRet ( -- ) vm.doRet(); end-code 
 code doFor ( n -- ) vm.doFor(); end-code 
 code doNext ( -- ) vm.doNext(); end-code 
 code doIf ( n -- ) vm.zBranch(); end-code 
 code doElse ( -- ) vm.branch(); end-code 
 code doThen ( -- ) vm.noop(); end-code 
 code doBegin ( -- ) vm.noop(); end-code 
 code doAgain ( -- ) vm.branch(); end-code 
 code doUntil ( n -- ) vm.zBranch(); end-code 
 code doWhile ( n -- ) vm.zBranch(); end-code 
 code doRepeat ( -- ) vm.branch(); end-code 
 code ( ( <string> -- ) vm.getToken( ")" ); end-code immediate 
 code \\ ( <string> -- ) \
	vm.getToken( String.fromCharCode(10) ); \
 end-code immediate \\ ignore string until end of line 
 code [ vm.compiling = true; end-code immediate 
 code ] vm.compiling = false; end-code 
 code compiling vm.dStk.push( vm.compiling ); end-code 
 code cr ( -- ) vm.cr(); end-code 
 code emit ( charCode -- ) vm.emit( vm.dStk.pop() ); end-code 
 code type ( string -- ) vm.type( vm.dStk.pop() ); end-code 
 code .( ( <string> -- ) vm.type( vm.getToken( ")" ) ); end-code 
 code . ( n -- ) vm.type( vm.toString( vm.dStk.pop() )+' ' ); end-code 
 code .r ( n w -- ) var d = vm.dStk, w = d.pop(); vm.type( vm.dotR( d.pop(), w, " " ) ); end-code 
 code .0r ( n w -- ) var d = vm.dStk, w = d.pop(); vm.type( vm.dotR( d.pop(), w, "0" ) ); end-code 
 code + ( a b -- a+b ) var d = vm.dStk; d[d.length-2] += d.pop(); end-code 
 code - ( a b -- a-b ) var d = vm.dStk; d[d.length-2] -= d.pop(); end-code 
 code * ( a b -- a*b ) var d = vm.dStk; d[d.length-2] *= d.pop(); end-code 
 code / ( a b -- a/b ) var d = vm.dStk; d[d.length-2] /= d.pop(); end-code 
 code drop ( n -- ) vm.dStk.pop(); end-code 
 code nip ( a b -- b ) var d = vm.dStk; d[d.length-2] = d.pop(); end-code 
 code dup ( n -- n n ) var d = vm.dStk; d.push( d[d.length-1] ); end-code 
 code over ( a b -- a b a ) var d = vm.dStk; d.push( d[d.length-2] ); end-code 
 code pick ( ni .. n1 n0 i -- ni .. n1 n0 ni ) var d = vm.dStk, t = d.length - 1, i = d[t]; d[t] = d[t-1-i]; end-code 
 code swap ( a b -- b a ) var d=vm.dStk, t=d.length-1, a=d[t-1], b=d[t]; d[t-1]=b, d[t]=a; end-code 
 code rot ( a b c -- b c a ) var d=vm.dStk, t=d.length-1, a=d[t-2], b=d[t-1], c=d[t]; d[t-2]=b, d[t-1]=c, d[t]=a; end-code 
 code -rot ( a b c -- c a b ) var d=vm.dStk, t=d.length-1, a=d[t-2], b=d[t-1], c=d[t]; d[t-2]=c, d[t-1]=a, d[t]=b; end-code 
 code roll ( ni .. n1 n0 i -- .. n1 n0 ni ) var d=vm.dStk, t=d.length-2, i=d.pop(), ni=d[t-i]; while(i){ d[t-i]=d[t-i+1]; i--; } d[t]=ni; end-code 
 code ** ( a b -- a**b ) var d = vm.dStk, t=d.length-2; d[t] = Math.pow( d[t], d.pop() ); end-code 
 code base ( -- addr ) vm.dStk.push( vm.base ); end-code 
 code >in ( -- addr ) vm.dStk.push( vm.toIn ); end-code 
 code @ ( addr -- value ) var d = vm.dStk, t = d.length-1, addr=d[t]; d[t] = vm.ram[addr]; end-code 
 code ! ( value addr -- ) var d = vm.dStk; vm.ram[d.pop()] = d.pop(); end-code 
 code words ( -- ) vm.type( Object.keys( vm.dict ).map( function( name ) { return vm.dict[name].id + " " + name; }).join( " " ) ), vm.cr(); end-code 
 code ] ( -- ) vm.compiling = true; end-code 
 code [ ( -- ) vm.compiling = false; end-code 
 code token ( <token> -- str ) vm.dStk.push( vm.getToken() ); end-code 
 code find ( str -- w ) var d = vm.dStk; d.push( vm.dict( d.pop() ) ); end-code 
 code ' ( <name> -- w ) vm.dStk.push( vm.dict[ vm.getToken() ] ); end-code 
 code , ( n -- ) vm.compileOffset( vm.dStk.pop() ); end-code 
 code word, ( w -- ) vm.compileWord( vm.dStk.pop() ); end-code 
 code compile ( -- ) vm.compileWord( vm.head.parm[vm.head.ip++] ); end-code 
 code literal ( n -- ) vm.compileNumber( vm.dStk.pop() ); end-code immediate 
 code execute ( w -- ) vm.executeWord( vm.dStk.pop() ); end-code 
 code alias ( w <name> -- ) var w = vm.dStk.pop(), n = vm.createWord(); n.code = w.code; \
   if( w.parm ) n.parm = w.parm; vm.addWord( n ); \
 end-code 
 ' doRet alias exit ( -- ) 
 : hex ( -- ) 16 base ! ;  : decimal ( -- ) 10 base ! ; 
 : h. ( number -- ) base @ swap hex . base ! ; 
 : h.r ( number n -- ) base @ -rot hex .r base ! ; 
 : h.0r ( number n -- ) base @ -rot hex .0r base ! ; 
 .( input "$100 decimal ." should output "256" ) cr 
 $100 . cr 
 .( input "$1234 8 h.0r" should output "00001234" ) cr 
 $1234 8 h.0r cr 
 code here ( -- n ) vm.dStk.push(vm.last.parm.length); end-code 
 code compileTo ( n a -- ) vm.last.parm[vm.dStk.pop()] = vm.dStk.pop(); end-code 
 code i ( -- n ) vm.dStk.push( vm.rStk[vm.rStk.length-1] ); end-code 
 code bl ( -- n ) vm.dStk.push( " " ); end-code 
 code quote ( -- n ) vm.dStk.push( String.fromCharCode(34) ); end-code 
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
 : t99 ( -- ) cr 8 for 9 i - t9 next ; t99 
 code (see) ( w -- ) vm.cr(); vm.dStk.pop().parm.forEach(function(w,i){ \
	if( typeof(w)=='object' && w.name ) w = (w.immediate?'[compile] ':'')+w.name; \
	else if( typeof(w)=='string' ) w = '"'+w+'"'; \
	vm.cr( (i<10?'0':'')+i+' : '+w ); \
 }); end-code 
 : see ( <word> -- ) ' (see) ; 
 code quote vm.dStk.push( '"' ); end-code 
 code word vm.dStk.push( vm.getToken( vm.dStk.pop() ) ); end-code 
 : s" ( <string>" -- ) quote word compiling if compile doStr , then ; immediate 
 : [compile] ' , ; immediate 
 : ." ( <string>" -- ) [compile] s" compile type ; immediate 
 .( input "words" should output the following: ) cr 
 words cr 
`);
console.stdlog = console.log.bind(console);
console.logs = [];
console.log = function(){
    console.logs.push(Array.from(arguments));
    console.stdlog.apply(console, arguments);
}