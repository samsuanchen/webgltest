var tdl = tdl || {};
var goog = goog || {};
if (!window.Int32Array) {
    window.Int32Array = function() {};
    window.Float32Array = function() {};
    window.Uint16Array = function() {};
}
goog.typedef = true;
tdl.global = this;
tdl.BROWSER_ONLY = true;
tdl.provided_ = [];
tdl.provide = function(name) {
    if (tdl.getObjectByName(name) && !tdl.implicitNamespaces_[name]) {
        throw 'Namespace "' + name + '" already declared.';
    }
    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
        tdl.implicitNamespaces_[namespace] = true;
    }
    tdl.exportPath_(name);
    tdl.provided_.push(name);
};
tdl.implicitNamespaces_ = {};
tdl.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
    var parts = name.split('.');
    var cur = opt_objectToExportTo || tdl.global;
    var part;
    if (!(parts[0] in cur) && cur.execScript) {
        cur.execScript('var ' + parts[0]);
    }
    while (parts.length && (part = parts.shift())) {
        if (!parts.length && tdl.isDef(opt_object)) {
            cur[part] = opt_object;
        } else if (cur[part]) {
            cur = cur[part];
        } else {
            cur = cur[part] = {};
        }
    }
};
tdl.getObjectByName = function(name, opt_obj) {
    var parts = name.split('.');
    var cur = opt_obj || tdl.global;
    for (var pp = 0; pp < parts.length; ++pp) {
        var part = parts[pp];
        if (cur[part]) {
            cur = cur[part];
        } else {
            return null;
        }
    }
    return cur;
};
tdl.require = function(rule) {
    var dummy = document.getElementsByTagName('script').length;
    if (tdl.getObjectByName(rule)) {
        return;
    }
    var path = tdl.getPathFromRule_(rule);
    if (path) {
        tdl.included_[path] = true;
        tdl.writeScripts_();
    } else {
        throw new Error('tdl.require could not find: ' + rule);
    }
};
tdl.basePath = '';
tdl.included_ = {};
tdl.dependencies_ = {
    visited: {},
    written: {}
};
tdl.findBasePath_ = function() {
    var doc = tdl.global.document;
    if (typeof doc == 'undefined') {
        return;
    }
    if (tdl.global.BASE_PATH) {
        tdl.basePath = tdl.global.BASE_PATH;
        return;
    } else {
        tdl.global.BASE_PATH = null;
    }
    var expectedBase = 'tdl/base.js';
    var scripts = doc.getElementsByTagName('script');
    for (var script, i = 0; script = scripts[i]; i++) {
        var src = script.src;
        var l = src.length;
        if (src.substr(l - expectedBase.length) == expectedBase) {
            tdl.basePath = src.substr(0, l - expectedBase.length);
            return;
        }
    }
};
tdl.writeScriptTag_ = function(src) {
    var doc = tdl.global.document;
    if (typeof doc != 'undefined' && !tdl.dependencies_.written[src]) {
        tdl.dependencies_.written[src] = true;
        var html = '<script type="text/javascript" src="' +
            src + '"></' + 'script>'
        doc.write(html);
    }
};
tdl.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = tdl.dependencies_;

    function visitNode(path) {
        if (path in deps.written) {
            return;
        }
        if (path in deps.visited) {
            if (!(path in seenScript)) {
                seenScript[path] = true;
                scripts.push(path);
            }
            return;
        }
        deps.visited[path] = true;
        if (!(path in seenScript)) {
            seenScript[path] = true;
            scripts.push(path);
        }
    }
    for (var path in tdl.included_) {
        if (!deps.written[path]) {
            visitNode(path);
        }
    }
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i]) {
            tdl.writeScriptTag_(tdl.basePath + scripts[i]);
        } else {
            throw Error('Undefined script input');
        }
    }
};
tdl.getPathFromRule_ = function(rule) {
    var parts = rule.split('.');
    return parts.join('/') + '.js';
};
tdl.findBasePath_();
tdl.isDef = function(val) {
    return typeof val != 'undefined';
};
tdl.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
    tdl.exportPath_(publicPath, object, opt_objectToExportTo);
};
tdl.provide('tdl.base');
tdl.base = tdl.base || {};
tdl.base.isArray = function(value) {
    var valueAsObject = (value);
    return typeof(value) === 'object' && value !== null && 'length' in valueAsObject && 'splice' in valueAsObject;
};
tdl.base.maybeDeobfuscateFunctionName_ = function(name) {
    return name;
};
tdl.base.inherit = function(subClass, superClass) {
    var TmpClass = function() {};
    TmpClass.prototype = superClass.prototype;
    subClass.prototype = new TmpClass();
};
tdl.base.parseErrorStack = function(excp) {
    var stack = [];
    var name;
    var line;
    if (!excp || !excp.stack) {
        return stack;
    }
    var stacklist = excp.stack.split('\n');
    for (var i = 0; i < stacklist.length - 1; i++) {
        var framedata = stacklist[i];
        name = framedata.match(/^([a-zA-Z0-9_$]*)/)[1];
        if (name) {
            name = tdl.base.maybeDeobfuscateFunctionName_(name);
        } else {
            name = 'anonymous';
        }
        var result = framedata.match(/(.*:[0-9]+)$/);
        line = result && result[1];
        if (!line) {
            line = '(unknown)';
        }
        stack[stack.length] = name + ' : ' + line
    }
    var omitRegexp = /^anonymous :/;
    while (stack.length && omitRegexp.exec(stack[stack.length - 1])) {
        stack.length = stack.length - 1;
    }
    return stack;
};
tdl.base.getFunctionName = function(aFunction) {
    var regexpResult = aFunction.toString().match(/function(\s*)(\w*)/);
    if (regexpResult & RexpResult.length >= 2 & RexpResult[2]) {
        return tdl.base.maybeDeobfuscateFunctionName_(regexpResult[2]);
    }
    return 'anonymous';
};
tdl.base.formatErrorStack = function(stack) {
    var result = '';
    for (var i = 0; i < stack.length; i++) {
        result += '> ' + stack[i] + '\n';
    }
    return result;
};
tdl.base.getStackTrace = function(stripCount) {
    var result = '';
    if (typeof(arguments.caller) != 'undefined') {
        for (var a = arguments.caller; a != null; a = a.caller) {
            result += '> ' + tdl.base.getFunctionName(a.callee) + '\n';
            if (a.caller == a) {
                result += '*';
                break;
            }
        }
    } else {
        var testExcp;
        try {
            eval('var var;');
        } catch (testExcp) {
            var stack = tdl.base.parseErrorStack(testExcp);
            result += tdl.base.formatErrorStack(stack.slice(3 + stripCount, stack.length));
        }
    }
    return result;
};
tdl.base.IsMSIE = function() {
    var ua = navigator.userAgent.toLowerCase();
    var msie = /msie/.test(ua) && !/opera/.test(ua);
    return msie;
};
tdl.provide('tdl.string');
tdl.string = tdl.string || {};
tdl.string.endsWith = function(haystack, needle) {
    return haystack.substr(haystack.length - needle.length) === needle;
};
tdl.string.startsWith = function(haystack, needle) {
    return haystack.substr(0, needle.length) === needle;
};
tdl.string.argsToString = function(args) {
    var lastArgWasNumber = false;
    var numArgs = args.length;
    var strs = [];
    for (var ii = 0; ii < numArgs; ++ii) {
        var arg = args[ii];
        if (arg === undefined) {
            strs.push('undefined');
        } else if (typeof arg == 'number') {
            if (lastArgWasNumber) {
                strs.push(", ");
            }
            if (arg == Math.floor(arg)) {
                strs.push(arg.toFixed(0));
            } else {
                strs.push(arg.toFixed(3));
            }
            lastArgWasNumber = true;
        } else if (window.Float32Array && arg instanceof Float32Array) {
            strs.push(tdl.string.argsToString(arg));
        } else {
            strs.push(arg.toString());
            lastArgWasNumber = false;
        }
    }
    return strs.join("");
};
tdl.string.objToString = function(obj, opt_prefix) {
    var strs = [];

    function objToString(obj, opt_prefix) {
        opt_prefix = opt_prefix || "";
        if (typeof obj == 'object') {
            if (obj.length !== undefined) {
                for (var ii = 0; ii < obj.length; ++ii) {
                    objToString(obj[ii], opt_prefix + "[" + ii + "]");
                }
            } else {
                for (var name in obj) {
                    objToString(obj[name], opt_prefix + "." + name);
                }
            }
        } else {
            strs.push(tdl.string.argsToString([opt_prefix, ": ", obj]));
        }
    }
    objToString(obj);
    return strs.join("\n");
};
tdl.provide('tdl.log');
tdl.require('tdl.string');
tdl.log = tdl.log || {};
tdl.log = function() {
    var str = tdl.string.argsToString(arguments);
    if (window.console && window.console.log) {
        window.console.log(str);
    } else if (window.dump) {
        window.dump(str + "\n");
    }
};
tdl.error = function() {
    var str = tdl.string.argsToString(arguments);
    if (window.console) {
        if (window.console.error) {
            window.console.error(str);
        } else if (window.console.log) {
            window.console.log(str);
        } else if (window.dump) {
            window.dump(str + "\n");
        }
    }
};
tdl.dumpObj = function(obj, opt_prefix) {
    tdl.log(tdl.string.objToString(obj, opt_prefix));
};
tdl.provide('tdl.buffers');
tdl.buffers = tdl.buffers || {};
tdl.buffers.Buffer = function(array, opt_target) {
    var target = opt_target || gl.ARRAY_BUFFER;
    var buf = gl.createBuffer();
    this.target = target;
    this.buf = buf;
    this.set(array);
    this.numComponents_ = array.numComponents;
    this.numElements_ = array.numElements;
    this.totalComponents_ = this.numComponents_ * this.numElements_;
    if (array.buffer instanceof Float32Array) {
        this.type_ = gl.FLOAT;
        this.normalize_ = false;
    } else if (array.buffer instanceof Uint8Array) {
        this.type_ = gl.UNSIGNED_BYTE;
        this.normalize_ = true;
    } else if (array.buffer instanceof Int8Array) {
        this.type_ = gl.BYTE;
        this.normalize_ = true;
    } else if (array.buffer instanceof Uint16Array) {
        this.type_ = gl.UNSIGNED_SHORT;
        this.normalize_ = true;
    } else if (array.buffer instanceof Int16Array) {
        this.type_ = gl.SHORT;
        this.normalize_ = true;
    } else {
        throw ("unhandled type:" + (typeof array.buffer));
    }
};
tdl.buffers.Buffer.prototype.set = function(array) {
    gl.bindBuffer(this.target, this.buf);
    gl.bufferData(this.target, array.buffer, gl.STATIC_DRAW);
}
tdl.buffers.Buffer.prototype.type = function() {
    return this.type_;
};
tdl.buffers.Buffer.prototype.numComponents = function() {
    return this.numComponents_;
};
tdl.buffers.Buffer.prototype.numElements = function() {
    return this.numElements_;
};
tdl.buffers.Buffer.prototype.totalComponents = function() {
    return this.totalComponents_;
};
tdl.buffers.Buffer.prototype.buffer = function() {
    return this.buf;
};
tdl.buffers.Buffer.prototype.stride = function() {
    return 0;
};
tdl.buffers.Buffer.prototype.normalize = function() {
    return this.normalize_;
}
tdl.buffers.Buffer.prototype.offset = function() {
    return 0;
};
tdl.provide('tdl.fast');
tdl.fast = tdl.fast || {};
if (!window.Float32Array) {
    window.Float32Array = function() {};
}
tdl.fast.temp0v3_ = new Float32Array(3);
tdl.fast.temp1v3_ = new Float32Array(3);
tdl.fast.temp2v3_ = new Float32Array(3);
tdl.fast.temp0v4_ = new Float32Array(4);
tdl.fast.temp1v4_ = new Float32Array(4);
tdl.fast.temp2v4_ = new Float32Array(4);
tdl.fast.temp0m4_ = new Float32Array(16);
tdl.fast.temp1m4_ = new Float32Array(16);
tdl.fast.temp2m4_ = new Float32Array(16);
tdl.fast.matrix4 = tdl.fast.matrix4 || {};
tdl.fast.rowMajor = tdl.fast.rowMajor || {};
tdl.fast.columnMajor = tdl.fast.columnMajor || {};
tdl.fast.Vector2 = goog.typedef;
tdl.fast.Vector3 = goog.typedef;
tdl.fast.Vector4 = goog.typedef;
tdl.fast.Vector = goog.typedef;
tdl.fast.Matrix2 = goog.typedef;
tdl.fast.Matrix3 = goog.typedef;
tdl.fast.Matrix4 = goog.typedef;
tdl.fast.Matrix = goog.typedef;
tdl.fast.addVector = function(dst, a, b) {
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        dst[i] = a[i] + b[i];
    return dst;
};
tdl.fast.subVector = function(dst, a, b) {
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        dst[i] = a[i] - b[i];
    return dst;
};
tdl.fast.lerpVector = function(dst, a, b, t) {
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        dst[i] = (1 - t) * a[i] + t * b[i];
    return dst;
};
tdl.fast.divVectorScalar = function(dst, v, k) {
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i)
        dst[i] = v[i] / k;
    return dst;
};
tdl.fast.cross = function(dst, a, b) {
    dst[0] = a[1] * b[2] - a[2] * b[1];
    dst[1] = a[2] * b[0] - a[0] * b[2];
    dst[2] = a[0] * b[1] - a[1] * b[0];
    return dst;
};
tdl.fast.dot = function(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
};
tdl.fast.normalize = function(dst, a) {
    var n = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        n += a[i] * a[i];
    n = Math.sqrt(n);
    if (n > 0.00001) {
        for (var i = 0; i < aLength; ++i)
            dst[i] = a[i] / n;
    } else {
        for (var i = 0; i < aLength; ++i)
            dst[i] = 0;
    }
    return dst;
};
tdl.fast.negativeVector = function(dst, v) {
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i) {
        dst[i] = -v[i];
    }
    return dst;
};
tdl.fast.negativeMatrix = function(dst, v) {
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i) {
        dst[i] = -v[i];
    }
    return dst;
};
tdl.fast.copyVector = function(dst, v) {
    dst.set(v);
    return dst;
};
tdl.fast.copyMatrix = function(dst, m) {
    dst.set(m);
    return dst;
};
tdl.fast.mulScalarVector = function(dst, k, v) {
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i) {
        dst[i] = k * v[i];
    }
    return dst;
};
tdl.fast.mulVectorScalar = function(dst, v, k) {
    return tdl.fast.mulScalarVector(dst, k, v);
};
tdl.fast.mulScalarMatrix = function(dst, k, m) {
    var mLength = m.length;
    for (var i = 0; i < mLength; ++i) {
        dst[i] = k * m[i];
    }
    return dst;
};
tdl.fast.mulMatrixScalar = function(dst, m, k) {
    return tdl.fast.mulScalarMatrix(dst, k, m);
};
tdl.fast.mulVectorVector = function(dst, a, b) {
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        dst[i] = a[i] * b[i];
    return dst;
};
tdl.fast.divVectorVector = function(dst, a, b) {
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        dst[i] = a[i] / b[i];
    return dst;
};
tdl.fast.rowMajor.mulVectorMatrix4 = function(dst, v, m) {
    for (var i = 0; i < 4; ++i) {
        dst[i] = 0.0;
        for (var j = 0; j < 4; ++j)
            dst[i] += v[j] * m[j * 4 + i];
    }
    return dst;
};
tdl.fast.columnMajor.mulVectorMatrix4 = function(dst, v, m) {
    var mLength = m.length;
    var vLength = v.length;
    for (var i = 0; i < 4; ++i) {
        dst[i] = 0.0;
        var col = i * 4;
        for (var j = 0; j < 4; ++j)
            dst[i] += v[j] * m[col + j];
    }
    return dst;
};
tdl.fast.mulVectorMatrix4 = null;
tdl.fast.rowMajor.mulMatrix4Vector = function(dst, m, v) {
    for (var i = 0; i < 4; ++i) {
        dst[i] = 0.0;
        var row = i * 4;
        for (var j = 0; j < 4; ++j)
            dst[i] += m[row + j] * v[j];
    }
    return dst;
};
tdl.fast.columnMajor.mulMatrix4Vector = function(dst, m, v) {
    for (var i = 0; i < 4; ++i) {
        dst[i] = 0.0;
        for (var j = 0; j < 4; ++j)
            dst[i] += v[j] * m[j * 4 + i];
    }
    return dst;
};
tdl.fast.mulMatrix4Vector = null;
tdl.fast.rowMajor.mulMatrixMatrix3 = function(dst, a, b) {
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a10 = a[3 + 0];
    var a11 = a[3 + 1];
    var a12 = a[3 + 2];
    var a20 = a[6 + 0];
    var a21 = a[6 + 1];
    var a22 = a[6 + 2];
    var b00 = b[0];
    var b01 = b[1];
    var b02 = b[2];
    var b10 = b[3 + 0];
    var b11 = b[3 + 1];
    var b12 = b[3 + 2];
    var b20 = b[6 + 0];
    var b21 = b[6 + 1];
    var b22 = b[6 + 2];
    dst[0] = a00 * b00 + a01 * b10 + a02 * b20;
    dst[1] = a00 * b01 + a01 * b11 + a02 * b21;
    dst[2] = a00 * b02 + a01 * b12 + a02 * b22;
    dst[3] = a10 * b00 + a11 * b10 + a12 * b20;
    dst[4] = a10 * b01 + a11 * b11 + a12 * b21;
    dst[5] = a10 * b02 + a11 * b12 + a12 * b22;
    dst[6] = a20 * b00 + a21 * b10 + a22 * b20;
    dst[7] = a20 * b01 + a21 * b11 + a22 * b21;
    dst[8] = a20 * b02 + a21 * b12 + a22 * b22;
    return dst;
};
tdl.fast.columnMajor.mulMatrixMatrix3 = function(dst, a, b) {
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a10 = a[3 + 0];
    var a11 = a[3 + 1];
    var a12 = a[3 + 2];
    var a20 = a[6 + 0];
    var a21 = a[6 + 1];
    var a22 = a[6 + 2];
    var b00 = b[0];
    var b01 = b[1];
    var b02 = b[2];
    var b10 = b[3 + 0];
    var b11 = b[3 + 1];
    var b12 = b[3 + 2];
    var b20 = b[6 + 0];
    var b21 = b[6 + 1];
    var b22 = b[6 + 2];
    dst[0] = a00 * b00 + a10 * b01 + a20 * b02;
    dst[1] = a01 * b00 + a11 * b01 + a21 * b02;
    dst[2] = a02 * b00 + a12 * b01 + a22 * b02;
    dst[3] = a00 * b10 + a10 * b11 + a20 * b12;
    dst[4] = a01 * b10 + a11 * b11 + a21 * b12;
    dst[5] = a02 * b10 + a12 * b11 + a22 * b12;
    dst[6] = a00 * b20 + a10 * b21 + a20 * b22;
    dst[7] = a01 * b20 + a11 * b21 + a21 * b22;
    dst[8] = a02 * b20 + a12 * b21 + a22 * b22;
    return dst;
};
tdl.fast.mulMatrixMatrix3 = null;
tdl.fast.rowMajor.mulMatrixMatrix4 = function(dst, a, b) {
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4 + 0];
    var a11 = a[4 + 1];
    var a12 = a[4 + 2];
    var a13 = a[4 + 3];
    var a20 = a[8 + 0];
    var a21 = a[8 + 1];
    var a22 = a[8 + 2];
    var a23 = a[8 + 3];
    var a30 = a[12 + 0];
    var a31 = a[12 + 1];
    var a32 = a[12 + 2];
    var a33 = a[12 + 3];
    var b00 = b[0];
    var b01 = b[1];
    var b02 = b[2];
    var b03 = b[3];
    var b10 = b[4 + 0];
    var b11 = b[4 + 1];
    var b12 = b[4 + 2];
    var b13 = b[4 + 3];
    var b20 = b[8 + 0];
    var b21 = b[8 + 1];
    var b22 = b[8 + 2];
    var b23 = b[8 + 3];
    var b30 = b[12 + 0];
    var b31 = b[12 + 1];
    var b32 = b[12 + 2];
    var b33 = b[12 + 3];
    dst[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    dst[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    dst[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    dst[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    dst[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    dst[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    dst[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    dst[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    dst[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    dst[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    dst[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    dst[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    dst[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    dst[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    dst[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    dst[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
    return dst;
};
tdl.fast.columnMajor.mulMatrixMatrix4 = function(dst, a, b) {
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4 + 0];
    var a11 = a[4 + 1];
    var a12 = a[4 + 2];
    var a13 = a[4 + 3];
    var a20 = a[8 + 0];
    var a21 = a[8 + 1];
    var a22 = a[8 + 2];
    var a23 = a[8 + 3];
    var a30 = a[12 + 0];
    var a31 = a[12 + 1];
    var a32 = a[12 + 2];
    var a33 = a[12 + 3];
    var b00 = b[0];
    var b01 = b[1];
    var b02 = b[2];
    var b03 = b[3];
    var b10 = b[4 + 0];
    var b11 = b[4 + 1];
    var b12 = b[4 + 2];
    var b13 = b[4 + 3];
    var b20 = b[8 + 0];
    var b21 = b[8 + 1];
    var b22 = b[8 + 2];
    var b23 = b[8 + 3];
    var b30 = b[12 + 0];
    var b31 = b[12 + 1];
    var b32 = b[12 + 2];
    var b33 = b[12 + 3];
    dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return dst;
};
tdl.fast.mulMatrixMatrix4 = null;
tdl.fast.rowMajor.column4 = function(dst, m, j) {
    for (var i = 0; i < 4; ++i) {
        dst[i] = m[i * 4 + j];
    }
    return dst;
};
tdl.fast.columnMajor.column4 = function(dst, m, j) {
    var off = j * 4;
    dst[0] = m[off + 0];
    dst[1] = m[off + 1];
    dst[2] = m[off + 2];
    dst[3] = m[off + 3];
    return dst;
};
tdl.fast.column4 = null;
tdl.fast.rowMajor.row4 = function(dst, m, i) {
    var off = i * 4;
    dst[0] = m[off + 0];
    dst[1] = m[off + 1];
    dst[2] = m[off + 2];
    dst[3] = m[off + 3];
    return dst;
};
tdl.fast.columnMajor.row4 = function(dst, m, i) {
    for (var j = 0; j < 4; ++j) {
        dst[j] = m[j * 4 + i];
    }
    return dst;
};
tdl.fast.row4 = null;
tdl.fast.identity4 = function(dst) {
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
};
tdl.fast.transpose4 = function(dst, m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    dst[0] = m00;
    dst[1] = m10;
    dst[2] = m20;
    dst[3] = m30;
    dst[4] = m01;
    dst[5] = m11;
    dst[6] = m21;
    dst[7] = m31;
    dst[8] = m02;
    dst[9] = m12;
    dst[10] = m22;
    dst[11] = m32;
    dst[12] = m03;
    dst[13] = m13;
    dst[14] = m23;
    dst[15] = m33;
    return dst;
};
tdl.fast.inverse4 = function(dst, m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0 = m22 * m33;
    var tmp_1 = m32 * m23;
    var tmp_2 = m12 * m33;
    var tmp_3 = m32 * m13;
    var tmp_4 = m12 * m23;
    var tmp_5 = m22 * m13;
    var tmp_6 = m02 * m33;
    var tmp_7 = m32 * m03;
    var tmp_8 = m02 * m23;
    var tmp_9 = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;
    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
        (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
        (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
        (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
        (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
        (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
        (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
        (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
        (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
        (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
        (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
        (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
        (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
    return dst;
};
tdl.fast.matrix4.inverse = function(dst, m) {
    return tdl.fast.inverse4(dst, m);
};
tdl.fast.matrix4.mul = function(dst, a, b) {
    return tdl.fast.mulMatrixMatrix4(dst, a, b);
};
tdl.fast.matrix4.copy = function(dst, m) {
    return tdl.fast.copyMatrix(dst, m);
};
tdl.fast.matrix4.setTranslation = function(a, v) {
    a[12] = v[0];
    a[13] = v[1];
    a[14] = v[2];
    a[15] = 1;
    return a;
};
tdl.fast.matrix4.getTranslation = function(dst, m) {
    dst[0] = m[12];
    dst[1] = m[13];
    dst[2] = m[14];
    return dst;
};
tdl.fast.matrix4.identity = function(dst) {
    return tdl.fast.identity4(dst);
};
tdl.fast.matrix4.getAxis = function(dst, m, axis) {
    var off = axis * 4;
    dst[0] = m[off + 0];
    dst[1] = m[off + 1];
    dst[2] = m[off + 2];
    return dst;
};
tdl.fast.matrix4.perspective = function(dst, angle, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * angle);
    var rangeInv = 1.0 / (near - far);
    dst[0] = f / aspect;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = f;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = (near + far) * rangeInv;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = near * far * rangeInv * 2;
    dst[15] = 0;
    return dst;
};
tdl.fast.matrix4.ortho = function(dst, left, right, bottom, top, near, far) {
    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = -1 / (far - near);
    dst[11] = 0;
    dst[12] = (right + left) / (left - right);
    dst[13] = (top + bottom) / (bottom - top);
    dst[14] = -near / (near - far);
    dst[15] = 1;
    return dst;
}
tdl.fast.matrix4.frustum = function(dst, left, right, bottom, top, near, far) {
    var dx = (right - left);
    var dy = (top - bottom);
    var dz = (near - far);
    dst[0] = 2 * near / dx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 * near / dy;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = (left + right) / dx;
    dst[9] = (top + bottom) / dy;
    dst[10] = far / dz;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = near * far / dz;
    dst[15] = 0;
    return dst;
};
tdl.fast.matrix4.lookAt = function(dst, eye, target, up) {
    var t0 = tdl.fast.temp0v3_;
    var t1 = tdl.fast.temp1v3_;
    var t2 = tdl.fast.temp2v3_;
    var vz = tdl.fast.normalize(t0, tdl.fast.subVector(t0, eye, target));
    var vx = tdl.fast.normalize(t1, tdl.fast.cross(t1, up, vz));
    var vy = tdl.fast.cross(t2, vz, vx);
    dst[0] = vx[0];
    dst[1] = vy[0];
    dst[2] = vz[0];
    dst[3] = 0;
    dst[4] = vx[1];
    dst[5] = vy[1];
    dst[6] = vz[1];
    dst[7] = 0;
    dst[8] = vx[2];
    dst[9] = vy[2];
    dst[10] = vz[2];
    dst[11] = 0;
    dst[12] = -tdl.fast.dot(vx, eye);
    dst[13] = -tdl.fast.dot(vy, eye);
    dst[14] = -tdl.fast.dot(vz, eye);
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.cameraLookAt = function(dst, eye, target, up) {
    var t0 = tdl.fast.temp0v3_;
    var t1 = tdl.fast.temp1v3_;
    var t2 = tdl.fast.temp2v3_;
    var vz = tdl.fast.normalize(t0, tdl.fast.subVector(t0, eye, target));
    var vx = tdl.fast.normalize(t1, tdl.fast.cross(t1, up, vz));
    var vy = tdl.fast.cross(t2, vz, vx);
    dst[0] = vx[0];
    dst[1] = vx[1];
    dst[2] = vx[2];
    dst[3] = 0;
    dst[4] = vy[0];
    dst[5] = vy[1];
    dst[6] = vy[2];
    dst[7] = 0;
    dst[8] = vz[0];
    dst[9] = vz[1];
    dst[10] = vz[2];
    dst[11] = 0;
    dst[12] = eye[0];
    dst[13] = eye[1];
    dst[14] = eye[2];
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.translation = function(dst, v) {
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = v[0];
    dst[13] = v[1];
    dst[14] = v[2];
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.translate = function(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    var m00 = m[0];
    var m01 = m[1];
    var m02 = m[2];
    var m03 = m[3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    m[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    m[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    m[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    m[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return m;
};
tdl.fast.matrix4.transpose = tdl.fast.transpose4;
tdl.fast.matrix4.rotationX = function(dst, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = c;
    dst[6] = s;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.rotateX = function(m, angle) {
    var m10 = m[4];
    var m11 = m[5];
    var m12 = m[6];
    var m13 = m[7];
    var m20 = m[8];
    var m21 = m[9];
    var m22 = m[10];
    var m23 = m[11];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    m[4] = c * m10 + s * m20;
    m[5] = c * m11 + s * m21;
    m[6] = c * m12 + s * m22;
    m[7] = c * m13 + s * m23;
    m[8] = c * m20 - s * m10;
    m[9] = c * m21 - s * m11;
    m[10] = c * m22 - s * m12;
    m[11] = c * m23 - s * m13;
    return m;
};
tdl.fast.matrix4.rotationY = function(dst, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    dst[0] = c;
    dst[1] = 0;
    dst[2] = -s;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = s;
    dst[9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.rotateY = function(m, angle) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    m[0] = c * m00 - s * m20;
    m[1] = c * m01 - s * m21;
    m[2] = c * m02 - s * m22;
    m[3] = c * m03 - s * m23;
    m[8] = c * m20 + s * m00;
    m[9] = c * m21 + s * m01;
    m[10] = c * m22 + s * m02;
    m[11] = c * m23 + s * m03;
    return m;
};
tdl.fast.matrix4.rotationZ = function(dst, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.rotateZ = function(m, angle) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    m[0] = c * m00 + s * m10;
    m[1] = c * m01 + s * m11;
    m[2] = c * m02 + s * m12;
    m[3] = c * m03 + s * m13;
    m[4] = c * m10 - s * m00;
    m[5] = c * m11 - s * m01;
    m[6] = c * m12 - s * m02;
    m[7] = c * m13 - s * m03;
    return m;
};
tdl.fast.matrix4.axisRotation = function(dst, axis, angle) {
    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    var n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var oneMinusCosine = 1 - c;
    dst[0] = xx + (1 - xx) * c;
    dst[1] = x * y * oneMinusCosine + z * s;
    dst[2] = x * z * oneMinusCosine - y * s;
    dst[3] = 0;
    dst[4] = x * y * oneMinusCosine - z * s;
    dst[5] = yy + (1 - yy) * c;
    dst[6] = y * z * oneMinusCosine + x * s;
    dst[7] = 0;
    dst[8] = x * z * oneMinusCosine + y * s;
    dst[9] = y * z * oneMinusCosine - x * s;
    dst[10] = zz + (1 - zz) * c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.axisRotate = function(m, axis, angle) {
    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    var n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var oneMinusCosine = 1 - c;
    var r00 = xx + (1 - xx) * c;
    var r01 = x * y * oneMinusCosine + z * s;
    var r02 = x * z * oneMinusCosine - y * s;
    var r10 = x * y * oneMinusCosine - z * s;
    var r11 = yy + (1 - yy) * c;
    var r12 = y * z * oneMinusCosine + x * s;
    var r20 = x * z * oneMinusCosine + y * s;
    var r21 = y * z * oneMinusCosine - x * s;
    var r22 = zz + (1 - zz) * c;
    var m00 = m[0];
    var m01 = m[1];
    var m02 = m[2];
    var m03 = m[3];
    var m10 = m[4];
    var m11 = m[5];
    var m12 = m[6];
    var m13 = m[7];
    var m20 = m[8];
    var m21 = m[9];
    var m22 = m[10];
    var m23 = m[11];
    var m30 = m[12];
    var m31 = m[13];
    var m32 = m[14];
    var m33 = m[15];
    m[0] = r00 * m00 + r01 * m10 + r02 * m20;
    m[1] = r00 * m01 + r01 * m11 + r02 * m21;
    m[2] = r00 * m02 + r01 * m12 + r02 * m22;
    m[3] = r00 * m03 + r01 * m13 + r02 * m23;
    m[4] = r10 * m00 + r11 * m10 + r12 * m20;
    m[5] = r10 * m01 + r11 * m11 + r12 * m21;
    m[6] = r10 * m02 + r11 * m12 + r12 * m22;
    m[7] = r10 * m03 + r11 * m13 + r12 * m23;
    m[8] = r20 * m00 + r21 * m10 + r22 * m20;
    m[9] = r20 * m01 + r21 * m11 + r22 * m21;
    m[10] = r20 * m02 + r21 * m12 + r22 * m22;
    m[11] = r20 * m03 + r21 * m13 + r22 * m23;
    return m;
};
tdl.fast.matrix4.scaling = function(dst, v) {
    dst[0] = v[0];
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = v[1];
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = v[2];
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
};
tdl.fast.matrix4.scale = function(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    m[0] = v0 * m[0 * 4 + 0];
    m[1] = v0 * m[0 * 4 + 1];
    m[2] = v0 * m[0 * 4 + 2];
    m[3] = v0 * m[0 * 4 + 3];
    m[4] = v1 * m[1 * 4 + 0];
    m[5] = v1 * m[1 * 4 + 1];
    m[6] = v1 * m[1 * 4 + 2];
    m[7] = v1 * m[1 * 4 + 3];
    m[8] = v2 * m[2 * 4 + 0];
    m[9] = v2 * m[2 * 4 + 1];
    m[10] = v2 * m[2 * 4 + 2];
    m[11] = v2 * m[2 * 4 + 3];
    return m;
};
tdl.fast.installRowMajorFunctions = function() {
    for (var f in tdl.fast.rowMajor) {
        tdl.fast[f] = tdl.fast.rowMajor[f];
    }
};
tdl.fast.installColumnMajorFunctions = function() {
    for (var f in tdl.fast.columnMajor) {
        tdl.fast[f] = tdl.fast.columnMajor[f];
    }
};
tdl.fast.installRowMajorFunctions();
tdl.provide('tdl.math');
tdl.math = tdl.math || {};
tdl.math.randomSeed_ = 0;
tdl.math.RANDOM_RANGE_ = Math.pow(2, 32);
tdl.math.matrix4 = tdl.math.matrix4 || {};
tdl.math.rowMajor = tdl.math.rowMajor || {};
tdl.math.columnMajor = tdl.math.columnMajor || {};
tdl.math.Vector2 = goog.typedef;
tdl.math.Vector3 = goog.typedef;
tdl.math.Vector4 = goog.typedef;
tdl.math.Vector = goog.typedef;
tdl.math.Matrix1 = goog.typedef;
tdl.math.Matrix2 = goog.typedef;
tdl.math.Matrix3 = goog.typedef;
tdl.math.Matrix4 = goog.typedef;
tdl.math.Matrix = goog.typedef;
tdl.math.pseudoRandom = function() {
    var math = tdl.math;
    return (math.randomSeed_ = (134775813 * math.randomSeed_ + 1) % math.RANDOM_RANGE_) / math.RANDOM_RANGE_;
};
tdl.math.resetPseudoRandom = function() {
    tdl.math.randomSeed_ = 0;
};
tdl.math.randomInt = function(n) {
    return Math.min(Math.floor(Math.random() * n), n - 1);
}
tdl.math.degToRad = function(degrees) {
    return degrees * Math.PI / 180;
};
tdl.math.radToDeg = function(radians) {
    return radians * 180 / Math.PI;
};
tdl.math.lerpScalar = function(a, b, t) {
    return (1 - t) * a + t * b;
};
tdl.math.addVector = function(a, b) {
    var r = [];
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r[i] = a[i] + b[i];
    return r;
};
tdl.math.subVector = function(a, b) {
    var r = [];
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r[i] = a[i] - b[i];
    return r;
};
tdl.math.lerpVector = function(a, b, t) {
    var r = [];
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r[i] = (1 - t) * a[i] + t * b[i];
    return r;
};
tdl.math.modClamp = function(v, range, opt_rangeStart) {
    var start = opt_rangeStart || 0;
    if (range < 0.00001) {
        return start;
    }
    v -= start;
    if (v < 0) {
        v -= Math.floor(v / range) * range;
    } else {
        v = v % range;
    }
    return v + start;
};
tdl.math.lerpCircular = function(a, b, t, range) {
    a = tdl.math.modClamp(a, range);
    b = tdl.math.modClamp(b, range);
    var delta = b - a;
    if (Math.abs(delta) > range * 0.5) {
        if (delta > 0) {
            b -= range;
        } else {
            b += range;
        }
    }
    return tdl.math.modClamp(tdl.math.lerpScalar(a, b, t), range);
};
tdl.math.lerpRadian = function(a, b, t) {
    return tdl.math.lerpCircular(a, b, t, Math.PI * 2);
};
tdl.math.divVectorScalar = function(v, k) {
    var r = [];
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i)
        r[i] = v[i] / k;
    return r;
};
tdl.math.dot = function(a, b) {
    var r = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r += a[i] * b[i];
    return r;
};
tdl.math.cross = function(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};
tdl.math.length = function(a) {
    var r = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r += a[i] * a[i];
    return Math.sqrt(r);
};
tdl.math.lengthSquared = function(a) {
    var r = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r += a[i] * a[i];
    return r;
};
tdl.math.distance = function(a, b) {
    var r = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i) {
        var t = a[i] - b[i];
        r += t * t;
    }
    return Math.sqrt(r);
};
tdl.math.distanceSquared = function(a, b) {
    var r = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i) {
        var t = a[i] - b[i];
        r += t * t;
    }
    return r;
};
tdl.math.normalize = function(a) {
    var r = [];
    var n = 0.0;
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        n += a[i] * a[i];
    n = Math.sqrt(n);
    if (n > 0.00001) {
        for (var i = 0; i < aLength; ++i)
            r[i] = a[i] / n;
    } else {
        r = [0, 0, 0];
    }
    return r;
};
tdl.math.addMatrix = function(a, b) {
    var r = [];
    var aLength = a.length;
    var a0Length = a[0].length;
    for (var i = 0; i < aLength; ++i) {
        var row = [];
        var ai = a[i];
        var bi = b[i];
        for (var j = 0; j < a0Length; ++j)
            row[j] = ai[j] + bi[j];
        r[i] = row;
    }
    return r;
};
tdl.math.subMatrix = function(a, b) {
    var r = [];
    var aLength = a.length;
    var a0Length = a[0].length;
    for (var i = 0; i < aLength; ++i) {
        var row = [];
        var ai = a[i];
        var bi = b[i];
        for (var j = 0; j < a0Length; ++j)
            row[j] = ai[j] - bi[j];
        r[i] = row;
    }
    return r;
};
tdl.math.lerpMatrix = function(a, b, t) {
    var r = [];
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i) {
        r[i] = (1 - t) * a[i] + t * b[i];
    }
    return r;
};
tdl.math.divMatrixScalar = function(m, k) {
    var r = [];
    var mLength = m.length;
    for (var i = 0; i < mLength; ++i) {
        r[i] = m[i] / k;
    }
    return r;
};
tdl.math.negativeScalar = function(a) {
    return -a;
};
tdl.math.negativeVector = function(v) {
    var r = [];
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i) {
        r[i] = -v[i];
    }
    return r;
};
tdl.math.negativeMatrix = function(m) {
    var r = [];
    var mLength = m.length;
    for (var i = 0; i < mLength; ++i) {
        r[i] = -m[i];
    }
    return r;
};
tdl.math.copyScalar = function(a) {
    return a;
};
tdl.math.copyVector = function(v) {
    var r = [];
    for (var i = 0; i < v.length; i++)
        r[i] = v[i];
    return r;
};
tdl.math.copyMatrix = function(m) {
    var r = [];
    var mLength = m.length;
    for (var i = 0; i < mLength; ++i) {
        r[i] = m[i];
    }
    return r;
};
tdl.math.mulScalarScalar = function(a, b) {
    return a * b;
};
tdl.math.mulScalarVector = function(k, v) {
    var r = [];
    var vLength = v.length;
    for (var i = 0; i < vLength; ++i) {
        r[i] = k * v[i];
    }
    return r;
};
tdl.math.mulVectorScalar = function(v, k) {
    return tdl.math.mulScalarVector(k, v);
};
tdl.math.mulScalarMatrix = function(k, m) {
    var r = [];
    var mLength = m.length;
    for (var i = 0; i < mLength; ++i) {
        r[i] = k * m[i];
    }
    return r;
};
tdl.math.mulMatrixScalar = function(m, k) {
    return tdl.math.mulScalarMatrix(k, m);
};
tdl.math.mulVectorVector = function(a, b) {
    var r = [];
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r[i] = a[i] * b[i];
    return r;
};
tdl.math.divVectorVector = function(a, b) {
    var r = [];
    var aLength = a.length;
    for (var i = 0; i < aLength; ++i)
        r[i] = a[i] / b[i];
    return r;
};
tdl.math.rowMajor.mulVectorMatrix4 = function(v, m) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        r[i] = 0.0;
        for (var j = 0; j < 4; ++j)
            r[i] += v[j] * m[j * 4 + i];
    }
    return r;
};
tdl.math.columnMajor.mulVectorMatrix = function(v, m) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        r[i] = 0.0;
        for (var j = 0; j < 4; ++j)
            r[i] += v[j] * r[i * 4 + j];
    }
    return r;
};
tdl.math.mulVectorMatrix = null;
tdl.math.rowMajor.mulMatrixVector = function(m, v) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        r[i] = 0.0;
        for (var j = 0; j < 4; ++j)
            r[i] += m[i * 4 + j] * v[j];
    }
    return r;
};
tdl.math.columnMajor.mulMatrixVector = function(m, v) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        r[i] = 0.0;
        for (var j = 0; j < 4; ++j)
            r[i] += v[j] * m[j * 4 + i];
    }
    return r;
};
tdl.math.mulMatrixVector = null;
tdl.math.rowMajor.mulMatrixMatrix2 = function(a, b) {
    var a00 = a[0 * 2 + 0];
    var a01 = a[0 * 2 + 1];
    var a10 = a[1 * 2 + 0];
    var a11 = a[1 * 2 + 1];
    var b00 = b[0 * 2 + 0];
    var b01 = b[0 * 2 + 1];
    var b10 = b[1 * 2 + 0];
    var b11 = b[1 * 2 + 1];
    return [a00 * b00 + a01 * b10, a00 * b01 + a01 * b11, a10 * b00 + a11 * b10, a10 * b01 + a11 * b11];
};
tdl.math.columnMajor.mulMatrixMatrix2 = function(a, b) {
    var a00 = a[0 * 2 + 0];
    var a01 = a[0 * 2 + 1];
    var a10 = a[1 * 2 + 0];
    var a11 = a[1 * 2 + 1];
    var b00 = b[0 * 2 + 0];
    var b01 = b[0 * 2 + 1];
    var b10 = b[1 * 2 + 0];
    var b11 = b[1 * 2 + 1];
    return [a00 * b00 + a10 * b01, a01 * b00 + a11 * b01, a00 * b10 + a10 * b11, a01 * b10 + a11 * b11];
};
tdl.math.mulMatrixMatrix2 = null;
tdl.math.rowMajor.mulMatrixMatrix3 = function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [a00 * b00 + a01 * b10 + a02 * b20, a00 * b01 + a01 * b11 + a02 * b21, a00 * b02 + a01 * b12 + a02 * b22, a10 * b00 + a11 * b10 + a12 * b20, a10 * b01 + a11 * b11 + a12 * b21, a10 * b02 + a11 * b12 + a12 * b22, a20 * b00 + a21 * b10 + a22 * b20, a20 * b01 + a21 * b11 + a22 * b21, a20 * b02 + a21 * b12 + a22 * b22];
};
tdl.math.columnMajor.mulMatrixMatrix3 = function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [a00 * b00 + a10 * b01 + a20 * b02, a01 * b00 + a11 * b01 + a21 * b02, a02 * b00 + a12 * b01 + a22 * b02, a00 * b10 + a10 * b11 + a20 * b12, a01 * b10 + a11 * b11 + a21 * b12, a02 * b10 + a12 * b11 + a22 * b12, a00 * b20 + a10 * b21 + a20 * b22, a01 * b20 + a11 * b21 + a21 * b22, a02 * b20 + a12 * b21 + a22 * b22];
};
tdl.math.mulMatrixMatrix3 = null;
tdl.math.rowMajor.mulMatrixMatrix4 = function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30, a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31, a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32, a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33, a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30, a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31, a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32, a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33, a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30, a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31, a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32, a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33, a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30, a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31, a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32, a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33];
};
tdl.math.columnMajor.mulMatrixMatrix4 = function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03, a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03, a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03, a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03, a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13, a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13, a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13, a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13, a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23, a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23, a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23, a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23, a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33, a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33, a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33, a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33];
};
tdl.math.mulMatrixMatrix4 = null;
tdl.math.rowMajor.mulMatrixMatrix = function(a, b) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            r[i * 4 + j] = 0.0;
            for (var k = 0; k < 4; ++k)
                r[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
    }
    return r;
};
tdl.math.columnMajor.mulMatrixMatrix = function(a, b) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            r[i * 4 + j] = 0.0;
            for (var k = 0; k < 4; ++k)
                r[i * 4 + j] += b[i * 4 + k] * a[k * 4 + j];
        }
    }
    return r;
};
tdl.math.mulMatrixMatrix = null;
tdl.math.rowMajor.column = function(m, j) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        r[i] = m[i * 4 + j];
    }
    return r;
};
tdl.math.columnMajor.column = function(m, j) {
    var r = [];
    for (var i = 0; i < 4; ++i) {
        r[i] = m[j * 4 + i];
    }
    return r;
};
tdl.math.column = null;
tdl.math.rowMajor.row = function(m, i) {
    var r = [];
    for (var j = 0; j < 4; ++j) {
        r[i] = m[i * 4 + j];
    }
    return r;
};
tdl.math.columnMajor.row = function(m, i, opt_size) {
    opt_size = opt_size || 4;
    var r = [];
    for (var j = 0; j < opt_size; ++j) {
        r[j] = m[j * opt_size + i];
    }
    return r;
};
tdl.math.row = null;
tdl.math.transpose = function(m) {
    var r = [];
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    r[0] = m00;
    r[1] = m10;
    r[2] = m20;
    r[3] = m30;
    r[4] = m01;
    r[5] = m11;
    r[6] = m21;
    r[7] = m31;
    r[8] = m02;
    r[9] = m12;
    r[10] = m22;
    r[11] = m32;
    r[12] = m03;
    r[13] = m13;
    r[14] = m23;
    r[15] = m33;
    return r;
};
tdl.math.trace = function(m) {
    var r = 0.0;
    for (var i = 0; i < 4; ++i)
        r += m[i * 4 + i];
    return r;
};
tdl.math.det1 = function(m) {
    return m[0];
};
tdl.math.det2 = function(m) {
    return m[0 * 2 + 0] * m[1 * 2 + 1] - m[0 * 2 + 1] * m[1 * 2 + 0];
};
tdl.math.det3 = function(m) {
    return m[2 * 3 + 2] * (m[0 * 3 + 0] * m[1 * 3 + 1] - m[0 * 3 + 1] * m[1 * 3 + 0]) -
        m[2 * 3 + 1] * (m[0 * 3 + 0] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 0]) +
        m[2 * 3 + 0] * (m[0 * 3 + 1] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 1]);
};
tdl.math.det4 = function(m) {
    var t01 = m[0 * 4 + 0] * m[1 * 4 + 1] - m[0 * 4 + 1] * m[1 * 4 + 0];
    var t02 = m[0 * 4 + 0] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 0];
    var t03 = m[0 * 4 + 0] * m[1 * 4 + 3] - m[0 * 4 + 3] * m[1 * 4 + 0];
    var t12 = m[0 * 4 + 1] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 1];
    var t13 = m[0 * 4 + 1] * m[1 * 4 + 3] - m[0 * 4 + 3] * m[1 * 4 + 1];
    var t23 = m[0 * 4 + 2] * m[1 * 4 + 3] - m[0 * 4 + 3] * m[1 * 4 + 2];
    return m[3 * 4 + 3] * (m[2 * 4 + 2] * t01 - m[2 * 4 + 1] * t02 + m[2 * 4 + 0] * t12) -
        m[3 * 4 + 2] * (m[2 * 4 + 3] * t01 - m[2 * 4 + 1] * t03 + m[2 * 4 + 0] * t13) +
        m[3 * 4 + 1] * (m[2 * 4 + 3] * t02 - m[2 * 4 + 2] * t03 + m[2 * 4 + 0] * t23) -
        m[3 * 4 + 0] * (m[2 * 4 + 3] * t12 - m[2 * 4 + 2] * t13 + m[2 * 4 + 1] * t23);
};
tdl.math.inverse1 = function(m) {
    return [
        [1.0 / m[0]]
    ];
};
tdl.math.inverse2 = function(m) {
    var d = 1.0 / (m[0 * 2 + 0] * m[1 * 2 + 1] - m[0 * 2 + 1] * m[1 * 2 + 0]);
    return [d * m[1 * 2 + 1], -d * m[0 * 2 + 1], -d * m[1 * 2 + 0], d * m[0 * 2 + 0]];
};
tdl.math.inverse3 = function(m) {
    var t00 = m[1 * 3 + 1] * m[2 * 3 + 2] - m[1 * 3 + 2] * m[2 * 3 + 1];
    var t10 = m[0 * 3 + 1] * m[2 * 3 + 2] - m[0 * 3 + 2] * m[2 * 3 + 1];
    var t20 = m[0 * 3 + 1] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 1];
    var d = 1.0 / (m[0 * 3 + 0] * t00 - m[1 * 3 + 0] * t10 + m[2 * 3 + 0] * t20);
    return [d * t00, -d * t10, d * t20, -d * (m[1 * 3 + 0] * m[2 * 3 + 2] - m[1 * 3 + 2] * m[2 * 3 + 0]), d * (m[0 * 3 + 0] * m[2 * 3 + 2] - m[0 * 3 + 2] * m[2 * 3 + 0]), -d * (m[0 * 3 + 0] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 0]), d * (m[1 * 3 + 0] * m[2 * 3 + 1] - m[1 * 3 + 1] * m[2 * 3 + 0]), -d * (m[0 * 3 + 0] * m[2 * 3 + 1] - m[0 * 3 + 1] * m[2 * 3 + 0]), d * (m[0 * 3 + 0] * m[1 * 3 + 1] - m[0 * 3 + 1] * m[1 * 3 + 0])];
};
tdl.math.inverse4 = function(m) {
    var tmp_0 = m[2 * 4 + 2] * m[3 * 4 + 3];
    var tmp_1 = m[3 * 4 + 2] * m[2 * 4 + 3];
    var tmp_2 = m[1 * 4 + 2] * m[3 * 4 + 3];
    var tmp_3 = m[3 * 4 + 2] * m[1 * 4 + 3];
    var tmp_4 = m[1 * 4 + 2] * m[2 * 4 + 3];
    var tmp_5 = m[2 * 4 + 2] * m[1 * 4 + 3];
    var tmp_6 = m[0 * 4 + 2] * m[3 * 4 + 3];
    var tmp_7 = m[3 * 4 + 2] * m[0 * 4 + 3];
    var tmp_8 = m[0 * 4 + 2] * m[2 * 4 + 3];
    var tmp_9 = m[2 * 4 + 2] * m[0 * 4 + 3];
    var tmp_10 = m[0 * 4 + 2] * m[1 * 4 + 3];
    var tmp_11 = m[1 * 4 + 2] * m[0 * 4 + 3];
    var tmp_12 = m[2 * 4 + 0] * m[3 * 4 + 1];
    var tmp_13 = m[3 * 4 + 0] * m[2 * 4 + 1];
    var tmp_14 = m[1 * 4 + 0] * m[3 * 4 + 1];
    var tmp_15 = m[3 * 4 + 0] * m[1 * 4 + 1];
    var tmp_16 = m[1 * 4 + 0] * m[2 * 4 + 1];
    var tmp_17 = m[2 * 4 + 0] * m[1 * 4 + 1];
    var tmp_18 = m[0 * 4 + 0] * m[3 * 4 + 1];
    var tmp_19 = m[3 * 4 + 0] * m[0 * 4 + 1];
    var tmp_20 = m[0 * 4 + 0] * m[2 * 4 + 1];
    var tmp_21 = m[2 * 4 + 0] * m[0 * 4 + 1];
    var tmp_22 = m[0 * 4 + 0] * m[1 * 4 + 1];
    var tmp_23 = m[1 * 4 + 0] * m[0 * 4 + 1];
    var t0 = (tmp_0 * m[1 * 4 + 1] + tmp_3 * m[2 * 4 + 1] + tmp_4 * m[3 * 4 + 1]) -
        (tmp_1 * m[1 * 4 + 1] + tmp_2 * m[2 * 4 + 1] + tmp_5 * m[3 * 4 + 1]);
    var t1 = (tmp_1 * m[0 * 4 + 1] + tmp_6 * m[2 * 4 + 1] + tmp_9 * m[3 * 4 + 1]) -
        (tmp_0 * m[0 * 4 + 1] + tmp_7 * m[2 * 4 + 1] + tmp_8 * m[3 * 4 + 1]);
    var t2 = (tmp_2 * m[0 * 4 + 1] + tmp_7 * m[1 * 4 + 1] + tmp_10 * m[3 * 4 + 1]) -
        (tmp_3 * m[0 * 4 + 1] + tmp_6 * m[1 * 4 + 1] + tmp_11 * m[3 * 4 + 1]);
    var t3 = (tmp_5 * m[0 * 4 + 1] + tmp_8 * m[1 * 4 + 1] + tmp_11 * m[2 * 4 + 1]) -
        (tmp_4 * m[0 * 4 + 1] + tmp_9 * m[1 * 4 + 1] + tmp_10 * m[2 * 4 + 1]);
    var d = 1.0 / (m[0 * 4 + 0] * t0 + m[1 * 4 + 0] * t1 + m[2 * 4 + 0] * t2 + m[3 * 4 + 0] * t3);
    return [d * t0, d * t1, d * t2, d * t3, d * ((tmp_1 * m[1 * 4 + 0] + tmp_2 * m[2 * 4 + 0] + tmp_5 * m[3 * 4 + 0]) -
        (tmp_0 * m[1 * 4 + 0] + tmp_3 * m[2 * 4 + 0] + tmp_4 * m[3 * 4 + 0])), d * ((tmp_0 * m[0 * 4 + 0] + tmp_7 * m[2 * 4 + 0] + tmp_8 * m[3 * 4 + 0]) -
        (tmp_1 * m[0 * 4 + 0] + tmp_6 * m[2 * 4 + 0] + tmp_9 * m[3 * 4 + 0])), d * ((tmp_3 * m[0 * 4 + 0] + tmp_6 * m[1 * 4 + 0] + tmp_11 * m[3 * 4 + 0]) -
        (tmp_2 * m[0 * 4 + 0] + tmp_7 * m[1 * 4 + 0] + tmp_10 * m[3 * 4 + 0])), d * ((tmp_4 * m[0 * 4 + 0] + tmp_9 * m[1 * 4 + 0] + tmp_10 * m[2 * 4 + 0]) -
        (tmp_5 * m[0 * 4 + 0] + tmp_8 * m[1 * 4 + 0] + tmp_11 * m[2 * 4 + 0])), d * ((tmp_12 * m[1 * 4 + 3] + tmp_15 * m[2 * 4 + 3] + tmp_16 * m[3 * 4 + 3]) -
        (tmp_13 * m[1 * 4 + 3] + tmp_14 * m[2 * 4 + 3] + tmp_17 * m[3 * 4 + 3])), d * ((tmp_13 * m[0 * 4 + 3] + tmp_18 * m[2 * 4 + 3] + tmp_21 * m[3 * 4 + 3]) -
        (tmp_12 * m[0 * 4 + 3] + tmp_19 * m[2 * 4 + 3] + tmp_20 * m[3 * 4 + 3])), d * ((tmp_14 * m[0 * 4 + 3] + tmp_19 * m[1 * 4 + 3] + tmp_22 * m[3 * 4 + 3]) -
        (tmp_15 * m[0 * 4 + 3] + tmp_18 * m[1 * 4 + 3] + tmp_23 * m[3 * 4 + 3])), d * ((tmp_17 * m[0 * 4 + 3] + tmp_20 * m[1 * 4 + 3] + tmp_23 * m[2 * 4 + 3]) -
        (tmp_16 * m[0 * 4 + 3] + tmp_21 * m[1 * 4 + 3] + tmp_22 * m[2 * 4 + 3])), d * ((tmp_14 * m[2 * 4 + 2] + tmp_17 * m[3 * 4 + 2] + tmp_13 * m[1 * 4 + 2]) -
        (tmp_16 * m[3 * 4 + 2] + tmp_12 * m[1 * 4 + 2] + tmp_15 * m[2 * 4 + 2])), d * ((tmp_20 * m[3 * 4 + 2] + tmp_12 * m[0 * 4 + 2] + tmp_19 * m[2 * 4 + 2]) -
        (tmp_18 * m[2 * 4 + 2] + tmp_21 * m[3 * 4 + 2] + tmp_13 * m[0 * 4 + 2])), d * ((tmp_18 * m[1 * 4 + 2] + tmp_23 * m[3 * 4 + 2] + tmp_15 * m[0 * 4 + 2]) -
        (tmp_22 * m[3 * 4 + 2] + tmp_14 * m[0 * 4 + 2] + tmp_19 * m[1 * 4 + 2])), d * ((tmp_22 * m[2 * 4 + 2] + tmp_16 * m[0 * 4 + 2] + tmp_21 * m[1 * 4 + 2]) -
        (tmp_20 * m[1 * 4 + 2] + tmp_23 * m[2 * 4 + 2] + tmp_17 * m[0 * 4 + 2]))];
};
tdl.math.codet = function(a, x, y) {
    var size = 4;
    var b = [];
    var ai = 0;
    for (var bi = 0; bi < size - 1; ++bi) {
        if (ai == x)
            ai++;
        var aj = 0;
        for (var bj = 0; bj < size - 1; ++bj) {
            if (aj == y)
                aj++;
            b[bi * 4 + bj] = a[ai * 4 + aj];
            aj++;
        }
        ai++;
    }
    return tdl.math.det(b);
};
tdl.math.det = function(m) {
    var d = 4;
    if (d <= 4) {
        return tdl.math['det' + d](m);
    }
    var r = 0.0;
    var sign = 1;
    var row = m[0];
    var mLength = m.length;
    for (var y = 0; y < mLength; y++) {
        r += sign * row[y] * tdl.math.codet(m, 0, y);
        sign *= -1;
    }
    return r;
};
tdl.math.inverse = function(m) {
    var d = 4;
    if (d <= 4) {
        return tdl.math['inverse' + d](m);
    }
    var r = [];
    var size = m.length;
    for (var j = 0; j < size; ++j) {
        r[j] = [];
        for (var i = 0; i < size; ++i)
            r[j][i] = ((i + j) % 2 ? -1 : 1) * tdl.math.codet(m, i, j);
    }
    return tdl.math.divMatrixScalar(r, tdl.math.det(m));
};
tdl.math.orthonormalize = function(m) {};
tdl.math.matrix4.inverse = function(m) {
    return tdl.math.inverse4(m);
};
tdl.math.matrix4.mul = function(a, b) {
    return tdl.math.mulMatrixMatrix4(a, b);
};
tdl.math.matrix4.det = function(m) {
    return tdl.math.det4(m);
};
tdl.math.matrix4.copy = function(m) {
    return tdl.math.copyMatrix(m);
};
tdl.math.matrix4.transpose = tdl.math.transpose;
tdl.math.matrix4.setUpper3x3 = function(a, b) {
    a[0 * 4 + 0] = b[0 * 3 + 0];
    a[0 * 4 + 1] = b[0 * 3 + 1];
    a[0 * 4 + 2] = b[0 * 3 + 2];
    a[1 * 4 + 0] = b[1 * 3 + 0];
    a[1 * 4 + 1] = b[1 * 3 + 1];
    a[1 * 4 + 2] = b[1 * 3 + 2];
    a[2 * 4 + 0] = b[2 * 3 + 0];
    a[2 * 4 + 1] = b[2 * 3 + 1];
    a[2 * 4 + 2] = b[2 * 3 + 2];
    return a;
};
tdl.math.matrix4.getUpper3x3 = function(m) {
    return [m[0 * 4 + 0], m[0 * 4 + 1], m[0 * 4 + 2], m[1 * 4 + 0], m[1 * 4 + 1], m[1 * 4 + 2], m[2 * 4 + 0], m[2 * 4 + 1], m[2 * 4 + 2]];
};
tdl.math.matrix4.setTranslation = function(a, v) {
    a[12] = v[0];
    a[13] = v[1];
    a[14] = v[2];
    a[15] = 1;
    return a;
};
tdl.math.matrix4.getTranslation = function(m) {
    return [m[12], m[13], m[14], m[15]];
};
tdl.math.matrix4.transformPoint = function(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];
    return [(v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d, (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d, (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d];
};
tdl.math.matrix4.transformVector4 = function(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    var v3 = v[3];
    return [v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + v3 * m[3 * 4 + 0], v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + v3 * m[3 * 4 + 1], v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + v3 * m[3 * 4 + 2], v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + v3 * m[3 * 4 + 3]];
};
tdl.math.matrix4.transformDirection = function(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    return [v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0], v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1], v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2]];
};
tdl.math.matrix4.transformNormal = function(m, v) {
    var mi = tdl.math.inverse4(m);
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    return [v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2], v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2], v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2]];
};
tdl.math.matrix4.identity = function() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
tdl.math.matrix4.setIdentity = function(m) {
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if (i == j) {
                m[i * 4 + j] = 1;
            } else {
                m[i * 4 + j] = 0;
            }
        }
    }
    return m;
};
tdl.math.matrix4.perspective = function(angle, aspect, near, far) {
    var f = Math.tan(0.5 * (Math.PI - angle));
    var range = near - far;
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, far / range, -1, 0, 0, near * far / range, 0];
};
tdl.math.matrix4.orthographic = function(left, right, bottom, top, near, far) {
    return [2 / (right - left), 0, 0, 0, 0, 2 / (top - bottom), 0, 0, 0, 0, 1 / (near - far), 0, (left + right) / (left - right), (bottom + top) / (bottom - top), near / (near - far), 1];
};
tdl.math.matrix4.frustum = function(left, right, bottom, top, near, far) {
    var dx = (right - left);
    var dy = (top - bottom);
    var dz = (near - far);
    return [2 * near / dx, 0, 0, 0, 0, 2 * near / dy, 0, 0, (left + right) / dx, (top + bottom) / dy, far / dz, -1, 0, 0, near * far / dz, 0];
};
tdl.math.matrix4.lookAt = function(eye, target, up) {
    return tdl.math.inverse(tdl.math.matrix4.cameraLookAt(eye, target, up));
};
tdl.math.matrix4.cameraLookAt = function(eye, target, up) {
    var vz = tdl.math.normalize(tdl.math.subVector(eye, target));
    var vx = tdl.math.normalize(tdl.math.cross(up, vz));
    var vy = tdl.math.cross(vz, vx);
    return tdl.math.inverse([vx[0], vx[1], vx[2], 0, vy[0], vy[1], vy[2], 0, vz[0], vz[1], vz[2], 0, -tdl.math.dot(vx, eye), -tdl.math.dot(vy, eye), -tdl.math.dot(vz, eye), 1]);
};
tdl.math.matrix4.composition = function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03, a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03, a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03, a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03, a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13, a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13, a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13, a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13, a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23, a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23, a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23, a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23, a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33, a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33, a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33, a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33];
};
tdl.math.matrix4.compose = function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    a[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    a[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    a[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    a[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    a[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    a[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    a[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    a[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    a[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    a[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    a[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    a[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    a[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    a[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    a[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    a[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return a;
};
tdl.math.matrix4.translation = function(v) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v[0], v[1], v[2], 1];
};
tdl.math.matrix4.translate = function(m, v) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    m[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    m[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    m[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    m[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return m;
};
tdl.math.matrix4.scaling = function(v) {
    return [v[0], 0, 0, 0, 0, v[1], 0, 0, 0, 0, v[2], 0, 0, 0, 0, 1];
};
tdl.math.matrix4.scale = function(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    m[0] = v0 * m[0 * 4 + 0];
    m[1] = v0 * m[0 * 4 + 1];
    m[2] = v0 * m[0 * 4 + 2];
    m[3] = v0 * m[0 * 4 + 3];
    m[4] = v1 * m[1 * 4 + 0];
    m[5] = v1 * m[1 * 4 + 1];
    m[6] = v1 * m[1 * 4 + 2];
    m[7] = v1 * m[1 * 4 + 3];
    m[8] = v2 * m[2 * 4 + 0];
    m[9] = v2 * m[2 * 4 + 1];
    m[10] = v2 * m[2 * 4 + 2];
    m[11] = v2 * m[2 * 4 + 3];
    return m;
};
tdl.math.matrix4.rotationX = function(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};
tdl.math.matrix4.rotateX = function(m, angle) {
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    m[4] = c * m10 + s * m20;
    m[5] = c * m11 + s * m21;
    m[6] = c * m12 + s * m22;
    m[7] = c * m13 + s * m23;
    m[8] = c * m20 - s * m10;
    m[9] = c * m21 - s * m11;
    m[10] = c * m22 - s * m12;
    m[11] = c * m23 - s * m13;
    return m;
};
tdl.math.matrix4.rotationY = function(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};
tdl.math.matrix4.rotateY = function(m, angle) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    m[0] = c * m00 - s * m20;
    m[1] = c * m01 - s * m21;
    m[2] = c * m02 - s * m22;
    m[3] = c * m03 - s * m23;
    m[8] = c * m20 + s * m00;
    m[9] = c * m21 + s * m01;
    m[10] = c * m22 + s * m02;
    m[11] = c * m23 + s * m03;
    return m;
};
tdl.math.matrix4.rotationZ = function(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
tdl.math.matrix4.rotateZ = function(m, angle) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    m[0] = c * m00 + s * m10;
    m[1] = c * m01 + s * m11;
    m[2] = c * m02 + s * m12;
    m[3] = c * m03 + s * m13;
    m[4] = c * m10 - s * m00;
    m[5] = c * m11 - s * m01;
    m[6] = c * m12 - s * m02;
    m[7] = c * m13 - s * m03;
    return m;
};
tdl.math.matrix4.rotationZYX = function(v) {
    var sinx = Math.sin(v[0]);
    var cosx = Math.cos(v[0]);
    var siny = Math.sin(v[1]);
    var cosy = Math.cos(v[1]);
    var sinz = Math.sin(v[2]);
    var cosz = Math.cos(v[2]);
    var coszsiny = cosz * siny;
    var sinzsiny = sinz * siny;
    return [cosz * cosy, sinz * cosy, -siny, 0, coszsiny * sinx - sinz * cosx, sinzsiny * sinx + cosz * cosx, cosy * sinx, 0, coszsiny * cosx + sinz * sinx, sinzsiny * cosx - cosz * sinx, cosy * cosx, 0, 0, 0, 0, 1];
};
tdl.math.matrix4.rotateZYX = function(m, v) {
    var sinX = Math.sin(v[0]);
    var cosX = Math.cos(v[0]);
    var sinY = Math.sin(v[1]);
    var cosY = Math.cos(v[1]);
    var sinZ = Math.sin(v[2]);
    var cosZ = Math.cos(v[2]);
    var cosZSinY = cosZ * sinY;
    var sinZSinY = sinZ * sinY;
    var r00 = cosZ * cosY;
    var r01 = sinZ * cosY;
    var r02 = -sinY;
    var r10 = cosZSinY * sinX - sinZ * cosX;
    var r11 = sinZSinY * sinX + cosZ * cosX;
    var r12 = cosY * sinX;
    var r20 = cosZSinY * cosX + sinZ * sinX;
    var r21 = sinZSinY * cosX - cosZ * sinX;
    var r22 = cosY * cosX;
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    m[0] = r00 * m00 + r01 * m10 + r02 * m20;
    m[1] = r00 * m01 + r01 * m11 + r02 * m21;
    m[2] = r00 * m02 + r01 * m12 + r02 * m22;
    m[3] = r00 * m03 + r01 * m13 + r02 * m23;
    m[4] = r10 * m00 + r11 * m10 + r12 * m20;
    m[5] = r10 * m01 + r11 * m11 + r12 * m21;
    m[6] = r10 * m02 + r11 * m12 + r12 * m22;
    m[7] = r10 * m03 + r11 * m13 + r12 * m23;
    m[8] = r20 * m00 + r21 * m10 + r22 * m20;
    m[9] = r20 * m01 + r21 * m11 + r22 * m21;
    m[10] = r20 * m02 + r21 * m12 + r22 * m22;
    m[11] = r20 * m03 + r21 * m13 + r22 * m23;
    return m;
};
tdl.math.matrix4.axisRotation = function(axis, angle) {
    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    var n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var oneMinusCosine = 1 - c;
    return [xx + (1 - xx) * c, x * y * oneMinusCosine + z * s, x * z * oneMinusCosine - y * s, 0, x * y * oneMinusCosine - z * s, yy + (1 - yy) * c, y * z * oneMinusCosine + x * s, 0, x * z * oneMinusCosine + y * s, y * z * oneMinusCosine - x * s, zz + (1 - zz) * c, 0, 0, 0, 0, 1];
};
tdl.math.matrix4.axisRotate = function(m, axis, angle) {
    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    var n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var oneMinusCosine = 1 - c;
    var r00 = xx + (1 - xx) * c;
    var r01 = x * y * oneMinusCosine + z * s;
    var r02 = x * z * oneMinusCosine - y * s;
    var r10 = x * y * oneMinusCosine - z * s;
    var r11 = yy + (1 - yy) * c;
    var r12 = y * z * oneMinusCosine + x * s;
    var r20 = x * z * oneMinusCosine + y * s;
    var r21 = y * z * oneMinusCosine - x * s;
    var r22 = zz + (1 - zz) * c;
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    m[0] = r00 * m00 + r01 * m10 + r02 * m20;
    m[1] = r00 * m01 + r01 * m11 + r02 * m21;
    m[2] = r00 * m02 + r01 * m12 + r02 * m22;
    m[3] = r00 * m03 + r01 * m13 + r02 * m23;
    m[4] = r10 * m00 + r11 * m10 + r12 * m20;
    m[5] = r10 * m01 + r11 * m11 + r12 * m21;
    m[6] = r10 * m02 + r11 * m12 + r12 * m22;
    m[7] = r10 * m03 + r11 * m13 + r12 * m23;
    m[8] = r20 * m00 + r21 * m10 + r22 * m20;
    m[9] = r20 * m01 + r21 * m11 + r22 * m21;
    m[10] = r20 * m02 + r21 * m12 + r22 * m22;
    m[11] = r20 * m03 + r21 * m13 + r22 * m23;
    return m;
};
tdl.math.installRowMajorFunctions = function() {
    for (var f in tdl.math.rowMajor) {
        tdl.math[f] = tdl.math.rowMajor[f];
    }
};
tdl.math.installColumnMajorFunctions = function() {
    for (var f in tdl.math.columnMajor) {
        tdl.math[f] = tdl.math.columnMajor[f];
    }
};
tdl.math.installErrorCheckFunctions = function() {
    for (var f in tdl.math.errorCheck) {
        tdl.math[f] = tdl.math.errorCheck[f];
    }
};
tdl.math.installErrorCheckFreeFunctions = function() {
    for (var f in tdl.math.errorCheckFree) {
        tdl.math[f] = tdl.math.errorCheckFree[f];
    }
}
tdl.math.installRowMajorFunctions();
tdl.math.installErrorCheckFunctions();
tdl.provide('tdl.misc');
tdl.require('tdl.log');
tdl.misc = tdl.misc || {};
tdl.misc.applyUrlSettings = function(obj, opt_argumentName) {
    var argumentName = opt_argumentName || 'settings';
    try {
        var s = window.location.href;
        var q = s.indexOf("?");
        var e = s.indexOf("#");
        if (e < 0) {
            e = s.length;
        }
        var query = s.substring(q + 1, e);
        var pairs = query.split("&");
        for (var ii = 0; ii < pairs.length; ++ii) {
            var keyValue = pairs[ii].split("=");
            var key = keyValue[0];
            var value = decodeURIComponent(keyValue[1]);
            switch (key) {
                case argumentName:
                    var settings = eval("(" + value + ")");
                    tdl.misc.copyProperties(settings, obj);
                    break;
            }
        }
    } catch (e) {
        tdl.error(e);
        tdl.error("settings:", settings);
        return;
    }
};
tdl.misc.copyProperties = function(obj, dst) {
    for (var name in obj) {
        var value = obj[name];
        if (value instanceof Array) {
            var newDst = dst[name];
            if (!newDst) {
                newDst = [];
                dst[name] = newDst;
            }
            tdl.misc.copyProperties(value, newDst);
        } else if (typeof value == 'object') {
            var newDst = dst[name];
            if (!newDst) {
                newDst = {};
                dst[name] = newDst;
            }
            tdl.misc.copyProperties(value, newDst);
        } else {
            dst[name] = value;
        }
    }
};
tdl.provide('tdl.models');
tdl.require('tdl.buffers');
tdl.models = tdl.models || {};
tdl.models.Model = function(program, arrays, textures, opt_mode) {
    this.buffers = {};
    this.setBuffers(arrays);
    var textureUnits = {}
    var unit = 0;
    for (var texture in program.textures) {
        textureUnits[texture] = unit++;
    }
    this.mode = (opt_mode === undefined) ? gl.TRIANGLES : opt_mode;
    this.textures = textures;
    this.textureUnits = textureUnits;
    this.setProgram(program);
}
tdl.models.Model.prototype.setProgram = function(program) {
    this.program = program;
}
tdl.models.Model.prototype.setBuffer = function(name, array) {
    var target = (name == 'indices') ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    var b = this.buffers[name];
    if (!b) {
        b = new tdl.buffers.Buffer(array, target);
    } else {
        b.set(array);
    }
    this.buffers[name] = b;
};
tdl.models.Model.prototype.setBuffers = function(arrays) {
    for (var name in arrays) {
        this.setBuffer(name, arrays[name]);
    }
};
tdl.models.Model.prototype.applyUniforms_ = function(opt_uniforms) {
    if (opt_uniforms) {
        var program = this.program;
        for (var uniform in opt_uniforms) {
            program.setUniform(uniform, opt_uniforms[uniform]);
        }
    }
};
tdl.models.Model.prototype.drawPrep = function() {
    var program = this.program;
    var buffers = this.buffers;
    var textures = this.textures;
    program.use();
    for (var buffer in buffers) {
        var b = buffers[buffer];
        if (buffer == 'indices') {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.buffer());
        } else {
            var attrib = program.attrib[buffer];
            if (attrib) {
                attrib(b);
            }
        }
    }
    this.applyUniforms_(textures);
    for (var ii = 0; ii < arguments.length; ++ii) {
        this.applyUniforms_(arguments[ii]);
    }
};
tdl.models.Model.prototype.draw = function() {
    for (var ii = 0; ii < arguments.length; ++ii) {
        this.applyUniforms_(arguments[ii]);
    }
    var buffers = this.buffers;
    gl.drawElements(this.mode, buffers.indices.totalComponents(), gl.UNSIGNED_SHORT, 0);
};
tdl.provide('tdl.primitives');
tdl.require('tdl.math');
tdl.require('tdl.log');
tdl.primitives = tdl.primitives || {};
tdl.primitives.AttribBuffer = function(numComponents, numElements, opt_type) {
    opt_type = opt_type || 'Float32Array';
    var type = window[opt_type];
    if (numElements.length) {
        this.buffer = new type(numElements);
        numElements = this.buffer.length / numComponents;
        this.cursor = numElements;
    } else {
        this.buffer = new type(numComponents * numElements);
        this.cursor = 0;
    }
    this.numComponents = numComponents;
    this.numElements = numElements;
    this.type = opt_type;
};
tdl.primitives.AttribBuffer.prototype.stride = function() {
    return 0;
};
tdl.primitives.AttribBuffer.prototype.offset = function() {
    return 0;
};
tdl.primitives.AttribBuffer.prototype.getElement = function(index) {
    var offset = index * this.numComponents;
    var value = [];
    for (var ii = 0; ii < this.numComponents; ++ii) {
        value.push(this.buffer[offset + ii]);
    }
    return value;
};
tdl.primitives.AttribBuffer.prototype.setElement = function(index, value) {
    var offset = index * this.numComponents;
    for (var ii = 0; ii < this.numComponents; ++ii) {
        this.buffer[offset + ii] = value[ii];
    }
};
tdl.primitives.AttribBuffer.prototype.clone = function() {
    var copy = new tdl.primitives.AttribBuffer(this.numComponents, this.numElements, this.type);
    copy.pushArray(this);
    return copy;
}
tdl.primitives.AttribBuffer.prototype.push = function(value) {
    this.setElement(this.cursor++, value);
};
tdl.primitives.AttribBuffer.prototype.pushArray = function(array) {
    for (var ii = 0; ii < array.numElements; ++ii) {
        this.push(array.getElement(ii));
    }
};
tdl.primitives.AttribBuffer.prototype.pushArrayWithOffset = function(array, offset) {
    for (var ii = 0; ii < array.numElements; ++ii) {
        var elem = array.getElement(ii);
        for (var jj = 0; jj < offset.length; ++jj) {
            elem[jj] += offset[jj];
        }
        this.push(elem);
    }
};
tdl.primitives.AttribBuffer.prototype.computeExtents = function() {
    var numElements = this.numElements;
    var numComponents = this.numComponents;
    var minExtent = this.getElement(0);
    var maxExtent = this.getElement(0);
    for (var ii = 1; ii < numElements; ++ii) {
        var element = this.getElement(ii);
        for (var jj = 0; jj < numComponents; ++jj) {
            minExtent[jj] = Math.min(minExtent[jj], element[jj]);
            maxExtent[jj] = Math.max(maxExtent[jj], element[jj]);
        }
    }
    return {
        min: minExtent,
        max: maxExtent
    };
};
tdl.primitives.mulComponents = function(array, multiplier) {
    var numElements = array.numElements;
    var numComponents = array.numComponents;
    for (var ii = 0; ii < numElements; ++ii) {
        var element = array.getElement(ii);
        for (var jj = 0; jj < numComponents; ++jj) {
            element[jj] *= multiplier[jj];
        }
        array.setElement(ii, element);
    }
};
tdl.primitives.reorientPositions = function(array, matrix) {
    var math = tdl.math;
    var numElements = array.numElements;
    for (var ii = 0; ii < numElements; ++ii) {
        array.setElement(ii, math.matrix4.transformPoint(matrix, array.getElement(ii)));
    }
};
tdl.primitives.reorientNormals = function(array, matrix) {
    var math = tdl.math;
    var numElements = array.numElements;
    for (var ii = 0; ii < numElements; ++ii) {
        array.setElement(ii, math.matrix4.transformNormal(matrix, array.getElement(ii)));
    }
};
tdl.primitives.reorientDirections = function(array, matrix) {
    var math = tdl.math;
    var numElements = array.numElements;
    for (var ii = 0; ii < numElements; ++ii) {
        array.setElement(ii, math.matrix4.transformDirection(matrix, array.getElement(ii)));
    }
};
tdl.primitives.reorient = function(arrays, matrix) {
    for (var array in arrays) {
        if (array.match(/^position/)) {
            tdl.primitives.reorientPositions(arrays[array], matrix);
        } else if (array.match(/^normal/)) {
            tdl.primitives.reorientNormals(arrays[array], matrix);
        } else if (array.match(/^tangent/) || array.match(/^binormal/)) {
            tdl.primitives.reorientDirections(arrays[array], matrix);
        }
    }
};
tdl.primitives.createTangentsAndBinormals = function(positionArray, normalArray, normalMapUVArray, triangles) {
    var math = tdl.math;
    var tangentFrames = {};

    function roundVector(v) {
        return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];
    }

    function tangentFrameKey(position, normal) {
        return roundVector(math.mulVectorScalar(position, 100)) + ',' +
            roundVector(math.mulVectorScalar(normal, 100));
    }

    function addTangentFrame(position, normal, tangent, binormal) {
        var key = tangentFrameKey(position, normal);
        var frame = tangentFrames[key];
        if (!frame) {
            frame = [
                [0, 0, 0],
                [0, 0, 0]
            ];
        }
        frame[0] = math.addVector(frame[0], tangent);
        frame[1] = math.addVector(frame[1], binormal);
        tangentFrames[key] = frame;
    }

    function getTangentFrame(position, normal) {
        var key = tangentFrameKey(position, normal);
        return tangentFrames[key];
    }
    var numTriangles = triangles.numElements;
    for (var triangleIndex = 0; triangleIndex < numTriangles; ++triangleIndex) {
        var vertexIndices = triangles.getElement(triangleIndex);
        var uvs = [];
        var positions = [];
        var normals = [];
        for (var i = 0; i < 3; ++i) {
            var vertexIndex = vertexIndices[i];
            uvs[i] = normalMapUVArray.getElement(vertexIndex);
            positions[i] = positionArray.getElement(vertexIndex);
            normals[i] = normalArray.getElement(vertexIndex);
        }
        var tangent = [0, 0, 0];
        var binormal = [0, 0, 0];
        for (var axis = 0; axis < 3; ++axis) {
            var edge1 = [positions[1][axis] - positions[0][axis], uvs[1][0] - uvs[0][0], uvs[1][1] - uvs[0][1]];
            var edge2 = [positions[2][axis] - positions[0][axis], uvs[2][0] - uvs[0][0], uvs[2][1] - uvs[0][1]];
            var edgeCross = math.normalize(math.cross(edge1, edge2));
            if (edgeCross[0] == 0) {
                edgeCross[0] = 1;
            }
            tangent[axis] = -edgeCross[1] / edgeCross[0];
            binormal[axis] = -edgeCross[2] / edgeCross[0];
        }
        var tangentLength = math.length(tangent);
        if (tangentLength > 0.00001) {
            tangent = math.mulVectorScalar(tangent, 1 / tangentLength);
        }
        var binormalLength = math.length(binormal);
        if (binormalLength > 0.00001) {
            binormal = math.mulVectorScalar(binormal, 1 / binormalLength);
        }
        for (var i = 0; i < 3; ++i) {
            addTangentFrame(positions[i], normals[i], tangent, binormal);
        }
    }
    var numVertices = positionArray.numElements;
    var tangents = new tdl.primitives.AttribBuffer(3, numVertices);
    var binormals = new tdl.primitives.AttribBuffer(3, numVertices);
    for (var vertexIndex = 0; vertexIndex < numVertices; ++vertexIndex) {
        var position = positionArray.getElement(vertexIndex);
        var normal = normalArray.getElement(vertexIndex);
        var frame = getTangentFrame(position, normal);
        var tangent = frame[0];
        tangent = math.subVector(tangent, math.mulVectorScalar(normal, math.dot(normal, tangent)));
        var tangentLength = math.length(tangent);
        if (tangentLength > 0.00001) {
            tangent = math.mulVectorScalar(tangent, 1 / tangentLength);
        }
        var binormal = frame[1];
        binormal = math.subVector(binormal, math.mulVectorScalar(tangent, math.dot(tangent, binormal)));
        binormal = math.subVector(binormal, math.mulVectorScalar(normal, math.dot(normal, binormal)));
        var binormalLength = math.length(binormal);
        if (binormalLength > 0.00001) {
            binormal = math.mulVectorScalar(binormal, 1 / binormalLength);
        }
        tangents.push(tangent);
        binormals.push(binormal);
    }
    return {
        tangent: tangents,
        binormal: binormals
    };
};
tdl.primitives.addTangentsAndBinormals = function(arrays) {
    var bn = tdl.primitives.createTangentsAndBinormals(arrays.position, arrays.normal, arrays.texCoord, arrays.indices);
    arrays.tangent = bn.tangent;
    arrays.binormal = bn.binormal;
    return arrays;
};
tdl.primitives.clone = function(arrays) {
    var newArrays = {};
    for (var array in arrays) {
        newArrays[array] = arrays[array].clone();
    }
    return newArrays;
};
tdl.primitives.concat = function(arrayOfArrays) {
    var names = {};
    var baseName;
    for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
        var arrays = arrayOfArrays[ii];
        for (var name in arrays) {
            if (!names[name]) {
                names[name] = [];
            }
            if (!baseName && name != 'indices') {
                baseName = name;
            }
            var array = arrays[name];
            names[name].push(array.numElements);
        }
    }
    var base = names[baseName];
    var newArrays = {};
    for (var name in names) {
        var numElements = 0;
        var numComponents;
        var type;
        for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
            var arrays = arrayOfArrays[ii];
            var array = arrays[name];
            numElements += array.numElements;
            numComponents = array.numComponents;
            type = array.type;
        }
        var newArray = new tdl.primitives.AttribBuffer(numComponents, numElements, type);
        var baseIndex = 0;
        for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
            var arrays = arrayOfArrays[ii];
            var array = arrays[name];
            if (name == 'indices') {
                newArray.pushArrayWithOffset(array, [baseIndex, baseIndex, baseIndex]);
                baseIndex += base[ii];
            } else {
                newArray.pushArray(array);
            }
        }
        newArrays[name] = newArray;
    }
    return newArrays;
};
tdl.primitives.applyPlanarUVMapping = function(positions, texCoords) {
    var extents = positions.computeExtents();
    var ranges = tdl.math.subVector(extents.max, extents.min);
    var numElements = positions.numElements;
    for (var ii = 0; ii < numElements; ++ii) {
        var position = positions.getElement(ii);
        var u = (position[0] - extents.min[0]) / ranges[0];
        var v = (position[2] - extents.min[2]) / ranges[2];
        texCoords.setElement(ii, [u, v]);
    }
};
tdl.primitives.createSphere = function(radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians) {
    if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
        throw Error('subdivisionAxis and subdivisionHeight must be > 0');
    }
    var math = tdl.math;
    opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
    opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
    opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
    opt_endLongitudeInRadians = opt_endLongitudeInRadians || (Math.PI * 2);
    var latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
    var longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;
    var numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
    var positions = new tdl.primitives.AttribBuffer(3, numVertices);
    var normals = new tdl.primitives.AttribBuffer(3, numVertices);
    var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
    for (var y = 0; y <= subdivisionsHeight; y++) {
        for (var x = 0; x <= subdivisionsAxis; x++) {
            var u = x / subdivisionsAxis;
            var v = y / subdivisionsHeight;
            var theta = longRange * u;
            var phi = latRange * v;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var ux = cosTheta * sinPhi;
            var uy = cosPhi;
            var uz = sinTheta * sinPhi;
            positions.push([radius * ux, radius * uy, radius * uz]);
            normals.push([ux, uy, uz]);
            texCoords.push([u, v]);
        }
    }
    var numVertsAround = subdivisionsAxis + 1;
    var indices = new tdl.primitives.AttribBuffer(3, subdivisionsAxis * subdivisionsHeight * 2, 'Uint16Array');
    for (var x = 0; x < subdivisionsAxis; x++) {
        for (var y = 0; y < subdivisionsHeight; y++) {
            indices.push([(y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x]);
            indices.push([(y + 1) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x + 1]);
        }
    }
    return {
        position: positions,
        normal: normals,
        texCoord: texCoords,
        indices: indices
    };
};
tdl.primitives.createPlane = function(width, depth, subdivisionsWidth, subdivisionsDepth) {
    if (subdivisionsWidth <= 0 || subdivisionsDepth <= 0) {
        throw Error('subdivisionWidth and subdivisionDepth must be > 0');
    }
    var math = tdl.math;
    var numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
    var positions = new tdl.primitives.AttribBuffer(3, numVertices);
    var normals = new tdl.primitives.AttribBuffer(3, numVertices);
    var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
    for (var z = 0; z <= subdivisionsDepth; z++) {
        for (var x = 0; x <= subdivisionsWidth; x++) {
            var u = x / subdivisionsWidth;
            var v = z / subdivisionsDepth;
            positions.push([width * u - width * 0.5, 0, depth * v - depth * 0.5]);
            normals.push([0, 1, 0]);
            texCoords.push([u, v]);
        }
    }
    var numVertsAcross = subdivisionsWidth + 1;
    var indices = new tdl.primitives.AttribBuffer(3, subdivisionsWidth * subdivisionsDepth * 2, 'Uint16Array');
    for (var z = 0; z < subdivisionsDepth; z++) {
        for (var x = 0; x < subdivisionsWidth; x++) {
            indices.push([(z + 0) * numVertsAcross + x, (z + 1) * numVertsAcross + x, (z + 0) * numVertsAcross + x + 1]);
            indices.push([(z + 1) * numVertsAcross + x, (z + 1) * numVertsAcross + x + 1, (z + 0) * numVertsAcross + x + 1]);
        }
    }
    return {
        position: positions,
        normal: normals,
        texCoord: texCoords,
        indices: indices
    };
};
tdl.primitives.CUBE_FACE_INDICES_ = [
    [3, 7, 5, 1],
    [6, 2, 0, 4],
    [6, 7, 3, 2],
    [0, 1, 5, 4],
    [7, 6, 4, 5],
    [2, 3, 1, 0],
];
tdl.primitives.createCube = function(size) {
    var k = size / 2;
    var cornerVertices = [
        [-k, -k, -k],
        [+k, -k, -k],
        [-k, +k, -k],
        [+k, +k, -k],
        [-k, -k, +k],
        [+k, -k, +k],
        [-k, +k, +k],
        [+k, +k, +k]
    ];
    var faceNormals = [
        [+1, +0, +0],
        [-1, +0, +0],
        [+0, +1, +0],
        [+0, -1, +0],
        [+0, +0, +1],
        [+0, +0, -1]
    ];
    var uvCoords = [
        [1, 0],
        [0, 0],
        [0, 1],
        [1, 1]
    ];
    var numVertices = 6 * 4;
    var positions = new tdl.primitives.AttribBuffer(3, numVertices);
    var normals = new tdl.primitives.AttribBuffer(3, numVertices);
    var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
    var indices = new tdl.primitives.AttribBuffer(3, 6 * 2, 'Uint16Array');
    for (var f = 0; f < 6; ++f) {
        var faceIndices = tdl.primitives.CUBE_FACE_INDICES_[f];
        for (var v = 0; v < 4; ++v) {
            var position = cornerVertices[faceIndices[v]];
            var normal = faceNormals[f];
            var uv = uvCoords[v];
            positions.push(position);
            normals.push(normal);
            texCoords.push(uv);
        }
        var offset = 4 * f;
        indices.push([offset + 0, offset + 1, offset + 2]);
        indices.push([offset + 0, offset + 2, offset + 3]);
    }
    return {
        position: positions,
        normal: normals,
        texCoord: texCoords,
        indices: indices
    };
};
tdl.provide('tdl.programs');
tdl.require('tdl.log');
tdl.require('tdl.string');
tdl.programs = tdl.programs || {};
tdl.programs.programDB = {};
tdl.programs.shaderDB = {};
tdl.programs.loadProgramFromScriptTags = function(vertexShaderId, fragmentShaderId) {
    var vertElem = document.getElementById(vertexShaderId);
    var fragElem = document.getElementById(fragmentShaderId);
    if (!vertElem) {
        throw ("Can't find vertex program tag: " + vertexShaderId);
    }
    if (!fragElem) {
        throw ("Can't find fragment program tag: " + fragmentShaderId);
    }
    return tdl.programs.loadProgram(document.getElementById(vertexShaderId).text, document.getElementById(fragmentShaderId).text);
};
tdl.programs.loadProgram = function(vertexShader, fragmentShader) {
    var id = vertexShader + fragmentShader;
    var program = tdl.programs.programDB[id];
    if (program) {
        return program;
    }
    try {
        program = new tdl.programs.Program(vertexShader, fragmentShader);
    } catch (e) {
        tdl.error(e);
        return null;
    }
    tdl.programs.programDB[id] = program;
    return program;
};
tdl.programs.Program = function(vertexShader, fragmentShader) {
    var loadShader = function(gl, shaderSource, shaderType) {
        var id = shaderSource + shaderType;
        var shader = gl.createShader(shaderType);
        if (shader == null) {
            throw ("*** Error: unable to create shader '" + shaderSource + "'");
        }
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            tdl.programs.lastError = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw ("*** Error compiling shader :" + tdl.programs.lastError);
        }
        tdl.programs.shaderDB[id] = shader;
        return shader;
    }
    var loadProgram = function(gl, vertexShader, fragmentShader) {
        var vs;
        var fs;
        var program;
        try {
            vs = loadShader(gl, vertexShader, gl.VERTEX_SHADER);
            fs = loadShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
            program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            linkProgram(gl, program);
        } catch (e) {
            if (vs) {
                gl.deleteShader(vs)
            }
            if (fs) {
                gl.deleteShader(fs)
            }
            if (program) {
                gl.deleteShader(program)
            }
            throw (e);
        }
        return program;
    };
    var linkProgram = function(gl, program) {
        gl.linkProgram(program);
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            tdl.programs.lastError = gl.getProgramInfoLog(program);
            throw ("*** Error in program linking:" + tdl.programs.lastError);
        }
    };
    var program = loadProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        throw ("could not compile program");
    }

    function flatten(array) {
        var flat = [];
        for (var i = 0, l = array.length; i < l; i++) {
            var type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase();
            if (type) {
                flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten(array[i]) : array[i]);
            }
        }
        return flat;
    }
    var attribs = {};
    var attribLocs = {};

    function createAttribSetter(info, index) {
        if (info.size != 1) {
            throw ("arrays of attribs not handled");
        }
        return function(b) {
            gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer());
            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(index, b.numComponents(), b.type(), b.normalize(), b.stride(), b.offset());
        };
    }
    var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var ii = 0; ii < numAttribs; ++ii) {
        var info = gl.getActiveAttrib(program, ii);
        var name = info.name;
        if (tdl.string.endsWith(name, "[0]")) {
            name = name.substr(0, name.length - 3);
        }
        var index = gl.getAttribLocation(program, info.name);
        attribs[name] = createAttribSetter(info, index);
        attribLocs[name] = index
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    var uniforms = {};
    var textureUnit = 0;

    function createUniformSetter(info) {
        var loc = gl.getUniformLocation(program, info.name);
        var type = info.type;
        if (info.size > 1 && tdl.string.endsWith(info.name, "[0]")) {
            if (type == gl.FLOAT)
                return function(v) {
                    gl.uniform1fv(loc, v);
                };
            if (type == gl.FLOAT_VEC2)
                return function(v) {
                    gl.uniform2fv(loc, v);
                };
            if (type == gl.FLOAT_VEC3)
                return function(v) {
                    gl.uniform3fv(loc, v);
                };
            if (type == gl.FLOAT_VEC4)
                return function(v) {
                    gl.uniform4fv(loc, v);
                };
            if (type == gl.INT)
                return function(v) {
                    gl.uniform1iv(loc, v);
                };
            if (type == gl.INT_VEC2)
                return function(v) {
                    gl.uniform2iv(loc, v);
                };
            if (type == gl.INT_VEC3)
                return function(v) {
                    gl.uniform3iv(loc, v);
                };
            if (type == gl.INT_VEC4)
                return function(v) {
                    gl.uniform4iv(loc, v);
                };
            if (type == gl.BOOL)
                return function(v) {
                    gl.uniform1iv(loc, v);
                };
            if (type == gl.BOOL_VEC2)
                return function(v) {
                    gl.uniform2iv(loc, v);
                };
            if (type == gl.BOOL_VEC3)
                return function(v) {
                    gl.uniform3iv(loc, v);
                };
            if (type == gl.BOOL_VEC4)
                return function(v) {
                    gl.uniform4iv(loc, v);
                };
            if (type == gl.FLOAT_MAT2)
                return function(v) {
                    gl.uniformMatrix2fv(loc, false, v);
                };
            if (type == gl.FLOAT_MAT3)
                return function(v) {
                    gl.uniformMatrix3fv(loc, false, v);
                };
            if (type == gl.FLOAT_MAT4)
                return function(v) {
                    gl.uniformMatrix4fv(loc, false, v);
                };
            if (type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE) {
                var units = [];
                for (var ii = 0; ii < info.size; ++ii) {
                    units.push(textureUnit++);
                }
                return function(units) {
                    return function(v) {
                        gl.uniform1iv(loc, units);
                        v.bindToUnit(units);
                    };
                }(units);
            }
            throw ("unknown type: 0x" + type.toString(16));
        } else {
            if (type == gl.FLOAT)
                return function(v) {
                    gl.uniform1f(loc, v);
                };
            if (type == gl.FLOAT_VEC2)
                return function(v) {
                    gl.uniform2fv(loc, v);
                };
            if (type == gl.FLOAT_VEC3)
                return function(v) {
                    gl.uniform3fv(loc, v);
                };
            if (type == gl.FLOAT_VEC4)
                return function(v) {
                    gl.uniform4fv(loc, v);
                };
            if (type == gl.INT)
                return function(v) {
                    gl.uniform1i(loc, v);
                };
            if (type == gl.INT_VEC2)
                return function(v) {
                    gl.uniform2iv(loc, v);
                };
            if (type == gl.INT_VEC3)
                return function(v) {
                    gl.uniform3iv(loc, v);
                };
            if (type == gl.INT_VEC4)
                return function(v) {
                    gl.uniform4iv(loc, v);
                };
            if (type == gl.BOOL)
                return function(v) {
                    gl.uniform1i(loc, v);
                };
            if (type == gl.BOOL_VEC2)
                return function(v) {
                    gl.uniform2iv(loc, v);
                };
            if (type == gl.BOOL_VEC3)
                return function(v) {
                    gl.uniform3iv(loc, v);
                };
            if (type == gl.BOOL_VEC4)
                return function(v) {
                    gl.uniform4iv(loc, v);
                };
            if (type == gl.FLOAT_MAT2)
                return function(v) {
                    gl.uniformMatrix2fv(loc, false, v);
                };
            if (type == gl.FLOAT_MAT3)
                return function(v) {
                    gl.uniformMatrix3fv(loc, false, v);
                };
            if (type == gl.FLOAT_MAT4)
                return function(v) {
                    gl.uniformMatrix4fv(loc, false, v);
                };
            if (type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE) {
                return function(unit) {
                    return function(v) {
                        gl.uniform1i(loc, unit);
                        v.bindToUnit(unit);
                    };
                }(textureUnit++);
            }
            throw ("unknown type: 0x" + type.toString(16));
        }
    }
    var textures = {};
    for (var ii = 0; ii < numUniforms; ++ii) {
        var info = gl.getActiveUniform(program, ii);
        name = info.name;
        if (tdl.string.endsWith(name, "[0]")) {
            name = name.substr(0, name.length - 3);
        }
        var setter = createUniformSetter(info);
        uniforms[name] = setter;
        if (info.type == gl.SAMPLER_2D || info.type == gl.SAMPLER_CUBE) {
            textures[name] = setter;
        }
    }
    this.textures = textures;
    this.program = program;
    this.attrib = attribs;
    this.attribLoc = attribLocs;
    this.uniform = uniforms;
};
tdl.programs.Program.prototype.use = function() {
    gl.useProgram(this.program);
};
tdl.programs.Program.prototype.setUniform = function(uniform, value) {
    var func = this.uniform[uniform];
    if (func) {
        func(value);
    }
};
tdl.provide('tdl.shader');
tdl.shader = tdl.shader || {};
tdl.shader.loadFromScriptNodes = function(gl, vertexScriptName, fragmentScriptName) {
    var vertexScript = document.getElementById(vertexScriptName);
    var fragmentScript = document.getElementById(fragmentScriptName);
    if (!vertexScript || !fragmentScript)
        return null;
    return new tdl.shader.Shader(gl, vertexScript.text, fragmentScript.text);
}
tdl.shader.glslNameToJs_ = function(name) {
    return name.replace(/_(.)/g, function(_, p1) {
        return p1.toUpperCase();
    });
}
tdl.shader.Shader = function(gl, vertex, fragment) {
    this.program = gl.createProgram();
    this.gl = gl;
    var vs = this.loadShader(this.gl.VERTEX_SHADER, vertex);
    if (vs == null) {
        return;
    }
    this.gl.attachShader(this.program, vs);
    this.gl.deleteShader(vs);
    var fs = this.loadShader(this.gl.FRAGMENT_SHADER, fragment);
    if (fs == null) {
        return;
    }
    this.gl.attachShader(this.program, fs);
    this.gl.deleteShader(fs);
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);
    var linked = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
    if (!linked) {
        var infoLog = this.gl.getProgramInfoLog(this.program);
        tdl.error("Error linking program:\n" + infoLog);
        this.gl.deleteProgram(this.program);
        this.program = null;
        return;
    }
    var re = /(uniform|attribute)\s+\S+\s+(\S+)\s*;/g;
    var match = null;
    while ((match = re.exec(vertex + '\n' + fragment)) != null) {
        var glslName = match[2];
        var jsName = tdl.shader.glslNameToJs_(glslName);
        var loc = -1;
        if (match[1] == "uniform") {
            this[jsName + "Loc"] = this.getUniform(glslName);
        } else if (match[1] == "attribute") {
            this[jsName + "Loc"] = this.getAttribute(glslName);
        }
        if (loc >= 0) {
            this[jsName + "Loc"] = loc;
        }
    }
}
tdl.shader.Shader.prototype.bind = function() {
    this.gl.useProgram(this.program);
}
tdl.shader.Shader.prototype.loadShader = function(type, shaderSrc) {
    var shader = this.gl.createShader(type);
    if (shader == null) {
        return null;
    }
    this.gl.shaderSource(shader, shaderSrc);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        var infoLog = this.gl.getShaderInfoLog(shader);
        tdl.error("Error compiling shader:\n" + infoLog);
        this.gl.deleteShader(shader);
        return null;
    }
    return shader;
}
tdl.shader.Shader.prototype.getAttribute = function(name) {
    return this.gl.getAttribLocation(this.program, name);
};
tdl.shader.Shader.prototype.getUniform = function(name) {
    return this.gl.getUniformLocation(this.program, name);
}
tdl.provide('tdl.textures');
tdl.textures = tdl.textures || {};
tdl.textures.textureDB = {};
tdl.textures.loadTexture = function(arg, opt_flipY, opt_callback) {
    var texture = tdl.textures.textureDB[arg.toString()];
    if (texture) {
        return texture;
    }
    if (typeof arg == 'string') {
        texture = new tdl.textures.Texture2D(arg, opt_flipY, opt_callback);
    } else if (arg.length == 4 && typeof arg[0] == 'number') {
        texture = new tdl.textures.SolidTexture(arg);
    } else if ((arg.length == 1 || arg.length == 6) && typeof arg[0] == 'string') {
        texture = new tdl.textures.CubeMap(arg);
    } else if (arg.tagName == 'CANVAS' || arg.tagName == 'IMG') {
        texture = new tdl.textures.Texture2D(arg, opt_flipY);
    } else if (arg.width) {
        texture = new tdl.textures.ColorTexture2D(arg);
    } else {
        throw "bad args";
    }
    tdl.textures.textureDB[arg.toString()] = texture;
    return texture;
};
tdl.textures.Texture = function(target) {
    this.target = target;
    this.texture = gl.createTexture();
    this.params = {};
};
tdl.textures.Texture.prototype.setParameter = function(pname, value) {
    this.params[pname] = value;
    gl.bindTexture(this.target, this.texture);
    gl.texParameteri(this.target, pname, value);
};
tdl.textures.Texture.prototype.recoverFromLostContext = function() {
    this.texture = gl.createTexture();
    gl.bindTexture(this.target, this.texture);
    for (var pname in this.params) {
        gl.texParameteri(this.target, pname, this.params[pname]);
    }
};
tdl.textures.SolidTexture = function(color) {
    tdl.textures.Texture.call(this, gl.TEXTURE_2D);
    this.color = color.slice(0, 4);
    this.uploadTexture();
};
tdl.base.inherit(tdl.textures.SolidTexture, tdl.textures.Texture);
tdl.textures.SolidTexture.prototype.uploadTexture = function() {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    var pixel = new Uint8Array(this.color);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
};
tdl.textures.SolidTexture.prototype.recoverFromLostContext = function() {
    tdl.textures.Texture.recoverFromLostContext.call(this);
    this.uploadTexture();
};
tdl.textures.SolidTexture.prototype.bindToUnit = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
};
tdl.textures.ColorTexture = function(data, opt_format, opt_type) {
    tdl.textures.Texture.call(this, gl.TEXTURE_2D);
    this.format = opt_format || gl.RGBA;
    this.type = opt_type || gl.UNSIGNED_BYTE;
    if (data.pixels instanceof Array) {
        data.pixels = new Uint8Array(data.pixels);
    }
    this.data = data;
    this.uploadTexture();
};
tdl.base.inherit(tdl.textures.ColorTexture, tdl.textures.Texture);
tdl.textures.ColorTexture.prototype.uploadTexture = function() {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.data.width, this.data.height, 0, this.format, this.type, this.data.pixels);
};
tdl.textures.ColorTexture.prototype.recoverFromLostContext = function() {
    tdl.textures.Texture.recoverFromLostContext.call(this);
    this.uploadTexture();
};
tdl.textures.ColorTexture.prototype.bindToUnit = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
};
tdl.textures.Texture2D = function(url, opt_flipY, opt_callback) {
    tdl.textures.Texture.call(this, gl.TEXTURE_2D);
    this.flipY = opt_flipY || false;
    var that = this;
    var img
    if (typeof url !== 'string') {
        img = url;
        this.loaded = true;
        if (opt_callback) {
            opt_callback();
        }
    } else {
        img = document.createElement('img');
        img.onload = function() {
            that.updateTexture();
            if (opt_callback) {
                opt_callback();
            }
        };
        img.onerror = function() {
            tdl.log("could not load image: ", url);
        };
    }
    this.img = img;
    this.uploadTexture();
    if (!this.loaded) {
        img.src = url;
    }
};
tdl.base.inherit(tdl.textures.Texture2D, tdl.textures.Texture);
tdl.textures.isPowerOf2 = function(value) {
    return (value & (value - 1)) == 0;
};
tdl.textures.Texture2D.prototype.uploadTexture = function() {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (this.loaded) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
        if (tdl.textures.isPowerOf2(this.img.width) && tdl.textures.isPowerOf2(this.img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            this.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            this.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this.setParameter(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    } else {
        var pixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    }
};
tdl.textures.Texture2D.prototype.updateTexture = function() {
    this.loaded = true;
    this.uploadTexture();
};
tdl.textures.Texture2D.prototype.recoverFromLostContext = function() {
    tdl.textures.Texture.recoverFromLostContext.call(this);
    this.uploadTexture();
};
tdl.textures.Texture2D.prototype.bindToUnit = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
};
tdl.textures.ExternalTexture = function(type) {
    tdl.textures.Texture.call(this, type);
    this.type = type;
};
tdl.base.inherit(tdl.textures.ExternalTexture, tdl.textures.Texture);
tdl.textures.ExternalTexture.prototype.recoverFromLostContext = function() {};
tdl.textures.ExternalTexture.prototype.bindToUnit = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(this.type, this.texture);
}
tdl.textures.ExternalTexture2D = function() {
    tdl.textures.ExternalTexture.call(this, gl.TEXTURE_2D);
};
tdl.base.inherit(tdl.textures.ExternalTexture2D, tdl.textures.ExternalTexture);
tdl.textures.CubeMap = function(urls) {
    tdl.textures.Texture.call(this, gl.TEXTURE_CUBE_MAP);
    if (!tdl.textures.CubeMap.faceTargets) {
        tdl.textures.CubeMap.faceTargets = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
        tdl.textures.CubeMap.offsets = [
            [0, 1],
            [2, 1],
            [1, 0],
            [1, 2],
            [1, 1],
            [3, 1]
        ];
    }
    var faceTargets = tdl.textures.CubeMap.faceTargets;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    this.setParameter(gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    this.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.faces = [];
    if (!urls.length) {
        this.numUrls = 0;
        this.size = urls;
    } else {
        this.numUrls = urls.length;
        var that = this;
        for (var ff = 0; ff < urls.length; ++ff) {
            var face = {};
            this.faces[ff] = face;
            var img = document.createElement('img');
            face.img = img;
            img.onload = function(faceIndex) {
                return function() {
                    that.updateTexture(faceIndex);
                }
            }(ff);
            img.onerror = function(url) {
                return function() {
                    tdl.log("could not load image: ", url);
                }
            }(urls[ff]);
            img.src = urls[ff];
        }
    }
    this.uploadTextures();
};
tdl.base.inherit(tdl.textures.CubeMap, tdl.textures.Texture);
tdl.textures.CubeMap.prototype.loaded = function() {
    for (var ff = 0; ff < this.faces.length; ++ff) {
        if (!this.faces[ff].loaded) {
            return false;
        }
    }
    return true;
};
tdl.textures.CubeMap.prototype.uploadTextures = function() {
    var allFacesLoaded = this.loaded();
    var faceTargets = tdl.textures.CubeMap.faceTargets;
    for (var faceIndex = 0; faceIndex < 6; ++faceIndex) {
        var uploaded = false;
        var target = faceTargets[faceIndex];
        if (this.faces.length) {
            var face = this.faces[Math.min(this.faces.length - 1, faceIndex)];
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
            if (allFacesLoaded) {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                if (this.faces.length == 6) {
                    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face.img);
                } else {
                    var canvas = document.createElement('canvas');
                    var width = face.img.width / 4;
                    var height = face.img.height / 3;
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext("2d");
                    var sx = tdl.textures.CubeMap.offsets[faceIndex][0] * width;
                    var sy = tdl.textures.CubeMap.offsets[faceIndex][1] * height;
                    ctx.drawImage(face.img, sx, sy, width, height, 0, 0, width, height);
                    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                }
                uploaded = true;
            }
        }
        if (!uploaded) {
            var pixel = new Uint8Array([100, 100, 255, 255]);
            gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }
    }
    var genMips = false;
    if (this.faces.length) {
        var faceImg = this.faces[0].img;
        if (this.faces.length == 6) {
            genMips = tdl.textures.isPowerOf2(faceImg.width) && tdl.textures.isPowerOf2(faceImg.height);
        } else {
            genMips = tdl.textures.isPowerOf2(faceImg.width / 4) && tdl.textures.isPowerOf2(faceImg.height / 3);
        }
    }
    if (genMips) {
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        this.setParameter(gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
        this.setParameter(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
};
tdl.textures.CubeMap.prototype.recoverFromLostContext = function() {
    tdl.textures.Texture.recoverFromLostContext.call(this);
    this.uploadTextures();
};
tdl.textures.CubeMap.prototype.updateTexture = function(faceIndex) {
    var face = this.faces[faceIndex];
    face.loaded = true;
    var loaded = this.loaded();
    if (loaded) {
        this.uploadTextures();
    }
};
tdl.textures.CubeMap.prototype.bindToUnit = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
};
tdl.provide('tdl.webgl');
tdl.require('tdl.log');
tdl.require('tdl.misc');
tdl.webgl = tdl.webgl || {};
tdl.webgl.makeFailHTML = function(msg) {
    return '' + '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' + '<td align="center">' + '<div style="display: table-cell; vertical-align: middle;">' + '<div style="">' + msg + '</div>' + '</div>' + '</td></tr></table>';
};
tdl.webgl.GET_A_WEBGL_BROWSER = '' + 'This page requires a browser that supports WebGL.<br/>' + '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';
tdl.webgl.OTHER_PROBLEM = '' + "It does not appear your computer supports WebGL.<br/>" + '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';
tdl.webgl.setupWebGL = function(canvas, opt_attribs, opt_onError) {
    function handleCreationError(msg) {
        var container = canvas.parentNode;
        if (container) {
            var str = window.WebGLRenderingContext ? tdl.webgl.OTHER_PROBLEM : tdl.webgl.GET_A_WEBGL_BROWSER;
            if (msg) {
                str += "<br/><br/>Status: " + msg;
            }
            container.innerHTML = tdl.webgl.makeFailHTML(str);
        }
    };
    opt_onError = opt_onError || handleCreationError;
    if (canvas.addEventListener) {
        canvas.addEventListener("webglcontextcreationerror", function(event) {
            opt_onError(event.statusMessage);
        }, false);
    }
    var context = tdl.webgl.create3DContext(canvas, opt_attribs);
    if (!context) {
        if (!window.WebGLRenderingContext) {
            opt_onError("");
        }
    }
    return context;
};
tdl.webgl.create3DContext = function(canvas, opt_attribs) {
    if (opt_attribs === undefined) {
        opt_attribs = {};
        tdl.misc.applyUrlSettings(opt_attribs, 'webgl');
    }
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            context = canvas.getContext(names[ii], opt_attribs);
        } catch (e) {}
        if (context) {
            break;
        }
    }
    if (context) {
        if (!tdl.webgl.glEnums) {
            tdl.webgl.init(context);
        }

        function returnFalse() {
            return false;
        }
        canvas.onselectstart = returnFalse;
        canvas.onmousedown = returnFalse;
    }
    return context;
}
tdl.webgl.glValidEnumContexts = {
    'enable': {
        0: true
    },
    'disable': {
        0: true
    },
    'getParameter': {
        0: true
    },
    'drawArrays': {
        0: true
    },
    'drawElements': {
        0: true,
        2: true
    },
    'createShader': {
        0: true
    },
    'getShaderParameter': {
        1: true
    },
    'getProgramParameter': {
        1: true
    },
    'getVertexAttrib': {
        1: true
    },
    'vertexAttribPointer': {
        2: true
    },
    'bindTexture': {
        0: true
    },
    'activeTexture': {
        0: true
    },
    'getTexParameter': {
        0: true,
        1: true
    },
    'texParameterf': {
        0: true,
        1: true
    },
    'texParameteri': {
        0: true,
        1: true,
        2: true
    },
    'texImage2D': {
        0: true,
        2: true,
        6: true,
        7: true
    },
    'texSubImage2D': {
        0: true,
        6: true,
        7: true
    },
    'copyTexImage2D': {
        0: true,
        2: true
    },
    'copyTexSubImage2D': {
        0: true
    },
    'generateMipmap': {
        0: true
    },
    'bindBuffer': {
        0: true
    },
    'bufferData': {
        0: true,
        2: true
    },
    'bufferSubData': {
        0: true
    },
    'getBufferParameter': {
        0: true,
        1: true
    },
    'pixelStorei': {
        0: true,
        1: true
    },
    'readPixels': {
        4: true,
        5: true
    },
    'bindRenderbuffer': {
        0: true
    },
    'bindFramebuffer': {
        0: true
    },
    'checkFramebufferStatus': {
        0: true
    },
    'framebufferRenderbuffer': {
        0: true,
        1: true,
        2: true
    },
    'framebufferTexture2D': {
        0: true,
        1: true,
        2: true
    },
    'getFramebufferAttachmentParameter': {
        0: true,
        1: true,
        2: true
    },
    'getRenderbufferParameter': {
        0: true,
        1: true
    },
    'renderbufferStorage': {
        0: true,
        1: true
    },
    'clear': {
        0: true
    },
    'depthFunc': {
        0: true
    },
    'blendFunc': {
        0: true,
        1: true
    },
    'blendFuncSeparate': {
        0: true,
        1: true,
        2: true,
        3: true
    },
    'blendEquation': {
        0: true
    },
    'blendEquationSeparate': {
        0: true,
        1: true
    },
    'stencilFunc': {
        0: true
    },
    'stencilFuncSeparate': {
        0: true,
        1: true
    },
    'stencilMaskSeparate': {
        0: true
    },
    'stencilOp': {
        0: true,
        1: true,
        2: true
    },
    'stencilOpSeparate': {
        0: true,
        1: true,
        2: true,
        3: true
    },
    'cullFace': {
        0: true
    },
    'frontFace': {
        0: true
    }
};
tdl.webgl.glEnums = null;
tdl.webgl.init = function(ctx) {
    if (tdl.webgl.glEnums == null) {
        tdl.webgl.glEnums = {};
        for (var propertyName in ctx) {
            if (typeof ctx[propertyName] == 'number') {
                tdl.webgl.glEnums[ctx[propertyName]] = propertyName;
            }
        }
    }
};
tdl.webgl.checkInit = function() {
    if (tdl.webgl.glEnums == null) {
        throw 'tdl.webgl.init(ctx) not called';
    }
};
tdl.webgl.mightBeEnum = function(value) {
    tdl.webgl.checkInit();
    return (tdl.webgl.glEnums[value] !== undefined);
}
tdl.webgl.glEnumToString = function(value) {
    tdl.webgl.checkInit();
    if (value === undefined) {
        return "undefined";
    }
    var name = tdl.webgl.glEnums[value];
    return (name !== undefined) ? name : ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
};
tdl.webgl.glFunctionArgToString = function(functionName, argumentIndex, value) {
    var funcInfo = tdl.webgl.glValidEnumContexts[functionName];
    if (funcInfo !== undefined) {
        if (funcInfo[argumentIndex]) {
            return tdl.webgl.glEnumToString(value);
        }
    }
    if (value === null) {
        return "null";
    } else if (value === undefined) {
        return "undefined";
    } else {
        return value.toString();
    }
};
tdl.webgl.glFunctionArgsToString = function(functionName, args) {
    var argStr = "";
    for (var ii = 0; ii < args.length; ++ii) {
        argStr += ((ii == 0) ? '' : ', ') +
            tdl.webgl.glFunctionArgToString(functionName, ii, args[ii]);
    }
    return argStr;
};
tdl.webgl.makeDebugContext = function(ctx, opt_onErrorFunc, opt_onFunc) {
    tdl.webgl.init(ctx);
    opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        tdl.error("WebGL error " + tdl.webgl.glEnumToString(err) + " in " +
            functionName + "(" + tdl.webgl.glFunctionArgsToString(functionName, args) + ")");
    };
    var glErrorShadow = {};

    function makeErrorWrapper(ctx, functionName) {
        return function() {
            if (opt_onFunc) {
                opt_onFunc(functionName, arguments);
            }
            try {
                var result = ctx[functionName].apply(ctx, arguments);
            } catch (e) {
                opt_onErrorFunc(ctx.NO_ERROR, functionName, arguments);
                throw (e);
            }
            var err = ctx.getError();
            if (err != 0) {
                glErrorShadow[err] = true;
                opt_onErrorFunc(err, functionName, arguments);
            }
            return result;
        };
    }
    var wrapper = {};
    for (var propertyName in ctx) {
        if (typeof ctx[propertyName] == 'function') {
            wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
        } else {
            wrapper[propertyName] = ctx[propertyName];
        }
    }
    wrapper.getError = function() {
        for (var err in glErrorShadow) {
            if (glErrorShadow[err]) {
                glErrorShadow[err] = false;
                return err;
            }
        }
        return ctx.NO_ERROR;
    };
    return wrapper;
};
tdl.webgl.requestAnimationFrame = function(callback, element) {
    if (!tdl.webgl.requestAnimationFrameImpl_) {
        tdl.webgl.requestAnimationFrameImpl_ = function() {
            var functionNames = ["requestAnimationFrame", "webkitRequestAnimationFrame", "mozRequestAnimationFrame", "oRequestAnimationFrame", "msRequestAnimationFrame"];
            for (var jj = 0; jj < functionNames.length; ++jj) {
                var functionName = functionNames[jj];
                if (window[functionName]) {
                    tdl.log("using ", functionName);
                    return function(name) {
                        return function(callback, element) {
                            window[name].call(window, callback, element);
                        };
                    }(functionName);
                }
            }
            tdl.log("using window.setTimeout");
            return function(callback, element) {
                window.setTimeout(callback, 1000 / 70);
            };
        }();
    }
    tdl.webgl.requestAnimationFrameImpl_(callback, element);
};