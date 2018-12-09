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
f.userException = function ( message ) {
   this.message = message;
   this.name = 'userException';
   f.print(JSON.stringify(message));
}
f.error = function ( message ) {
   f.userException( message );
   exit;
}
f.panic = function( msg ){	// print message and return f.errorMessage
	f.errorMessage = { msg: msg,
		base: f.ram[f.base], tib: f.tib, toIn: f.ram[f.toIn], last: f.last,
		token: f.token, word: f.word, compiling: f.compiling, head: f.head,
		dStk: f.dStk, rStk: f.rStk
	}
	if( f.ram[f.tracing] ) window.alert("??? "+msg+" ???\n"+JSON.stringify(f.errorMessage,null,2));
	f.error(f.errorMessage);
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
		f.traceInfo( 'execute '+(f.head ? ( ( f.head.ip - 1 ) + ' ' ) : '' ) + 'word ' + w.name, 1 );
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
f.zBranch = function(){		// branch to relative ip addr if TOS is 0 or undefined
	if( f.dStk.pop() ) f.head.ip++;
	else f.head.ip += f.head.parm[f.head.ip];
}
f.doFor = function(){		// push the loop counter for-next to return stack
	f.rStk.push(f.dStk.pop());
}
f.doNext = function(){		// dec counter and loop back to relative ip addr if counter is 0
	var r = f.rStk, t = r.length - 1, counter = -- r[t];
	if( counter < 0 ) f.head.ip++, r.pop();
	else f.head.ip += f.head.parm[f.head.ip];
}
f.compile = function( w ) {	// compile a word into colon word-list
	f.last.parm.push( w );
}
f.createWord = function( code, tag, value ){ // 
	var name = f.getToken();
	if( f.ram[f.tracing] ) f.traceInfo( 'create a new word ' + name );
	if( ! name ) {
		f.panic("expect a name of new word");
		return;
	}
	var w = f.last = { id: Object.keys( f.dict ).length, name: name }
	if( code ) w.code = code;
	if( tag ) w[tag] = value;
	return w;
}
f.addWord = function(w){	// add a new into the dictionary
	f.dict[w.name] = w;
}
f.getToken = function( delimiter ) { // get next token from tib
	delimiter = delimiter || ' ';
	var m, t = f.tib.substr( f.ram[f.toIn] );
	if( delimiter != ' ' ){
		delimiter = delimiter.charAt(0);
		if( delimiter ==')' ) delimiter = '\\'+delimiter;
		var regexp = RegExp('^\\s*(.+?)'+delimiter+'(\\s|$)');
		m = t.match( regexp );
		if( m ) {
			f.ram[f.toIn] += m[0].length;  return m[1]; 
		}
		f.ram[f.toIn] += t.length; return t.substr(1);
	}
	m = t.match( /^\s*(\S+)\s?/ );
	if( !m ) return;
	f.ram[f.toIn] += m[0].length;
	return m[1];
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
		f.panic( "unable convert to string " + number ); return; }
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
f.eval = function(tib) { // evaluate given script in tib
	f.cr();
	f.tib = tib || "", f.ram[f.toIn] = 0, f.rStk=[], f.compiling = f.errorMessage = false;
	var token;
	while( f.token = token = f.getToken() ){ var w, n;
		if( f.word = w = f.dict[f.token] ){
			if( w.immediate || ! f.compiling ){
				if( w.code==f.doCol ){
					if( f.beforeCalling ) f.beforeCalling();
					f.executeWord(w);
					if( f.afterCalling ) f.afterCalling();
				} else
					f.executeWord(w);		// 1. execute the word
			} else
				f.compileWord(w);			// 2. compile the word
		} else {
			if( token.charAt(0) == '$' )
				n = parseInt( token.substr(1), 16 );	// int number of hex
			else if( f.isNotANumber( token ) ) {
				if( !isNaN( token ) ) f.panic( "not in demimal mode '" + token + "'" );
				var code = "n=" + token;
				try {
					eval( code );
				} catch ( err ) {
					f.panic( "unDefd "+token );					// alert undefined
					break;
				}
			} else if( token.indexOf( '.' )<0 )
				n = parseInt( token, f.ram[f.base] ); // int number
			else
				n = parseFloat( token );				// float number
			if( f.compiling )
				f.compileNumber( n );			// 3. compile the number
			else
				f.numberToStack( n ); 		// 4. push the number onto data stack
		}
		if( f.errorMessage ) break;
	}
}
f.dict = {	// The word "code" so far is the only word in dictionary.
			// Many new words defined by "code" in java script via f.eval() later.
	"code": { id: 0, name: 'code', code: function(){ // ( <namw> -- )
		const w = f.createWord(),
			t = f.tib.substr(f.ram[f.toIn]),
			m = t.match(/^\s*(\(\s.+?\s\)\s)?(.+?)\send-code/);
		if( ! m ){
			f.panic( "expect 'end-code'" );
			return;
		}
		f.ram[f.toIn] += m[0].length;
		var _fun_;
		const code = "_fun_ = function(){" + (m[1] ? ("// " + m[1]) : "") + "\n\t" + m[2] + "}";
		try {
			eval( code ); w.code = _fun_, f.addWord( w );
		} catch ( err ) {
			f.print( 'eval("' + code + '")' );
			f.panic( err )
		}
	} }
};

f.init = function( script ){
	f.print( "the javascript one word vm f 20180715 samsuanchen@gmail.com" );
	f.eval( script );
}

f.init(`
 code immediate ( -- ) f.last.immediate = true; end-code 
 code compile-only ( -- ) f.last.compileOnly = true; end-code 
 code constant ( n <name> -- ) f.addWord( f.createWord( f.doCon, "parm", f.dStk.pop() ) ); end-code 
 code variable ( <name> -- ) f.addWord( f.createWord( f.doVar, "parm", f.ram.length ) ); f.ram.push( 0 ); end-code 
 code value ( n <name> -- ) f.addWord( f.createWord( f.doVal, "parm", f.dStk.pop() ) ); end-code 
 code : ( <name> -- ) f.createWord( f.doCol, "parm", [] ), f.compiling = true; end-code 
 code ; ( -- ) f.compileWord( f.dict.doRet ), f.addWord( f.last ), f.compiling = false; end-code immediate
 code doLit ( -- n ) f.dStk.push( f.head.parm[f.head.ip++] ); end-code compile-only 
 code doStr ( -- str ) f.dStk.push( f.head.parm[f.head.ip++] ); end-code compile-only 
 code doRet ( -- ) f.doRet(); end-code compile-only 
 code exit ( -- ) f.doRet(); end-code compile-only 
 code ?exit ( flag -- ) if( f.dStk.pop() ) f.doRet(); end-code compile-only 
 code doFor ( n -- ) f.doFor(); end-code compile-only 
 code doNext ( -- ) f.doNext(); end-code compile-only 
 code doIf ( n -- ) f.zBranch(); end-code compile-only 
 code doElse ( -- ) f.branch(); end-code compile-only 
 code doThen ( -- ) f.noop(); end-code compile-only 
 code doBegin ( -- ) f.noop(); end-code compile-only 
 code doAgain ( -- ) f.branch(); end-code compile-only 
 code doUntil ( n -- ) f.zBranch(); end-code compile-only 
 code doWhile ( n -- ) f.zBranch(); end-code compile-only 
 code doRepeat ( -- ) f.branch(); end-code compile-only 
 code ( ( <string> -- ) f.getToken( ")" ); end-code immediate 
 code \\ ( <string> -- ) f.getToken( String.fromCharCode(10) ); end-code immediate \\ ignore string until end of line
 code cr ( -- ) f.cr(); end-code 
 code space ( -- ) f.emit( 0x20 ); end-code 
 code spaces ( n -- ) var n=f.dStk.pop(); for(var i=0; i<n; i++) f.emit( 0x20 ); end-code 
 code emit ( charCode -- ) f.emit( f.dStk.pop() ); end-code
 code type ( string -- ) f.type( f.dStk.pop() ); end-code 
 code .( ( <string> -- ) f.type( f.getToken( ")" ) ); end-code 
 code . ( n -- ) f.type( f.toString( f.dStk.pop() )+" " ); end-code 
 code .r ( n w -- ) var d = f.dStk, w = d.pop(); f.type( f.dotR( d.pop(), w, " " ) ); end-code 
 code .0r ( n w -- ) var d = f.dStk, w = d.pop(); f.type( f.dotR( d.pop(), w, "0" ) ); end-code 
 code + ( a b -- a+b ) var d = f.dStk; d[d.length-2] += d.pop(); end-code 
 code - ( a b -- a-b ) var d = f.dStk; d[d.length-2] -= d.pop(); end-code 
 code * ( a b -- a*b ) var d = f.dStk; d[d.length-2] *= d.pop(); end-code 
 code / ( a b -- a/b ) var d = f.dStk; d[d.length-2] /= d.pop(); end-code 
 code drop ( n -- ) f.dStk.pop(); end-code 
 code nip ( a b -- b ) var d = f.dStk; d[d.length-2] = d.pop(); end-code 
 code dup ( n -- n n ) var d = f.dStk; d.push( d[d.length-1] ); end-code 
 code over ( a b -- a b a ) var d = f.dStk; d.push( d[d.length-2] ); end-code 
 code pick ( ni .. n1 n0 i -- ni .. n1 n0 ni ) var d = f.dStk, t = d.length - 1, i = d[t]; d[t] = d[t-1-i]; end-code 
 code swap ( a b -- b a ) var d=f.dStk, t=d.length-1, a=d[t-1], b=d[t]; d[t-1]=b, d[t]=a; end-code 
 code rot ( a b c -- b c a ) var d=f.dStk, t=d.length-1, a=d[t-2], b=d[t-1], c=d[t]; d[t-2]=b, d[t-1]=c, d[t]=a; end-code 
 code -rot ( a b c -- c a b ) var d=f.dStk, t=d.length-1, a=d[t-2], b=d[t-1], c=d[t]; d[t-2]=c, d[t-1]=a, d[t]=b; end-code 
 code roll ( ni .. n1 n0 i -- .. n1 n0 ni ) var d=f.dStk, t=d.length-2, i=d.pop(), ni=d[t-i]; while(i){ d[t-i]=d[t-i+1]; i--; } d[t]=ni; end-code 
 code ** ( a b -- a**b ) var d = f.dStk, t=d.length-2; d[t] = Math.pow( d[t], d.pop() ); end-code 
 code base ( -- addr ) f.dStk.push( f.base ); end-code 
 code >in ( -- addr ) f.dStk.push( f.toIn ); end-code 
 code tracing ( -- addr ) f.dStk.push( f.tracing ); end-code 
 code @ ( addr -- value ) var d = f.dStk, t = d.length-1, addr=d[t]; d[t] = f.ram[addr]; end-code 
 : ? ( addr -- ) @ . ; 
 code ! ( value addr -- ) var d = f.dStk; f.ram[d.pop()] = d.pop(); end-code 
 : on ( addr -- ) 1 swap ! ; 
 : off ( addr -- ) 0 swap ! ; 
 code words ( -- ) f.type( Object.keys( f.dict ).map( function( name ) { return f.dict[name].id + " " + name; }).join( " " ) ), f.cr(); end-code 
 code ] ( -- ) f.compiling = true; end-code 
 code [ ( -- ) f.compiling = false; end-code 
 code token ( <token> -- str ) f.dStk.push( f.getToken() ); end-code 
 code find ( str -- w ) var d = f.dStk; d.push( f.dict( d.pop() ) ); end-code 
 code ' ( <name> -- w ) f.dStk.push( f.dict[ f.getToken() ] ); end-code 
 code , ( n -- ) f.compileOffset( f.dStk.pop() ); end-code 
 code word, ( w -- ) f.compileWord( f.dStk.pop() ); end-code 
 code compile ( -- ) f.compileWord( f.head.parm[f.head.ip++] ); end-code 
 code literal ( n -- ) f.compileNumber( f.dStk.pop() ); end-code immediate 
 code execute ( w -- ) f.executeWord( f.dStk.pop() ); end-code 
 : trace ( <word> -- ) ' 1 tracing ! execute 0 tracing ! ; 
 code alias ( w <name> -- ) var w = f.dStk.pop(), n = f.createWord(); n.code = w.code; if( w.parm ) n.parm = w.parm; f.addWord( n ); end-code 
 code > ( a b -- a>b ) f.dStk.push(f.dStk.pop()<f.dStk.pop()); end-code
 code < ( a b -- a<b ) f.dStk.push(f.dStk.pop()>f.dStk.pop()); end-code
 code >= ( a b -- a>=b ) f.dStk.push(f.dStk.pop()<=f.dStk.pop()); end-code
 code <= ( a b -- a<=b ) f.dStk.push(f.dStk.pop()>=f.dStk.pop()); end-code
 code = ( a b -- a=b ) f.dStk.push(f.dStk.pop()==f.dStk.pop()); end-code
 code <> ( a b -- a<>b ) f.dStk.push(f.dStk.pop()!=f.dStk.pop()); end-code
 code 1+ f.dStk[f.dStk.length-1]++; end-code
 code 1- f.dStk[f.dStk.length-1]--; end-code
 code 2+ f.dStk[f.dStk.length-1]+=2; end-code
 code 2- f.dStk[f.dStk.length-1]-=2; end-code
 code 2dup f.dStk.push(f.dStk[f.dStk.length-2]); f.dStk.push(f.dStk[f.dStk.length-2]); end-code
 code 2drop f.dStk.length-=2; end-code
 code 3drop f.dStk.length-=3; end-code
 code 2over f.dStk.push(f.dStk[f.dStk.length-4]); f.dStk.push(f.dStk[f.dStk.length-4]); end-code
 code depth f.dStk.push(f.dStk.length); end-code
 code r@ f.dStk.push(f.rStk[f.rStk.length-1]); end-code
 ' r@ alias i
 code r> f.dStk.push(f.rStk.pop()); end-code
 code >r f.rStk.push(f.dStk.pop()); end-code
 code pick ( ni .. n2 n1 n0 i -- ni .. n2 n1 n0 ni )
   f.dStk[f.dStk.length-1]=f.dStk[f.dStk.length-f.dStk[f.dStk.length-1]-2]; end-code
 ' doRet alias exit ( -- ) 
 : hex ( -- ) 16 base ! ;  : decimal ( -- ) 10 base ! ; 
 : h. ( number -- ) base @ swap hex . base ! ; 
 : h.r ( number n -- ) base @ -rot hex .r base ! ; 
 : h.0r ( number n -- ) base @ -rot hex .0r base ! ; 
 .( input "$100 decimal ." should output the following "256" ) cr 
 $100 . cr 
 .( input "$1234 8 h.0r" should output the following "00001234" ) cr 
 $1234 8 h.0r cr 
 code here ( -- n ) f.dStk.push(f.last.parm.length); end-code 
 code compileTo ( n a -- ) f.last.parm[f.dStk.pop()] = f.dStk.pop(); end-code 
 code i ( -- n ) f.dStk.push( f.rStk[f.rStk.length-1] ); end-code 
 code bl ( -- n ) f.dStk.push( " " ); end-code 
 code quote ( -- n ) f.dStk.push( String.fromCharCode(34) ); end-code 
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
 : t99 ( -- ) 8 for 9 i - t9 next ;
 .( input "t99" should output the following: ) cr t99 
 code word ( delimiter -- str ) f.dStk.push(f.getToken(f.dStk.pop())); end-code
 code 拆板 ( n obj -- n ) f.dStk.pop().indices.length -= f.dStk[f.dStk.length-1]; end-code
 code 裝板 ( n obj -- ) f.dStk.pop().indices.length += f.dStk.pop(); end-code
 .( input "words" should output the following: ) cr 
 words cr 
 code ." ( <str>" -- ) f.compile(f.dict.doStr); f.compile(f.getToken('"')); end-code immediate 
 : .s depth if depth 1- for r@ pick . next else ." empty " . then cr ;
`);