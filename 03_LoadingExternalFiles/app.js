var gl;
var fps, fpsInterval, startTime, now, then, elapsed;

var sunBuffer;
var planetBuffer = [];
var fieldOfViewRadians = degToRad(60);

var program;
var programInfo;

var lastMoustPosition = [];
var currentMoustPostion = [];
var camTranslation = [0, 10, 700];
var camRotation = [0, 0, 0];
var lastCamRotation = [0, 0, 0];

var loadedTexture = 0;
var sunTexture;
var planetTexture = [];
var earthRotation = 1;
var earthRevolution = 1 / 22;
var sunSize = 100;
var saturnRingTexture;

var planetSize = [
    2.440, 6.052, 6.378, 3.390,
    69.911, 58.232, 25.362, 24.624,
]

var distance = [
    sunSize + 57.9, sunSize + 108.2, sunSize + 149.6, sunSize + 227.9,
    sunSize + 778.3, sunSize + 1427.0, sunSize + 2871.0, sunSize + 4497.1,
]

var rotation = [
    earthRotation / 58.7, - earthRotation / 243,
    earthRotation, earthRotation / 1.026,
    24 * earthRotation / 9.84, 24 * earthRotation / 10.2,
    -24 * earthRotation / 17.9, 24 * earthRotation / 19.1,
]

var revolution = [
    365.26 * earthRevolution / 87.96, 365.26 * earthRevolution / 224.68,
    earthRevolution, 365.26 * earthRevolution / 686.98,
    earthRevolution / 11.862, earthRevolution / 29.456,
    earthRevolution / 84.07, earthRevolution / 164.81
]


$(document).mousedown((event1) => {
    lastMoustPosition = [event1.pageX, event1.pageY];
    $("#webGLcanvas").on("mousemove", (event2) => {
        currentMoustPostion = [event2.pageX, event2.pageY];
        var xDiff = currentMoustPostion[0] - lastMoustPosition[0];
        var yDiff = currentMoustPostion[1] - lastMoustPosition[1];

        camRotation = [- degToRad((xDiff) / 50) + lastCamRotation[0],
        - degToRad((yDiff) / 50) + lastCamRotation[1], 0,
        ];
        var pihalf = Math.PI/2;
    })
}).mouseup(() => {
    lastCamRotation = camRotation;
    $("#webGLcanvas").off();
})


$(() => {
    console.log("Scroll to zoom, drag to rotate.")

    $("#moonEnter").click(() => {
        numMoon = parseInt($("#numMoon").val());
    })

    $("#orbitEnter").click(() => {
        numOrbit = parseInt($("#numOrbit").val());
    })

    $("#track input").click(function(event){
        var currentId = event.currentTarget.id;        
        if($("#" + currentId).prop("checked")){
            $("#track input:checked").prop("checked", false);
            $("#" + currentId).prop("checked", true);
        }else{
            $("#" + currentId).prop("checked", false)

        }
    })

})


// .on("keydown", (event) => {
//     switch (event.keyCode) {
//         case 37: camTranslation[0] -= 20; break;
//         case 39: camTranslation[0] += 20; break;
//         case 38: camTranslation[2] -= 20; break;
//         case 40: camTranslation[2] += 20; break;
//     }
$(document).on("wheel", function (e){
    var change = e.originalEvent.wheelDelta;
    if(change < 0){
        camTranslation[2] += 20;
    }else{
        camTranslation[2] -= 20;

    }
})

function computeMatrix(viewProjectionMatrix, translation, rotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    return m4.zRotate(matrix, rotation[2]);
}







function initSunBuffer() {
    var sRadius = sunSize; var slices = 40; var stacks = 20; var sVertices = [];
    for (t = 0; t < stacks; t++) { // stacks are ELEVATION so they count theta
        var phi1 = ((t) / stacks) * Math.PI;
        var phi2 = ((t + 1) / stacks) * Math.PI;
        for (p = 0; p < slices + 1; p++) { // slices are ORANGE SLICES so 					
            var theta = ((p) / slices) * 2 * Math.PI;
            var xVal = sRadius * Math.cos(theta) * Math.sin(phi1);
            var yVal = sRadius * Math.sin(theta) * Math.sin(phi1);
            var zVal = sRadius * Math.cos(phi1);
            sVertices = sVertices.concat([xVal, yVal, zVal]);

            var xVal = sRadius * Math.cos(theta) * Math.sin(phi2);
            var yVal = sRadius * Math.sin(theta) * Math.sin(phi2);
            var zVal = sRadius * Math.cos(phi2);
            sVertices = sVertices.concat([xVal, yVal, zVal]);

        }
    }
    sunBuffer = {
        vertex: gl.createBuffer(),
        texture: gl.createBuffer(),
        u_matrix: m4.identity(),
        translation: [0, 5, 0],
        selfRotation: 1 / 24 * earthRotation,
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, sunBuffer.vertex);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sVertices), gl.STATIC_DRAW);
    sunBuffer.vertex.itemSize = 3;
    sunBuffer.vertex.numItems = stacks * (slices + 1) * 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var textureCoords = [];
    for (t = 0; t < stacks; t++) {
        var phi1 = ((t) / stacks);
        var phi2 = ((t + 1) / stacks);
        for (p = 0; p < slices + 1; p++) {
            var theta = 1 - ((p) / slices);
            textureCoords = textureCoords.concat([theta, phi1]);
            textureCoords = textureCoords.concat([theta, phi2]);
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, sunBuffer.texture);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    sunBuffer.texture.itemSize = 2;
    sunBuffer.texture.numItems = stacks * (slices + 1) * 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function initPlanetBuffer() {
    for (var i = 0; i < 8; i++) {

        var sRadius = planetSize[i];
        var angle = Math.random() * Math.PI * 2;
        var x = Math.cos(angle) * distance[i];
        var z = Math.sin(angle) * distance[i];
        planetBuffer[i] = {
            vertex: gl.createBuffer(),
            texture: gl.createBuffer(),
            u_matrix: m4.identity(),
            translation: [x, 0, z],
            revolution: revolution[i],
            rotation: rotation[i],
        }

        if (i == 1 || i == 6) {
            planetBuffer[i].rotation = - planetBuffer[i].rotation;
        }
        var slices = 32; var stacks = 16; var sVertices = []; var count = 0;
        for (t = 0; t < stacks; t++) { // stacks are ELEVATION so they count theta
            var phi1 = ((t) / stacks) * Math.PI;
            var phi2 = ((t + 1) / stacks) * Math.PI;
            for (p = 0; p < slices + 1; p++) { // slices are ORANGE SLICES so 					
                var theta = ((p) / slices) * 2 * Math.PI;
                var xVal = sRadius * Math.cos(theta) * Math.sin(phi1);
                var yVal = sRadius * Math.sin(theta) * Math.sin(phi1);
                var zVal = sRadius * Math.cos(phi1);
                sVertices = sVertices.concat([xVal, yVal, zVal]);
                count++;
                var xVal = sRadius * Math.cos(theta) * Math.sin(phi2);
                var yVal = sRadius * Math.sin(theta) * Math.sin(phi2);
                var zVal = sRadius * Math.cos(phi2);
                sVertices = sVertices.concat([xVal, yVal, zVal]);
                count++;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, planetBuffer[i].vertex);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sVertices), gl.STATIC_DRAW);
        planetBuffer[i].vertex.itemSize = 3;
        planetBuffer[i].vertex.numItems = stacks * (slices + 1) * 2;
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        var textureCoords = [];
        for (t = 0; t < stacks; t++) {
            var phi1 = ((t) / stacks);
            var phi2 = ((t + 1) / stacks);
            for (p = 0; p < slices + 1; p++) {
                var theta = 1 - ((p) / slices);
                textureCoords = textureCoords.concat([theta, phi1]);
                textureCoords = textureCoords.concat([theta, phi2]);
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, planetBuffer[i].texture);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        planetBuffer[i].texture.itemSize = 2;
        planetBuffer[i].texture.numItems = stacks * (slices + 1) * 2;
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        //SATURN RING
        if(i == 5){
            planetBuffer[i].ring = {
                vertex: gl.createBuffer(),
                texture: gl.createBuffer(),
                translation: planetBuffer[i].translation,
            }
            var ringVertex = [];
            for(var j = 0; j<=360; j++){
                var circleVertex = [
                    Math.sin(degToRad(j)) * 140.210,
                    0,
                    Math.cos(degToRad(j)) * 140.210,
                ]
                var holeVertex = [
                    Math.sin(degToRad(j)) * 67,
                    0,
                    Math.cos(degToRad(j)) * 67,
                ]
                ringVertex = ringVertex.concat(circleVertex);
                ringVertex = ringVertex.concat(holeVertex);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, planetBuffer[i].ring.vertex);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringVertex), gl.STATIC_DRAW);
            planetBuffer[i].ring.vertex.itemSize = 2;
            planetBuffer[i].ring.vertex.numItems = ringVertex.length / 2;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            var textureCoords = [];
            for (var j = 0; j < 360; j++) {
                textureCoords.concat();
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, planetBuffer[i].ring.texture);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
            planetBuffer[i].texture.itemSize = 2;
            planetBuffer[i].texture.numItems = ringVertex.length /2;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }
}







function initTexture() {
    sunTexture = gl.createTexture();
    sunTexture.image = new Image();
    var url = $("#sun").prop("src");
    sunTexture.image.onload = function () {
        loadedTexture += 1;
        handleLoadedTexture(sunTexture);
    }
    sunTexture.image.src = url;

    for (var i = 0; i < 8; i++) {
        (function (i) {
            planetTexture[i] = gl.createTexture();
            planetTexture[i].image = new Image();
            url = $("#planet" + i).prop("src");
            planetTexture[i].image.onload = function () {
                loadedTexture += 1;
                handleLoadedTexture(planetTexture[i]);
            };
            planetTexture[i].image.src = url;
        })(i);
    }

    saturnRingTexture = gl.createTexture();
    saturnRingTexture.image = new Image();
    url = $("#saturnRing").prop("src");
    saturnRingTexture.image.onload = function () {
        loadedTexture += 1;
        handleLoadedTexture(saturnRingTexture);
    }
    saturnRingTexture.image.src = url;
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}



/**
 * **************************************************
 * 
 *          DRAW THE SCENE
 * 
 * **************************************************
 */
function drawBGScene() {
    var time = 0.002 * now;
    var id = parseInt($("#track input:checked").prop("id")) - 10;
    var fPosition;
    if (id == -1) {
        fPosition = [0, 0, 0];
    } else if (id >= 0 && id <= 7) {
        fPosition = [Math.sin(time * planetBuffer[id].revolution) * distance[id], 0,
        Math.cos(time * planetBuffer[id].revolution) * distance[id]];
    } else {
        fPosition = [0,1000, -200];
        camRotation[1] = 270;
    }

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 20000);

    // Use matrix math to compute a position on a circle where
    // the camera is
    
    var cameraMatrix = m4.identity();

    cameraMatrix = m4.yRotate(cameraMatrix, camRotation[0]);
    cameraMatrix = m4.xRotate(cameraMatrix, camRotation[1]);
    cameraMatrix = m4.translate(cameraMatrix, fPosition[0], fPosition[1], fPosition[2] + 200 + camTranslation[2]);

    // Get the camera's postion from the matrix we computed
    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];
    var up = [0, 1, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);


    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, sunBuffer.vertex);
    gl.vertexAttribPointer(program.positionLocation, sunBuffer.vertex.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sunBuffer.texture);
    gl.vertexAttribPointer(program.textureLocation, sunBuffer.texture.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sunBuffer.normal);
    gl.vertexAttribPointer(program.normalLocation, sunBuffer.normal.itemSize, gl.FLOAT, flase, 0,0);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(gl.TEXTURE_2D, sunTexture);
    gl.uniform1i(program.samplerLocation, 0);
    var rotation = [degToRad(90), 0, - sunBuffer.selfRotation * time];
    sunBuffer.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sunBuffer.translation,
        rotation,
    );


    gl.uniformMatrix4fv(program.matrixLocation, false, sunBuffer.u_matrix);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, sunBuffer.vertex.numItems);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // var i = 0;
    // planetBuffer.forEach((planet) => {
    //     j = i + 10;
    //     if ($("#" + i).prop("checked")) {
    //         $("#" + j).removeAttr("disabled");
    //         gl.useProgram(program);

    //         gl.bindBuffer(gl.ARRAY_BUFFER, planet.vertex);
    //         gl.vertexAttribPointer(program.positionLocation, planet.vertex.itemSize, gl.FLOAT, false, 0, 0);
    //         gl.bindBuffer(gl.ARRAY_BUFFER, planet.texture);
    //         gl.vertexAttribPointer(program.textureLocation, planet.texture.itemSize, gl.FLOAT, false, 0, 0);

    //         gl.activeTexture(gl.TEXTURE0);
    //         gl.bindTexture(gl.TEXTURE_2D, planetTexture[i]);
    //         gl.uniform1i(program.samplerLocation, 0);

    //         var translation = [Math.sin(time * planet.revolution) * distance[i], 0,
    //         Math.cos(time * planet.revolution) * distance[i],
    //         ];
    //         var rotation = [degToRad(90), 0, -planet.rotation * time];
    //         planet.u_matrix = computeMatrix(
    //             viewProjectionMatrix,
    //             translation,
    //             rotation,
    //         );
    //         gl.uniformMatrix4fv(program.matrixLocation, false, planet.u_matrix);

    //         gl.drawArrays(gl.TRIANGLE_STRIP, 0, planet.vertex.numItems);
    //         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    //     } else {
    //         $("#" + j).attr("disabled", true);
    //         if ($("#" + j).prop("checked")) {
    //             $("#" + j).prop("checked", false);
    //             $("#9").prop("checked", true);
    //         }
    //     }
    //     i += 1;
    // });



    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    /////////////////////                              /////////////////////////
    //////////////////////DIDNT HAVE TIME FOR SATURN RING///////////////////////
    //////////////////////                              ////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    // gl.useProgram(program);
    // console.log(planetBuffer[5].ring.texture.itemSize)

    // gl.bindBuffer(gl.ARRAY_BUFFER, planetBuffer[5].ring.vertex);
    // gl.vertexAttribPointer(program.positionLocation, planetBuffer[5].ring.vertex.itemSize, gl.FLOAT, false, 0, 0);
    // gl.bindBuffer(gl.ARRAY_BUFFER, planetBuffer[5].ring.texture);
    // gl.vertexAttribPointer(program.textureLocation,  2, gl.FLOAT, false, 0, 0);

    // gl.activeTexture(gl.TEXTURE0);

    // gl.bindTexture(gl.TEXTURE_2D, saturnRingTexture);
    // gl.uniform1i(program.samplerLocation, 0);
    // var rotation = [degToRad(90), 0, - sunBuffer.selfRotation * time];
    // var u_matrix = computeMatrix(
    //     viewProjectionMatrix,
    //     sunBuffer.translation,
    //     rotation,
    // );

    // gl.uniformMatrix4fv(program.matrixLocation, false, u_matrix);
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, planetBuffer[5].ring.vertex.numItems);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
    canvas.height = Math.floor(window.innerHeight - 0.2 * window.innerHeight);
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("cannot initialize webGL");
    }

    programInfo = webglUtils.createProgramInfo(gl, ["shader-vs", "shader-fs"]);
    program = programInfo.program;
    program.positionLocation = gl.getAttribLocation(program, "a_position");
    program.textureLocation = gl.getAttribLocation(program, "a_textureCoord");
    program.matrixLocation = gl.getUniformLocation(program, "u_matrix");
    program.samplerLocation = gl.getUniformLocation(program, "u_texture");
    program.useLightUniform = gl.getUniformLocation(program, "u_useLighting");
    program.directionalColorUniform = gl.getUniformLocation(program, "u_directionalColor")
    program.lightDirectionUniform = gl.getUniformLocation(program, "u_lightingDirection")
    program.ambientColor = gl.getUniformLocation(program, "u_ambientColor")

    program.normalLocation = gl.getAttribLocation(program, "a_normal");
    gl.enableVertexAttribArray(program.normalLocation);
    gl.enableVertexAttribArray(program.positionLocation);
    gl.enableVertexAttribArray(program.textureLocation);


    //  gl.clearColor(1, 1,1, 1);
    gl.clearColor(0.08, 0.08, 0.08, 1);
    gl.enable(gl.DEPTH_TEST);

    fpsInterval = 1000 / 15;
    then = Date.now();
    startTime = then;

    initTexture();
    initSunBuffer();
    initPlanetBuffer();


    animate();
}

function animate() {
    requestAnimationFrame(animate);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        resize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (loadedTexture == 10) {
            drawBGScene();
        }
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

function emod(x, n) {
    return x >= 0 ? (x % n) : ((n - (-x % n)) % n);
};

function resize(canvas) {
    var dispHeight = Math.floor(window.innerHeight - 0.2 * window.innerHeight);
    var dispWidth = window.innerWidth - 20;
    if (dispHeight != canvas.height) {
        canvas.height = dispHeight;
    }
    else if (dispWidth != canvas.width) {
        canvas.width = dispWidth;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}

function trackBody(cameraPosition, target, up) {
    var zAxis = normalize(
        subtractVectors(cameraPosition, target));
    var xAxis = cross(up, zAxis);
    var yAxis = cross(zAxis, xAxis);

    return [
        xAxis[0], xAxis[1], xAxis[2], 0,
        yAxis[0], yAxis[1], yAxis[2], 0,
        zAxis[0], zAxis[1], zAxis[2], 0,
        cameraPosition[0],
        cameraPosition[1],
        cameraPosition[2],
        1,
    ];
}

function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]];
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    } else {
        return [0, 0, 0];
    }
}