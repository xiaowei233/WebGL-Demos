# WebGL-Demos
  This repo consists of work for Course CSE 313 Computer Graphics. Every demo program is written in Javascript and the shaders are written in GLSL. Some of the shaders functionalities (e.g. Forward ray trace testing in ray trace demo is to credit of [LearnWebGL](http://learnwebgl.brown37.net/)).
## 01_Basic
  It coveres how to draw basic shape on the screen using WebGL, all shapes are drwan using one same shader.
## 02_Dynamic Drawing
  Using randomly algorithm-generated spheres, this demo mimics a solar system.
## 03_LoadingExternalFiles
  Using a loader to load external ply models (dolphin and trees from [here](https://people.sc.fsu.edu/~jburkardt/data/ply/ply.html))and draw the model in the scene.
## 04_Light & Specularity
  Two shaders, per-fragment shdaer and per-vertex shaders are used to calculate the light and shadow of objects based on their property such as specularity, different lighting environments are created to provide ambient light, directional light and point light.
## 05_BasicRayTracing
  A extremely simple version of the ray tracing, only works on provided spheres bacause the algorithm written in the shader can only calculate the relative positions of the spheres, but hey, it is still ray tracing and there are reflections everywhere, cool!
## 06_Marching Cube
  Use marching cubes to capture and present a simple sphere, thanks to my professor for providing much of the algorithms used in this demo. 
