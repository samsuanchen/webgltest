# TOP FORTH  #

## A) Forth 基本特性

   1. Forth 是 場域應用系統 (domain specific system) 使用者 或 程式語言 初學者 容易使用
      並且 容易用以設計 場域應用系統 的 語言。

   2. Forth 是 程式語言 開發者 容易輕鬆建制 的 系統, 從無到有 (Bottom Up)
      或者 從既有到更豐富 (Top Up)。

## B) 對 Forth 的期許

   1. Forth 應該永遠是 場域應用系統 使用者 或 程式語言 初學者 方便的工具。

   2. Forth 應該永遠是 場域應用系統 使用者 與 開發者 隨時代進步而日新月異的
      方便工具 (善用既有豐富資源)。

## C) TOP FORTH

   Forth 應該就是 站在巨人肩膀 (On Top, 在既有 豐富資源的語言環境上, 例如 js), 
   充分 發揮 Forth 本能, 輕鬆創造 應用新指令 的 Top Up 發展系統。 這樣的 Forth 
   或許可以 稱作 TOP FORTH。

## D) oneWordVM.js

   oneWordVM.js 中 f = new  oneWordVM(); 這 js 指令 預設 f 為僅有 1 個指令 (Forth Word)  
   的 TOP FORTH 核心引擎。 這僅有的指令叫作 "code", 有了這指令 就可 定義出許多新指令 (Forth Word) 分別去執行 任何形式的 js code。

## E) f.eval(script)

   f.eval(script) 這 js 指令 將 script 存到 輸入暫存區 f.tib, 然後 依序取 以 white space 區隔的
   字串 f.token (注意! 其中不含 white space) 依下述規則處理之。
   
   1. 若 f.token 是 Forth Word, 就直接執行。 
   2. 若 f.token 是一個 任何進制的 整數 int 就放上 資料堆疊 f.dStk。 
   3. 若 f.token 是一個 js object, 不管是 10 進制 float, string, list, function, … 等, 也放上 f.dStk。
   4. 否則, 就宣稱 這 f.token 字串 為 "unDef", 並停止其餘 token 的處理。

   
## F) 用 code 定義 Forth Word

   現在說明 怎樣可以 在 script 中 用 code 來定義 Forth Word, 其語法如下。 
   
   1. code 之後 是 Forth Word 的名稱 (可為任何字串, 可包含任何符號)。 
   2. 隨後 可接或不接 一個 i/o 參數宣告 (左右圓括弧間)。 兩個減號前 代表這 Forth Word 執行時
      從 輸入暫存區 f.tib 取後續 token 或 資料堆疊 f.dStk 取其上 data; 兩個減號後 代表 執行後
	  放上 資料堆疊 f.dStk 的 data。
   3. 之後到 end-code 間 為這 Forth Word 所要執行的 js script。
   
   例1: 定義一個 名稱為 space 的 Forth Word。 
	
	f.eval(`
		code space ( -- ) // 印出 空白字元 (其實並非真正印出, 乃是加到 輸出暫存區 f.tob)
			f.tob+=" ";
			end-code
	`)
	
   執行這 Forth Word 也就是執行 js 指令 f.tob+=" "; 將 空白字元 加到 輸出暫存區 f.tob 等候印出。
   雙斜線是 js 註解 其後文字僅供參考 用以說明執行效果。
   
   例2: 定義兩個 名稱為 bl 及 emit 的 Forth Word。
	
	f.eval(`
		code bl ( -- 32 ) // 空白字元 的 ASCII 碼 32 放上 資料堆疊 f.dStk
			f.dStk.push(32);
			end-code
		code emit ( asciiCode -- ) // 印出  ASCII 碼 對應的字元 (並非真正印出, 乃加到 f.tob)
			f.tob+=String.fromCharCode(asciiCode);
			end-code
	`)
	
   註1: i/o 參數宣告 中的名稱, 例如 asciiCode, 可直接引用於 所要執行的 js script, 例如
   f.tob+=String.fromCharCode(asciiCode); 之中。
		
   註2: 若 執行一個 Forth Word, 例如 space, 就能達到 執行幾個 Forth Word, 例如 bl emit,
   的相同效果, 應多加考慮 以大幅增進 執行效率。

   註3: 針對 場域應用 系統設計, 太過低階又用不到的 Forth Word 或可不必定義。
   
   
## G) Forth Word 範例
		
	code quote ( -- 34 ) // 雙引號 字元的 ASCII 碼 34 (存到 資料堆疊 f.dStk)。
		f.dStk.push(34); end-code
		
	code space ( -- ) // 印出 空白字元 (其實並未真正印出, 乃是存到 輸出暫存區 f.tob)。
		f.tob+=" "; end-code
	
	code print ( dataItem -- ) // 印出 資料堆疊上的項目 (轉成字串 存到 輸出暫存區 f.tob)。
		f.tob+=f.dStk.pop(); end-code
		
	code . ( dataItem -- ) // 印出 資料堆疊上的項目 (轉成字串) 並多印一個空白 (到 f.tob)。
		f.tob+=f.dStk.pop()+" "; end-code
		
	code emit ( ASCII -- ) // 印出 ASCII 碼 對應字元 (到 輸出暫存區 f.tob)。
		f.tob+=String.fromCharCode(f.dStk.pop()); end-code
		
	code cr ( -- ) // 印出 輸出暫存區 f.tob 字串, 然後清空 f.tob (準備存之後要輸出的字串)。
		console.log(f.tob), f.tob=""; end-code
		
	code + ( a b -- a+b ) // 取資料堆疊頂端兩項 (number, string, 或其他) 相加, 留結果在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]+=t; end-code
		
	code - ( a b -- a-b ) // 取資料堆疊頂端兩數相減, 留結果在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]-=t; end-code
		
	code * ( a b -- a*b ) // 取資料堆疊頂端兩數相乘, 留結果在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]*=t; end-code
		
	code / ( a b -- a/b ) // 取資料堆疊頂端兩數相除, 留商數在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]/=t; end-code
		
	code mod ( a b -- a%b ) // 取資料堆疊頂端兩數相除, 留餘數在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]%=t; end-code
		
	code or ( a b -- a|b ) // 取資料堆疊頂端兩數 執行 bitwise OR, 留結果在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]|=t; end-code
		
	code and ( a b -- a&b ) // 取資料堆疊頂端兩數 執行 bitwise AND, 留結果在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]&=t; end-code
		
	code xor ( a b -- a^b ) // 取資料堆疊頂端兩數 執行 bitwise XOR, 留結果在堆疊。
		var s=f.dStk, t=s.pop(); s[s.length-1]^=t; end-code
		
	code = ( a b -- a==b ) // 取資料堆疊頂端兩項 看是否相等, 留下 true 或 false。
		var s=f.dStk, t=s.pop(); s[s.length-1]=s[s.length-1]==t; end-code
		
	code <> ( a b -- a==b ) // 取資料堆疊頂端兩項 看是否不等, 留下 true 或 false。
		var s=f.dStk, t=s.pop(); s[s.length-1]=s[s.length-1]!=t; end-code
		
	code < ( a b -- a<b ) // 取資料堆疊頂端兩項 看是否前項小於後項, 留下 true 或 false。
		var s=f.dStk, t=s.pop(); s[s.length-1]=s[s.length-1]<t; end-code
		
	code > ( a b -- a>b ) // 看資料堆疊頂端兩項 前項是否大於後項, 留下 true 或 false。
		var s=f.dStk, t=s.pop(); s[s.length-1]=s[s.length-1]>t; end-code
		
	code <= ( a b -- a<=b ) // 看資料堆疊頂端兩項 前項是否不大於後項, 留下 true 或 false。
		var s=f.dStk, t=s.pop(); s[s.length-1]=s[s.length-1]<=t; end-code
		
	code >= ( a b -- a>=b ) // 看資料堆疊頂端兩項 前項是否不小於後項, 留下 true 或 false。
		var s=f.dStk, t=s.pop(); s[s.length-1]=s[s.length-1]>=t; end-code
		
	code true ( -- true ) // 將 true 放上 資料堆疊。
		f.dStk.push(true); end-code
		
	code false ( -- false ) // 將 false 放上 資料堆疊。
		f.dStk.push(false); end-code

G) 堆疊操作

   dup、swap、drop … 這些 堆疊操作指令 不是 forth 吸引人的特點, 我們不該太過強調他們。就算沒有這些 堆疊操作指令 應該也沒關係吧。
   不過, 我們還是可以 將這些 Forth 標準指令 當作範例 加入系統, 如下。
   
	code dup ( a -- a a ) // 資料堆疊頂端項目 複製
		var s=f.dStk, a=s[s.length-1]; s.push(a); end-code
	
	code swap ( a b -- b a ) // 資料堆疊頂端兩項目 位置對調
		var s=f.dStk, n=s.length, b=s[n-1]; s[n-1]=s[n-2]; s[n-2]=b; end-code;
	
	code drop ( a -- ) // 資料堆疊頂端項目 丟棄
		f.dStk.length--;
   
	code over ( a b -- a b a ) // 資料堆疊頂端次項 複製
		var s=f.dStk, a=s[s.length-2]; s.push(a); end-code
   
	code rot ( a b c -- b c a ) // 資料堆頂三項 位置轉動
		var s=f.dStk, n=s.length, a=s[n-3];
		s[n-3]=s[n-2]; s[n-2]=s[n-1]; s[n-1]=a; end-code
   
	code -rot ( a b c -- c a b ) // 資料堆頂三項 位置反轉
		var s=f.dStk, n=s.length, c=s[n-1];
		s[n-1]=s[n-2]; s[n-2]=s[n-3]; s[n-3]=c; end-code
		
	code pick ( ni .. n2 n1 n0 i == ni .. n2 n1 n0 ni )
		var s=f.dStk, i=s.pop(); s.push(s[i]); end-code
   
	code roll ( ni .. n2 n1 n0 i == .. n2 n1 n0 ni )
		var s=f.dStk, i=s.pop(), n=s.length, ni=s[n-i];
		while(i>1)s[n-i]=s[n-(--i)]; s[n-1]=ni; end-code
   
   還有一些常見的堆疊操作指令
   
	code nip ( a b -- b )
		var s=f.dStk, b=s.pop(); s[s.length-1]=b; end-code
	
	code tuck ( a b -- b a b )
		var s=f.dStk, n=s.length, b=s[n-1], a=s[n-2];
		s[n-2]=b, s[n-1]=a, s.push(b); end-code
	
	code 2dup ( a b --  a b a b )
		var s=f.dStk, n=s.length, b=s[n-1], a=s[n-2];
		s.push(a), s.push(b); end-code
		
	code 2drop ( a b -- ) f.dStk.length-=2; end-code
	
	code 2swap ( a b c d -- c d a b )
		var s=f.dStk, n=s.length, a=s[n-4], b=s[n-3];
		s[n-4]=s[n-2], s[n-3]=s[n-1], s[n-2]=a, s[n-1]=b; end-code
		
	code 2over ( a b c d -- a b c d a b )
		var s=f.dStk, n=s.length, a=s[n-4], b=s[n-3];
		s.push(a), s.push(b); end-code
		
H) f.dict 字典 與其中的 Forth Word

   f.dict 是一個字典, 每個 Forth Word 的 名稱 就是搜尋字典的 key。
   若 Forth Word 的 名稱 是 "x", 則 f.dict["x"] 就是 所找到 的 Forth Word, f.word。
   (重複用同一個名稱 定義的 Forth Word 將取代之前所定義的 Forth Word)
   
   以 w=f.dict["x"] 為例, w.name 就是 "x", w.code 就是 所要執行的 js code。
   w.id 則是 序號 (定義這 Forth Word 時的 流水號)。

I) constant

   常常要取用的不變資料 可用 constant 來定義, 例如 f.eval("16 constant led"),
   定義 led 就是 16, 執行 led 這 Forth Word 就是 執行 f.doCon,
   把存放在 f.word.parm 的內容 16 放上 資料堆疊 f.dStk。 f.doCon 的定義如下。
   
	f.doCon=function(){f.dStk.push(f.word.parm);}
 
   所有用 constant 來定義的 Forth Word 我們稱作 constant type Forth Word。
   f.dict['constant'], 或可簡寫為 f.dict.constant, 可在 script 中定義如下。
   
	code constant ( n <name> -- ) // 用 n 定義 一個 constant type Forth Word
		var w = f.createWord( f.doCon );
		w.name = f.dStk.pop(), w.parm = f.dStk.pop();
		f.addWord( w );
	end-code 

J) value

   會改變的資料 可用 value 來定義, 例如 f.eval("0 value level"), 
   定義 level 的起始值為 0, 執行 level 這 Forth Word 就是 執行 f.doVal,
   也是把存放在 f.word.parm 的值 放上 資料堆疊 f.dStk, 只是這值是隨時可改變的。
   f.doVal 的定義如下。
   
	f.doVal=function(){f.dStk.push(f.word.parm);}
 
   所有用 value 來定義的 Forth Word 我們稱作 value type Forth Word。
   f.dict['value'], 或可簡寫為 f.dict.value, 可在 script 中定義如下。
   
	code value ( n <name> -- ) // 用 n 定義 一個 value type Forth Word
		var w = f.createWord( f.doCon );
		w.name = f.dStk.pop(), w.parm = f.dStk.pop();
		f.addWord( w );
	end-code 
   


# superAnthony4

I am trying to draw a 3D robot so called Super Anthony animated via webGL programming in js.

## show the robot on web html page, in superAnthony3.html

## use a 3D cube as the basic object, in cube.js

## animate 3D objects via webGL GPU shader programs, in index.js

## rotate angles of 16 motors to move the robot and the scene in superAnthony.js 

## handle UI controls via event handlers, in eventHandlers.js

## calculate 3D motion via matrix operation, in glMatrix-0.9.5.js

## repeat animation frames via the function called in webgl-utils.js

## provide a one word VM, in oneWordVM.js

### ### an instence f of the one word VM uses js console as output device
### ### use fuction key, e.g. f12 for chrome, to open a js console
### ### f.eval(script) gives the f a script to execute
#### $$$$ f.eval parses tokens from script, (taking white space as delimiter)
#### $$$$ if token is a word name in dictionary, f.dict, f executes the word
#### $$$$ if token is a number, interger or float, f pushs the it onto data stack, f.dStk
#### $$$$ if token is a js object, f pushs the object onto data stack, f.dStk
#### $$$$ else f reports the token as unDef
#### $$$$ e.g. f.eval('1.2 3')
The given script '1.2 3' pushs two numbers 1.2 and 3 onto data stack, f.dStk
#### $$$$ e.g. f.eval('code + var x=f.dStk.pop(); f.dStk.push(f.dStk.pop()+x); end-code')
The given script defines + as the name of word to do f.dStk.push(f.dStk.pop()+f.dStk.pop());
Pops two numbers from stack, e.g. 1.2 and 3, adds them as sum, e.g. 4.2, pushs it onto stack
#### $$$$ e.g. f.eval('code . f.print(f.dStk.pop()); end-code')
The given script defines . as the name of word to do f.print(f.dStk.pop());
Pops a data (number or js object) from stack, e.g. 4.2, print the data
#### $$$$ e.g. f.eval('1.2 3 + .')
Two numbers 1.2 and 3 are added, then print the sum 4.2
#### $$$$ e.g. f.eval('"data1" . "data" 2 + .')
String "data1" is printed first, then "data" and 2 are added, then print the result string "data2"
#### $$$$ e.g. f.eval()
Default script is given to add 123 words into dictionary f.dict
### ### f.dict[wordName] and f.dStk[i]

### ### the word w in f.dict
#### $$$$ primitive word, the word code or the word of w.definedBy="code"
##### ***** w.name
##### ***** w.code
#### $$$$ other word types, each of same w.code but differnt w.parm
##### ***** constant word, w.code=f.doCon and w.definedBy="constant"
##### ***** value word, w.code=f.doVal and w.definedBy="value"
##### ***** variable word, w.code=f.doVar and w.definedBy="variable"
##### ***** colon word, w.code=f.doCol and w.definedBy=":"
#### $$$$ compilation and execution of the colon word 
##### ***** w.immediate
##### ***** w.compileOnly
##### ***** f.rStk[i]
#### $$$$ other word attributes
##### ***** w.id
##### ***** w.src
##### ***** w.iInp
##### ***** w.srcBgn
##### ***** w.srcEnd
### ### testing and checking
#### $$$$ f.eval(script)
#### $$$$ f.dStk
#### $$$$ w=f.dict[wordName]
#### $$$$ f.execute(w) 
#### $$$$ f.word=w and w.code()
#### $$$$ w.src
#### $$$$ f.tracing=true

