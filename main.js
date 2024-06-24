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
    loadFile: function() {
        document.getElementById('fileInput').click();
    },

    fileName: "fileName.off",
    content: "", 

    saveFile: function() {
        saveFile();
    },

    faceOpacity: 1,
    edgeOpacity: 1,
	faceNormals: false,
    showVertex: false,
    color: 0x3137DD,

    position: 0,

	iteration: 1,
	applyCatmullClark: function() {
        applyCatmullClark(guiParams.iteration);
    },
};

///////////////////////////////////////////////
// Set up the GUI
const gui = new GUI();

// File
const file = gui.addFolder('File');
file.add(guiParams, 'loadFile').name('Load File');
file.add(guiParams, 'fileName');
file.add(guiParams, 'saveFile').name('Save File');

// Options
const options = gui.addFolder('Options');
options.add(guiParams, 'faceNormals').onChange(bool => {
    if (bool) {
        viewer.showFaceNormals();
    } else {
        viewer.clearFaceNormals();
    }
});
options.add(guiParams, 'showVertex').onChange(bool => {
    if (bool) {
        viewer.showVertexAsDots();
    } else {
        viewer.clearVertexAsDots();
    }
});
options.add(guiParams, 'faceOpacity', 0, 1, 0.01).onChange(opacity => {
    viewer.setFaceOpacity(opacity);
});
options.add(guiParams, 'edgeOpacity', 0, 1, 0.01).onChange(opacity => {
    viewer.setEdgeOpacity(opacity);
});
options.addColor(guiParams, 'color').onChange(color => {
    viewer.setFaceColor(color);
});
options.add(guiParams, 'position', -1, 1, 0.1).onChange(position => {
    viewer.changeVertexPosition(position);
});

// CatmullClark
const catmullClark = gui.addFolder('CatmullClark');
catmullClark.add(guiParams, 'iteration');
catmullClark.add(guiParams, 'applyCatmullClark').name('Apply');

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
function applyCatmullClark(iteration) {
    for (let nbIteration = 0; nbIteration < iteration; nbIteration++) {
        CatmullClark(dataHandler.mesh);
    }

    const cmap = dataHandler.mesh;
    let vertex = cmap.vertex;

    const position = cmap.getAttribute(cmap.vertex, "position");
    const ref = cmap.getAttribute(cmap.vertex, "<refs>");
    let buff = cmap.getAttribute(cmap.dart, "<emb_1>");
    buff = cmap.getAttribute(cmap.dart, "<topo_d>");
    buff = cmap.getAttribute(cmap.dart, "<topo_phi1>");
    buff = cmap.getAttribute(cmap.dart, "<topo_phi_1>");
    buff = cmap.getAttribute(cmap.dart, "<topo_phi2>");
    // console.log(buff);

    cmap.foreach(cmap.face, fid => {
        const instanceId = cmap.getAttribute(cmap.dart, "<topo_d>");
        const idFace = instanceId[cmap.cell(cmap.vertex, fid)];
        position[idFace];
    });

    viewer.setMesh(dataHandler.mesh);
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
// Initialize mouse movement listener
function first() {
    window.addEventListener('mousemove', function(e) {
        
        mousePsoition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePsoition.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        const canvasBounds = renderer.domElement.getBoundingClientRect();
        const x = e.clientX - canvasBounds.left;
        const y = e.clientY - canvasBounds.top;
        
        if (x >= 0 && x < canvasBounds.width && y >= 0 && y < canvasBounds.height) {
            viewer.overShape(mousePsoition);
        }
    });
    window.addEventListener('click', function(e) {
        mousePsoition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePsoition.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const canvasBounds = renderer.domElement.getBoundingClientRect();
        const x = e.clientX - canvasBounds.left;
        const y = e.clientY - canvasBounds.top;
        
        if (x >= 0 && x < canvasBounds.width && y >= 0 && y < canvasBounds.height) {
            viewer.selectShape(mousePsoition);
        }
    });
}

first();
mainloop();
