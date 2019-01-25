
//variables for setting up animation
var fps, fpsInterval, startTime, now, then, elapsed;
//variables for gl basics
var gl;
var vertprogram;
var currentProgram;
var canvas;
//variables for uniform
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var normalMatrix = mat3.create();
var directionalColor = [0.3, 0.3, 0.3];

//variabls for camera control
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var xPos = 0; var yPos = 0; var zPos = 0;
var xRot = 0; var yRot = 0; var zRot = 0;
var xSpeed = 30;
//variabls for spheres
var sphereVertexPosBuffer;
var sphereVertexNormalBuffer;
var sMaxRadius = 4;
var sMinRadius = 1;
var sVertices = [];
var sNormals = [];
var maxNumSpheres = 10;
var numSpheres = 0;
var sphereCenters = [];
var sphereRadius = [];
//Marching Cube variables
var resolution = 0.2;
var cubeSize = 10;


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
    if (currentlyPressedKeys[87]) {
        zPos += .2;
    }
    if (currentlyPressedKeys[83]) {
        zPos -= .2;
        console.log("sss")
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

function marchCube() {
    numSpheres = Math.floor(rand(1, maxNumSpheres));
    sphereRadius = [];
    sphereCenters = [];
    for (var i = 0; i < numSpheres; i++) {
        sphereRadius.push(rand(sMaxRadius, sMinRadius));
        sphereCenters.push([
            Math.random() * (10 - 2 * sphereRadius[i]) + sphereRadius[i],
            Math.random() * (10 - 2 * sphereRadius[i]) + sphereRadius[i],
            Math.random() * (10 - 2 * sphereRadius[i]) + sphereRadius[i],
        ])
    }

    console.log(numSpheres + " spheres generated")
    //The rest of this function is credit to @dmg219
    var cubes = 10 / resolution;
    var cornerMap = new Map();
    var cornerSet = new Set();
    for (var x = 0; x <= cubes; x++) {
        for (var y = 0; y <= cubes; y++) {
            for (var z = 0; z <= cubes; z++) {
                var currentSet = new Set();
                for (var i = 0; i < numSpheres; i++) {
                    if (checkSphere(x * resolution, y * resolution, z * resolution, sphereCenters[i][0], sphereCenters[i][1], sphereCenters[i][2], sphereRadius[i])) {
                        currentSet.add(i);
                        cornerSet.add(x * (cubes + 1) * (cubes + 1) + y * (cubes + 1) + z);
                    }
                }
                cornerMap.set(x * resolution * (cubes + 1) * (cubes + 1) + y * resolution * (cubes + 1) + z * resolution, currentSet);
            }
        }
    }

    var edgeMap = new Map();
    for (var i = 0; i < cubes * cubes * cubes; i++) {
        var currentMap = new Map();
        var currentSet = new Set();
        var x = Math.floor(i / (cubes * cubes));
        var y = Math.floor(i % (cubes * cubes) / cubes)
        var z = i % (cubes * cubes) % cubes;

        var cornerX = x * resolution;
        var cornerY = y * resolution;
        var cornerZ = z * resolution;
        var cornerIndex = x * (cubes + 1) * (cubes + 1) + y * (cubes + 1) + z;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(0);
            if (cornerIndex + 1 > 0 && cornerIndex + 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, 1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(1, [cornerX, cornerY, cornerZ + maxDistance]);
                }
            }
            if (cornerIndex + 1 + cubes > 0 && cornerIndex + 1 + cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1 + cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(0, [cornerX, cornerY + maxDistance, cornerZ]);
                }
            }
            if (cornerIndex + (cubes + 1) * (cubes + 1) > 0 && cornerIndex + (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(4, [cornerX + maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = x * resolution;
        var cornerY = y * resolution;
        var cornerZ = (z + 1) * resolution;
        var cornerIndex = x * (cubes + 1) * (cubes + 1) + y * (cubes + 1) + z + 1;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(2);
            if (cornerIndex - 1 > 0 && cornerIndex - 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, -1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(1, [cornerX, cornerY, cornerZ - maxDistance]);
                }
            }
            if (cornerIndex + 1 + cubes > 0 && cornerIndex + 1 + cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1 + cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(3, [cornerX, cornerY + maxDistance, cornerZ]);
                }
            }
            if (cornerIndex + (cubes + 1) * (cubes + 1) > 0 && cornerIndex + (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(6, [cornerX + maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = x * resolution;
        var cornerY = (y + 1) * resolution;
        var cornerZ = z * resolution;
        var cornerIndex = x * (cubes + 1) * (cubes + 1) + (y + 1) * (cubes + 1) + z;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(1);
            if (cornerIndex + 1 > 0 && cornerIndex + 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, 1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(2, [cornerX, cornerY, cornerZ + maxDistance]);
                }
            }
            if (cornerIndex - 1 - cubes > 0 && cornerIndex - 1 - cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1 - cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, -1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(0, [cornerX, cornerY - maxDistance, cornerZ]);
                }
            }
            if (cornerIndex + (cubes + 1) * (cubes + 1) > 0 && cornerIndex + (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(5, [cornerX + maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = x * resolution;
        var cornerY = (y + 1) * resolution;
        var cornerZ = (z + 1) * resolution;
        var cornerIndex = x * (cubes + 1) * (cubes + 1) + (y + 1) * (cubes + 1) + z + 1;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(3);
            if (cornerIndex - 1 > 0 && cornerIndex - 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, -1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(2, [cornerX, cornerY, cornerZ - maxDistance]);
                }
            }
            if (cornerIndex - 1 - cubes > 0 && cornerIndex - 1 - cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1 - cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, -1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(3, [cornerX, cornerY - maxDistance, cornerZ]);
                }
            }
            if (cornerIndex + (cubes + 1) * (cubes + 1) > 0 && cornerIndex + (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(7, [cornerX + maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = (x + 1) * resolution;
        var cornerY = y * resolution;
        var cornerZ = z * resolution;
        var cornerIndex = (x + 1) * (cubes + 1) * (cubes + 1) + y * (cubes + 1) + z;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(4);
            if (cornerIndex + 1 > 0 && cornerIndex + 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, 1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(9, [cornerX, cornerY, cornerZ + maxDistance]);
                }
            }
            if (cornerIndex + 1 + cubes > 0 && cornerIndex + 1 + cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1 + cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(8, [cornerX, cornerY + maxDistance, cornerZ]);
                }
            }
            if (cornerIndex - (cubes + 1) * (cubes + 1) > 0 && cornerIndex - (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [-1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(4, [cornerX - maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = (x + 1) * resolution;
        var cornerY = (y + 1) * resolution;
        var cornerZ = z * resolution;
        var cornerIndex = (x + 1) * (cubes + 1) * (cubes + 1) + (y + 1) * (cubes + 1) + z;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(5);
            if (cornerIndex + 1 > 0 && cornerIndex + 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, 1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(10, [cornerX, cornerY, cornerZ + maxDistance]);
                }
            }
            if (cornerIndex - 1 - cubes > 0 && cornerIndex - 1 - cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1 - cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, -1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(8, [cornerX, cornerY - maxDistance, cornerZ]);
                }
            }
            if (cornerIndex - (cubes + 1) * (cubes + 1) > 0 && cornerIndex - (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [-1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(5, [cornerX - maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = (x + 1) * resolution;
        var cornerY = y * resolution;
        var cornerZ = (z + 1) * resolution;
        var cornerIndex = (x + 1) * (cubes + 1) * (cubes + 1) + y * (cubes + 1) + z + 1;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(6);
            if (cornerIndex - 1 > 0 && cornerIndex - 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, -1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(9, [cornerX, cornerY, cornerZ - maxDistance]);
                }
            }
            if (cornerIndex + 1 + cubes > 0 && cornerIndex + 1 + cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex + 1 + cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(11, [cornerX, cornerY + maxDistance, cornerZ]);
                }
            }
            if (cornerIndex - (cubes + 1) * (cubes + 1) > 0 && cornerIndex - (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [-1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(6, [cornerX - maxDistance, cornerY, cornerZ]);
                }
            }
        }

        var cornerX = (x + 1) * resolution;
        var cornerY = (y + 1) * resolution;
        var cornerZ = (z + 1) * resolution;
        var cornerIndex = (x + 1) * (cubes + 1) * (cubes + 1) + (y + 1) * (cubes + 1) + z + 1;
        if (cornerSet.has(cornerIndex)) {
            currentSet.add(7);
            if (cornerIndex - 1 > 0 && cornerIndex - 1 < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, 0, -1];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(10, [cornerX, cornerY, cornerZ - maxDistance]);
                }
            }
            if (cornerIndex - 1 - cubes > 0 && cornerIndex - 1 - cubes < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - 1 - cubes) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [0, -1, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(11, [cornerX, cornerY - maxDistance, cornerZ]);
                }
            }
            if (cornerIndex - (cubes + 1) * (cubes + 1) > 0 && cornerIndex - (cubes + 1) * (cubes + 1) < (cubes + 1) * (cubes + 1) * (cubes + 1) && cornerSet.has(cornerIndex - (cubes + 1) * (cubes + 1)) == false) {
                var maxDistance = 0;
                for (var j = 0; j < numSpheres; j++) {
                    var r0 = [cornerX, cornerY, cornerZ];
                    var rd = [-1, 0, 0];
                    var center = [sphereCenters[j][0], sphereCenters[j][1], sphereCenters[j][2]];
                    var distance = rayIntersect(r0, rd, center, sphereRadius[j]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                    }
                    currentMap.set(7, [cornerX - maxDistance, cornerY, cornerZ]);
                }
            }
        }

        edgeMap.set(i, currentMap);
        cornerMap.set(i, currentSet);
    }
    vertexData = [];
    normalData = [];
    for (var i = 0; i < cubes * cubes * cubes; i++) {
        var currentSet = cornerMap.get(i);
        var currentMap = edgeMap.get(i);

        if (currentSet.size > 0) {
            var cubeTableIndex = currentSet.has(0) + 2 * currentSet.has(1) + 4 * currentSet.has(2) + 8 * currentSet.has(3) + 16 * currentSet.has(4) + 32 * currentSet.has(5) + 64 * currentSet.has(6) + 128 * currentSet.has(7);
            var edges = cubeTable[cubeTableIndex];

            for (var j = 0; j < edges.length; j++) {
                var xa = 0;
                var xb = 0;
                var ya = 0;
                var yb = 0;
                var za = 0;
                var zb = 0;
                vertexData.push(currentMap.get(edges[j])[0]);
                vertexData.push(currentMap.get(edges[j])[1]);
                vertexData.push(currentMap.get(edges[j])[2]);
                xa += currentMap.get(edges[j])[0];
                ya += currentMap.get(edges[j])[1];
                za += currentMap.get(edges[j])[2];
                j++;

                vertexData.push(currentMap.get(edges[j])[0]);
                vertexData.push(currentMap.get(edges[j])[1]);
                vertexData.push(currentMap.get(edges[j])[2]);
                xb += currentMap.get(edges[j])[0];
                yb += currentMap.get(edges[j])[1];
                zb += currentMap.get(edges[j])[2];
                j++;

                vertexData.push(currentMap.get(edges[j])[0]);
                vertexData.push(currentMap.get(edges[j])[1]);
                vertexData.push(currentMap.get(edges[j])[2]);
                xa -= currentMap.get(edges[j])[0];
                ya -= currentMap.get(edges[j])[1];
                za -= currentMap.get(edges[j])[2];
                xb -= currentMap.get(edges[j])[0];
                yb -= currentMap.get(edges[j])[1];
                zb -= currentMap.get(edges[j])[2];

                normalData.push(ya * zb - yb * za);
                normalData.push(xa * zb - xb * za);
                normalData.push(xa * yb - ya * xb);
                normalData.push(ya * zb - yb * za);
                normalData.push(xa * zb - xb * za);
                normalData.push(xa * yb - ya * xb);
                normalData.push(ya * zb - yb * za);
                normalData.push(xa * zb - xb * za);
                normalData.push(xa * yb - ya * xb);
            }
        }
    }
}


function initBuffers() {

    sphereVertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,
        sphereVertexPosBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    sphereVertexPosBuffer.itemSize = 3;
    sphereVertexPosBuffer.numItems = vertexData.length / 3;


    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,
        sphereVertexNormalBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = normalData.length / 3;
}

function checkInput(){
    var newResolution = $("#resolution").val();
    var newMaxNumSphere = $("#numSphere").val();
    if(newResolution > 2){
        newResolution = resolution;
        $("#resolution").val(newResolution);
    } else if (newResolution <= 0) {
        newResolution = resolution;
        $("#resolution").val(newResolution);
    }
    var update = false;
    if(newMaxNumSphere > 10){
        newMaxNumSphere = 10;
    } else if (newMaxNumSphere <1){
        newMaxNumSphere = 1;
    }
    if(newResolution != resolution || newMaxNumSphere != maxNumSpheres){
        resolution = newResolution;
        maxNumSpheres = newMaxNumSphere;
        $("#numSphere").val(newMaxNumSphere);
        $("#resolution").val(newResolution);
        marchCube();
        initBuffers();
        console.log("resolution is:" + resolution);
        console.log("maxNumSPhere is:" + maxNumSpheres)
        update = true
    }

}


/**
 * **************************************************
 * 
 *          DRAW THE SCENE
 * 
 * **************************************************
 */
function drawBGScene() {
    gl.useProgram(currentProgram);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    gl.useProgram(currentProgram);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [xPos - 4, yPos - 5, -30.0 + zPos]);

    mat4.multiply(mvMatrix, mvMatrix, mouseRotMatrix);

    mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(yRot), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(zRot), [0, 0, 1]);

    for (var k = 0; k < numSpheres; k++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPosBuffer);
        gl.vertexAttribPointer(currentProgram.positionLocation, sphereVertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
        gl.vertexAttribPointer(currentProgram.normalLocation, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms(currentProgram);
        gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPosBuffer.numItems);
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
    console.log("unable to resolve the issue of [OffScreen for webgl] error when change resolution to certain value")
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

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    vertprogram = initShaders("shader-fs", "shader-vs");
    //  gl.clearColor(1, 1,1, 1);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.enable(gl.DEPTH_TEST);

    fpsInterval = 1000 / 15;
    then = Date.now();
    startTime = then;
    currentProgram = vertprogram;


    setupCubeTable()

    marchCube();

    initBuffers();
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
        checkInput();
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


function setMatrixUniforms(program) {
    gl.uniformMatrix4fv(program.projectionMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(program.modelMatrixUniform, false, mvMatrix);
    var normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, mvMatrix);

    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(program.normalmatrixUniform, false, normalMatrix);
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

    program.positionLocation = gl.getAttribLocation(program, "aVertexPosition");
    program.normalLocation = gl.getAttribLocation(program, "aVertexNormal");
    gl.enableVertexAttribArray(program.normalLocation);
    gl.enableVertexAttribArray(program.positionLocation);

    program.modelMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
    program.projectionMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
    program.normalmatrixUniform = gl.getUniformLocation(program, "uNMatrix");


    return program;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}







function checkSphere(x, y, z, centerX, centerY, centerZ, radius) {
    var distance = Math.pow((x - centerX), 2) + Math.pow((y - centerY), 2) + Math.pow((z - centerZ), 2);
    if (distance < Math.pow(radius, 2)) {
        return true;
    }
    return false;
}


function rayIntersect(r0, rd, center, radius) {
    var s = [r0[0] - center[0], r0[1] - center[1], r0[2] - center[2]];
    var a = dotproduct3(rd, rd);
    var b = 2.0 * dotproduct3(s, rd);
    var c = dotproduct3(s, s) - (radius * radius);

    var under = b * b - 4.0 * a * c;
    if (under < 0.0) { return -1; }

    var t1 = (-b + Math.sqrt(under)) / (2.0 * a);
    var t2 = (-b - Math.sqrt(under)) / (2.0 * a);

    if (t1 >= 0 && t1 <= resolution) {
        return t1;
    }
    else if (t2 >= 0 && t2 <= resolution) {
        return t2;
    }
    else {
        return -1;
    }
}

function dotproduct3(a, b) {
    var n = 0, lim = 3;
    for (var i = 0; i < lim; i++) n += a[i] * b[i];
    return n;
}