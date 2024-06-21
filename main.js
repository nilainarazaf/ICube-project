// import CMap0 from './CMapJS/CMap/CMap0.js';
import CMap0 from './CMapJS/CMap/CMap0.js';
import * as THREE from './CMapJS/Libs/three.module.js';
import DataHandler from './DataHandler.js';
import CatmullClark, { catmullClark_inter } from './CMapJS/Modeling/Subdivision/Surface/CatmullClark.js';
import { GUI } from './lil-gui.module.min.js';
import Viewer from './Viewer.js';

///////////////////////////////////////////////
// Set render
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const dataHandler = new DataHandler();
const viewer = new Viewer(renderer);
const mousePsoition = new THREE.Vector2();

///////////////////////////////////////////////
// Set size according the window
window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    viewer.resize(width, height);
});

///////////////////////////////////////////////
// gui for setting parameters on Mesh
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

    position: 1,

	iteration: 1,
	applyCatmullClark: function() {
        applyCatmullClark(guiParams.iteration);
    },
};

///////////////////////////////////////////////
// set gui perform
const gui = new GUI();


const file = gui.addFolder( 'file' );
file.add(guiParams, 'loadFile').name('Load File');
file.add(guiParams, 'fileName')
file.add(guiParams, 'saveFile').name('Save File');

const options = gui.addFolder( 'Options' );
options.add(guiParams, 'faceNormals').onChange( bool => {
    if(bool){
        viewer.showFaceNormals();
    } else {
        viewer.clearFaceNormals();
    }
});
options.add(guiParams, 'showVertex').onChange( bool => {
    if(bool){
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
options.add(guiParams, 'position').onChange(x => {
    viewer.setXPosition(x);
});

const catmullClark = gui.addFolder( 'CatmullClark' );
catmullClark.add(guiParams, 'iteration');
catmullClark.add(guiParams, 'applyCatmullClark').name('apply');

///////////////////////////////////////////////
// action on fileInput
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // console.log(`Selected file: ${file.name}`);
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            guiParams.content = `File content: ${content}`;
            // console.log(guiParams.content);
            dataHandler.loadMeshFromString(content);
            viewer.initializeMeshRenderer(dataHandler.mesh);
        };
        reader.readAsText(file);
    }
});

///////////////////////////////////////////////
// action to saveFile
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
// CatmullClark
function applyCatmullClark(iteration){
	// console.log("DATA MESH");
	// console.log(dataHandler.mesh);

    for (let nbIteration = 0; nbIteration < iteration; nbIteration++) {        
        CatmullClark(dataHandler.mesh, 49, 49);
    }
	// console.log("DATA MESH AFTER CATMULLCLARK 0");
	// console.log(dataHandler.mesh);



    const cmap = dataHandler.mesh;
    let vertex = cmap.vertex;

    const position = cmap.getAttribute(cmap.vertex, "position");
    // console.log("Position");
    // console.log(position);

    const radius = cmap.getAttribute(cmap.vertex, "<refs>");
    // console.log("<refs>");
    // console.log(radius);

    let instanceId = cmap.getAttribute(cmap.dart, "<emb_1>");
    // console.log("<emb_1>");
    // console.log(instanceId);

    instanceId = cmap.getAttribute(cmap.dart, "<topo_d>");
    // console.log("<topo_d>");
    // console.log(instanceId);

    instanceId = cmap.getAttribute(cmap.dart, "<topo_phi1>");
    // console.log("<topo_phi1>");
    // console.log(instanceId);

    instanceId = cmap.getAttribute(cmap.dart, "<topo_phi_1>");
    // console.log("<topo_phi_1>");
    // console.log(instanceId);

    instanceId = cmap.getAttribute(cmap.dart, "<topo_phi2>");
    // console.log("<topo_phi2>");
    // console.log(instanceId);

    // console.log("here your stuff");
    const stuff = cmap.getAttribute(cmap.dart, "<topo_d>");
    // console.log(stuff);
    
    stuff.forEach(vd => {
        // console.log("point: "+vd);
        // console.log("cell: "+cmap.cell(cmap.vertex, vd));
    });

    cmap.foreach(cmap.face ,fid => {
        // if(cmap.cell(cmap.face, fid)){
            // console.log("thing");
        // }
        const instanceId = cmap.getAttribute(cmap.dart, "<topo_d>");
        const idFace = instanceId[cmap.cell(cmap.vertex, fid)];
        position[idFace];
        // console.log(idFace);
        // viewer.showVertex(position[idFace]);
    }, ); 

    viewer.setMesh(dataHandler.mesh);
    render();
};

///////////////////////////////////////////////
// Show Normals
function showNormal(noraml){
    const normal = new THREE.Vector3( 10, 10, 10 );
    // console.log(dataHandler.mesh);
    viewer.addLine(null, normal);
}

///////////////////////////////////////////////
// Things to do on update
function update() {
    // console.log("update")
}

///////////////////////////////////////////////
// Tings to do on renderer
function render() {

    viewer.render();
}

function mainloop() {
    update();
    render();
    requestAnimationFrame(mainloop);
    viewer.showVertex(new THREE.Vector3(0, 0, 0));
    // listner();
}

function first(){
    window.addEventListener('mousemove', function(e) {
        // console.log(mousePsoition.x+", "+mousePsoition.y);
        mousePsoition.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	    mousePsoition.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
        viewer.setVertexPosition(mousePsoition);
    });

    // viewer.setListner(mousePsoition);
}

first();
mainloop();


