//variables for setting up animation
var fps, fpsInterval, startTime, now, then, elapsed;
//variables for gl basics
var gl;
var fragprogram;
var vertprogram;
var currentProgram;
var canvas;
//variables for uniform
var pointLightColor;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var normalMatrix = mat3.create();
var lightingDirection;
var pointLightPos = [];
var numPtLights;
var pointLightRot = 0;
var pointLightRotSpeed = .5;
var numSpheres = 0;
var sphereCenters = [];
var numBounces = 0;
//variabls for camera control
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var posXelement;	var posYelement;	var posZelement;
var posXnode;	var posYnode;	var posZnode;
var rotXelement;	var rotYelement;	var rotZelement;
var rotXnode;	var rotYnode;	var rotZnode;
var xPos = 0;	var yPos = 0;	var zPos = 0;
var xRot = 0;	var yRot = 0;	var zRot = 0;
var xSpeed = 30;
//variabls for spheres
var sphereVertexPosBuffer;
var sphereVertexTextureCoordBuffer;
var sphereVertexNormalBuffer;
var sRadius = 10;
var slices = 100;
var stacks = 50;
var sVertices = [];
var sNormals = [];
var textureCoords = [];
//variabls for the fullscreen triangles
var backgroundBuf;
var cornerVertexPosBuffer;

/*********************
 * HANDLE K/M INPUT 
 *********************
 */
var currentlyPressedKeys = {};
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
    if (currentlyPressedKeys[37]) {
        // left arrow
        xPos += .2;
    }
    if (currentlyPressedKeys[39]) {
        // right arrow
        xPos -= .2;
    }
    if (currentlyPressedKeys[40]) {
        // down arrow
        yPos += .2;
    }
    if (currentlyPressedKeys[38]) {
        // up arrow
        yPos -= .2;
    }
    if (currentlyPressedKeys[82]) {
        // up arrow
        xPos = 0;
        yPos = 0;
    }
}


var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var mouseRotMatrix = mat4.create();
mat4.identity(mouseRotMatrix);

    function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    var newRotationMatrix = mat4.create();
    mat4.identity(newRotationMatrix);
    mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

    var deltaY = newY - lastMouseY;
    mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

    
    mat4.multiply(mouseRotMatrix, newRotationMatrix, mouseRotMatrix);
    lastMouseX = newX
    lastMouseY = newY;

    setMatrixUniforms();
}

/**
 * **************************************************
 * 
 *          DRAW THE SCENE
 * 
 * **************************************************
 */
function drawBGScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    gl.useProgram(currentProgram);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [xPos, yPos, -6.0]);

    mat4.multiply(mvMatrix, mvMatrix, mouseRotMatrix);

    setMatrixUniforms();

    var cameraTo = vec3.create();
    vec3.set(cameraTo, 0.0, 0.0, 0.0);
    var cameraFrom = vec3.create();
    vec3.set(cameraFrom, 0.0, 0.0, 1.0);
    var cameraDirection = vec3.create();
    vec3.set(cameraDirection, 0.0, 0.0, -1.0);
    var up = vec3.create();
    vec3.set(up, 0.0, 1.0, 0.0);

    var cameraLeft = vec3.create();
    vec3.cross(cameraLeft, cameraDirection, up);
    vec3.normalize(cameraLeft, cameraLeft);

    var cameraUp = vec3.create();
    vec3.cross(cameraUp, cameraLeft, cameraDirection);
    vec3.normalize(cameraUp, cameraUp);

    var cameraCenter = vec3.create();
    vec3.add(cameraCenter, cameraFrom, cameraDirection);


    var ratio = gl.viewportWidth / gl.viewportHeight;
    
    var cameraTopLeft = vec3.create();
    var cameraBottomLeft = vec3.create();
    var cameraTopRight = vec3.create();
    var cameraBottomRight = vec3.create();
    var screenTopLeft = vec3.create();
    var screenBottomLeft = vec3.create();
    var screenTopRight = vec3.create();
    var screenBottomRight = vec3.create();
    
    vec3.set(cameraTopLeft,     -1.0, 1.0, 0.0);
    vec3.set(cameraBottomLeft,  -1.0,-1.0, 0.0);
    vec3.set(cameraTopRight,     1.0, 1.0, 0.0);
    vec3.set(cameraBottomRight,  1.0,-1.0, 0.0);

    vec3.set(screenTopLeft,     -ratio, 1.0, 0.0);
    vec3.set(screenBottomLeft,  -ratio,-1.0, 0.0);
    vec3.set(screenTopRight,     ratio, 1.0, 0.0);
    vec3.set(screenBottomRight,  ratio,-1.0, 0.0);

    var corners = [];
    corners.push(cameraTopRight[0]);		corners.push(cameraTopRight[1]);		corners.push(cameraTopRight[2]);
    corners.push(cameraTopLeft[0]);		corners.push(cameraTopLeft[1]);		corners.push(cameraTopLeft[2]);		
    corners.push(cameraBottomRight[0]);	corners.push(cameraBottomRight[1]);	corners.push(cameraBottomRight[2]);
    corners.push(cameraBottomLeft[0]);		corners.push(cameraBottomLeft[1]);		corners.push(cameraBottomLeft[2]);

    var screenCorners = [];
    screenCorners.push(screenTopRight[0]);		screenCorners.push(screenTopRight[1]);		screenCorners.push(screenTopRight[2]);
    screenCorners.push(screenTopLeft[0]);		screenCorners.push(screenTopLeft[1]);		screenCorners.push(screenTopLeft[2]);		
    screenCorners.push(screenBottomRight[0]);	screenCorners.push(screenBottomRight[1]);	screenCorners.push(screenBottomRight[2]);
    screenCorners.push(screenBottomLeft[0]);	screenCorners.push(screenBottomLeft[1]);	screenCorners.push(screenBottomLeft[2]);

    var plotPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plotPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), this.gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    plotPositionBuffer.itemSize = 3;
    plotPositionBuffer.numItems = 4;

    var cornerPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenCorners), this.gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    cornerPositionBuffer.itemSize = 3;
    cornerPositionBuffer.numItems = 4;

    gl.bindBuffer(gl.ARRAY_BUFFER, plotPositionBuffer);
    gl.vertexAttribPointer(currentProgram.vertexPositionALocation, cornerPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerPositionBuffer);
    gl.vertexAttribPointer(currentProgram.plotPositionALocation, plotPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, cornerPositionBuffer.numItems);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}





/*
********************************************
********************************************
    NO NEED TO EDIT
********************************************
********************************************
*/
function initGL() {
    var canvas = document.getElementById("webGLcanvas");
    canvas.width = window.innerWidth - 30;
    canvas.height = Math.floor(window.innerHeight - 0.25 * window.innerHeight);
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("cannot initialize webGL");
    }

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    // fragprogram = initShaders("perfrag-shader-fs", "perfrag-shader-vs");
    vertprogram = initShaders("shader-fs", "shader-vs");
    currentProgram = vertprogram;
    gl.clearColor(0.13, 0.13, 0.13, 1);
    gl.enable(gl.DEPTH_TEST);

    fpsInterval = 1000 / 15;
    then = Date.now();
    startTime = then;
    // initBuffer();
    cornerVertexPosBuffer = gl.createBuffer();
    pointLightPos = [
        rand(-3, 7),rand(-3, 7),rand(-3, 7),
        rand(-3, 7),rand(-3, 7),rand(-3, 7),
        rand(-3, 7),rand(-3, 7),rand(-3, 7),
        rand(-3, 7),rand(-3, 7),rand(-3, 7),
        rand(-3, 7),rand(-3, 7),rand(-3, 7),
    ];
    pointLightColor = [
        rand(0, 0.5),rand(0.4, 1),rand(0.4, 1),
        rand(0.4, 1),rand(0.4, 1),rand(0, 0.5),
        rand(0.4, 1),rand(0.4, 1),rand(0.4, 1),
        rand(0, 0.5),rand(0, 0.5),rand(0, 0.5),
        rand(0.4, 1),rand(0, 0.5),rand(0.4, 1),
    ];
    
    numPtLights = 5;

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        resize(gl.canvas);

        handleKeys();
        drawBGScene();
    }
}

window.requestAnimFrame = (function () {
    return
    window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (FrameRequestCallback, DOMElement) {
            window.setTimeout(callback, 1000 / 60);
        };
}
)();

function degToRad(d) {
    return d * Math.PI / 180;
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function rand(min, max, thresh) {
    if (thresh > 0) {
        while (true) {
            var a = Math.random() * (max - min) + min;
            if (a < thresh && a > -thresh) {
                continue
            }
            return a
        }
    } else {
        while (true) {
            var a = Math.random() * (max - min) + min;
            let mid = (max - min) / 2
            if (a > mid + thresh && a < mid - thresh) {
                continue
            }
            return a;
        }
    }

}

function resize(canvas) {
    var dispHeight = Math.floor(window.innerHeight - 0.25 * window.innerHeight);
    var dispWidth = window.innerWidth - 30;
    if (dispHeight != canvas.height) {
        canvas.height = dispHeight;
    }
    else if (dispWidth != canvas.width) {
        canvas.width = dispWidth;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(currentProgram.uPMatrixULocation, false, pMatrix);
    gl.uniformMatrix4fv(currentProgram.uMVMatrixULocation, false, mvMatrix);

    mat3.fromMat4(normalMatrix, mvMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix,normalMatrix);
    gl.uniformMatrix3fv(currentProgram.uNMatrixULocation, false, normalMatrix);
    
    var rval; var gval; var bval;
    if(document.getElementById("ambientR").value.length == 0){rval = 0;}
    else{rval = parseFloat(document.getElementById("ambientR").value)}
    if(document.getElementById("ambientG").value.length == 0){gval = 0;}
    else{gval = parseFloat(document.getElementById("ambientG").value)}
    if(document.getElementById("ambientB").value.length == 0){bval = 0;}
    else{bval = parseFloat(document.getElementById("ambientB").value)}
    gl.uniform3f( currentProgram.ambientColorULocation, rval, gval, bval );

    if(document.getElementById("lightDirectionX").value.length == 0){rval = 0;}
    else{rval = parseFloat(document.getElementById("lightDirectionX").value)}
    if(document.getElementById("lightDirectionY").value.length == 0){gval = 0;}
    else{gval = parseFloat(document.getElementById("lightDirectionY").value)}
    if(document.getElementById("lightDirectionZ").value.length == 0){bval = 0;}
    else{bval = parseFloat(document.getElementById("lightDirectionZ").value)}
    lightingDirection = [rval, gval, bval];

    var adjustedLD = vec3.create();
    var adjustedLD2 = vec3.create();
    vec3.normalize(adjustedLD, lightingDirection);
    
    vec3.transformMat4(adjustedLD2, adjustedLD, mouseRotMatrix);
    vec3.scale(adjustedLD2, adjustedLD2, -3);
    gl.uniform3fv(currentProgram.directionalLightDirectionULocation, adjustedLD2);

    if(document.getElementById("directionalR").value.length <= 0){rval = 0;}
    else{rval = parseFloat(document.getElementById("directionalR").value)}
    if(document.getElementById("directionalG").value.length <= 0){gval = 0;}
    else { gval = parseFloat(document.getElementById("directionalG").value) }
    if (document.getElementById("directionalB").value.length <= 0) { bval = 0; }
    else { bval = parseFloat(document.getElementById("directionalB").value) }
    gl.uniform3f(currentProgram.directionalColorULocation, rval, gval, bval);

    if (document.getElementById("numSpheresField").value.length == 0) { numSpheres = 0; }
    else { numSpheres = parseFloat(document.getElementById("numSpheresField").value); }
    gl.uniform1i(currentProgram.numSphereULocation, numSpheres);

    if (document.getElementById("numBouncesField").value.length == 0) { numBounces = 0; }
    else { numBounces = parseFloat(document.getElementById("numBouncesField").value); }
    gl.uniform1i(currentProgram.numBounceULocation, numBounces);

    var point1 = $("#2").prop("checked");

    var point2 = $("#3").prop("checked");

    var point3 = $("#4").prop("checked");
    var point4 = $("#5").prop("checked");
    var point5 = $("#6").prop("checked");
    gl.uniform1i(currentProgram.usePointLight1Uniform, point1);
    gl.uniform1i(currentProgram.usePointLight2Uniform, point2);
    gl.uniform1i(currentProgram.usePointLight3Uniform, point3);
    gl.uniform1i(currentProgram.usePointLight4Uniform, point4);
    gl.uniform1i(currentProgram.usePointLight5Uniform, point5);

    var shine = [];
    shine[0] = $("#11").val();
    shine[1] = $("#12").val();
    if(shine[0] < 1){
        shine[0] = 0.00001;
    }

    gl.uniform1f(currentProgram.materialShineUniform, shine[0]);
    gl.uniform1f(currentProgram.materialSpecuUniform, shine[1]);



    var spheres = [];
    var cubeSize = Math.floor(Math.cbrt(numSpheres));
    var squareSize = Math.pow(cubeSize, 2);

    spheres.push(0.0); spheres.push(0.0); spheres.push(0.0);
    spheres.push(0.0); spheres.push(3.0); spheres.push(0.0);
    spheres.push(0.0); spheres.push(-3.0); spheres.push(0.0);
    spheres.push(3.0); spheres.push(-3.0); spheres.push(0.0);
    spheres.push(-3.0); spheres.push(3.0); spheres.push(0.0);
    spheres.push(3.0); spheres.push(3.0); spheres.push(0.0);
    spheres.push(-3.0); spheres.push(-3.0); spheres.push(0.0);
    spheres.push(-3.0); spheres.push(0.0); spheres.push(0.0);
    spheres.push(3.0); spheres.push(0.0); spheres.push(0.0);
    spheres.push(0.0); spheres.push(0.0); spheres.push(3.0);
    gl.uniform3fv(currentProgram.sphereCenterArrayULocation, new Float32Array(spheres));

    var temp = new Float32Array(pointLightPos)
    gl.uniform3fv(currentProgram.pointLightPosArrayULocation, temp);

    var temp2 = new Float32Array(pointLightColor);
    gl.uniform3fv(currentProgram.pointLightColorArrayULocation, temp2);
    
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders(id1, id2) {
    var fragmentShader = getShader(gl, id1);
    var vertexShader = getShader(gl, id2);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(program);

    //Attribute for vertex shader
    program.vertexPositionALocation = gl.getAttribLocation(program, "aVertexPosition");
    program.plotPositionALocation = gl.getAttribLocation(program, "aPlotPosition");
    gl.enableVertexAttribArray(program.vertexPositionALocation);
    gl.enableVertexAttribArray(program.plotPositionALocation);
    //Uniform for vertex shader
    program.uPMatrixULocation = gl.getUniformLocation(program, "uPMatrix");

    //Attribute for fragment shader
    //Uniform for fragment shader
    program.numSphereULocation = gl.getUniformLocation(program, "uNumSpheres");
    program.sphereCenterArrayULocation = gl.getUniformLocation(program, "uSphereCenters");
    program.numBounceULocation = gl.getUniformLocation(program, "uNumBounces");
    // program.usePointLightULocation = gl.getUniformLocation(program, "pointLight");
    program.pointLightPosArrayULocation = gl.getUniformLocation(program, "uPtLightPos");
    program.pointLightColorArrayULocation = gl.getUniformLocation(program, "uPtLightColor");

    program.ambientColorULocation =  gl.getUniformLocation(program, "uAmbientColor");
    program.directionalColorULocation = gl.getUniformLocation(program, "uDirectionalColor");
    program.directionalLightDirectionULocation = gl.getUniformLocation(program, "uLightingDirection");
    program.uMVMatrixULocation = gl.getUniformLocation(program, "uMVMatrix");
    program.uNMatrixULocation = gl.getUniformLocation(program, "uNMatrix");

    program.usePointLight1Uniform = gl.getUniformLocation(program, "u_usePointLight1");
    program.usePointLight2Uniform = gl.getUniformLocation(program, "u_usePointLight2");
    program.usePointLight3Uniform = gl.getUniformLocation(program, "u_usePointLight3");
    program.usePointLight4Uniform = gl.getUniformLocation(program, "u_usePointLight4");
    program.usePointLight5Uniform = gl.getUniformLocation(program, "u_usePointLight5");

    program.materialSpecuUniform = gl.getUniformLocation(program, "u_materialSpecu");
    program.materialShineUniform = gl.getUniformLocation(program, "u_materialShine");

    return program;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}