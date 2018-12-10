// index.js @ https://github.com/samsuanchen/superAnthony3
var shader_fs = `
    precision mediump float;
    varying vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }`
var shader_vs = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    varying vec4 vColor;
    void main() {
        gl_Position = uPMatrix * uMVMatrix * aVertexPosition;
        vColor = aVertexColor;
    }`
var gl = canvas.getContext("webgl");
var pMatrix = mat4.create();
var mvMatrix = mat4.create();
function initGL() {
	if (! gl) {
		alert("Could not initialise WebGL, sorry :-(");
		return;
	}
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
}
function compileTypeShader(type, shaderScript) {
	var typeShader;
	if (type == "fragmentShader") {
		typeShader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (type == "vertexShader") {
		typeShader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}
	gl.shaderSource(typeShader, shaderScript);
	gl.compileShader(typeShader);
	if (!gl.getShaderParameter(typeShader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(typeShader));
		return null;
	}
	return typeShader;
}
var shader;
function initShaders() {
	var fragmentShader = compileTypeShader("fragmentShader", shader_fs);
	var vertexShader = compileTypeShader("vertexShader", shader_vs);
	shader = gl.createProgram();
	gl.attachShader(shader, vertexShader);
	gl.attachShader(shader, fragmentShader);
	gl.linkProgram(shader);
	if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}
	gl.useProgram(shader);
	shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	shader.vertexColorAttribute = gl.getAttribLocation(shader, "aVertexColor");
	gl.enableVertexAttribArray(shader.vertexColorAttribute);
	shader.pMatrixUniform = gl.getUniformLocation(shader, "uPMatrix");
	shader.mvMatrixUniform = gl.getUniformLocation(shader, "uMVMatrix");
}
var	vertexPositionBufferItemSize = 3; // x, y, z
var	vertexColorBufferItemSize = 3; // R, G, B
function initBuffers() {
	cube.vertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW);
	cube.vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.indices), gl.STATIC_DRAW);
}
function drawBackground() {
	gl.clearColor(0.2, 0.2, 0.2, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	gl.uniformMatrix4fv(shader.pMatrixUniform, false, pMatrix);
}
function changeScale(points, s, v){
	if(typeof(s) == "number"){
		for(var i=0; i<points.length; i++) v[i]=points[i]*s;
	} else {
		for(var i=0; i<points.length; i+=3) v[i]=points[i]*s[0], v[i+1]=points[i+1]*s[1], v[i+2]=points[i+2]*s[2];
	}
}
cube.draw = function (s) {
	var scale = s || 1, v=[];
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	changeScale(cube.points, scale, v);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, vertexPositionBufferItemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexColorBuffer);
	gl.vertexAttribPointer(shader.vertexColorAttribute, vertexColorBufferItemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);
	gl.uniformMatrix4fv(shader.mvMatrixUniform, false, mvMatrix);
	gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
}
function setOrigin(pos) { mat4.identity(mvMatrix); mat4.translate(mvMatrix, pos); }
function translate(pos) { mat4.translate(mvMatrix, pos); }
function rotate(dir, angle) { mat4.rotate(mvMatrix, angle * Math.PI / 180, dir); }
function rotateX(angle) { mat4.rotateX(mvMatrix, angle * Math.PI / 180); }
function rotateY(angle) { mat4.rotateY(mvMatrix, angle * Math.PI / 180); }
function rotateZ(angle) { mat4.rotateZ(mvMatrix, angle * Math.PI / 180); }
var stack = [];
function mvMatrixPush(){ var copy = mat4.create(); mat4.set(mvMatrix, copy); stack.push(copy); }
function mvMatrixPop(){ mat4.set(stack.pop(), mvMatrix); }
function webGLStart() {
	initGL();
	initShaders();
	initBuffers();
	drawAnthony(0);
	animate();
}