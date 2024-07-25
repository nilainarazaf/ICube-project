
// Import necessary modules
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
let dataHandler = new DataHandler();
let viewer = new Viewer(renderer);
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
    reset: function() {
        viewer.removeAll();
        dataHandler = new DataHandler();
        viewer = new Viewer(renderer);
    },
    // file
    loadFile: function() {
        document.getElementById('fileInput').click();
    },
    fileName: "fileName.off",
    content: "", 
    saveFile: function() {
        saveFile();
    },

    // helpers
    helpers: function(){
        viewer.showHelpers();
    },

    // Settings
    // Faces
    showFaces: true,
    faceOpacity: 1,
    faceColor: 0x0099FF,
    
	facesNormals: false,

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
	applySubdivision: function() {
        applySubdivision(guiParams.subdivision);
    },
    subdivision: 'CatmullClark',

    // Generation
    generation: 0,
    genToShow: 0,
	showGeneration: function() {
        viewer.showGeneration(true, guiParams.genToShow);
    },
    genToRemove: 0,
	clearGeneration: function() {
        viewer.showGeneration(false, guiParams.genToRemove);
        viewer.clearScene();
    },
    removeAllGen: function() {
        viewer.removeAllGen();
        viewer.clearScene();
    },
    genOpacity: 1,
    genSize: 2.5,
    translation: function(){
        viewer.translationMode();
    },
    rotation: function(){
        viewer.rotationMode();
    },

};

///////////////////////////////////////////////
// Set up the GUI
const gui = new GUI();
    gui.domElement.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    gui.add(guiParams, 'reset').name('Reset');

// File
const file = gui.addFolder('File');
    file.add(guiParams, 'loadFile').name('Load File');
    file.add(guiParams, 'fileName').name('file name');
    file.add(guiParams, 'saveFile').name('Save File');

// Helpers
const helpers = gui.addFolder('Helpers');
    helpers.close();
    helpers.add(guiParams, 'helpers');

// Settings
// Faces
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

    guiFace.add(guiParams, 'facesNormals').listen().onChange(bool => {
            viewer.showFaceNormals(bool);
    });

// Edges :
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

// Vetices :
const guiVertex = gui.addFolder('Vertex');
    guiVertex.close();
    guiVertex.add(guiParams, 'showVertices').onChange(bool => {
        viewer.showVertices(bool);
    });
    
    guiVertex.add(guiParams, 'verticesOpacity', 0.01, 1, 0.01).onChange(opacity => {
        viewer.setVerticesOpacity(opacity);
    });
    guiVertex.add(guiParams, 'verticesSize', 0.1, 3, 0.1).onChange(size => {
        viewer.setVerticesSize(size/100);
    });
    guiVertex.addColor(guiParams, 'verticesColor').onChange(color => {
        viewer.setVerticesColor(color);
    });
    
    guiVertex.add(guiParams, 'verticesNormals').listen().onChange(bool => {
        viewer.showVertexNormals(bool);
    });



// CatmullClark
const subdivision = gui.addFolder('Subdivision');

    subdivision.add(guiParams, 'subdivision', ['CatmullClark', 'CatmullClark-Inter', 'Butterfly'])
    subdivision.add(guiParams, 'generationCount').name('Generation count').listen().disable();
    subdivision.add(guiParams, 'applySubdivision').name('Apply');

// Generations
const generation = gui.addFolder('Generation');
    generation.close();
    const showGen = generation.add(guiParams, 'generation', 0, 1, 1).listen().onChange( gen => {
        viewer.clearScene();
        viewer.removeAllGen();
        viewer.showGeneration(true, gen);
    });
    generation.add(guiParams, 'genToShow');
    generation.add(guiParams, 'showGeneration').name('show Generation');
    generation.add(guiParams, 'genToRemove');
    generation.add(guiParams, 'clearGeneration').name('remove Generation');
    generation.add(guiParams, 'removeAllGen').name('Remove all Generations');

const genSettings = gui.addFolder('Generation Setting')
    genSettings.close();
    genSettings.add(guiParams, 'genOpacity', 0.01, 1, 0.01).onChange(opacity => {
        viewer.setGenOpacity(opacity);
    });
    genSettings.add(guiParams, 'genSize', 0.1, 3, 0.1).onChange(size => {
        viewer.setGenSize(size);
    });

const transformControls = gui.addFolder('Control mode');
    transformControls.close();
    transformControls.add(guiParams, 'translation');
    transformControls.add(guiParams, 'rotation');

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
// Apply function
function applySubdivision(sub){
    if(dataHandler.mesh){
        const generations = viewer.getGenerations();
    
        let gen = [];
        switch (sub) {
            case 'CatmullClark':
                gen = CatmullClark(dataHandler.mesh, generations);
                const position = dataHandler.mesh.getAttribute(dataHandler.mesh.vertex, "DQ");
                console.log(position);
                // throw new Error();
                break;

            case 'CatmullClark-Inter':
                catmullClark_inter(dataHandler.mesh);
                break;

            case 'Butterfly':
                // butterfly();
                break;
        
            default:
                break;
        }
        // throw new Error();
        viewer.setGenerations(gen);
        
        guiParams.generationCount = gen.length-1;
        showGen.max(guiParams.generationCount - 1);
        
        update();
    }
    render();
}


///////////////////////////////////////////////
// Update function
function update() {
    viewer.updateMeshRenderer();
    viewer.updateGenRenderer();    
    viewer.clearScene();
    guiParams.facesNormals = false;
    guiParams.verticesNormals = false;
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
            viewer.selectMesh(mousePsoition);
        };
    });
}

listner();
mainloop();







////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////


///////////////////////////////////////////////
// Apply Catmull-Clark subdivision
function applyCatmullClark() {
    if(dataHandler.mesh){
        const generations = viewer.getGenerations();
    
        const gen = CatmullClark(dataHandler.mesh, generations);
        
        viewer.setGenerations(gen);
        
        guiParams.generationCount = gen.length-1;
        showGen.max(guiParams.generationCount - 1);
        
        update();
    }
    render();
};










