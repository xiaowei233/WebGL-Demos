var gl;
var fps, fpsInterval, startTime, now, then, elapsed;

var fieldOfViewRadians = degToRad(60);

var fragprogram;
var vertprogram;

var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var normalMatrix = mat3.create();
var mvMatrixStack = [];

var modelItemSize = 0;
var modelNumItems = 0;
var dolphinTexture;
var treeTexture;

var positionBuffer;
var normalBuffer;
var models = [];
var sphereVertexPosBuffer;
var sphereVertexTextureCoordBuffer;
var sphereVertexNormalBuffer;
var sRadius = 10;
var slices = 100;
var stacks = 50;

var sVertices = [];
var sNormals = [];
var textureCoords = [];

var fileVertexPosBuffer;
var fileVertexNrmBuffer;
var fileVertexTexBuffer;
var fileVertexColBuffer;
var fileVertexIndBuffer;
var modelData = [];
var modelScale = 0.15;

// PLY object
function PLY() { this.object; }

// Path to folder where models are stored
var ModelFolderPath = "src/";

// Number of vertices in PLY file
var PLY_Vertices = 0;

// Number of faces in PLY file
var PLY_Faces = 0;


// 11 entries per vertex (x,y,z,nx,ny,nz,r,g,b,u,v)
var PLY_DataLenght = 11;

var VAO_VertexIndex = 0;

var FaceIndex = 0;


/**
 * **************************************************
 * 
 *          DRAW THE SCENE
 * 
 * **************************************************
 */
function drawBGScene() {
    var currentprogram;
    if ($("#7").prop("checked")) {
        currentprogram = fragprogram;
    } else {
        currentprogram = vertprogram;
    }
    gl.useProgram(currentprogram);

    var time = 0.0003 * now
    // console.log(fileVertexPosBuffer)
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 1, 4000.0);

    // console.log(pMatrix)

    gl.uniform1i(currentprogram.showSpecularHighlightsUniform, false);
    var useLight = $("#0").prop("checked");
    gl.uniform1i(currentprogram.useLightingUniform, useLight);
    var dirLight = $("#1").prop("checked");
    if (true) {
        gl.uniform3f(currentprogram.ambientColorUniform, 0.5, 0.6, 0.6);
        gl.uniform1i(currentprogram.useDirectionalLightUniform, dirLight)
        gl.uniform3f(currentprogram.directionalColorUniform, Math.sin(time + degToRad(90)) / 2 + 0.5, 0.7, Math.sin(time) / 4 + 0.75)
        var adjustedLD = vec3.create();
        var adjustedLD2 = vec3.create();
        var lightingDirection = [0, -2, -1];
        vec3.normalize(adjustedLD, lightingDirection); // normalize the vector
        vec3.scale(adjustedLD2, adjustedLD, -3);
        gl.uniform3fv(currentprogram.lightDirectionUniform, adjustedLD2);
    }

    var point1 = $("#2").prop("checked");
    var point2 = $("#3").prop("checked");
    var point3 = $("#4").prop("checked");
    var point4 = $("#5").prop("checked");
    var point5 = $("#6").prop("checked");
    // console.log(point1)
    gl.uniform1i(currentprogram.usePointLight1Uniform, point1);
    gl.uniform1i(currentprogram.usePointLight2Uniform, point2);
    gl.uniform1i(currentprogram.usePointLight3Uniform, point3);
    gl.uniform1i(currentprogram.usePointLight4Uniform, point4);
    gl.uniform1i(currentprogram.usePointLight5Uniform, point5);


    gl.uniform3f(currentprogram.pointLightLoc1Uniform, -90, 100 + Math.sin(time), -150);
    gl.uniform3f(currentprogram.pointLightCol1Uniform, 0.6, 0.2, 0.5);

    gl.uniform3f(currentprogram.pointLightLoc2Uniform, -70 + Math.sin(time + degToRad(56)) * 20, Math.sin(time) * 100, -100 + Math.cos(time) * 50);
    gl.uniform3f(currentprogram.pointLightCol2Uniform, 0.4, 0.6, 0.7);

    gl.uniform3f(currentprogram.pointLightLoc3Uniform, - 70 + Math.sin(time) * 70, 0, -100);
    gl.uniform3f(currentprogram.pointLightCol3Uniform, 0.2, 0.2, 0.7);

    gl.uniform3f(currentprogram.pointLightLoc4Uniform, -30, Math.cos(time + degToRad(30)) * 30, -150 + Math.sin(time  + degToRad(11)) * 15);
    gl.uniform3f(currentprogram.pointLightCol4Uniform, 0.7, 0.2, 0.7);

    gl.uniform3f(currentprogram.pointLightLoc5Uniform, -50 + Math.sin(time  + degToRad(78)) * 20, 8, -150 + Math.cos(time)*80);
    gl.uniform3f(currentprogram.pointLightCol5Uniform, 0.7, 0.7, 0.2);
    var shine = [];
    shine[0] = $("#11").val();
    shine[1] = $("#12").val();
    shine[2] = $("#13").val();
    for(var zzzz = 0; zzzz < 3; zzzz ++){
        if(shine[zzzz] == 0) {shine[zzzz] = 0.1;}
    }
    gl.uniform1f(currentprogram.materialShineUniform, shine[0]);
    gl.uniform1f(currentprogram.lightSpecuUnifom, shine[1]);
    gl.uniform1f(currentprogram.materialSpecuUniform, shine[2]);
    var i = 0;
    models.forEach((model) => {
        mat4.identity(mvMatrix);
        // mvPushMatrix();
        // console.log(mvMatrix)

        mat4.translate(mvMatrix, mvMatrix, [-50 + 90 * i, -20, -150]);
        var yrota = 0;
        var xrota = 0;
        if (i == 0) {
            yrota = degToRad(-45);
            xrota = degToRad(-10)
        }
        mat4.rotate(mvMatrix, mvMatrix, yrota, [1, 0, 0]);
        mat4.rotate(mvMatrix, mvMatrix, xrota, [0, 1, 1]);
        // console.log(model.fileVertexNrmBuffer)

        gl.bindBuffer(gl.ARRAY_BUFFER, model.fileVertexPosBuffer);
        gl.vertexAttribPointer(currentprogram.vertexPositionAttribute, model.fileVertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.fileVertexTexBuffer);
        gl.vertexAttribPointer(currentprogram.textureLocation, model.fileVertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.fileVertexNrmBuffer);
        gl.vertexAttribPointer(currentprogram.normalLocation, model.fileVertexNrmBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // gl.uniform1f(currentprogram.materialShininessUniform, 32);
        var texture = $("#9").prop("checked");
        // console.log(texture)
        gl.uniform1i(currentprogram.useTexturesUniform, texture);
        gl.activeTexture(gl.TEXTURE0);
        if(i == 0){
            gl.bindTexture(gl.TEXTURE_2D, dolphinTexture);
        } else{
            gl.bindTexture(gl.TEXTURE_2D, treeTexture);
        }

        gl.uniform1i(currentprogram.samplerUniform, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.fileVertexIndBuffer);
        setMatrixUniforms(currentprogram);
        gl.drawElements(gl.TRIANGLES, model.fileVertexIndBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        // mvPopMatrix();
        i += 1;
    })

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

    // programInfo = webglUtils.createProgramInfo(gl, ["shader-vs", "shader-fs"]);
    // program = programInfo.program;

    fragprogram = initShaders("perfrag-shader-fs", "perfrag-shader-vs");
    vertprogram = initShaders("shader-fs", "shader-vs");
    //  gl.clearColor(1, 1,1, 1);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.enable(gl.DEPTH_TEST);

    fpsInterval = 1000 / 15;
    then = Date.now();
    startTime = then;
    initTexture();
    var loadingModels = ["dolphins.ply", "fracttree.ply"];
    LoadPLY(loadingModels);
    setTimeout(() => {
        // console.log(fragprogram)
        // console.log(vertprogram)
        animate();
    }, 100);
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
        if (modelData.length == 5) {
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

function initTexture() {
    dolphinTexture = gl.createTexture();
    dolphinTexture.image = new Image();
    dolphinTexture.image.onload = function () {
        handleLoadedTexture(dolphinTexture);
        console.log(dolphinTexture.image.src + " loaded")
    }
    dolphinTexture.image.src = "./src/blue.jpg";

    treeTexture = gl.createTexture();
    treeTexture.image = new Image();
    treeTexture.image.onload = function () {
        handleLoadedTexture(treeTexture);
    }
    treeTexture.image.src = "./src/sun.jpg";
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

    if (isPowerOf2(texture.image.width) && isPowerOf2(texture.image.height)) {
        console.log("sss")
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    // gl.bindTexture(gl.TEXTURE_2D, null);
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
    program.positionLocation = gl.getAttribLocation(program, "a_position");
    program.textureLocation = gl.getAttribLocation(program, "a_textureCoord");
    program.normalLocation = gl.getAttribLocation(program, "a_normal");
    gl.enableVertexAttribArray(program.normalLocation);
    gl.enableVertexAttribArray(program.positionLocation);
    gl.enableVertexAttribArray(program.textureLocation);

    program.projectionMatrixUniform = gl.getUniformLocation(program, "u_projectionMatrix");
    program.modelMatrixUniform = gl.getUniformLocation(program, "u_modelMatrix");
    program.normalmatrixUniform = gl.getUniformLocation(program, "u_normalMatrix");

    program.useTexturesUniform = gl.getUniformLocation(program, "u_useTextures");
    program.useLightingUniform = gl.getUniformLocation(program, "u_useLighting");
    program.useDirectionalLightUniform = gl.getUniformLocation(program, "u_useDirectionalLight")

    program.samplerUniform = gl.getUniformLocation(program, "u_sampler");
    // program.materialShininessUniform = gl.getUniformLocation(program, "u_materialShininess");
    // program.showSpecularHighlightsUniform = gl.getUniformLocation(program, "u_showSpecularHighlights");
    program.ambientColorUniform = gl.getUniformLocation(program, "u_ambientColor");

    program.lightDirectionUniform = gl.getUniformLocation(program, "u_lightDirection")
    program.directionalColorUniform = gl.getUniformLocation(program, "u_directionalColor")
    // program.pointLightingLocationUniform = gl.getUniformLocation(program, "u_pointLightingLocation");
    // program.pointLightingSpecularColorUniform = gl.getUniformLocation(program, "u_pointLightingSpecularColor");
    // program.pointLightingDiffuseColorUniform = gl.getUniformLocation(program, "u_pointLightingDiffuseColor");

    program.pointLightLoc1Uniform = gl.getUniformLocation(program, "u_pointLightLoc1");
    program.pointLightLoc2Uniform = gl.getUniformLocation(program, "u_pointLightLoc2");
    program.pointLightLoc3Uniform = gl.getUniformLocation(program, "u_pointLightLoc3");
    program.pointLightLoc4Uniform = gl.getUniformLocation(program, "u_pointLightLoc4");
    program.pointLightLoc5Uniform = gl.getUniformLocation(program, "u_pointLightLoc5");

    program.pointLightCol1Uniform = gl.getUniformLocation(program, "u_pointLightCol1");
    program.pointLightCol2Uniform = gl.getUniformLocation(program, "u_pointLightCol2");
    program.pointLightCol3Uniform = gl.getUniformLocation(program, "u_pointLightCol3");
    program.pointLightCol4Uniform = gl.getUniformLocation(program, "u_pointLightCol4");
    program.pointLightCol5Uniform = gl.getUniformLocation(program, "u_pointLightCol5");

    program.usePointLight1Uniform = gl.getUniformLocation(program, "u_usePointLight1");
    program.usePointLight2Uniform = gl.getUniformLocation(program, "u_usePointLight2");
    program.usePointLight3Uniform = gl.getUniformLocation(program, "u_usePointLight3");
    program.usePointLight4Uniform = gl.getUniformLocation(program, "u_usePointLight4");
    program.usePointLight5Uniform = gl.getUniformLocation(program, "u_usePointLight5");

    program.materialSpecuUniform = gl.getUniformLocation(program, "u_materialSpecu");
    program.materialShineUniform = gl.getUniformLocation(program, "u_materialShine");
    program.lightSpecuUnifom = gl.getUniformLocation(program, "u_lightSpecu");

    return program;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                         //
//         ##  ######        ########  ##       ##    ##       ########     ###    ########   ######  ######## ########    //
//         ## ##    ##       ##     ## ##        ##  ##        ##     ##   ## ##   ##     ## ##    ## ##       ##     ##   //
//         ## ##             ##     ## ##         ####         ##     ##  ##   ##  ##     ## ##       ##       ##     ##   //
//         ##  ######        ########  ##          ##          ########  ##     ## ########   ######  ######   ########    //
//   ##    ##       ##       ##        ##          ##          ##        ######### ##   ##         ## ##       ##   ##     //
//   ##    ## ##    ##       ##        ##          ##          ##        ##     ## ##    ##  ##    ## ##       ##    ##    // 
//    ######   ######        ##        ########    ##          ##        ##     ## ##     ##  ######  ######## ##     ##   //
//                                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
//  888~-_                           ,e,                /       ,d88~~\   d8                             d8           // 
//  888   \    /~~~8e  888-~\  d88~\  "  888-~88e e88~88e       8888    _d88__ 888-~\ 888  888  e88~~\ _d88__  d88~\  //
//  888    |       88b 888    C888   888 888  888 888 888       `Y88b    888   888    888  888 d888     888   C888    //
//  888   /   e88~-888 888     Y88b  888 888  888 "88_88"        `Y88b,  888   888    888  888 8888     888    Y88b   //
//  888_-~   C888  888 888      888D 888 888  888  /               8888  888   888    888  888 Y888     888     888D  //
//  888       "88_-888 888    \_88P  888 888  888 Cb            \__88P'  "88_/ 888    "88_-888  "88__/  "88_/ \_88P   //
//                                                 Y8""8D                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function PLY_Vertex(x, y, z, nx, ny, nz, u, v, r, g, b) {
	this.x = 0; this.y = 0; this.z = 0;
	this.nx = 0; this.ny = 0; this.nz = 0;
	this.u = 0; this.v = 0;
	this.r = 0; this.g = 0; this.b = 0;
}

// PLY file face consisting of 3 vertex indices for each face
function PLY_Face(a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
//       e      ,d88~~\ Y88b    / 888b    |  e88~-_        ,d88~~\             d8                       //
//      d8b     8888     Y88b  /  |Y88b   | d888   \       8888     e88~~8e  _d88__ 888  888 888-~88e   //
//     /Y88b    `Y88b     Y88b/   | Y88b  | 8888           `Y88b   d888  88b  888   888  888 888  888b  //
//    /  Y88b    `Y88b,    Y8Y    |  Y88b | 8888            `Y88b, 8888__888  888   888  888 888  8888  //
//   /____Y88b     8888     Y     |   Y88b| Y888   /          8888 Y888    ,  888   888  888 888  888P  //
//  /      Y88b \__88P'    /      |    Y888  "88_-~        \__88P'  "88___/   "88_/ "88_-888 888-_88"   //
//                                                                                           888        //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
var xmlhttp = [];
function LoadPLY(filenames) {
	for (var idn = 0; idn < filenames.length; idn++) {
		(function (idn) {
			xmlhttp[idn] = new XMLHttpRequest();
			xmlhttp[idn].onreadystatechange = function () {
				if (xmlhttp[idn].readyState == XMLHttpRequest.DONE) {
					if (xmlhttp[idn].status == 200) {
						loadAsyncPLYfile(idn);
					}
				}
			}
			console.log("Loading Model <" + filenames[idn] + ">...");
			xmlhttp[idn].open("GET", ModelFolderPath + filenames[idn], true);
			xmlhttp[idn].send();
		})(idn);
	}
}


///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
//  888~-_   888     Y88b    /       888~-_                                              //
//  888   \  888      Y88b  /        888   \    /~~~8e  888-~\  d88~\  e88~~8e  888-~\   //
//  888    | 888       Y88b/         888    |       88b 888    C888   d888  88b 888      //
//  888   /  888        Y8Y          888   /   e88~-888 888     Y88b  8888__888 888      //
//  888_-~   888         Y           888_-~   C888  888 888      888D Y888    , 888      //
//  888      888____    /            888       "88_-888 888    \_88P   "88___/  888      //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
var vertices = null;
var faces = null;
var arrayVertex, arrayNormal, arrayTexture, arrayColor, arrayIndex;
function loadAsyncPLYfile(idn) {
	var data = xmlhttp[idn].responseText;		//the downloaded data
	var lines = data.split("\n");			//the downloaded data split into lines
	var PLY_index = 0;					//the current PLY file line
	var ReadingPLYData = false;			//Switch for skipping header
	// console.log("once")
	vertices = null;
	faces = null;
	//console.log("PLY number of lines = " + lines.length);

	for (var i = 0; i < lines.length; i++) {
		////////////////////////////////////////////////////////////////////
		///Parse the Header                                              ///
		////////////////////////////////////////////////////////////////////
		if (!ReadingPLYData) {
			// Read number of vertices stored in the file
			if (lines[i].substr(0, "element vertex".length) == "element vertex") {
				PLY_Vertices = lines[i].split(" ")[2];
			}

			// Read number of faces stored in the file
			if (lines[i].substr(0, "element face".length) == "element face") {
				PLY_Faces = lines[i].split(" ")[2];
			}
			// console.log(lines[i])
			// Finished reading header data, prepare for reading vertex data
			if (lines[i].substr(0, "end_header".length) == "end_header") {
				// console.log("once")			
				// Allocate enough space for vertices
				vertices = new Array(PLY_Vertices);

				// Allocate enough space for faces
				faces = new Array(PLY_Faces);
				// Allocate memory for returned arrays (VAOs)
				arrayVertex = new Array(); // PLY_Vertices * 3
				arrayNormal = new Array(); // PLY_Vertices * 3
				arrayTexture = new Array(); // PLY_Vertices * 2
				arrayColor = new Array(); // PLY_Vertices * 3
				arrayIndex = new Array(); // PLY_Vertices * 1

				ReadingPLYData = true;
			}
		}

		////////////////////////////////////////////////////////////////////
		///Parse the main data                                           ///
		////////////////////////////////////////////////////////////////////
		else {
			var e = lines[i].split(" ");

			////////////////////////////////////////////////////////////////////
			///Parse the Vertices                                            ///
			////////////////////////////////////////////////////////////////////
			if (PLY_index < PLY_Vertices) {
				// Read vertices
				// console.log(e[3])

				vertices[PLY_index] = new PLY_Vertex();
				vertices[PLY_index].x = e[0]; vertices[PLY_index].y = e[1]; vertices[PLY_index].z = e[2];		//position
				// console.log(normal)
				// vertices[PLY_index].nx = normal[0]; vertices[PLY_index].ny = normal[1]; vertices[PLY_index].nz = normal[2];	//normal
				// if(i < 100){
				// 	vertices[PLY_index].nx = 0; vertices[PLY_index].ny = 0; vertices[PLY_index].nz = 1;	//normal
				// } else if (i < 200){

				// 	vertices[PLY_index].nx = 1; vertices[PLY_index].ny = 0; vertices[PLY_index].nz = 0;	//normal
				// }else if(i <300){
				// 	vertices[PLY_index].nx = 0; vertices[PLY_index].ny = 1; vertices[PLY_index].nz = 0;	//normal

				// }
				// console.log(e)
				vertices[PLY_index].u = e[0]/40; vertices[PLY_index].v = e[1]/40;									//texture coords
				vertices[PLY_index].r = e[8]; vertices[PLY_index].g = e[9]; vertices[PLY_index].b = e[10];	//color
			}

			////////////////////////////////////////////////////////////////////
			///Parse the Faces                                               ///
			////////////////////////////////////////////////////////////////////
			else {
				// Reset index for building VAOs
				if (PLY_index == PLY_Vertices) {
					console.log("Resetting Index...");
					FaceIndex = 0;
					VAO_VertexIndex = 0;
				}

				

				if (FaceIndex < PLY_Faces) {
					// e[0] is not used; it stores the number of points on the polyhedron
					// we assume that to be 3, and accept no alternative.
					// var tempA = vec3.fromValues(vertices[a].x - vertices[b].x, vertices[a].y - vertices[b].y, vertices[a].z - vertices[b].z);
                    //    var tempB = vec3.fromValues(vertices[a].x - vertices[c].x, vertices[a].y - vertices[c].y, vertices[a].z - vertices[c].z);
                       
                    //    if(FaceIndex < 5) {
                    //        console.log("tempA: " + tempA);
                    //        console.log("tempB: " + tempB);
                    //    }
                       
                    //    vec3.cross(tempA, tempA, tempB);
                    //    vec3.normalize(tempA, tempA);
                    //    if(FaceIndex < 5) {
                    //        console.log("tempA: " + tempA);
                    //        console.log("tempA.x: " + tempA[0]);
                    //        console.log("tempA.y: " + tempA[1]);
                    //        console.log("tempA.z: " + tempA[2]);                           
                    //    }

					faces[FaceIndex] = new PLY_Face(e[1], e[2], e[3]);

				}
				FaceIndex++;

			}
			PLY_index++;
		}
	}

	buildTriangleList(true);

	console.log("PLY_Vertices = " + PLY_Vertices + " loaded");
	console.log("PLY_Faces = " + PLY_Faces + " loaded");
	console.log("arrayVertex length = " + arrayVertex.length);
	console.log("arrayNormal length = " + arrayNormal.length);
	console.log("arrayTexture length = " + arrayTexture.length);
	console.log("arrayColor length = " + arrayColor.length);
	console.log("arrayIndex length = " + arrayIndex.length);

	// We now have both complete vertex and face data loaded;
	// return everything we loaded as Float32Array & Uint16Array for index
	modelData = [
		new Float32Array(arrayVertex),
		new Float32Array(arrayNormal),
		new Float32Array(arrayTexture),
		new Float32Array(arrayColor),
		new Uint16Array(arrayIndex)
	];
	processBuffers(true, true, true, idn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                    //
//   ########  ##     ## #### ##       ########     ######## ########  ####    ###    ##    ##  ######   ##       ########  ######    //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##     ##  ##    ## ##   ###   ## ##    ##  ##       ##       ##    ##   //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##     ##  ##   ##   ##  ####  ## ##        ##       ##       ##         //
//   ########  ##     ##  ##  ##       ##     ##       ##    ########   ##  ##     ## ## ## ## ##   #### ##       ######    ######    //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##   ##    ##  ######### ##  #### ##    ##  ##       ##             ##   //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##    ##   ##  ##     ## ##   ### ##    ##  ##       ##       ##    ##   //
//   ########   #######  #### ######## ########        ##    ##     ## #### ##     ## ##    ##  ######   ######## ########  ######    //
//                                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function buildTriangleList() {
	// console.log(faces)
	for (var i = 0; i < faces.length; i++) {
		var a = faces[i].a;
		var b = faces[i].b;
		var c = faces[i].c;

		// vertices
		arrayVertex.push(vertices[a].x); arrayVertex.push(vertices[a].y); arrayVertex.push(vertices[a].z);
		arrayVertex.push(vertices[b].x); arrayVertex.push(vertices[b].y); arrayVertex.push(vertices[b].z);
		arrayVertex.push(vertices[c].x); arrayVertex.push(vertices[c].y); arrayVertex.push(vertices[c].z);

		var norm = getNorm(vertices[a], vertices[b], vertices[c]);

		// normals
		arrayNormal.push(norm[0]); arrayNormal.push(norm[1]); arrayNormal.push(norm[2]);
		arrayNormal.push(norm[0]); arrayNormal.push(norm[1]); arrayNormal.push(norm[2]);
		arrayNormal.push(norm[0]); arrayNormal.push(norm[1]); arrayNormal.push(norm[2]);

		// colors
		arrayColor.push(vertices[a].r); arrayColor.push(vertices[a].g); arrayColor.push(vertices[a].b);
		arrayColor.push(vertices[b].r); arrayColor.push(vertices[b].g); arrayColor.push(vertices[b].b);
		arrayColor.push(vertices[c].r); arrayColor.push(vertices[c].g); arrayColor.push(vertices[c].b);

		// uv
		arrayTexture.push(vertices[a].u); arrayTexture.push(vertices[a].v);
		arrayTexture.push(vertices[b].u); arrayTexture.push(vertices[b].v);
		arrayTexture.push(vertices[c].u); arrayTexture.push(vertices[c].v);

		if(i < 5){
			// console.log(arrayNormal)
		}
		// index
		arrayIndex.push(i);
	}
}




////////////////////////////////////////////////////////////////////////////////////////////////////
///Helper function
///compute triangle norms from three PLY_VERTEX's
////////////////////////////////////////////////////////////////////////////////////////////////////
function getNorm(va, vb, vc) {

	var d1 = vec3.fromValues(va.x - vb.x, va.y - vb.y, va.z - vb.z);
	var d2 = vec3.fromValues(va.x - vc.x, va.y - vc.y, va.z - vc.z);

	// console.log(d1)
	vec3.cross(d1, d1, d2);
	vec3.normalize(d1, d1);

	// console.log(d1)
	// console.log()
	return d1;
}








/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                                         //
//  ########  ##     ## ######## ######## ######## ########     ########  ########   #######   ######  ########  ######   ######  #### ##    ##  ######    //
//  ##     ## ##     ## ##       ##       ##       ##     ##    ##     ## ##     ## ##     ## ##    ## ##       ##    ## ##    ##  ##  ###   ## ##    ##   //
//  ##     ## ##     ## ##       ##       ##       ##     ##    ##     ## ##     ## ##     ## ##       ##       ##       ##        ##  ####  ## ##         //
//  ########  ##     ## ######   ######   ######   ########     ########  ########  ##     ## ##       ######    ######   ######   ##  ## ## ## ##   ####  //
//  ##     ## ##     ## ##       ##       ##       ##   ##      ##        ##   ##   ##     ## ##       ##             ##       ##  ##  ##  #### ##    ##   //
//  ##     ## ##     ## ##       ##       ##       ##    ##     ##        ##    ##  ##     ## ##    ## ##       ##    ## ##    ##  ##  ##   ### ##    ##   //
//  ########   #######  ##       ##       ######## ##     ##    ##        ##     ##  #######   ######  ########  ######   ######  #### ##    ##  ######    // 
//                                                                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function processBuffers(recenter, rescale, randomTexture, idn) {
	/////////////////////////////////////////////////////////////////
	///recenter the model                                         ///
	/////////////////////////////////////////////////////////////////
	var centX = 0; var centY = 0; var centZ = 0;
	if (recenter) {
		for (var i = 0; i < arrayVertex.length / 3; i++) {
			centX += modelData[0][3 * i + 0];
			centY += modelData[0][3 * i + 1];
			centZ += modelData[0][3 * i + 2];
			//console.log("Done Rescaling: centX: " + centX + " centY: " + centY + " centZ: " + centZ);
			//console.log("Done Rescaling: centX: " + arrayVertex[3*i+0] + " centY: " + arrayVertex[3*i+1] + " centZ: " + arrayVertex[3*i+2]);
		}
		centX /= arrayVertex.length / 3;
		centY /= arrayVertex.length / 3;
		centZ /= arrayVertex.length / 3;
	}

	/////////////////////////////////////////////////////////////////
	///rescale the model                                          ///
	/////////////////////////////////////////////////////////////////
	if (rescale) {
		var oldScale = modelScale;
		if (idn == 1) {
			modelScale = 20;
		}
		for (var i = 0; i < arrayVertex.length / 3; i++) {
			// console.log(arrayVertex[3*i] + "   "+modelScale * (modelData[0][3 * i + 0] - centX))
			arrayVertex[3 * i + 0] = modelScale * (modelData[0][3 * i + 0] - centX);
			arrayVertex[3 * i + 1] = modelScale * (modelData[0][3 * i + 1] - centY);
			arrayVertex[3 * i + 2] = modelScale * (modelData[0][3 * i + 2] - centZ);
		}
		modelScale = oldScale;
	}

	/////////////////////////////////////////////////////////////////
	///retexture the model                                        ///
	/////////////////////////////////////////////////////////////////
	if (randomTexture) {
		for (var i = 0; i < arrayTexture.length / 2; i++) {
			// console.log("texture coords: texU: " + modelData[2][2*i+0] + " texV: " + modelData[2][2*i+1]);
			modelData[2][2 * i + 0] = Math.random();
			modelData[2][2 * i + 1] = Math.random();
		}
	}

	/////////////////////////////////////////////////////////////////
	///fill the buffers                                           ///
	/////////////////////////////////////////////////////////////////
	// console.log(modelScale)
	// console.log(arrayVertex)
	// console.log(modelData[0])
	if (idn == 0) {
		doBufferStuff(1);
	} else {
		doBufferStuff(1);
	}
}

function doBufferStuff(part) {
	for (var i = 0; i < part; i++) {
		fileVertexPosBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayVertex), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		fileVertexPosBuffer.itemSize = 3;
		fileVertexPosBuffer.numItems = arrayVertex.length / 3 / part;

		fileVertexNrmBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexNrmBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData[1]), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		fileVertexNrmBuffer.itemSize = 3;
		fileVertexNrmBuffer.numItems = arrayVertex.length / 3 / part;

		fileVertexTexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexTexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData[2]), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		fileVertexTexBuffer.itemSize = 2;
		fileVertexTexBuffer.numItems = arrayTexture.length / 2 / part;

		fileVertexColBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexColBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData[3]), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		fileVertexColBuffer.itemSize = 2;
		fileVertexColBuffer.numItems = arrayTexture.length / 2 / part;

		fileVertexIndBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fileVertexIndBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData[4]), gl.STATIC_DRAW);
		fileVertexIndBuffer.itemSize = 1;
		fileVertexIndBuffer.numItems = arrayIndex.length / part;

		models.push({
			fileVertexPosBuffer,
			fileVertexNrmBuffer,
			fileVertexTexBuffer,
			fileVertexIndBuffer
		})
	}
}











