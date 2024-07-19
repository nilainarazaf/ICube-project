// Import necessary modules
import * as THREE from './CMapJS/Libs/three.module.js';
import Renderer from './CMapJS/Rendering/Renderer.js';
import {GenRenderer} from './CMapJS/Rendering/Renderer.js';
import { OrbitControls } from './CMapJS/Libs/OrbitsControls.js';
import { TransformControls } from './CMapJS/Libs/TransformControls.js';
// import { MeshHandler } from './MeshHandler.js';

export default class Viewer {
	#renderer; // WebGL renderer
	#scene; // Three.js scene
	#camera; // Perspective camera
	#helpers; // Group for helper objects
	#transformControls;
	#orbitControls;

	#ambientLight; // Ambient light in the scene
	#pointLight; // Point light in the scene

	#mesh; // The mesh object
	#meshRenderer; // Renderer for the mesh

	#faceNormals; // Array to store face normals

	#vertexMeshScale = 2.5;
	#vertexNormals; // Array to store vertex normals
	#vertices = {}; // Array to store vertex positions

	#intersected; // Variable to store the intersected object

	#selected;
	#raycaster = new THREE.Raycaster(); // Raycaster for mouse interactions

	#catmullClarkGenerations = [];

	#GenRenderer = [];

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
		this.#orbitControls = new OrbitControls(this.#camera, this.#renderer.domElement);

		// Add helpers (axes helper and directional light helper)
		this.#helpers = new THREE.Group();
		this.#helpers.add(new THREE.AxesHelper(1));
		this.#scene.add(this.#helpers);

		// const dirL = new THREE.DirectionalLight(0xfff, 0.8);
		// this.#scene.add(dirL);
		// dirL.position.set(10, 8, 5);

		// const DLH = new THREE.DirectionalLightHelper(dirL, 5);
		// this.#scene.add(DLH);

		// Ajout d'un contrôleur de transformation
		const transformControls = new TransformControls(this.#camera, this.#renderer.domElement);
		this.#transformControls = transformControls;
		this.#scene.add(transformControls);
	}

	getCatmullClarkGenerations(){
        return this.#catmullClarkGenerations ? this.#catmullClarkGenerations : [];
	}
	setCatmullClarkGenerations(gen){
        this.#catmullClarkGenerations = gen;
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
		this.#meshRenderer.vertices.create();
		this.#meshRenderer.vertices.addTo(this.#scene);
	}
	
	// Update the renderer
	updateMeshRenderer() {
		this.#meshRenderer.edges.update();
		this.#meshRenderer.faces.update();
		this.#meshRenderer.vertices.update();
		this.updateVertices();
	}




	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// FACES

	showFaces(bool){
		if(bool){
			if (!this.#meshRenderer.faces.mesh) {
				this.#meshRenderer.faces.create();
			}
			this.#meshRenderer.faces.addTo(this.#scene);
		} else {
			this.#meshRenderer.faces.remove();
		}
	}

	// Set the opacity of the mesh faces
	setFaceOpacity(opacity) {
		if (this.#meshRenderer.faces.mesh) {
			this.#meshRenderer.faces.setOpacity(opacity);
			this.#meshRenderer.faces.update();
		}
		this.render();
	}

	// Set the color of the mesh faces
	setFaceColor(color) {
		if (this.#meshRenderer.faces.mesh) {
			this.#meshRenderer.faces.setColor(new THREE.Color(color));
			this.#meshRenderer.faces.update();
		}
		this.render();
	}

	// Show face normals
	showFaceNormals(display) {
		if(display){
			if (this.#meshRenderer.faces.mesh) {
				this.#faceNormals = []
				const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");

				this.#mesh.foreach(this.#mesh.vertex, vd => {
					const centroid = position[this.#mesh.cell(this.#mesh.vertex, vd)]
					const vertices = []
		
					const n = this.#mesh.degree(this.#mesh.vertex, vd);
		
					let d0 = vd;
					let d1 = d0;
					do {
						d0 = this.#mesh.phi2[d0];
						d1 = this.#mesh.phi_1[d0]
						// centroid.add(position[this.#mesh.cell(this.#mesh.vertex, d1)]);
						vertices.push(position[this.#mesh.cell(this.#mesh.vertex, d1)].clone())
		
						d0 = this.#mesh.phi1[d0];	
					} while (d0 != vd)
					
					// centroid.divideScalar(n);

					const normal = this.calculerVecteurNormal(vertices[2], vertices[1], vertices[0])
					console.log(normal, centroid)
					const arrowHelper = new THREE.ArrowHelper(normal, centroid, 0.3, 0xff0000);
					this.#scene.add(arrowHelper);

					this.#faceNormals.push(arrowHelper);
				});
		
				this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
			}
		} else {
			if (this.#faceNormals) {
				this.#faceNormals.forEach(helper => {
					this.#scene.remove(helper);
				});
				this.#faceNormals = [];
			}
			this.render();
		}
		this.render();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// EDGE

	showEdges(bool){
		if(bool){
			if (!this.#meshRenderer.edges.mesh) {
				this.#meshRenderer.edges.create();
			}
			this.#meshRenderer.edges.addTo(this.#scene);
		} else {
			this.#meshRenderer.edges.remove();
		}
	}

	// Set the opacity of the mesh edges
	setEdgeOpacity(opacity) {
		if(this.#meshRenderer.edges) {
			this.#meshRenderer.edges.setOpacity(opacity);
			this.#meshRenderer.edges.update();
			console.log(this.#meshRenderer.edges)
		}
		this.render();
	}

	// Set the opacity of the mesh edges
	setEdgeSize(size) {
		if(this.#meshRenderer.edges) {
			this.#meshRenderer.edges.resize(size);
			this.#meshRenderer.edges.update();
		}
		this.render();
	}

	// Set the color of the mesh edges
	setEdgeColor(color) {
		if(this.#meshRenderer.edges) {
			this.#meshRenderer.edges.setColor(new THREE.Color(color));
			this.#meshRenderer.edges.update();
		}
		this.render();
	}

	

	

	
	// calculerVecteurNormal(pointA, pointB, pointC) {
	// 	// Vecteur AB
	// 	let AB = new THREE.Vector3().subVectors(pointB, pointA);
		
	// 	// Vecteur AC
	// 	let AC = new THREE.Vector3().subVectors(pointC, pointA);
		
	// 	// Produit vectoriel AB x AC
	// 	let normal = new THREE.Vector3().crossVectors(AB, AC).normalize();
		
	// 	return normal;
	// }

	
	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// VERTEX

	// Show all vetices of the current mesh
	showVertices(bool){
		if(bool){
			if (!this.#meshRenderer.vertices.mesh) {
				this.#meshRenderer.vertices.create();
			}
			this.#meshRenderer.vertices.addTo(this.#scene);
		} else {
			this.#meshRenderer.vertices.remove();
		}
	}

	// Show vertices normals
	showVertexNormals(display) {
		if(display) {
			if (this.#meshRenderer.faces.mesh) {
				this.#faceNormals = []
				const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");

				this.#mesh.foreach(this.#mesh.vertex, vd => {
					const centroid = position[this.#mesh.cell(this.#mesh.vertex, vd)]
					const vertices = []
		
					const n = this.#mesh.degree(this.#mesh.vertex, vd);
		
					let d0 = vd;
					let d1 = d0
					do {
						d0 = this.#mesh.phi2[d0];
						d1 = this.#mesh.phi_1[d0]
						// centroid.add(position[this.#mesh.cell(this.#mesh.vertex, d1)]);
						vertices.push(position[this.#mesh.cell(this.#mesh.vertex, d1)].clone())
		
						d0 = this.#mesh.phi1[d0];
					} while (d0 != vd)
					
					centroid.divideScalar(n);

					const normal = this.calculerVecteurNormal(vertices[0], vertices[1], vertices[2])
					console.log(normal, centroid)
					const arrowHelper = new THREE.ArrowHelper(normal, centroid, 0.3, 0xff0000);
					this.#scene.add(arrowHelper);

					this.#faceNormals.push(arrowHelper);
				});
		
				this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
			}
		} else {
			if (this.#vertexNormals) {
				this.#vertexNormals.forEach(helper => {
					this.#scene.remove(helper);
				});
				this.#vertexNormals = [];
			}
		}
		this.render();
	}

	setVerticesOpacity(opacity){
		if (this.#meshRenderer.vertices.mesh) {
			this.#meshRenderer.vertices.setOpacity(opacity);
			this.#meshRenderer.vertices.update();
		}
		this.render();
	}

	// Set vertices size
	setVerticesSize(size){
		if (this.#meshRenderer.vertices.mesh) {
			this.#meshRenderer.vertices.resize(size);
			this.#meshRenderer.vertices.update();
		}
		this.render();
	}

	setVerticesColor(color){
		if (this.#meshRenderer.vertices.mesh) {
			this.#meshRenderer.vertices.setColor(new THREE.Color(color));
			this.#meshRenderer.vertices.update();
		}
		this.render();
	}

	////////////

	// // Show vertices as dots
	// showVerticesAtPosition(position, randomColor = false, color) {

	// 	if (this.#mesh) {
	// 		const geometry = new THREE.SphereGeometry(0.01, 32, 32);
	// 		const material = new THREE.MeshStandardMaterial();
	
	// 		const count = position.length;
	// 		const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
		
	
	// 		const matrix = new THREE.Matrix4();
	
	// 		const verticesIndex = [];
	// 		if(randomColor){
	// 			color.setRGB(Math.random(), Math.random(), Math.random())
	// 		} 
	
	// 		position.forEach( (pos, id) => {
	
	// 			matrix.makeTranslation(pos.x, pos.y, pos.z);
				
	// 			const scaleMatrix = new THREE.Matrix4().makeScale(2.5, 2.5, 2.5);
	// 			matrix.multiply(scaleMatrix);
	// 			instancedMesh.setMatrixAt(id, matrix);
				
				
	// 			instancedMesh.setColorAt(id, color);
	
	// 			verticesIndex.push(id);
	// 		});
	
	// 		instancedMesh.verticesIndexPosition = verticesIndex;
	// 		instancedMesh.instanceColor.needsUpdate = true;
			
	// 		this.#scene.add(instancedMesh);

	// 		// this.setVerticesSize(this.#vertexMeshScale);
	// 		return instancedMesh;
	// 	}
	// 	return null;
	// }

	updateVertices(){
		this.showVertices(false);
		this.showVertices(true);
	}
	

	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// CATMULLCLARK


	showGeneration(display = true, genIndex){
		if(display) {
			if(this.#catmullClarkGenerations.length > 1 
					&& genIndex < this.#catmullClarkGenerations.length - 1
					&& this.#catmullClarkGenerations[genIndex]) {

				this.#GenRenderer[genIndex] = GenRenderer(this.#catmullClarkGenerations[genIndex]);
				this.#GenRenderer[genIndex].create();
				this.#GenRenderer[genIndex].addTo(this.#scene);
				
				this.#GenRenderer[genIndex].mesh.genIndex = genIndex;
				this.#GenRenderer[genIndex].mesh.color = this.#GenRenderer[genIndex].params.color;
				console.log(this.#GenRenderer[genIndex].mesh)
				console.log(this.#GenRenderer[genIndex].mesh.genIndex)
				
			} else if(this.#GenRenderer[genIndex]){
				this.#GenRenderer[genIndex].addTo(this.#scene);
			}
		} else {
			if(this.#catmullClarkGenerations.length > 1 && this.#GenRenderer[genIndex]){
				this.#GenRenderer[genIndex].remove();
			}
		}
		this.render();
	}

	updateGenRenderer(){
		for(const [id, gen] of Object.entries(this.#GenRenderer) ){
			this.#GenRenderer[genIndex].update();
		}
	}














	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// INTERACTION


	// Set the vertex color hover by mouse pointer
	hoverMesh(pointer) {
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);

		if((intersects[0]?.object?.genIndex) && intersects.length > 0){
			const instanceId = intersects[0]?.instanceId;
			const gen = intersects[0]?.object.genIndex;

				if ( this.#intersected ) this.#intersected.mesh.setColorAt( instanceId, this.#intersected.currentHex );
				this.#intersected = {};
				this.#intersected.mesh = intersects[ 0 ].object
				this.#intersected.id = instanceId;
				
				this.#intersected.currentHex = new THREE.Color();
				this.#intersected.mesh.getColorAt( instanceId, this.#intersected.currentHex );

				const color = new THREE.Color(0xcccccc);
				this.#intersected.mesh.setColorAt( instanceId, color );

				this.#intersected.mesh.instanceColor.needsUpdate = true; 
		
		} else {
			if ( this.#intersected ) {
				this.#intersected.mesh.setColorAt( this.#intersected.id, this.#intersected.currentHex );
				this.#intersected.mesh.instanceColor.needsUpdate = true;
			}
			this.#intersected = null;
		}

		this.render();
	}

	// select mesh by by mouse pointer
	selectMesh(pointer){
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
		
		let id = 0;
		
		if((this.#GenRenderer.includes(intersects[ 0 ]?.object)) && intersects.length > 0){
			const instanceId = intersects[0]?.instanceId;
			const gen = intersects[0]?.object.genIndex
			// console.log("...", instanceId, this.#selected?.id, this.#selected?.mesh, intersects[ 0 ]?.object)
			
			if ( ((gen != this.#selected?.genIndex) && (this.#selected?.mesh.uuid != intersects[ 0 ]?.object.uuid))
				|| (this.#selected?.id != instanceId) ) {
				if ( this.#selected ) this.#selected.mesh.setColorAt( instanceId, this.#intersected.currentHex );
				this.#selected = {'id':instanceId};
				this.#selected.mesh = intersects[ 0 ].object
				// console.log(this.#selected);

				this.selectInstance(instanceId);
				
			}
		} else if(intersects[ 0 ]) {
			if ( this.#selected ) {
				
				this.clearScene();
			}
			this.#selected = null;
			
		}

		this.render();
	}
	
	// Fonction pour sélectionner et manipuler une instance spécifique
	selectInstance(instanceId) {
		const instancedMesh = this.#selected.mesh;

		const indexPos = instancedMesh.verticesIndexPosition[instanceId];

		const dummy = new THREE.Object3D();
		this.#selected.dummy = dummy;
		this.#scene.add(dummy);
		
		
		instancedMesh.getMatrixAt(instanceId, dummy.matrix);
		dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
		
		
		const indexGeneration = this.#mesh.getAttribute(this.#mesh.vertex, "indexGeneration");
		let gen = indexGeneration[indexPos];
		
		if(this.#selected.mesh?.genIndex) gen = this.#selected.mesh.genIndex

		const pos0 = this.#catmullClarkGenerations[gen].initialPosition[indexPos].clone()
		console.log(gen, pos0 , indexPos)
		
		this.#transformControls.attach(dummy);

		this.#transformControls.addEventListener('objectChange', () => {
			// instancedMesh.getMatrixAt(instanceId, dummy.matrix);
			// dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

			// console.log(dummy.matrix)
			const pos = dummy.position.clone();
			pos.sub(pos0.clone());
			this.changeVertexPosition(pos.clone());

			this.updateGenRenderer();
			
		});

		// console.log("new lis")
		this.#transformControls.addEventListener('mouseDown', () => {
			this.#orbitControls.enabled = false;
			this.#transformControls.addEventListener('mouseUp', () => {
				this.#orbitControls.enabled = true;
				// this.#transformControls.removeEventListener('mouseUp')
			})
			// this.#transformControls.removeEventListener('mouseDown')
		})
	}

	clearScene(){
		if(this.#transformControls && this.#selected){
			this.#transformControls.detach();
			this.#scene.remove(this.#selected.dummy);
			this.#selected.dummy = null;
			this.#selected = null;
		}
	}
	


	






	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// TRANSFORM

	// transform selected vertex
	changeVertexPosition(transformVector){

		const positionIndex = this.#vertices.verticesIndexPosition[this.#selected.id];
		
		// const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
		
		const indexGeneration = this.#mesh.getAttribute(this.#mesh.vertex, "indexGeneration");
		let genToUpdate = this.#selected.mesh.genIndex;

		if(this.#catmullClarkGenerations.length >= 0 && genToUpdate <= this.#catmullClarkGenerations.length){
			
			this.#catmullClarkGenerations[genToUpdate].addTransform(positionIndex, transformVector);

			this.#catmullClarkGenerations[genToUpdate].toTransform = true

			while (genToUpdate < this.#catmullClarkGenerations.length) {
				// console.log(this.#catmullClarkGenerations, genToUpdate)
				this.#catmullClarkGenerations[genToUpdate].updatePosition(this.#mesh);
				
				genToUpdate++;
				if(this.#catmullClarkGenerations[genToUpdate]) {
					this.#catmullClarkGenerations[genToUpdate].updateInitialPosition(this.#mesh)
				}
			}
			// console.log(this.#catmullClarkGenerations)
		}
	
		this.updateMeshRenderer();
		this.updateGenRenderer();
		
		this.render();
	}

	
}


