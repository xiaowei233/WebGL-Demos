var gl;
var fps, fpsInterval, startTime, now, then, elapsed;

var sphereBufferCenter = [];
var fieldOfViewRadians = degToRad(60);
var baseHue = rand(0, 300);

var G = 6.67408 * Math.pow(10, -11);
var sphereBufferOrbit = [];
var sphereBufferMoon = [];
var programInfo;

var lastMoustPosition = [];
var currentMoustPostion = [];
var camTranslation = [0, 10, 0];
var camRotation = [0, 0, 0];
var lastCamRotation = [0, 0, 0];

var numOrbit = 9;
var numMoon = 5;
var lastCheckNumMoon = 5;

//THIS CODE CONTAINS NO PHYSICS
//ALL MOVEMENTS ARE MOCKED TO LOOK LIKE OBEYING LAY OF GRAVITY


/**
 * **************************************************
 * 
 * 
 *          SET UP EVENT LISTENER
 * 
 * 
 * **************************************************
 */
$(document).mousedown((event1) => {
    lastMoustPosition = [event1.pageX, event1.pageY];
    $("#webGLcanvas").on("mousemove", (event2) => {
        currentMoustPostion = [event2.pageX, event2.pageY];
        camRotation = [degToRad((currentMoustPostion[1] - lastMoustPosition[1]) / 50) + lastCamRotation[0],
        degToRad((currentMoustPostion[0] - lastMoustPosition[0]) / 50) + lastCamRotation[1], 0,
        ];

    })
}).mouseup(() => {
    lastCamRotation = camRotation;
    $("#webGLcanvas").off();
})

$(() => {
    $("#moonEnter").click(() => {
        numMoon = parseInt($("#numMoon").val());
    })

    $("#orbitEnter").click(() => {
        numOrbit = parseInt($("#numOrbit").val());
    })
})

$(document).on("keydown", (event) => {
    switch (event.keyCode) {
        case 37: camTranslation[0] -= 2; break;
        case 39: camTranslation[0] += 2; break;
        case 38: camTranslation[2] -= 2; break;
        case 40: camTranslation[2] += 2; break;
    }
})

/**
 * **************************************************
 * 
 * 
 *            SET UP FUNCTIOSN FOR SHAPES
 * 
 * 
 * **************************************************
 */
function computeMatrix(viewProjectionMatrix, translation, rotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    return m4.zRotate(matrix, rotation[2]);
}

function generateCenterBuffers() {
    var numSun = Math.round(Math.random()) + 1;
    console.log(numSun)
    for (i = 0; i < numSun; i++) {
        let size = Math.floor(Math.random() * 2 + 10);
        sphereBufferCenter.push({
            programInfo: programInfo,
            bufferInfo: createFlattenedVertices(gl, primitives.createSphereVertices(size, 20, 10)),
            uniforms: {
                u_colorMult: chroma.hsv(emod(42 + rand(80, 90), 360), rand(0, 1), 1).gl(),
                u_matrix: m4.identity(),
            },
            mass: rand(2, 4) * Math.pow(10, 30),
            translation: [rand(-25, 25), rand(-10, 10), rand(-150, -120)],
            xRotationSpeed: rand(0.08, 0.12),
            yRotationSpeed: rand(0.08, 0.12),
            zRotationSpeed: rand(0.08, 0.12),
            translationA: rand(0, 180),
            tranalarionB: rand(0.9, 1),
        });
    }
}
/**
 * **************************************
 * **************************************  
 *  FAILED
 *  TO
 *  MOCK
 *  TWO-BODY
 *  SYSTEM
 *  INTERACTION
 */
// function computeCenter(obj1, obj2, viewProjectionMatrix, time) {
//     var xdiff = obj1.translation[0] - obj2.translation[0];
//     var zdiff = obj1.translation[2] - obj2.translation[2];

//     rotation1 = [0, obj1.yRotationSpeed * time, 0];
//     rotation2 = [0, obj2.yRotationSpeed * time, 0];


//     var shift1 = obj1.translationA;
//     var shift2 = obj2.translationA;
//     console.log(Math.sin(time + shift1))
//     var translation = [];
//     translation[0] = Math.abs(xdiff)/2 * Math.sin((time+ shift1)) + obj1.translation[0] + xdiff
//     translation[1] = 0
//     translation[2] = Math.abs(zdiff)/2 * Math.cos((time+ shift1)) + obj1.translation[2] + zdiff
//     obj1.uniforms.u_matrix = computeMatrix(
//         viewProjectionMatrix,
//         translation,
//         rotation1,
//     )
//     translation[0] = Math.abs(xdiff)/2 * Math.cos((time+ shift1 - degToRad(90))) + obj2.translation[0]+ xdiff
//     translation[1] = 0
//     translation[2] = Math.abs(zdiff)/2 * Math.sin((time+ shift1 - degToRad(90))) + obj2.translation[2] + zdiff
//     obj2.uniforms.u_matrix = computeMatrix(
//         viewProjectionMatrix,
//         translation,
//         rotation2,
//     )
// }

function generateOrbitBuffers(num) {
    for (i = 0; i < num; i++) {
        let x = rand(-300, 300, 32);
        let y = rand(-33 + x / 20, 33 + x / 20, x / 20);
        // let z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        let size = Math.random() * (1 + Math.log(Math.abs(x))) + 1;
        let sizePenalty = size / 2.22;
        sphereBufferOrbit.push({
            size: size,
            programInfo: programInfo,
            bufferInfo: createFlattenedVertices(gl, primitives.createSphereVertices(size, 16, 8)),
            uniforms: {
                u_colorMult: chroma.hsv(emod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
                u_matrix: m4.identity(),
            },
            translation: [x, y, -x / 2],
            xRotationSpeed: rand(0.8, 1.5) / sizePenalty,
            yRotationSpeed: rand(0.8, 1.5) / sizePenalty,
            zRotationSpeed: rand(0.8, 1.5) / sizePenalty,
            translationA: rand(0, 180),
            tranalarionB: rand(0.9, 1),
        });
    }
}

function generateMoonBuffers(num, num2) {
    for (i = 0; i < num; i++) {
        let numMoon = Math.floor(Math.random() * num2 + sphereBufferOrbit[i].size / 2);
        for (j = 0; j < numMoon; j++) {
            let size = Math.random() * (0.2) + 0.2;

            sphereBufferMoon.push({
                parent: i,
                programInfo: programInfo,
                bufferInfo: createFlattenedVertices(gl, primitives.createSphereVertices(size, 10, 5)),
                uniforms: {
                    u_colorMult: chroma.hsv(emod(baseHue + rand(0, 120), 360), rand(0.8, 1), rand(0.5, 1)).gl(),
                    u_matrix: m4.identity(),
                },
                // translation: [sphereBufferOrbit[i].translation[0] + rand(-2 - sphereBufferOrbit[i].size, 2 + sphereBufferOrbit[i].size, sphereBufferOrbit[i].size),
                // sphereBufferOrbit[i].translation[1] + rand(-2 - sphereBufferOrbit[i].size, 2 + sphereBufferOrbit[i].size, sphereBufferOrbit[i].size),
                // sphereBufferOrbit[i].translation[2] + rand(-2 - sphereBufferOrbit[i].size, 2 + sphereBufferOrbit[i].size, sphereBufferOrbit[i].size),
                // ],
                translation: [rand(-2 - sphereBufferOrbit[i].size, 2 + sphereBufferOrbit[i].size, sphereBufferOrbit[i].size),
                rand(-2 - sphereBufferOrbit[i].size, 2 + sphereBufferOrbit[i].size, sphereBufferOrbit[i].size),
                rand(-2 - sphereBufferOrbit[i].size, 2 + sphereBufferOrbit[i].size, sphereBufferOrbit[i].size)],
                xRotationSpeed: rand(0.8, 1.5),
                yRotationSpeed: rand(0.8, 1.5),
                zRotationSpeed: rand(0.8, 1.5),
                translationA: rand(0, 360),
                translationB: rand(0.6, 0.7),
            });

            // console.log(i + " " + sphereBufferOrbit[i].size);
        }
    }
}

var createFlattenedVertices = function (gl, vertices) {
    return webglUtils.createBufferInfoFromArrays(
        gl,
        primitives.makeRandomVertexColors(
            primitives.deindexVertices(vertices),
            {
                vertsPerColor: 6,
                rand: function (ndx, channel) {
                    return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
                }
            }
        )
    );
};

/**
 * **************************************************
 * 
 *          DRAW THE SCENE
 * 
 * **************************************************
 */
function drawBGScene() {
    /**
    * **************************************************
    * 
    *          CHECK FOR USER INPUT MATCH
    * 
    * **************************************************
    */
    if (sphereBufferOrbit.length != numOrbit) {
        generateOrbitBuffers(numOrbit - sphereBufferOrbit.length);
        var tem = numOrbit - sphereBufferOrbit.length;
        if (tem < 0) {
            for (i = 0; i > tem; i--) {
                // var bedeleted = Math.floor(Math.random() * sphereBufferOrbit.length);
                // sphereBufferOrbit.splice(bedeleted, 1);
                // console.log(bedeleted);
                // for(j = 0; j < sphereBufferMoon.length; j ++){
                //     console.log(" ss" + sphereBufferMoon[j].parent);
                //     if(bedeleted == sphereBufferMoon[j].parent){
                //         sphereBufferMoon.splice(j, 1);
                //         j -= 1;
                //     }
                sphereBufferOrbit.pop();
                for (j = 0; j < sphereBufferMoon.length; j++) {
                    // console.log(sphereBufferMoon[j].parent);
                    if (sphereBufferMoon[j].parent >= sphereBufferOrbit.length) {
                        sphereBufferMoon.splice(j, 1);
                    }
                }
            }
        }
    }

    // numMoon is number of moon for 1 planet
    // .length is number of moon for all
    // how to check?
    // how to implement???
    var parent;
    var parentCount = 0;
    var maxParentCount = 0;
    if (lastCheckNumMoon != numMoon) {
        for (i = 0; i < sphereBufferMoon.length; i++) {
            if (i == 0) {
                parent = sphereBufferMoon[i].parent;
            }
            if (parent == sphereBufferMoon[i].parent) {
                parentCount += 1;
            } else {
                if (lastCheckNumMoon > numMoon) {
                    if (parentCount > numMoon) {
                        var cut = parentCount - numMoon;
                        sphereBufferMoon.splice(i - cut, cut);
                        i -= cut;
                    }
                }
                if (maxParentCount < parentCount) {
                    maxParentCount = parentCount;
                }
                parentCount = 0;
                parent = sphereBufferMoon[i].parent
            }
        }
        if (lastCheckNumMoon < numMoon) {
            generateMoonBuffers(numOrbit, numMoon - maxParentCount);
        }
        lastCheckNumMoon = numMoon;
    }



    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    // Compute the camera's matrix using look at.
    // var cameraPosition = [-camTranslation[0], -camTranslation[1], 100 - camTranslation[2]];
    // var target = [0, 0, -100];
    // var up = [0, 1, 0];
    // var cameraMatrix = m4.lookAt(cameraPosition, target, up);
    var cameraMatrix = computeMatrix(m4.identity(), camTranslation, camRotation);
    // cameraMatrix = m4.translate(cameraMatrix, camTranslation[0], 0, 50 - camTranslation[2]);

    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var time = 0.002 * now;




    // // ------ DRAW PLANETS --------

    // sphereBufferOrbit.forEach(function (obj) {
    //     var r;
    //     //This if-else should reduce memory cost of running this program
    //     if (obj.r == null) {
    //         if (sphereBufferCenter.length == 1) {
    //             r = Math.sqrt(Math.pow(sphereBufferCenter[0].translation[0] - obj.translation[0], 2) +
    //                 Math.pow(sphereBufferCenter[0].translation[1] - obj.translation[1], 2) +
    //                 Math.pow(sphereBufferCenter[0].translation[2] - obj.translation[2], 2));
    //                 console.log("ss")
    //         } else {
    //             r = Math.sqrt(Math.pow((sphereBufferCenter[0].translation[0] + sphereBufferCenter[1].translation[0]) / 2 - obj.translation[0], 2) +
    //                 Math.pow((sphereBufferCenter[0].translation[1] + sphereBufferCenter[1].translation[1]) / 2 - obj.translation[1], 2) +
    //                 Math.pow((sphereBufferCenter[0].translation[2] + sphereBufferCenter[1].translation[2]) / 2 - obj.translation[2], 2));
    //         }

    //         obj.r = r;
    //     } else {
    //         r = obj.r;
    //     }

    //     var xdiff = sphereBufferCenter[0].translation[0] - obj.translation[0];
    //     var ydiff = sphereBufferCenter[0].translation[1] - obj.translation[1];
    //     var zdiff = sphereBufferCenter[0].translation[2] - obj.translation[2];
    //     var rotation = [Math.abs(xdiff) / Math.abs(ydiff) * 0.001,

    //     obj.yRotationSpeed * time * Math.abs(ydiff) * 0.01,
    //     obj.zRotationSpeed * Math.abs(zdiff) * 0.001,
    //     ];
    //     var shift = obj.translationA;
    //     var speed = Math.pow(Math.E, - r / 60);

    //     var translation = [Math.abs(xdiff) * Math.sin((time * speed + shift)) + xdiff + obj.translation[0],
    //     Math.abs(ydiff) * Math.sin((time * speed + shift)) + ydiff + obj.translation[1],
    //     Math.abs(zdiff) * Math.cos((time * speed + shift)) + zdiff + obj.translation[2],
    //     ];

    //     obj.trueTranslation = translation;

    //     obj.uniforms.u_matrix = computeMatrix(
    //         viewProjectionMatrix,
    //         translation,
    //         rotation);
    // });

    // var lastUsedProgramInfo = null;
    // var lastUsedBufferInfo = null;

    // sphereBufferOrbit.forEach(function (obj) {
    //     var programInfo = obj.programInfo;
    //     var bufferInfo = obj.bufferInfo;
    //     var bindBuffers = false;
    //     if (programInfo !== lastUsedProgramInfo) {
    //         lastUsedProgramInfo = programInfo;
    //         gl.useProgram(programInfo.program);
    //         bindBuffers = true;
    //     }

    //     if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
    //         lastUsedBufferInfo = bufferInfo;
    //         webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    //     }

    //     webglUtils.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo);
    //     webglUtils.setUniforms(programInfo, obj.uniforms);
    //     gl.drawArrays(gl.TRIANGLES, 0, obj.bufferInfo.numElements);
    // });


    // // ------ DRAW SUNS --------

    // sphereBufferCenter.forEach(function (obj) {
    //     var rotation = [0, sphereBufferCenter[0].yRotationSpeed * time, 0];
    //     obj.uniforms.u_matrix = computeMatrix(
    //         viewProjectionMatrix,
    //         obj.translation,
    //         rotation);
    // });
    // // computeCenter(sphereBufferCenter[0], sphereBufferCenter[1], viewProjectionMatrix, 4*time);
    // // computeCenter(sphereBufferCenter[1], sphereBufferCenter[0], viewProjectionMatrix);

    // var lastUsedProgramInfo = null;
    // var lastUsedBufferInfo = null;

    // sphereBufferCenter.forEach(function (obj) {
    //     var programInfo = obj.programInfo;
    //     var bufferInfo = obj.bufferInfo;
    //     var bindBuffers = false;
    //     if (programInfo !== lastUsedProgramInfo) {
    //         lastUsedProgramInfo = programInfo;
    //         gl.useProgram(programInfo.program);
    //         bindBuffers = true;
    //     }

    //     if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
    //         lastUsedBufferInfo = bufferInfo;
    //         webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    //     }

    //     webglUtils.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo);
    //     webglUtils.setUniforms(programInfo, obj.uniforms);
    //     gl.drawArrays(gl.TRIANGLES, 0, obj.bufferInfo.numElements);
    // });


    // // ------ DRAW MOONS --------

    // sphereBufferMoon.forEach(function (obj) {
    //     var parent = obj.parent;
    //     // var xdiff = sphereBufferOrbit[parent].translation[0] - obj.translation[0];
    //     // var ydiff = sphereBufferOrbit[parent].translation[1] - obj.translation[1];
    //     // var zdiff = sphereBufferOrbit[parent].translation[2] - obj.translation[2];
    //     var xdiff = obj.translation[0];
    //     var ydiff = obj.translation[1];
    //     var zdiff = obj.translation[2];
    //     var rotation = [Math.abs(xdiff) / Math.abs(ydiff) * 0.001,
    //     obj.yRotationSpeed * time * Math.abs(ydiff) * 0.01,
    //     obj.zRotationSpeed * Math.abs(zdiff) * 0.001,
    //     ];

    //     var shift = obj.translationA;
    //     var speed = obj.translationB / 2;

    //     var translation = [Math.abs(xdiff) * Math.sin((time * speed) + shift) + sphereBufferOrbit[parent].trueTranslation[0],
    //     Math.abs(ydiff) * Math.sin((time * speed) + shift) + sphereBufferOrbit[parent].trueTranslation[1],
    //     Math.abs(zdiff) * Math.cos((time * speed) + shift) + sphereBufferOrbit[parent].trueTranslation[2],
    //     ];
    //     obj.uniforms.u_matrix = computeMatrix(
    //         viewProjectionMatrix,
    //         translation,
    //         rotation);
    // });

    // var lastUsedProgramInfo = null;
    // var lastUsedBufferInfo = null;

    // sphereBufferMoon.forEach(function (obj) {
    //     var programInfo = obj.programInfo;
    //     var bufferInfo = obj.bufferInfo;
    //     var bindBuffers = false;
    //     if (programInfo !== lastUsedProgramInfo) {
    //         lastUsedProgramInfo = programInfo;
    //         gl.useProgram(programInfo.program);
    //         bindBuffers = true;
    //     }

    //     if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
    //         lastUsedBufferInfo = bufferInfo;
    //         webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    //     }

    //     webglUtils.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo);
    //     webglUtils.setUniforms(programInfo, obj.uniforms);
    //     gl.drawArrays(gl.TRIANGLES, 0, obj.bufferInfo.numElements);
    // });
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

    // gl.clearColor(22 / 255, 130 / 255, 182 / 255, 1);
    gl.clearColor(0.08, 0.08, 0.08, 1);
    gl.enable(gl.DEPTH_TEST);

    var loadList = ["dolphins.ply"]
    LoadPLY(loadList);
    fpsInterval = 1000 / 15;
    then = Date.now();
    startTime = then;
    generateCenterBuffers();
    generateOrbitBuffers(numOrbit);
    generateMoonBuffers(numOrbit, numMoon);
    // console.log(sphereBufferMoon);
    animate();
}

function degToRad(d) {
    return d * Math.PI / 180;
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
