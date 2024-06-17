import CMap0 from './CMapJS/CMap/CMap0.js';
import * as THREE from './CMapJS/Libs/three.module.js';
import DataHandler from './DataHandler.js';
import CatmullClark from './CMapJS/Modeling/Subdivision/Surface/CatmullClark.js';
import { GUI } from './lil-gui.module.min.js';
import Viewer from './Viewer.js';

///////////////////////////////////////////////
// Set render
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const dataHandler = new DataHandler();
const viewer = new Viewer(renderer);

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
	normal: false,
    color: 0xffffff,
	iteration: 1,
	applyCatmullClark: function() {
        applyCatmullClark();
    },
};

///////////////////////////////////////////////
// set gui perform
const gui = new GUI();

const file = gui.addFolder( 'file' );
file.add(guiParams, 'loadFile').name('Load File');
file.add(guiParams, 'fileName');
file.add(guiParams, 'saveFile').name('Save File');

const options = gui.addFolder( 'Options' );
options.add(guiParams, 'normal').onChange(opacity => {
    viewer.showNormal();
});
options.add(guiParams, 'faceOpacity', 0, 1, 0.01).onChange(opacity => {
    viewer.setFaceOpacity(opacity);
});
options.add(guiParams, 'edgeOpacity', 0, 1, 0.01).onChange(opacity => {
    viewer.setEdgeOpacity(opacity);
});
options.addColor(guiParams, 'color').onChange(LightColor => {
    console.log(LightColor);
    viewer.setLightColors(LightColor);
});

const catmullClark = gui.addFolder( 'CatmullClark' );
catmullClark.add(guiParams, 'iteration');
catmullClark.add(guiParams, 'applyCatmullClark').name('apply');

// const folder = gui.addFolder( 'Position' );
// folder.add( obj, 'x' );
// folder.add( obj, 'y' );
// folder.add( obj, 'z' );

///////////////////////////////////////////////
// action on fileInput
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        console.log(`Selected file: ${file.name}`);
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            guiParams.content = `File content: ${content}`;
            console.log(guiParams.content);
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
function applyCatmullClark(){
	console.log("DATA MESH");
	console.log(dataHandler.mesh);

	CatmullClark(dataHandler.mesh);
	console.log("DATA MESH AFTER CATMULLCLARK 0");
	console.log(dataHandler.mesh);
	render();
};

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
}

mainloop();
