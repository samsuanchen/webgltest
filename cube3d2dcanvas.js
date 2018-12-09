/*
 * @(#)cube3d2dcanvas.js  1.0  2013-12-30
 *
 * Copyright (c) 2013 Werner Randelshofer, Switzerland.
 * You may not use, copy or modify this file, except in compliance with the
 * accompanying license terms.
 */

/** Renders a Cube3D into an HTML 5 canvas 
    using its 2D context. 
*/

// ===============================
// Face object used for deferred rendering
// ===============================
Face = function () {
  this.length = 0;
  this.vertices = new Array(8);
  this.fillStyle = 'rgb(0,0,0)';
  this.depth = 0;
}
Face.prototype.loadTriangle = function (fs,v,i1,i2,i3) {
  this.length = 6;
  this.vertices[0]=v[i1*3];
  this.vertices[1]=v[i1*3+1];
  this.vertices[2]=v[i2*3];
  this.vertices[3]=v[i2*3+1];
  this.vertices[4]=v[i3*3];
  this.vertices[5]=v[i3*3+1];
  this.fillStyle=fs;
//  this.fillStyle = 'rgb(250,0,0)';
  this.depth = (v[i1*3+2]+v[i2*3+2]+v[i3*3+2])/3;
}
Face.prototype.loadQuad = function (fs,v,i1,i2,i3,i4) {
  this.length = 8;
  this.vertices[0]=v[i1*3];
  this.vertices[1]=v[i1*3+1];
  this.vertices[2]=v[i2*3];
  this.vertices[3]=v[i2*3+1];
  this.vertices[4]=v[i3*3];
  this.vertices[5]=v[i3*3+1];
  this.vertices[6]=v[i4*3];
  this.vertices[7]=v[i4*3+1];
  this.fillStyle=fs;
  this.depth = (v[i1*3+2]+v[i2*3+2]+v[i3*3+2]+v[i4*3+2])/4;
}

Face.prototype.draw = function (g) {
  var v=this.vertices;
  g.fillStyle=this.fillStyle;
  g.beginPath();
  g.moveTo(v[0],v[1]);
  g.lineTo(v[2],v[3]);
  g.lineTo(v[4],v[5]);
  if (this.length == 8) {
    g.lineTo(v[6],v[7]);
  }
  g.closePath();
  g.fill();
}

// ===============================
//
// Cube3D2DCanvas
//
// ===============================

/** Creates a Cube3D2DCanvas. 
    Subclasses must call initCube3D2DCanvas(). */
Cube3D2DCanvas = function() {
  this.initCube3D2DCanvas();
}
Cube3D2DCanvas.prototype=new Cube3DCanvas();


/** Initializes the Cube3D2DCanvas object. */
Cube3D2DCanvas.prototype.initCube3D2DCanvas = function() {
  this.initCube3DCanvas();
  this.g=null; //2d context
  
}

/** Opens the canvas for rendering. Protected method. */
Cube3D2DCanvas.prototype.openCanvas = function() {
	this.g = this.canvas.getContext('2d');
	if (this.g == null) return false;
	
	// disable antialiasing
	this.g.imageSmoothingEnabled = false;
	this.g.mozImageSmoothingEnabled = false;
	
	this.initScene();
	if (this.initCallback != null) {
    this.initCallback(this);
  }
  
  this.draw();
  return true;
}
/** Closes the current canvas. Protected method. */
Cube3D2DCanvas.prototype.closeCanvas = function() {
	// empty
}
/** Initializes the scene.
  * This function is called from init().
  */
Cube3D2DCanvas.prototype.initScene = function() {
  var g=this.g;
  var gl=null;
  var self=this;
  var fRepaint=function() {self.repaint();};
  
  this.world=new Node3D();
  this.cube3d=new RubiksCube3D();
  this.world.add(this.cube3d);
  this.cube=this.cube3d.cube;
  this.cube3d.addChangeListener(this);
  var attr=this.cube3d.attributes;
  
  this.currentAngle=0;
  this.xRot=attr.xRot;
  this.yRot=attr.yRot;
  this.camPos=new J3DIVector3(0,0,-7);
  this.lookAtPos=new J3DIVector3(0,0,0);
  this.up=new J3DIVector3(0,1,0);
  this.lightPos=new J3DIVector3(4,4,-8);
  this.lightNormal=new J3DIVector3(this.lightPos).normalize();
  this.observerNormal=new J3DIVector3(this.camPos).normalize();
  this.center=J3DI.loadObj(gl,"rubik_center_simple",fRepaint);
  this.center.proxy=null;
  this.corner=J3DI.loadObj(gl,"rubik_corner_simple",fRepaint);
  this.corner.proxy=null;
  this.edge=J3DI.loadObj(gl,"rubik_edge_simple",fRepaint);
  this.edge.proxy=null;
  this.side=J3DI.loadObj(gl,"rubik_side_simple",fRepaint);
  this.side.proxy=null;
  //this.sticker=J3DI.loadObj(gl,"rubik_sticker",fRepaint);
  this.stickers=new Array(this.cube3d.stickerCount);
  
  this.deferredFaceCount = 0;
  this.deferredFaces = [];
  
  
  var stickersImageURL=this.canvas.getAttribute('stickersImage');
  if (stickersImageURL!=null) {
    attr.stickersImageURL=stickersImageURL;
  }
  
  for (var i=0;i<this.cube3d.stickerCount;i++) {
    this.stickers[i]=J3DI.loadObj(gl,"rubik_sticker_simple",fRepaint);
    this.stickers[i].hasTexture=attr.stickersImageURL!=null;
    if (i*2+1<this.cube3d.stickerOffsets.length) {
    this.stickers[i].textureOffsetX=this.cube3d.stickerOffsets[i*2];
    this.stickers[i].textureOffsetY=this.cube3d.stickerOffsets[i*2+1];
    }
    this.stickers[i].textureScale=56/512;
    //this.stickers[i]={proxy:this.sticker,hasTexture:true,textureOffset:0,textureScale:512/56};
  }
  //attr.stickersImageURL='rubikscube.png';
  if (attr.stickersImageURL) {
    var txtrURL=this.baseURL+'/textures/';
    //this.stickersTexture=loadImageTexture(gl,attr.stickersImageURL,fRepaint);
  }
  
  
  this.mvMatrix = new J3DIMatrix4();
  this.perspectiveMatrix = new J3DIMatrix4();
  this.mvpMatrix = new J3DIMatrix4();
  this.mvNormalMatrix = new J3DIMatrix4();
  this.spherePos=new J3DIVector3(0,0,5);
  this.cubeSize=1.8*3; // size of a cube side in centimeters
  this.invCameraMatrix=new J3DIMatrix4();  
  this.cameraMatrix=new J3DIMatrix4();  
  this.rotationMatrix = new J3DIMatrix4();
  this.viewportMatrix = new J3DIMatrix4();
  
  this.forceColorUpdate=false;
  
  this.mvVertexArray = new J3DIVertexArray();
  this.mvpVertexArray = new J3DIVertexArray();
}
/**
 * This function is called before we draw.
 * It adjusts the perspective matrix to the dimensions of the canvas.
 */
Cube3D2DCanvas.prototype.reshape = function() {
    var canvas = this.canvas;
    if (canvas.clientWidth == this.width && canvas.clientHeight == this.height)
        return;
 
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
 
   // gl.viewport(0, 0, this.width, this.height);
    this.viewportMatrix = new J3DIMatrix4().scale(this.canvas.width*0.5,this.canvas.height*0.5).translate(1,1).scale(1,-1);
}
Cube3D2DCanvas.prototype.updateMatrices = function() {
    // Update the perspective matrix
    this.cameraMatrix.makeIdentity();
    this.cameraMatrix.lookat(
          this.camPos[0], this.camPos[1], this.camPos[2], 
          this.lookAtPos[0], this.lookAtPos[1], this.lookAtPos[2], 
          this.up[0], this.up[1], this.up[2]
          );
    
  var flip=new J3DIMatrix4();
  flip.scale(1,1,-1);
  flip.multiply(this.cameraMatrix);
  this.cameraMatrix.load(flip);    
  
    this.perspectiveMatrix = new J3DIMatrix4();
    this.perspectiveMatrix.perspective(30, this.width/this.height, 1, 12);
    this.perspectiveMatrix.multiply(this.cameraMatrix);
//    this.perspectiveMatrix.scale(1,1,1);
    
    this.invCameraMatrix.load(this.cameraMatrix);
    this.invCameraMatrix.invert();
    this.rasterToCameraMatrix = new J3DIMatrix4(this.perspectiveMatrix);
    this.rasterToCameraMatrix.invert();
    
}
/** Draws the scene. */
Cube3D2DCanvas.prototype.draw = function() {
  if (!this.camPos) return;
  
	this.reshape();
	this.updateMatrices();
	var self=this;
	
	var g=this.g;
	g.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.deferredFaceCount = 0;
	
  var cube3d=this.cube3d;
  cube3d.repainter=this;
  var attr=this.cube3d.attributes;

  // part colors
  var ccenter=attr.partsFillColor[cube3d.centerOffset];
  var cparts=attr.partsFillColor[cube3d.cornerOffset];
  
  // world-view transformation
  var wvMatrix = this.world.matrix;
  wvMatrix.makeIdentity();
  wvMatrix.multiply(this.rotationMatrix);
  wvMatrix.rotate(this.cube3d.attributes.xRot,1,0,0);
  wvMatrix.rotate(this.cube3d.attributes.yRot,0,-1,0);
  wvMatrix.rotate(this.currentAngle, 1,1,1);
  var scaleFactor =0.4*attr.scaleFactor;  
	wvMatrix.scale(scaleFactor,scaleFactor,scaleFactor);

	
  // model view transformation
  var mvMatrix=this.mvMatrix;
  
  // draw the sphere  
  /*
  if (this.sphereHit) {
    var phongparts=[0.5,0.6,0.4,16.0];//ambient, diffuse, specular, shininess
    mvMatrix.load(wvMatrix);
    mvMatrix.translate(this.spherePos[0],this.spherePos[1],this.spherePos[2]);
    this.drawObject(this.sphere, mvMatrix, this.sphereHit?chit:cmiss,phongparts,true);  
  } */
  
  // draw center parts
  for (var i=0;i<this.cube3d.centerCount;i++) {
    mvMatrix.makeIdentity();
    this.cube3d.parts[this.cube3d.centerOffset+i].transform(mvMatrix);
    this.drawObject(this.center, mvMatrix, ccenter,attr.partsPhong[this.cube3d.centerOffset+i]);  
  }
  // draw side parts
  for (var i=0;i<cube3d.sideCount;i++) {
      mvMatrix.makeIdentity();
      cube3d.parts[cube3d.sideOffset+i].transform(mvMatrix);
      this.drawObject(this.side, mvMatrix, cparts, attr.partsPhong[this.cube3d.sideOffset+i]);  
      var si=cube3d.getStickerIndexForPartIndex(cube3d.sideOffset+i,0);
			mvMatrix.multiply(cube3d.sideMatrices[i]);
      this.drawObject(this.stickers[si], mvMatrix, 
        attr.stickersFillColor[si], 
        attr.stickersPhong[si]);
  }
  // draw edge parts
  for (var i=0;i<this.cube3d.edgeCount;i++) {
      mvMatrix.makeIdentity();
      this.cube3d.parts[this.cube3d.edgeOffset+i].transform(mvMatrix);
      this.drawObject(this.edge, mvMatrix, cparts, attr.partsPhong[this.cube3d.edgeOffset+i]);  
      var si=cube3d.getStickerIndexForPartIndex(cube3d.edgeOffset+i,0);
			mvMatrix.multiply(cube3d.edgeMatrices[i]);
      this.drawObject(this.stickers[si], mvMatrix, 
        attr.stickersFillColor[si], 
        attr.stickersPhong[si]);
      mvMatrix.makeIdentity();
      this.cube3d.parts[this.cube3d.edgeOffset+i].transform(mvMatrix);
      mvMatrix.rotate(90,-1,0,0); // this should be in rubikscube3d! (?) maybe not
      mvMatrix.rotate(90,0,0,1); // this should be in rubikscube3d! (?) maybe not
			mvMatrix.multiply(cube3d.edgeMatrices[i]);
      si=cube3d.getStickerIndexForPartIndex(cube3d.edgeOffset+i,1);
      this.drawObject(this.stickers[si], mvMatrix, 
        attr.stickersFillColor[si], 
        attr.stickersPhong[si]);
  }
  // draw corner parts
  for (var i=0;i<this.cube3d.cornerCount;i++) {
      mvMatrix.makeIdentity();
      this.cube3d.parts[this.cube3d.cornerOffset+i].transform(mvMatrix);
      this.drawObject(this.corner, mvMatrix, cparts, attr.partsPhong[this.cube3d.cornerOffset+i],this.forceColorUpdate);  
      var si=cube3d.getStickerIndexForPartIndex(cube3d.cornerOffset+i,1);
	  	mvMatrix.multiply(cube3d.cornerMatrices[i]);
      this.drawObject(this.stickers[si], mvMatrix, attr.stickersFillColor[si], attr.stickersPhong[si],this.forceColorUpdate);
      mvMatrix.makeIdentity();
      this.cube3d.parts[this.cube3d.cornerOffset+i].transform(mvMatrix);
      mvMatrix.rotate(90,-1,0,0); // this should be in rubikscube3d! (?) maybe not
	  	mvMatrix.multiply(cube3d.cornerMatrices[i]);
      si=cube3d.getStickerIndexForPartIndex(cube3d.cornerOffset+i,0);
      this.drawObject(this.stickers[si], mvMatrix, attr.stickersFillColor[si], attr.stickersPhong[si],this.forceColorUpdate);
      mvMatrix.makeIdentity();
      this.cube3d.parts[this.cube3d.cornerOffset+i].transform(mvMatrix);
      mvMatrix.rotate(90,0,1,0); // this should be in rubikscube3d! (?) maybe not
	  	mvMatrix.multiply(cube3d.cornerMatrices[i]);
      si=cube3d.getStickerIndexForPartIndex(cube3d.cornerOffset+i,2);
      this.drawObject(this.stickers[si], mvMatrix, attr.stickersFillColor[si], attr.stickersPhong[si],this.forceColorUpdate);
  }
	//gl.flush();
	this.forceColorUpdate=false;
	
	// The steps above only collect triangles
	// we sort them by depth, and draw them
	var tri = this.deferredFaces.splice(0,this.deferredFaceCount);
	tri.sort(function(a,b){return b.depth - a.depth});
	for (var i in tri) {
	  tri[i].draw(g);
	}
	/*
	g.fillStyle='rgb(0,0,0)';
	g.fillText("faces:"+this.deferredFaceCount,20,20);
	/*
      var interpolator = new SplineInterpolator(0, 1, 1, 0);
      g.strokeStyle='rgb(0,0,0)';
      g.beginPath();
      g.moveTo(0,0);
      for (var value=0;value<=1;value+=0.1) {
      g.lineTo(this.canvas.width*value,this.canvas.height*interpolator.getFraction(value));
      }
      g.stroke();
      
      interpolator = new SplineInterpolator(0, 0, 1, 1);
      g.strokeStyle='rgb(0,0,250)';
      g.beginPath();
      g.moveTo(0,0);
      for (var value=0;value<=1;value+=0.1) {
      g.lineTo(this.canvas.width*value,this.canvas.height*interpolator.getFraction(value));
      }
      g.stroke();*/
	
}

/** Draws an individual object of the scene. */
Cube3D2DCanvas.prototype.drawObject = function(obj, mvMatrix, color, phong, forceColorUpdate) {
  if (obj==null) return;
  if (obj.proxy) {
    if (obj.proxy.loaded) {
      obj.colorObject=obj.proxy.colorObject;
      obj.vertexObject=obj.proxy.vertexObject;
      obj.texCoordObject=obj.proxy.texCoordObject;
      obj.indexObject=obj.proxy.indexObject;
      obj.normalObject=obj.proxy.normalObject;
      obj.numIndices=obj.proxy.numIndices;
      obj.textureArray=obj.proxy.textureArray;
      obj.ctx=obj.proxy.ctx;
      obj.proxy=null;
      obj.loaded=true;
    } else {
      return;
    }
  }
  
  if (! obj.loaded) return;
  
  var g=this.g;
  
  this.mvpMatrix.load(this.viewportMatrix);
  this.mvpMatrix.multiply(this.perspectiveMatrix);
  this.mvpMatrix.multiply(mvMatrix);
  
	// Draw the object
  var mv = this.mvVertexArray;
  mv.load(obj.vertexArray); 
  mv.multVecMatrix(this.mvMatrix);
  
  var mvp = this.mvpVertexArray;
  mvp.load(obj.vertexArray); 
  mvp.multVecMatrix(this.mvpMatrix);
  
  for (var j in obj.groups) {
    var isQuad = obj.groups[j][1] == 6;
    
    if (isQuad) {
      var i=(obj.groups[j][0]);
      var i1 = obj.indexArray[i];
      var i2 = obj.indexArray[i+1];
      var i3 = obj.indexArray[i+2];
      var i4 = obj.indexArray[i+3];
      var n = mvp.rawNormal(i1,i2,i3);
      if (n[2] > 0) {
        var light = Math.max(0,mv.normal(i1,i2,i3).dot(this.lightNormal));
        //g.fillStyle='rgb('+color[0]*light+','+color[1]*light+','+color[2]*light+')';
        var t=this.deferredFaces[this.deferredFaceCount++];
        if (t === undefined) {
          t = new Face();
          this.deferredFaces.push(t);
        }
        t.loadQuad(
          this.computeFillStyle(mv.normal(i1,i2,i3),this.lightNormal,this.observerNormal,phong,color),
          mvp,i1,i2,i3,i4);
      }
    } else {
      for (var k=0; k<obj.groups[j][1]; k+=3 ) {
        var i=(obj.groups[j][0]+k);
        var i1 = obj.indexArray[i];
        var i2 = obj.indexArray[i+1];
        var i3 = obj.indexArray[i+2];
        var n = mvp.rawNormal(i1,i2,i3);
        if (n[2] > 0) {
          //var light = Math.max(0,mv.normal(i1,i2,i3).dot(this.lightNormal));
          //g.fillStyle='rgb('+color[0]*light+','+color[1]*light+','+color[2]*light+')';
          var t=this.deferredFaces[this.deferredFaceCount++];
          if (t === undefined) {
            t = new Face();
            this.deferredFaces.push(t);
          }
          t.loadTriangle(
            this.computeFillStyle(mv.normal(i1,i2,i3),this.lightNormal,this.observerNormal,phong,color),
            mvp,i1,i2,i3);
        }
      }
    }
  }
}

/** @param n J3DIVec3 surface normal
 *  @param wi J3DIVec3 direction to light source (light normal)
 *  @param wo J3DIVec3 direction to observer (observer normal)
 *  @param phong Array with phong parameters: [ambient.0,diffuse.1,specular.2,specularPower.3];
 */
Cube3D2DCanvas.prototype.computeFillStyle = function (n,wi,wo,phong,color) {
  //vec3 wi = normalize(lightPos - fPos.xyz); // direction to light source
  //vec3 wo = normalize(camPos - fPos.xyz); // direction to observer
  //vec3 n = normalize(fNormal.xyz);
  var specular=Math.pow( Math.max(0.0,-(new J3DIVector3(wi).reflect(n).dot(wo))), phong[3])*phong[2];
  var diffuse=Math.max(0.0,wi.dot(n))*phong[1];
  var ambient=phong[0];
  var newColor=new Array(3);
  var fs = 'rgb(';
  for (var i=0;i<3;i++) {
    if (i!=0) fs += ',';
    fs+=Math.round(color[i]*(diffuse+ambient)+255*specular);
  }
  fs += ')';
  return fs;
}


/**
 * Hit test for mouse events.
 */
Cube3D2DCanvas.prototype.mouseIntersectionTest = function(event) {
  // point in raster coordinates
  var rect = this.canvas.getBoundingClientRect();  
  var pRaster=new J3DIVector3(event.clientX - rect.left, event.clientY - rect.top, 0);
  
  // point in camera coordinates
  var pCamera=new J3DIVector3((pRaster[0] - this.width/2)/this.width*2, (pRaster[1] - this.height/2)/-this.height*2, 0);
  
  // point in world coordinates
  var pWorld = new J3DIVector3(pCamera);
  pWorld.multVecMatrix(this.rasterToCameraMatrix);

  // Inverse model-world matrix
  var wmMatrix = new J3DIMatrix4(this.world.matrix);
  wmMatrix.invert();
  
  // point in model coordinates
  var pModel =  new J3DIVector3(pWorld);  
  pModel.multVecMatrix(wmMatrix);
  
  // camera ray in model coordinates
  var ray={point:new J3DIVector3(), dir:new J3DIVector3()};
  ray.point.load(this.camPos);
  ray.point.multVecMatrix(wmMatrix);
  ray.dir.load(pModel);
  ray.dir.subtract(ray.point);
  ray.dir.normalize();
  
  var box={pMin:new J3DIVector3(-this.cubeSize/2,-this.cubeSize/2,-this.cubeSize/2),pMax:new J3DIVector3(this.cubeSize/2,this.cubeSize/2,this.cubeSize/2)};
  var isect = this.intersectBox(ray, box);
  
  if (isect != null) {
    var face=isect.face;
    var u=Math.floor(isect.uv[0]*3);
    var v=Math.floor(isect.uv[1]*3);

    var cube3d=this.cube3d;
    isect.axis=cube3d.boxClickToAxisMap[face][u][v];
    isect.layerMask=cube3d.boxClickToLayerMap[face][u][v];
    isect.angle=cube3d.boxClickToAngleMap[face][u][v];
  }
  
  return isect;
}


