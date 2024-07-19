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

    // Settings
    // Faces
    showFaces: true,
    faceOpacity: 1,
    faceColor: 0x0099FF,
    
	faceNormals: false,

    // Edges
    showEdges: true,
    edgeOpacity: 1,
    edgeSize: 1,
    edgeColor: 0x010101,

    // Vertices
    showVertices: true,
    verticesOpacity: 1,
    verticesSize: 0.00625,
    verticesColor: 0xff0000,
    
    verticesNormals: false,
    
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
    guiFace.add(guiParams, 'showFaces').onChange(bool => {
        viewer.showFaces(bool);
    });
    
    guiFace.add(guiParams, 'faceOpacity', 0.01, 1, 0.01).onChange(opacity => {
        viewer.setFaceOpacity(opacity);
    });
    guiFace.addColor(guiParams, 'faceColor').onChange(color => {
        viewer.setFaceColor(color);
    });

    guiFace.add(guiParams, 'faceNormals').onChange(bool => {
            viewer.showFaceNormals(bool);
    });


const guiEdge = gui.addFolder('Edge');
    guiEdge.close();
    guiEdge.add(guiParams, 'showEdges').onChange(bool => {
        viewer.showEdges(bool);
    });

    guiEdge.add(guiParams, 'edgeOpacity', 0.01, 1, 0.01).onChange(opacity => {
        viewer.setEdgeOpacity(opacity);
    });
    guiEdge.add(guiParams, 'edgeSize', 0.001, 5, 0.001).onChange(size => {
        viewer.setEdgeSize(size);
    });
    guiEdge.addColor(guiParams, 'edgeColor').onChange(color => {
        viewer.setEdgeColor(color);
    });


const guiVertex = gui.addFolder('Vertex');
    guiVertex.close();
    guiVertex.add(guiParams, 'showVertices').onChange(bool => {
        viewer.showVertices(bool);
    });
    
    guiVertex.add(guiParams, 'verticesOpacity', 0.01, 1, 0.01).onChange(opacity => {
        viewer.setVerticesOpacity(opacity);
    });
    guiVertex.add(guiParams, 'verticesSize', 0.001, 0.2, 0.00001).onChange(size => {
        viewer.setVerticesSize(size);
    });
    guiVertex.addColor(guiParams, 'verticesColor').onChange(color => {
        viewer.setVerticesColor(color);
    });
    
    guiVertex.add(guiParams, 'verticesNormals').onChange(bool => {
        viewer.showVertexNormals(bool);
    });



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
    render();
    requestAnimationFrame(mainloop);
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












