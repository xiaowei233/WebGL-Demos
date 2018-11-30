var gl;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var positionBuffer;
var colorBuffer;
var baseColorBuffer;
var logoColorBuffer;
var fps, fpsInterval, startTime, now, then, elapsed;
var time = 0;
var logoPositionBuffer;
var pointPositionBuffer;
var pointColorBuffer;
var pointSizeBuffer;
var triangleBuffer;
var triangleColorBuffer;
var LargeTriangleBuffer;
var LargeTriangleColorBuffer;

function setMatrixUniforms(translation) {
    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [translation[0], translation[1], translation[2]]);
    mat4.rotate(mvMatrix, mvMatrix, time, [0, 0, 1]);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


//Create different position vertex buffers
function initTriangleBuffers(){
    LargeTriangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, LargeTriangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        3, 5,
        -3, 5,
    ]), gl.STATIC_DRAW);
    // 5.9, 33.7, 47.5
    LargeTriangleColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, LargeTriangleColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.11, 0.38, 0.514, 1,
        0.11, 0.38, 0.514, 1,

        0.11, 0.38, 0.514, 1,

    ]), gl.STATIC_DRAW);

    triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0.15,0.25,
        -0.15,0.25,
    ]), gl.STATIC_DRAW);

    triangleBuffer.itemSize = 2;
    triangleBuffer.numItems = 3;

    triangleColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
    ]), gl.STATIC_DRAW);
    triangleColorBuffer.itemSize = 4;
    triangleColorBuffer.numItems = 3;
}
function initPositionBuffers(length, sqrt3) {
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var sideLength = length;
    var vertices = [
        sideLength, -sideLength * sqrt3,
        -sideLength, -sideLength * sqrt3,
        -2 * sideLength, 0.0,
        -sideLength, sideLength * sqrt3,
        sideLength, sideLength * sqrt3,
        2 * sideLength, 0.0,
    ];
    positionBuffer.itemSize = 2;
    positionBuffer.numItems = 6;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function initLogoPositionBuffers(wave) {
    logoPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, logoPositionBuffer);
    var sideLength = 0.258;
    var sqrt3 = Math.sqrt(2);
    var vertices = [
        sideLength, -sideLength * sqrt3,
        -sideLength, -sideLength * sqrt3,
        -2 * sideLength, 0.0,
        -sideLength, sideLength * sqrt3,
        sideLength, sideLength * sqrt3,
        2 * sideLength, 0.0,
        sideLength, -sideLength * sqrt3,
        -sideLength, -sideLength * sqrt3,
    ];
    logoPositionBuffer.itemSize = 2;
    logoPositionBuffer.numItems = 8;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function initPointerBuffers() {
    pointPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
    var vertex = [
        1.0, 1.0
    ]
    pointPositionBuffer.itemSize = 2;
    pointPositionBuffer.numItems = 1;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);

    pointColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer);
    var cvertex = [
        0.012, 0.259, 0.376, 1.0
    ]
    pointColorBuffer.itemSize = 4;
    pointColorBuffer.numItems = 1;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cvertex), gl.STATIC_DRAW);

    pointSizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Math.random() * 10 + 1), gl.STATIC_DRAW);
    pointSizeBuffer.itemSize = 1;
    pointSizeBuffer.numItems = 1;
}


//Create different color buffers
function initColorBuffers(x, y) {
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var rchange = 1 - 2.268 * (0.02 * x + 0.01 * y) * 0.75;
    var bchange = 1 - (0.02 * x + 0.01 * y) * 0.75;
    var gchange = 1 - 0.375 * (0.02 * x + 0.01 * y) * 0.75;
    var colors = [
        rchange, bchange, gchange, 1.0,
        rchange, bchange, gchange, 1.0,
        rchange, bchange, gchange, 1.0,
        rchange, bchange, gchange, 1.0,
        rchange, bchange, gchange, 1.0,
        rchange, bchange, gchange, 1.0
    ];
    colorBuffer.itemSize = 4;
    colorBuffer.numItems = 6;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
}

/*
********************************************
********************************************
Interpolation color applied for logo
********************************************
********************************************
*/
function initLogoColorBuffers(time) {
    logoColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, logoColorBuffer);
    var change = Math.round(time % 40);
    var colors = [];
    for (i = 0; i < 8; i++) {
        colors = colors.concat([0.051, 0.241, 0.315, 1.0]);
    }
    switch (Math.floor(change / 6)) {
        case 1:
            colors[20] = 0.392; colors[21] = 0.51; colors[22] = 0.565;
            colors[4] = 0.392; colors[5] = 0.51; colors[6] = 0.565;
            colors[0] = colors[1] = colors[2] = 1; break;
        case 2:
            colors[0] = 0.392; colors[1] = 0.51; colors[2] = 0.565;
            colors[8] = 0.392; colors[9] = 0.51; colors[10] = 0.565;
            colors[4] = colors[5] = colors[6] = 1; break;
        case 3:
            colors[12] = 0.392; colors[13] = 0.51; colors[14] = 0.565;
            colors[4] = 0.392; colors[5] = 0.51; colors[6] = 0.565;
            colors[8] = colors[9] = colors[10] = 1; break;
        case 4:
            colors[8] = 0.392; colors[9] = 0.51; colors[10] = 0.565;
            colors[16] = 0.392; colors[17] = 0.51; colors[18] = 0.565;
            colors[12] = colors[13] = colors[14] = 1; break;
        case 5:
            colors[20] = 0.392; colors[21] = 0.51; colors[22] = 0.565;
            colors[12] = 0.392; colors[13] = 0.51; colors[14] = 0.565;
            colors[16] = colors[17] = colors[18] = 1; break;
        default:
            colors[0] = 0.392; colors[1] = 0.51; colors[2] = 0.565;
            colors[16] = 0.392; colors[17] = 0.51; colors[18] = 0.565;
            colors[20] = colors[21] = colors[22] = 1;
    }
    logoColorBuffer.itemSize = 4;
    logoColorBuffer.numItems = 8;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function initBaseColorBuffers(x, y) {
    baseColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, baseColorBuffer);
    var colors = [];
    var change = 0.002*Math.pow(x, 2) + 0.0008*Math.pow(y,2);
    if(change > 1){
        change = 1;
    }
    for (b = 0; b < 6; b++) {
        colors = colors.concat([0.161 +  0.839 * change, 0.184 + 0.816 * change, 0.196 +  0.804 * change, 0.66]);
    }

    baseColorBuffer.itemSize = 4;
    baseColorBuffer.numItems = 6;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
}

//DrawScene method
function drawBGScene(time) {
    requestAnimationFrame(drawBGScene);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        time *= 0.071;
        resize(gl.canvas);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var translation;

        //Create the background, xshift is still not correct
        var wave = Math.round(time % 42);

        var sqrt3 = Math.sqrt(2);
        var length = 0.15;
        var xshift = 0;
        var yshift = 0;
        var flag = false;
        initPositionBuffers(length, sqrt3);
        for (j = 0; j < 50; j += 1) {
            if (j == 0) {
            }
            else if (j % 2 == 0) {
                xshift = j * 3 * length / 2;
            }
            else {
                if (yshift == 0) {
                    yshift = length * sqrt3;
                }
                else {
                    yshift = 0;
                }
                xshift = - (3 * length / 2) - (j * 3 * length / 2);
            }
            for (i = 0; i < 19; i += 1) {
                if (i % 2 == 0) {
                    translation = [xshift, - length * i * sqrt3 + yshift, -7 + 0.000041 * Math.pow(j, 3)];
                    translation[1] -= 0.00071 * Math.pow(i, 2);
                }
                else {
                    translation = [xshift, length * sqrt3 + length * i * sqrt3 + yshift, -7 + 0.000041 * Math.pow(j, 3)];
                    translation[1] += 0.00071 * Math.pow(i, 2);
                }
                var flag = false;
                if (i + j == wave || i + j == (wave + 1)) {
                    translation[2] += 0.2;
                    flag = true;
                    initColorBuffers(i, j);
                }
                else{
                    initBaseColorBuffers(i, j);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                if (!flag) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, baseColorBuffer);
                    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, baseColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
                } else {
                    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
                }
                setMatrixUniforms(translation);
                if (!flag) {
                    //********************************************
                    //********************************************
                    //LINE method
                    //********************************************
                    //********************************************
                    gl.drawArrays(gl.LINE_LOOP, 0, positionBuffer.numItems);
                }
                else {
                    //********************************************
                    //********************************************
                    //FAN method
                    //********************************************
                    //********************************************
                    gl.drawArrays(gl.TRIANGLE_FAN, 0, positionBuffer.numItems);
                }
            }
        }
        // Create center logo block
        translation = [0, 0, -6];
        initLogoPositionBuffers(wave);
        initLogoColorBuffers(time);
        gl.bindBuffer(gl.ARRAY_BUFFER, logoPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, logoPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, logoColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, logoColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        setMatrixUniforms(translation);
        //********************************************
        //********************************************
        //STRIP method
        //********************************************
        //********************************************
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, logoPositionBuffer.numItems);

        //Create point cloud
        initPointerBuffers();
        for (i = 0; i < 300; i++) {
            translation = [-0.17 + (i % 6) / 15, -5 + (i % 100) / 10 + time % 40 / 40, -8];
            if (Math.abs(translation[1]) < 0.4) {
                continue
            }
            if (translation[1] < -0.4 && Math.random() < 0.7) {
                continue;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pointPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pointColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
            gl.vertexAttribPointer(shaderProgram.pointSizeAttribute, pointSizeBuffer.itemSize, gl.FLOAT, false, 0, 0);
            setMatrixUniforms(translation);
            //********************************************
            //********************************************
            //POINT method
            //********************************************
            //********************************************
            gl.drawArrays(gl.POINTS, 0, pointPositionBuffer.numItems);
        }

        // for (i = 0; i < 300; i++) {
        //     translation = [-7 + (i % 6) / 15, -6.5+ (i % 100) / 7.5 + time % 80 / 120, -10];

        //     gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
        //     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pointPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        //     gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer);
        //     gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pointColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        //     gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
        //     gl.vertexAttribPointer(shaderProgram.pointSizeAttribute, pointSizeBuffer.itemSize, gl.FLOAT, false, 0, 0);
        //     setMatrixUniforms(translation);
        //     //********************************************
        //     //********************************************
        //     //POINT method
        //     //********************************************
        //     //********************************************
        //     gl.drawArrays(gl.POINTS, 0, pointPositionBuffer.numItems);
        // }
        //Create triangle arrow
        initTriangleBuffers();
        translation = [0, -0.145, -5.9];
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer)
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleColorBuffer.itemSize, gl.FLOAT, false, 0, 0)
        setMatrixUniforms(translation);
        gl.drawArrays(gl.TRIANGLES, 0, triangleBuffer.numItems);

        translation = [0, -3.3, -37];
        gl.bindBuffer(gl.ARRAY_BUFFER, LargeTriangleBuffer)
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, LargeTriangleColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleColorBuffer.itemSize, gl.FLOAT, false, 0, 0)

        setMatrixUniforms(translation);
        gl.drawArrays(gl.TRIANGLES, 0, triangleBuffer.numItems);

        // for(i = -5; i < 5; i ++){
        // translation = [i*0.8, 2.6, -5];
        // setMatrixUniforms(translation);
        // gl.drawArrays(gl.TRIANGLES, 0, triangleBuffer.numItems);
        // }
    }
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
    initShaders();
    gl.clearColor(22 / 255, 130 / 255, 182 / 255, 1);
    gl.enable(gl.DEPTH_TEST);

    fpsInterval = 1000 / 15;
    then = Date.now();
    startTime = then;
    drawBGScene();
}

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aPosition");
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aColor");
    // shaderProgram.pointSizeAttribute = gl.getAttribLocation(shaderProgram, "aPointSize");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    // gl.enableVertexAttribArray(shaderProgram.pointSizeAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
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

function resize(canvas) {
    var dispHeight = window.innerHeight - 20;
    var dispWidth = window.innerWidth - 20;
    if (dispHeight != canvas.height) {
        canvas.height = dispHeight;
    }
    else if (dispWidth != canvas.width) {
        canvas.width = dispWidth;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}