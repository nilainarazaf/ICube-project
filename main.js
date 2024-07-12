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
    showOriginalEdges: true,
    faceOpacity: 1,
    edgeOpacity: 1,
	faceNormals: false,
    showVertices: true,
    showEdges: true,
    color: 0x0099FF,

    // Vertex
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    change: function(){
        const vertex = new THREE.Vector3(this.positionX, this.positionY, this.positionZ);
        viewer.changeVertexPosition(vertex);
    },

    // CatmullClark
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
const options = gui.addFolder('Options');

options.add(guiParams, 'showOriginalEdges').onChange(bool => {
    if (bool) {
        viewer.showOriginalEdges();
    } else {
        viewer.clearOriginalEdges();
    }
});
options.add(guiParams, 'faceNormals').onChange(bool => {
    if (bool) {
        viewer.showFaceNormals();
    } else {
        viewer.clearFaceNormals();
    }
});
options.add(guiParams, 'showVertices').onChange(bool => {
    if (bool) {
        viewer.showVertices();
    } else {
        viewer.clearVertices();
    }
});
options.add(guiParams, 'faceOpacity', 0, 1, 0.01).onChange(opacity => {
    viewer.setFaceOpacity(opacity);
});
options.add(guiParams, 'edgeOpacity', 0, 1, 0.001).onChange(opacity => {
    viewer.setEdgeOpacity(opacity);
});
options.add(guiParams, 'showEdges').onChange(bool => {
    viewer.showEdges(bool);
});
options.addColor(guiParams, 'color').onChange(color => {
    viewer.setFaceColor(color);
});

const guiVertex = gui.addFolder('Vertex');
guiVertex.add(guiParams, 'positionX', -10, 10, 0.05).onChange( x =>{
    const vertex = new THREE.Vector3(guiParams.positionX, guiParams.positionY, guiParams.positionZ);
        viewer.changeVertexPosition(vertex);
});
guiVertex.add(guiParams, 'positionY', -10, 10, 0.05).onChange( x =>{
    const vertex = new THREE.Vector3(guiParams.positionX, guiParams.positionY, guiParams.positionZ);
        viewer.changeVertexPosition(vertex);
});
guiVertex.add(guiParams, 'positionZ', -10, 10, 0.05).onChange( x =>{
    const vertex = new THREE.Vector3(guiParams.positionX, guiParams.positionY, guiParams.positionZ);
        viewer.changeVertexPosition(vertex);
});


guiVertex.add(guiParams, 'change').name('change');

// CatmullClark
const catmullClark = gui.addFolder('CatmullClark');
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
            
            // Set generation
            const gen = CatmullClark(dataHandler.mesh, 0);
            viewer.setMesh(dataHandler.mesh);
            viewer.genCatmullClark(gen);
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
    let generationIndex = 1;
        
    generationIndex = viewer.catmullClarkGenerations.length;

    const gen = CatmullClark(dataHandler.mesh, generationIndex);
    viewer.setMesh(dataHandler.mesh);
    viewer.genCatmullClark(gen);
    
    reset();

    const cmap = dataHandler.mesh;
    let vertex = cmap.vertex;

    viewer.setMesh(dataHandler.mesh);

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
    
    // viewer.clearVertexNormals()
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
