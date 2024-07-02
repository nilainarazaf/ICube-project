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
	#meshColor;

	#originalEdges;

	#faceNormals; // Array to store face normals
	#vertexNormals; // Array to store vertex normals
	#vertices = []; // Array to store vertex positions

	#firstIteration = true; // Flag for the first iteration
	#intersected; // Variable to store the intersected object

	#selected;
	#raycaster = new THREE.Raycaster(); // Raycaster for mouse interactions

	#hasBeenChanged = [];
	#transformVector = [];
	#positions_init = [];

	catmullClarkGenerations = [];

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
		const ambientLight = new THREE.AmbientLight(0xAAAAaa, 0.5);
		this.#scene.add(ambientLight);

		// Add point light to the scene
		const pointLight = new THREE.PointLight(0x313131, 5);
		this.#pointLight = pointLight;
		pointLight.position.set(10, 8, 5);
		this.#scene.add(pointLight);

		// Add orbit controls
		new OrbitControls(this.#camera, this.#renderer.domElement);

		// Add helpers (axes helper and directional light helper)
		this.#helpers = new THREE.Group();
		this.#helpers.add(new THREE.AxesHelper(1));
		this.#scene.add(this.#helpers);

		// const dirL = new THREE.DirectionalLight(0xfff, 0.8);
		// this.#scene.add(dirL);
		// dirL.position.set(10, 8, 5);

		// const DLH = new THREE.DirectionalLightHelper(dirL, 5);
		// this.#scene.add(DLH);
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

		// initialize original mesh, only edges
		if(!this.#originalEdges) this.#originalEdges = this.#meshRenderer.edges;

		const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
		this.#positions_init = Object.assign(position);
		// this.#positions_init = position.clone(true);

		if (this.#mesh) {
			this.#mesh.foreach(this.#mesh.vertex, vId => {
				this.#hasBeenChanged.push(false);
				this.#transformVector.push(new THREE.Vector3());
			});
		}

		// const transform = this.#mesh.addAttribute(this.#mesh.vertex, 'transforme');
		// if (this.#mesh) {
		// 	this.#mesh.foreach(this.#mesh.vertex, vId => {
		// 		transform.push(null);
		// 	});
		// }
		// console.log(transform);
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
			// this.#meshRenderer.edges.mesh.geometry.needUpdate = true;
		}
		this.render();
	}

	showEdges(bool){
		if(bool){
			this.#meshRenderer.edges.mesh.scale.set(1, 1, 1);
			this.#meshRenderer.edges.mesh.geometry.needUpdate = true;
		} else {
			this.#meshRenderer.edges.mesh.scale.set(0, 0, 0);
			this.#meshRenderer.edges.mesh.geometry.needUpdate = true;
		}
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

			// const phi1 = cmap.getAttribute(cmap.dart, "<topo_phi_1>");
			// this.#mesh.foreach(this.#mesh.face, fId => {
			// 	console.log(fId);
			// 	const vertexIndex = this.#mesh.cell(this.#mesh.vertex, fId);
			// 	while(vertexIndex != fId){

			// 	}
			// });

			geometry.faces.forEach(face => {
				const centroid = new THREE.Vector3(0, 0, 0);
				
				let id = 0;
				// this.#mesh.cell(vertex, cmap.phi1[d]);
				// this.#mesh.foreachDartOf(this.#mesh.vertex, vd, d => {
				// 	console.log("sommet["+cmap.cell(vertex, cmap.phi2[d])+"] :: ");
				// 	console.log(pos[cmap.cell(vertex, cmap.phi2[d])]);
				// })

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
	// addLine(from, to) {
	// 	const line = [];

	// 	if (from == null) {
	// 		line.push(new THREE.Vector3(0, 0, 0));
	// 	} else {
	// 		line.push(from);
	// 	}
	// 	line.push(to);

	// 	const material = new THREE.LineBasicMaterial({ color: 0x0 });
	// 	const geometry = new THREE.BufferGeometry().setFromPoints(line);
	// 	this.#scene.add(new THREE.Line(geometry, material));
	// 	this.render();
	// }

	// Show vertices as dots
	showVertices() {
		if (this.#mesh) {
			const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
			this.#mesh.foreach(this.#mesh.vertex, vId => {
				this.showVertex(position[this.#mesh.cell(this.#mesh.vertex, vId)], vId);
			});
		}
	}

	// Clear vertices dots
	clearVertices() {
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
		const geometry = new THREE.SphereGeometry(0.01, 32, 32);
		const material = new THREE.MeshStandardMaterial({ color: 0xbb0000 });

		const sphere = new THREE.Mesh(geometry, material);
		sphere.vertexIndex = index;
		sphere.position.copy(dot);

		this.#vertices.push(sphere);
		this.#scene.add(sphere);
		this.render();
	}

	// Show the original edges
	showOriginalEdges(){
		this.#originalEdges.addTo(this.#scene);
		this.render();
	}

	// Clear the original edges from the scene
	clearOriginalEdges(){
		if (this.#originalEdges) {
			this.#scene.remove(this.#originalEdges.mesh);
		}
		this.render();
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
	hoverMesh(pointer) {
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
		
		let id = 0;
		if ( intersects.length > 0 ) {
			if(this.#vertices.includes(intersects[ 0 ].object)){
				if ( (this.#intersected != intersects[ 0 ].object) || ((intersects[ 0 ].object != this.#selected) && this.#selected) ) {
					if ( this.#intersected ) this.#intersected.material.emissive.setHex( this.#intersected.currentHex );
					this.#intersected = intersects[ 0 ].object;
					this.#intersected.currentHex = this.#intersected.material.emissive.getHex();
					this.#intersected.material.emissive.setHex( 0xff0000 );
				}
			}
		} else {
			if ( this.#intersected ) this.#intersected.material.emissive.setHex( this.#intersected.currentHex ); 
			this.#intersected = null;
		}
		this.render();
	}

	// select mesh by rayCaster
	selectMesh(pointer){
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
		
		let id = 0;
		console.log(intersects);
		if ( intersects.length > 0 ) {
			if(this.#vertices.includes(intersects[ 0 ].object)){
				console.log("Selected");
				if ( this.#selected != intersects[ 0 ].object ) {
					if ( this.#selected ) this.#selected.material.emissive.setHex( 0 );
					this.#selected = intersects[ 0 ].object;
					this.#selected.material.emissive.setHex( 0xcccccc );
					if(this.#intersected == this.#selected) {
						this.#intersected.currentHex = this.#selected.material.emissive.getHex();
					}
				}
			}
		} else {
			console.log("Deselected");
			if ( this.#selected ) {
				this.#selected.material.emissive.setHex( 0 );
			}
			this.#selected = null;
		}
		this.render();
	}

	// transform selected vertex
	changeVertexPosition(transformVector){
		
		const vertexIndex = this.#selected.vertexIndex;

		const positionIndex = this.#mesh.cell(this.#mesh.vertex, vertexIndex)
		
		const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
		
		// this.#hasBeenChanged[vertexIndex] = true;
		// this.#transformVector[vertexIndex] = transformVector.clone(); // Cloner le vecteur transformVector
		// position[positionIndex].copy(this.#positions_init[positionIndex])
		

		// position[positionIndex].add(transformVector); // Copier et ajouter le vecteur de transformation
		const indexGeneration = this.#mesh.getAttribute(this.#mesh.vertex, "indexGeneration");

		let genToUpdate = indexGeneration[vertexIndex];
		// console.log(genToUpdate, this.catmullClarkGenerations ,this.catmullClarkGenerations[genToUpdate]);

		if(this.catmullClarkGenerations.length > 0){

			this.catmullClarkGenerations[genToUpdate].addTransform(positionIndex, transformVector);
			while (genToUpdate < this.catmullClarkGenerations.length) {
				this.catmullClarkGenerations[genToUpdate].updatePosition(this.#mesh);
				genToUpdate++;
				console.log(genToUpdate)
			}
		
		}

		

		// console.log(this.#positions_init[positionIndex]);
		// console.log(transformVector);
		// console.log(position[positionIndex]);

		this.setMesh(this.#mesh);
		this.clearVertices();
		this.showVertices();
		
		this.render();
	}

	// If selected vertex has been changed
	vertexTransform(){
		if(this.#selected){
			const vertexIndex = this.#selected.vertexIndex;
			if(this.#hasBeenChanged[vertexIndex]){
				return this.#transformVector[vertexIndex];
			}
		}
	}

	genCatmullClark(gen){
        this.catmullClarkGenerations.push(gen);
		// console.log(this.catmullClarkGenerations);
	}
}
