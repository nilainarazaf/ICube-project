import * as THREE from './CMapJS/Libs/three.module.js';
import Renderer from './CMapJS/Rendering/Renderer.js';

export default function MeshHandler (mesh, params = {}) {
	const renderer = new Renderer(mesh);
	
	const vertexColor = new THREE.Color(params.vertexColor || 0x4EA6BA);
	const edgeColor = new THREE.Color(params.edgeColor || 0x0A0A20);
	const faceColor = new THREE.Color(params.faceColor || 0x66AABB);
	let vertexSize = params.vertexSize || 0.01; 
	let edgeSize = params.edgeSize || 1.5; 

	let parentObject;
	let verticesMesh, edgesMesh, facesMesh;
	this.initialize = function (params = {}) {
		console.log(params)
		if(params.vertices) {
			renderer.vertices.create({size: vertexSize, color: vertexColor}); 
			verticesMesh = renderer.vertices.mesh;
		}
		if(params.edges) {
			renderer.edges.create({size: edgeSize, color: edgeColor}); 
			edgesMesh = renderer.edges.mesh;
		}
		if(params.faces) {
			renderer.faces.create({color: faceColor, side: THREE.DoubleSide}); 
			facesMesh = renderer.faces.mesh;
		}
	};

	this.addMeshesTo = function (parent) {
		parentObject = parentObject || parent;
		if(verticesMesh) renderer.vertices.addTo(parent);
		if(edgesMesh) renderer.edges.addTo(parent);
		if(facesMesh) renderer.faces.addTo(parent);
	};

	this.setVertexColor = function (color) {
		if(verticesMesh) {
			vertexColor.setHex(color);
			verticesMesh.material.color.setHex(color);
			verticesMesh.material.needsUpdate = true;
		}
	};

	this.setEdgeColor = function (color) {
		if(edgesMesh) {
			edgeColor.setHex(color);
			edgesMesh.material.color.setHex(color);
			edgesMesh.material.needsUpdate = true;
		}
	};

	this.setFaceColor = function (color) {
		if(facesMesh) {
			faceColor.setHex(color);
			facesMesh.material.color.setHex(color);
			facesMesh.material.needsUpdate = true;
		}
	};

	this.resizeVertices = function(size) {
		vertexSize = size;
		renderer.vertices.resize(size);
		this.updateVertices();
	}

	this.resizeEdges = function(size) {
		edgeSize = size;
		renderer.edges.resize(size);
		this.updateEdges();
	}

	this.updateVertices = function() {
		const visible = verticesMesh.visible
		renderer.vertices.update();
		verticesMesh = renderer.vertices.mesh;
		verticesMesh.visible = visible
	};

	this.updateEdges = function() {
		const visible = edgesMesh.visible;
		renderer.edges.update();
		edgesMesh = renderer.edges.mesh;
		edgesMesh.visible = visible;
	};

	this.updateFaces = function() {
		const visible = facesMesh.visible;
		renderer.faces.update();
		facesMesh = renderer.faces.mesh;
		facesMesh.visible = visible;
	}

	this.updateMeshes = function () {
		if(verticesMesh) {
			this.updateVertices();
		}
		if(edgesMesh) {
			this.updateEdges();
		}
		if(facesMesh) {
			this.updateFaces();
		}
	}

	this.vertexVisibility = function (visible) {
		if(verticesMesh)
			verticesMesh.visible = visible
		else if(visible) {
			renderer.vertices.create({size: vertexSize, color: vertexColor}); 
			verticesMesh = renderer.vertices.mesh;
			renderer.vertices.addTo(parentObject);
		}
	}

	this.edgeVisibility = function (visible) {
		if(edgesMesh)
			edgesMesh.visible = visible
		else if(visible) {
			renderer.edges.create({size: edgeSize, color: edgeColor}); 
			edgesMesh = renderer.edges.mesh;
			renderer.edges.addTo(parentObject);
		}
	}

	this.faceVisibility = function (visible) {
		if(facesMesh)
			facesMesh.visible = visible
		else if(visible) {
			renderer.faces.create({color: faceColor}); 
			facesMesh = renderer.faces.mesh;
			renderer.faces.addTo(parentObject);
		}
	}


	this.delete = function () {
		if(verticesMesh) renderer.vertices.delete();
		if(edgesMesh) renderer.edges.delete();
		if(facesMesh) renderer.faces.delete();
	}
}