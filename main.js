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
    vertexNormals: false,
    verticesSize: 1,
    
    
    // CatmullClark
    generationCount: 0,
	iteration: 1,
	applyCatmullClark: function() {
        applyCatmullClark(guiParams.iteration);
    },
    genScale: 1,
    genToShow: 0,
	showGeneration: function() {
        viewer.showGeneration(true, guiParams.genToShow);
    },
    genToRemove: 0,
	clearGeneration: function() {
        viewer.showGeneration(false, guiParams.genToRemove);
    },
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
    guiFace.close();
    guiFace.add(guiParams, 'faceNormals').onChange(bool => {
            viewer.showFaceNormals(bool);
    });
    guiFace.add(guiParams, 'faceOpacity', 0, 1, 0.01).onChange(opacity => {
        viewer.setFaceOpacity(opacity);
    });
    guiFace.addColor(guiParams, 'color').onChange(color => {
        viewer.setFaceColor(color);
    });


const guiEdge = gui.addFolder('Edge');
    guiEdge.close();
    guiEdge.add(guiParams, 'edgeOpacity', 0, 1, 0.001).onChange(opacity => {
        viewer.setEdgeOpacity(opacity);
    });
    guiEdge.add(guiParams, 'showEdges').onChange(bool => {
        viewer.showEdges(bool);
    });


const guiVetex = gui.addFolder('Vertex');
    guiVetex.close();
    guiVetex.add(guiParams, 'showVertices').onChange(bool => {
            viewer.showVertices(bool);
    });
    guiVetex.add(guiParams, 'vertexNormals').onChange(bool => {
        viewer.showVertexNormals(bool);
    });
    let scaleBuff = 1;
    guiVetex.add(guiParams, 'verticesSize', 0.5, 2, 0.05).onChange(scale => {
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
catmullClark.add(guiParams, 'generationCount').name('Generation count').listen().disable();

catmullClark.add(guiParams, 'iteration');
catmullClark.add(guiParams, 'applyCatmullClark').name('Apply');
let scaleGenBuff = 1;
catmullClark.add(guiParams, 'genScale', 0.1, 2, 0.05).onChange(scale => {
        if(scale != 0) {
            if(scaleGenBuff != 1) scaleGenBuff = 1 / scaleGenBuff;
            viewer.setGenVerticesSize(scaleGenBuff);
            viewer.setGenVerticesSize(scale);
            scaleGenBuff = scale;
        }
    });
catmullClark.add(guiParams, 'genToShow');
catmullClark.add(guiParams, 'showGeneration').name('show Generation');
catmullClark.add(guiParams, 'genToRemove');
catmullClark.add(guiParams, 'clearGeneration').name('clear Generation');

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
function applyCatmullClark() {
    const generations = viewer.getCatmullClarkGenerations();
    
    const gen = CatmullClark(dataHandler.mesh, generations);
    
    viewer.setCatmullClarkGenerations(gen);
    
    viewer.updateMeshRenderer();
    
    viewer.clearScene();
    guiParams.generationCount = gen.length-1;
    update();
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
    reset();
}

///////////////////////////////////////////////
// Render function
function render() {
    viewer.render();
}

///////////////////////////////////////////////
// Main loop function
function mainloop() {
    render();
    requestAnimationFrame(mainloop);
}

///////////////////////////////////////////////
// Reset options renderer (when apply catmullclark)
function reset(){
    // face
    viewer.showFaceNormals(guiParams.faceNormals);
    viewer.setFaceOpacity(guiParams.faceOpacity);
    viewer.setFaceColor(guiParams.color);
    
    // Edge
    viewer.setEdgeOpacity(guiParams.edgeOpacity);
    viewer.showEdges(guiParams.showEdges);
    
    // Vertices
    viewer.showVertices(guiParams.showVertices);
    viewer.setVerticesSize(guiParams.verticesSize);
    
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
            // update()
        };
    });
}

listner(); // Add listner
mainloop();







///////////////////////////////////////::::
////////////////////////////////////////////
///////////////////////////////////////////












