var gl;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var uMatrix = mat4.create();
var positionBuffer;
/*
DrawScene for background
DrawObject for center
DrawLogo for frame
*/

function setMatrixUniforms(){
    gl.uniform2f(shaderProgram.uResolution, gl.canvas.width, gl.canvas.height);
    // gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    // gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, uMatrix);
}
function initBuffers(length) {
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var sqrt3 = Math.sqrt(3);
    var sideLength = length;
    var vertices = [
        sideLength, -sideLength * sqrt3,
        -sideLength, -sideLength * sqrt3,
        -2 * sideLength, 0.0,
        -sideLength, sideLength * sqrt3,
        sideLength, sideLength * sqrt3,
        2 * sideLength, 0.0,
    ];
    var count = 6;
    positionBuffer.itemSize = 3;
    positionBuffer.numItems = count;
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function drawBGScene(time) {
    time *= 0.0005;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(uMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.identity(uMatrix);
    mat4.translate(uMatrix, uMatrix, [0, 0, -10.0]);

    initBuffers(100);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();

    gl.drawArrays(gl.LINE_LOOP, 0, positionBuffer.numItems);

    initBuffers(0.9);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, positionBuffer.numItems);
}

function initGL(){
    var canvas = document.getElementById("webGLcanvas");
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("cannot initialize webGL");
    }

    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.clearColor(106 / 255, 131 / 255, 114 / 255, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    // shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMatrix");
    shaderProgram.uResolution = gl.getUniformLocation(shaderProgram, "uResolution");
    drawBGScene();
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) return null;
    var k = shaderScript.firstChild;
    var str = "";
    while (k) {
        if (k.nodeType == 3) str += k.textContent;
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