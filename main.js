// Import necessary modules
import CMap0 from './CMapJS/CMap/CMap0.js';
import * as THREE from './CMapJS/Libs/three.module.js';
import DataHandler from './DataHandler.js';
import CatmullClark, { catmullClark_inter } from './CMapJS/Modeling/Subdivision/Surface/CatmullClark.js';
import { GUI } from './lil-gui.module.min.js';
import Viewer from './Viewer.js';

///////////////////////////////////////////////
// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize data handler and viewer
const dataHandler = new DataHandler();
const viewer = new Viewer(renderer);
const mousePsoition = new THREE.Vector2();

// vertex edited
const vertex = new THREE.Vector3();

///////////////////////////////////////////////
// Adjust size according to the window
window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    viewer.resize(width, height);
});

///////////////////////////////////////////////
// GUI for setting parameters on the mesh
const guiParams = {
    // file
    loadFile: function() {
        document.getElementById('fileInput').click();
    },
    fileName: "fileName.off",
    content: "", 
    saveFile: function() {
        saveFile();
    },

    // Options
	faceNormals: false,
    faceOpacity: 1,
    color: 0x0099FF,

    edgeOpacity: 1,
    showEdges: true,
    
    showVertices: true,
    verticesSize: 1,
    
    // Vertex
    // positionX: 0,
    // positionY: 0,
    // positionZ: 0,
    // change: function(){
    //     const vertex = new THREE.Vector3(this.positionX, this.positionY, this.positionZ);
    //     viewer.changeVertexPosition(vertex);
    // },
    
    // CatmullClark
    showOriginalEdges: false,
	iteration: 1,
	applyCatmullClark: function() {
        applyCatmullClark(guiParams.iteration);
    },
    reset: function(){
        this.reset();
    }
};

///////////////////////////////////////////////
// Set up the GUI
const gui = new GUI();
gui.domElement.addEventListener('click', function(event) {
    event.stopPropagation();
})

// File
const file = gui.addFolder('File');
file.add(guiParams, 'loadFile').name('Load File');
file.add(guiParams, 'fileName');
file.add(guiParams, 'saveFile').name('Save File');

// Options

const guiFace = gui.addFolder('Face');
guiFace.add(guiParams, 'faceNormals').onChange(bool => {
    if (bool) {
        viewer.showFaceNormals();
    } else {
        viewer.clearFaceNormals();
    }
});
guiFace.add(guiParams, 'faceOpacity', 0, 1, 0.01).onChange(opacity => {
    viewer.setFaceOpacity(opacity);
});
guiFace.addColor(guiParams, 'color').onChange(color => {
    viewer.setFaceColor(color);
});


const guiEdge = gui.addFolder('Edge');
guiEdge.add(guiParams, 'edgeOpacity', 0, 1, 0.001).onChange(opacity => {
    viewer.setEdgeOpacity(opacity);
});
guiEdge.add(guiParams, 'showEdges').onChange(bool => {
    viewer.showEdges(bool);
});


const guiVetex = gui.addFolder('Vertex');
guiVetex.add(guiParams, 'showVertices').onChange(bool => {
    if (bool) {
        viewer.showVertices();
    } else {
        viewer.clearVertices();
    }
});
let scaleBuff = 1;
guiVetex.add(guiParams, 'verticesSize', 1, 5, 0.05).onChange(scale => {
    if(scale != 0) {
        if(scaleBuff != 1) scaleBuff = 1 / scaleBuff;
        viewer.setVerticesSize(scaleBuff);
        viewer.setVerticesSize(scale);
        scaleBuff = scale;
    }
});

// const guiVertex = gui.addFolder('Vertex');
// const transformVectorBuffer = new THREE.Vector3();
// guiVertex.add(guiParams, 'positionX', -10, 10, 0.05).onChange( x =>{
//     const vertex = new THREE.Vector3(guiParams.positionX, guiParams.positionY, guiParams.positionZ);
			
//     if(!transformVectorBuffer){
//         transformVectorBuffer = new THREE.Vector3(0,0,0);
//     }

//     const resetPos = transformVectorBuffer.clone().negate();
//     viewer.changeVertexPosition(resetPos)
    
//     viewer.changeVertexPosition(vertex)
//     transformVectorBuffer.copy(vertex)
// });
// guiVertex.add(guiParams, 'positionY', -10, 10, 0.05).onChange( x =>{
//     const vertex = new THREE.Vector3(guiParams.positionX, guiParams.positionY, guiParams.positionZ);
			
//     if(!transformVectorBuffer){
//         transformVectorBuffer = new THREE.Vector3(0,0,0);
//     }

//     const resetPos = transformVectorBuffer.clone().negate();
//     viewer.changeVertexPosition(resetPos)
    
//     viewer.changeVertexPosition(vertex)
//     transformVectorBuffer.copy(vertex)
// });
// guiVertex.add(guiParams, 'positionZ', -10, 10, 0.05).onChange( x =>{
//     const vertex = new THREE.Vector3(guiParams.positionX, guiParams.positionY, guiParams.positionZ);
			
//     if(!transformVectorBuffer){
//         transformVectorBuffer = new THREE.Vector3(0,0,0);
//     }

//     const resetPos = transformVectorBuffer.clone().negate();
//     viewer.changeVertexPosition(resetPos)
    
//     viewer.changeVertexPosition(vertex)
//     transformVectorBuffer.copy(vertex)

// });


// guiVertex.add(guiParams, 'change').name('change');

// CatmullClark
const catmullClark = gui.addFolder('CatmullClark');
catmullClark.add(guiParams, 'showOriginalEdges').onChange(bool => {
    if (bool) {
        viewer.showOriginalEdges();
    } else {
        viewer.clearOriginalEdges();
    }
});
catmullClark.add(guiParams, 'iteration');
catmullClark.add(guiParams, 'applyCatmullClark').name('Apply');
catmullClark.add(guiParams, 'reset');

///////////////////////////////////////////////
// Handle file input change event
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            guiParams.content = `File content: ${content}`;
            dataHandler.loadMeshFromString(content);
            viewer.initializeMeshRenderer(dataHandler.mesh);
            applyCatmullClark()
            reset();
        };
        reader.readAsText(file);
    }


});

///////////////////////////////////////////////
// Save file function
function saveFile() {
    console.log(guiParams);
    const blob = new Blob([guiParams.content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = guiParams.fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

///////////////////////////////////////////////
// Apply Catmull-Clark subdivision
function applyCatmullClark(iteration = 1) {
    for (let index = 0; index < iteration; index++) {
        let generations = viewer.getCatmullClarkGenerations();

        if(generations.length == 0){
            viewer.setInitalMesh()
        }
        
        const gen = CatmullClark(dataHandler.mesh, generations);
        
        viewer.setCatmullClarkGenerations(gen);
        
        viewer.setMesh(dataHandler.mesh);
    }
    
    viewer.clearScene();
    reset();
    render();
};

///////////////////////////////////////////////
// Show normals function
function showNormal(normal) {
    // const normalVec = new THREE.Vector3(10, 10, 10);
    // viewer.addLine(null, normalVec);
}

///////////////////////////////////////////////
// Update function
function update() {
    // This function can be used to update the scene
}

///////////////////////////////////////////////
// Render function
function render() {
    viewer.render();
}

///////////////////////////////////////////////
// Main loop function
function mainloop() {
    update();
    render();
    requestAnimationFrame(mainloop);
}

///////////////////////////////////////////////
// Reset options renderer (when apply catmullclark)
function reset(){
    if(guiParams.showOriginalEdges){
        viewer.showOriginalEdges();
    } else {
        viewer.clearOriginalEdges();
    }
    viewer.clearFaceNormals();
    if(guiParams.showVertices){
        viewer.clearVertices();
        viewer.showVertices();
    } else {
        viewer.clearVertices();
    }

    viewer.setFaceOpacity(guiParams.faceOpacity);
    viewer.setEdgeOpacity(guiParams.edgeOpacity);
    viewer.showEdges(guiParams.showEdges);
    viewer.setFaceColor(guiParams.color);
    viewer.setVerticesSize(guiParams.verticesSize);
    
    // viewer.clearVertexNormals();
}


///////////////////////////////////////////////
// Initialize mouse movement listener
function listner() {
    window.addEventListener('mousemove', function(e) {
        
        mousePsoition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePsoition.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        const canvasBounds = renderer.domElement.getBoundingClientRect();
        const x = e.clientX - canvasBounds.left;
        const y = e.clientY - canvasBounds.top;
        
        if (x >= 0 && x < canvasBounds.width && y >= 0 && y < canvasBounds.height) {
            viewer.hoverMesh(mousePsoition);
        }
    });
    window.addEventListener('click', function(e) {
        mousePsoition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePsoition.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const canvasBounds = renderer.domElement.getBoundingClientRect();
        const x = e.clientX - canvasBounds.left;
        const y = e.clientY - canvasBounds.top;
        
        if (x >= 0 && x < canvasBounds.width && y >= 0 && y < canvasBounds.height) {
            // console.log(mousePsoition);
            viewer.selectMesh(mousePsoition);
        }
    });
}

listner(); // Add listner
mainloop();
