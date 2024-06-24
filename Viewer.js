// Import necessary modules
import * as THREE from './CMapJS/Libs/three.module.js';
import Renderer from './CMapJS/Rendering/Renderer.js';
import { OrbitControls } from './CMapJS/Libs/OrbitsControls.js';

export default class Viewer {
	#renderer; // WebGL renderer
	#scene; // Three.js scene
	#camera; // Perspective camera
	#helpers; // Group for helper objects

	#ambientLight; // Ambient light in the scene
	#pointLight; // Point light in the scene

	#mesh; // The mesh object
	#meshRenderer; // Renderer for the mesh

	#faceNormals; // Array to store face normals
	#vertexNormals; // Array to store vertex normals
	#vertices = []; // Array to store vertex positions

	#firstIteration = true; // Flag for the first iteration
	#INTERSECTED; // Variable to store the intersected object
	#INTERSECTED_FACE;
	#SELECTED;
	#raycaster = new THREE.Raycaster(); // Raycaster for mouse interactions

	#faceHoverIndex;
	#faceHoverColor;

	#vertexHover;

	constructor(renderer) {
		// Initialize the renderer
		this.#renderer = renderer;

		// Set up the camera
		this.#camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100.0);
		this.#camera.position.set(0, 0, 2);

		// Set up the scene
		this.#scene = new THREE.Scene();
		this.#scene.background = new THREE.Color(0x444444);

		// Add ambient light to the scene
		const ambientLight = new THREE.AmbientLight(0xAAAAFF, 0.5);
		this.#scene.add(ambientLight);

		// Add point light to the scene
		const pointLight = new THREE.PointLight(0x3137DD, 5);
		this.#pointLight = pointLight;
		pointLight.position.set(10, 8, 5);
		this.#scene.add(pointLight);

		// Add orbit controls
		new OrbitControls(this.#camera, this.#renderer.domElement);

		// Add helpers (axes helper and directional light helper)
		this.#helpers = new THREE.Group();
		this.#helpers.add(new THREE.AxesHelper(1));
		this.#scene.add(this.#helpers);

		const dirL = new THREE.DirectionalLight(0xfff, 0.8);
		this.#scene.add(dirL);
		dirL.position.set(10, 8, 5);

		const DLH = new THREE.DirectionalLightHelper(dirL, 5);
		this.#scene.add(DLH);
	}

	// Render the scene
	render() {
		this.#renderer.render(this.#scene, this.#camera);
	}

	// Resize the renderer and update the camera aspect ratio
	resize(width, height) {
		this.#renderer.setSize(width, height);
		this.#camera.aspect = width / height;
		this.#camera.updateProjectionMatrix();
	}

	// Initialize the mesh renderer
	initializeMeshRenderer(mesh) {
		this.#mesh = mesh;
		this.#meshRenderer = new Renderer(mesh);
		this.#meshRenderer.edges.create();
		this.#meshRenderer.edges.addTo(this.#scene);

		this.#meshRenderer.faces.create();
		this.#meshRenderer.faces.addTo(this.#scene);
	}

	// Set the opacity of the mesh faces
	setFaceOpacity(opacity) {
		if (this.#meshRenderer.faces.mesh) {
			this.#meshRenderer.faces.mesh.material.transparent = true;
			this.#meshRenderer.faces.mesh.material.opacity = opacity;
			this.#meshRenderer.faces.mesh.geometry.needUpdate = true;
		}
		this.render();
	}

	// Set the opacity of the mesh edges
	setEdgeOpacity(opacity) {
		if (this.#meshRenderer.edges.mesh) {
			this.#meshRenderer.edges.mesh.material.transparent = true;
			this.#meshRenderer.edges.mesh.material.opacity = opacity;
			this.#meshRenderer.edges.mesh.geometry.needUpdate = true;
		}
		this.render();
	}

	// Set the color of the mesh faces
	setFaceColor(color) {
		if (this.#meshRenderer.faces.mesh) {
			let newColor = new THREE.Color(color);
			this.#meshRenderer.faces.mesh.geometry.faces.forEach(face => {
				face.color.set(newColor);
			});
			this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
		}
		this.render();
	}

	// Show face normals
	showFaceNormals() {
		if (this.#meshRenderer.faces.mesh) {
			const geometry = this.#meshRenderer.faces.mesh.geometry;

			geometry.computeFaceNormals();
			this.#faceNormals = [];
			geometry.faces.forEach(face => {
				const centroid = new THREE.Vector3(0, 0, 0);
				centroid.add(geometry.vertices[face.a]);
				centroid.add(geometry.vertices[face.b]);
				centroid.add(geometry.vertices[face.c]);
				centroid.divideScalar(3);

				const normal = face.normal.clone();
				const arrowHelper = new THREE.ArrowHelper(normal, centroid, 0.3, 0xff0000);
				this.#scene.add(arrowHelper);

				this.#faceNormals.push(arrowHelper);
			});

			this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
		}
		this.render();
	}

	// Clear face normals
	clearFaceNormals() {
		if (this.#faceNormals) {
			this.#faceNormals.forEach(helper => {
				this.#scene.remove(helper);
			});

			this.#faceNormals = [];
		}
		this.render();
	}

	// Show vertex normals
	showVertexNormals() {
		if (this.#meshRenderer.faces.mesh) {
			const geometry = this.#meshRenderer.faces.mesh.geometry;

			geometry.computeVertexNormals();

			geometry.vertices.forEach((vertex, index) => {
				const normal = geometry.normals[index].clone(); // Assuming geometry.normals stores the vertex normals
				const arrowHelper = new THREE.ArrowHelper(normal, vertex, 0.1, 0x00ff00); // 0.1 is the arrow length, green is the color
				this.#scene.add(arrowHelper);
				this.#vertexNormals.push(arrowHelper);
			});

			this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
		}
		this.render();
	}

	// Clear vertex normals
	clearVertexNormals() {
		if (this.#vertexNormals) {
			this.#vertexNormals.forEach(helper => {
				this.#scene.remove(helper);
			});

			this.#vertexNormals = [];
		}
		this.render();
	}

	// Add a line to the scene
	addLine(from, to) {
		const line = [];

		if (from == null) {
			line.push(new THREE.Vector3(0, 0, 0));
		} else {
			line.push(from);
		}
		line.push(to);

		const material = new THREE.LineBasicMaterial({ color: 0x0 });
		const geometry = new THREE.BufferGeometry().setFromPoints(line);
		this.#scene.add(new THREE.Line(geometry, material));
		this.render();
	}

	// Show vertices as dots
	showVertexAsDots() {
		if (this.#mesh) {
			const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
			// console.log(position);
			this.#mesh.foreach(this.#mesh.vertex, vId => {
				console.log(vId);
				this.showVertex(position[this.#mesh.cell(this.#mesh.vertex, vId)], vId);
			});
		}
	}

	// Clear vertex dots
	clearVertexAsDots() {
		if (this.#vertices) {
			this.#vertices.forEach(vertex => {
				this.#scene.remove(vertex);
			});

			this.#vertices = [];
		}
		this.render();
	}

	// Show a single vertex as a dot
	showVertex(dot, index) {
		const geometry = new THREE.SphereGeometry(0.07, 32, 32);
		const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

		const sphere = new THREE.Mesh(geometry, material);
		sphere.vertexIndex = index;
		sphere.position.copy(dot);

		this.#vertices.push(sphere);
		this.#scene.add(sphere);
		this.render();
	}

	// Set the mesh and initialize the renderer
	setMesh(mesh) {
		if (this.#firstIteration) {
			this.#firstIteration = false;
		} else {
			this.#meshRenderer.edges.delete();
		}
		this.#meshRenderer.faces.delete();
		this.#mesh = mesh;
		this.initializeMeshRenderer(this.#mesh);
	}

	// Change the color of a face by its ID
	changeColorFace(id) {
		if (this.#meshRenderer.faces.mesh) {
			let newColor = new THREE.Color(0x00ff00);
			this.#meshRenderer.faces.mesh.geometry.faces[id].color.set(newColor);
			this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
		}
		this.render();
	}

	// Set the vertex position based on mouse pointer
	overShape(pointer) {
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
		
		let id = 0;
		if ( intersects.length > 0 ) {
			// (this.#INTERSECTED != this.#SELECTED && this.#INTERSECTED && this.#SELECTED)
			if ( (this.#INTERSECTED != intersects[ 0 ].object) || ((intersects[ 0 ].object != this.#SELECTED) && this.#SELECTED) ) {
				if ( this.#INTERSECTED ) this.#INTERSECTED.material.emissive.setHex( this.#INTERSECTED.currentHex );
				this.#INTERSECTED = intersects[ 0 ].object;
				this.#INTERSECTED.currentHex = this.#INTERSECTED.material.emissive.getHex();

				this.#INTERSECTED.material.emissive.setHex( 0xff0000 );
			}

		} else {

			if ( this.#INTERSECTED ) this.#INTERSECTED.material.emissive.setHex( this.#INTERSECTED.currentHex ); 

			this.#INTERSECTED = null;

		}
		this.render();
	}

	selectShape(pointer){
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
		
		let id = 0;
		if ( intersects.length > 0 ) {
			console.log("selected");
			if ( this.#SELECTED != intersects[ 0 ].object ) {

				if ( this.#SELECTED ) this.#SELECTED.material.emissive.setHex( 0 );

				this.#SELECTED = intersects[ 0 ].object;
				this.#SELECTED.material.emissive.setHex( 0xeeeeee );
				if(this.#INTERSECTED == this.#SELECTED) {
					this.#INTERSECTED.currentHex = this.#SELECTED.material.emissive.getHex();
				}
			}

		} else {
			console.log("deselected");
			if ( this.#SELECTED ) {
				this.#SELECTED.material.emissive.setHex( 0 );
			}
			this.#SELECTED = null;

		}
		this.render();
	}


	changeVertexPosition(position){
		// console.log(this.#SELECTED.position);
		
		// this.#mesh = 
		position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
		// console.log(this.#SELECTED.vertexIndex);
		const pos = position[this.#mesh.cell(this.#mesh.vertex, this.#SELECTED.vertexIndex)];

		pos.multiplyScalar(1.5);
		this.setMesh(this.#mesh);
		this.clearVertexAsDots();
		this.showVertexAsDots();
		// console.log(this.#SELECTED.position);
		this.render();
	}
}
