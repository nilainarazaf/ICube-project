// Import necessary modules
import * as THREE from './CMapJS/Libs/three.module.js';
import Renderer from './CMapJS/Rendering/Renderer.js';
import {GenRenderer} from './CMapJS/Rendering/Renderer.js';
import { OrbitControls } from './CMapJS/Libs/OrbitsControls.js';
import { TransformControls } from './CMapJS/Libs/TransformControls.js';

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
	#vertexNormals; // Array to store vertex normals

	#intersected; // Variable to store the intersected object
	#selected; // Variable to store the selected object

	#raycaster = new THREE.Raycaster(); // Raycaster for mouse interactions

	// Catmull-Clark
	#catmullClarkGenerations = []; // Array to store Catmull-Clark subdivision generations
	#GenRenderer = []; // Array to store generation renderers

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
		this.#helpers.add(new THREE.GridHelper(10, 100));

		// Add trasform controler
		const transformControls = new TransformControls(this.#camera, this.#renderer.domElement);
		this.#transformControls = transformControls;
		this.#scene.add(transformControls);
	}

	// get Array of all generations from CatmullClark
	getCatmullClarkGenerations(){
        return this.#catmullClarkGenerations ? this.#catmullClarkGenerations : [];
	}
	// set Array of all generations from CatmullClark
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
		if(this.#meshRenderer.edges.parent) this.#meshRenderer.edges.update();
		if(this.#meshRenderer.faces.parent) this.#meshRenderer.faces.update();
		if(this.#meshRenderer.vertices.parent) this.#meshRenderer.vertices.update();
	}

	// Remove all from the scene
	removeAll(){
		if(this.#meshRenderer?.edges?.parent) this.#meshRenderer.edges.delete();
		if(this.#meshRenderer?.faces?.parent) this.#meshRenderer.faces.delete();
		if(this.#meshRenderer?.vertices?.parent) this.#meshRenderer.vertices.delete();
		if(this.#GenRenderer) this.removeAllGen();
		this.clearScene();
	}

	// Show all helpers
	showHelpers(){
		if(this.#helpers){
			if(!this.#helpers.parent){
				this.#scene.add(this.#helpers);
			} else {
				this.#scene.remove(this.#helpers);
			}
		}
	}










	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// FACES

	// Show all faces of the current mesh
	showFaces(bool){
		if(bool){
			if (!this.#meshRenderer.faces?.mesh?.parent) {
				this.#meshRenderer.faces.update();
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
				this.#faceNormals = [];
				const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");

				this.#mesh.foreach(this.#mesh.face, vd => {
					
					const n = this.#mesh.degree(this.#mesh.vertex, vd);
					
					let d0 = vd;
					let d1 = d0;
					
					do {
						d0 = this.#mesh.phi2[d0];
						d1 = this.#mesh.phi_1[d0];
						
						const centroid = new THREE.Vector3();
						const neighboringVertices = [];
						let d2 = d1;
						let nbVertex = 0;
						do{
							const pos = position[this.#mesh.cell(this.#mesh.vertex, d2)].clone();
							neighboringVertices.push(pos);
							centroid.add(pos)
							d2 = this.#mesh.phi1[d2];
							nbVertex++;

						} while (d2 != d1);

						centroid.divideScalar(nbVertex);

						let AB = new THREE.Vector3().subVectors(neighboringVertices[0], neighboringVertices[1]);
						let AC = new THREE.Vector3().subVectors(neighboringVertices[0], neighboringVertices[2]);
						let normal = new THREE.Vector3().crossVectors(AB, AC).normalize();
						

						/////////////////////////////////////

						const arrowHelper = new THREE.ArrowHelper(normal, centroid, 0.3, 0xaa0000);
						this.#scene.add(arrowHelper);

						this.#faceNormals.push(arrowHelper);

						/////////////////////////////////////

		
						d0 = this.#mesh.phi1[d0];	
					} while (d0 != vd);					

				});
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

	// Show all edges of the current mesh
	showEdges(bool){
		if(bool){
			if (!this.#meshRenderer.edges?.mesh?.parent) {
				this.#meshRenderer.edges.update();
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

	// Set the size of the mesh edges
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










	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// VERTEX

	// Show all vetices of the current mesh
	showVertices(bool){
		if(bool){
			if (!this.#meshRenderer.vertices?.mesh?.parent) {
				this.#meshRenderer.vertices.update();
			}
			this.#meshRenderer.vertices.addTo(this.#scene);
		} else {
			this.#meshRenderer.vertices.remove();
		}
	}

	// Set the opacity of the mesh vertices
	setVerticesOpacity(opacity){
		if (this.#meshRenderer.vertices.mesh) {
			this.#meshRenderer.vertices.setOpacity(opacity);
			this.#meshRenderer.vertices.update();
		}
		this.render();
	}

	// Set the size of the mesh vertices
	setVerticesSize(size){
		if (this.#meshRenderer.vertices.mesh) {
			this.#meshRenderer.vertices.resize(size);
			this.#meshRenderer.vertices.update();
		}
		this.render();
	}

	// Set the color of the mesh vertices
	setVerticesColor(color){
		if (this.#meshRenderer.vertices.mesh) {
			this.#meshRenderer.vertices.setColor(new THREE.Color(color));
			this.#meshRenderer.vertices.update();
		}
		this.render();
	}

	// Show vertices normals
	showVertexNormals(display = true) {
		if(display) {
			if (this.#meshRenderer.vertices.mesh) {
				this.#vertexNormals = []
				const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");

				this.#mesh.foreach(this.#mesh.vertex, vd => {
					const centroid = position[this.#mesh.cell(this.#mesh.vertex, vd)].clone();
					const neighboringVertices = [];
		
					const n = this.#mesh.degree(this.#mesh.vertex, vd);
		
					let d0 = vd;
					do {
						d0 = this.#mesh.phi2[d0];

						const pos = position[this.#mesh.cell(this.#mesh.vertex, d0)].clone();
						neighboringVertices.push(pos);
						d0 = this.#mesh.phi1[d0];

					} while (d0 != vd);
					
					const AB = new THREE.Vector3().subVectors(neighboringVertices[2], neighboringVertices[1]);
					const AC = new THREE.Vector3().subVectors(neighboringVertices[2], neighboringVertices[0]);
					const normal = new THREE.Vector3().crossVectors(AB, AC).normalize();
					

					/////////////////////////////////////

					const arrowHelper = new THREE.ArrowHelper(normal, centroid, 0.3, 0x00aa00);
					this.#scene.add(arrowHelper);

					this.#vertexNormals.push(arrowHelper);

					/////////////////////////////////////
				});
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










	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// CATMULLCLARK

	// Show generation of subdivision
	showGeneration(display = true, id){
		if(this.#mesh) {
			if(display) {
				if(this.#catmullClarkGenerations.length > 1 
						&& id < this.#catmullClarkGenerations.length - 1
						&& this.#catmullClarkGenerations[id]
						&& (!this.#GenRenderer || !this.#GenRenderer[id])) {

					this.#GenRenderer[id] = GenRenderer(this.#catmullClarkGenerations[id]);

					this.#GenRenderer[id].create({genIndex:id});

					this.#GenRenderer[id].addTo(this.#scene);
					

					this.#GenRenderer[id].mesh.color = this.#GenRenderer[id].params.color;
					
				} else if(this.#GenRenderer[id]){
					this.#GenRenderer[id].addTo(this.#scene);
				}
			} else {
				if(this.#catmullClarkGenerations.length > 1 && this.#GenRenderer[id]){
					this.#GenRenderer[id].remove();
				}
			}
		}
		this.render();
	}

	// Update renderer of generation
	updateGenRenderer(params = undefined){
		this.#GenRenderer.forEach( gen => {
			gen.update();
		});
	}

	// Remove all generations from the scene
	removeAllGen(){
		this.#GenRenderer.forEach( gen => {
			if(gen.parent) gen.remove();
		});
	}

	// Set opacity of all generations
	setGenOpacity(opacity){
		this.#GenRenderer.forEach( gen => {
			gen.setOpacity(opacity);
			gen.update();
		});
	}

	// Set size of all generations
	setGenSize(size){
		this.#GenRenderer.forEach( gen => {
			gen.resize(size);
			gen.update();
		});
	}










	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// INTERACTION


	// Set the vertex color hover by mouse pointer
	hoverMesh(pointer) {
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);

		if((intersects[ 0 ]?.object?.genIndex != undefined) && intersects.length > 0){
			const instanceId = intersects[ 0 ]?.instanceId;

			if ( this.#intersected ) this.#intersected.mesh.setColorAt( instanceId, this.#intersected.color );
			this.#intersected = {
				mesh : intersects[ 0 ].object,
				id : instanceId,
				color : new THREE.Color(),
			};
			this.#intersected.mesh.getColorAt( instanceId, this.#intersected.color );

			
			const color = new THREE.Color(0xffffff);
			this.#intersected.mesh.setColorAt( instanceId, color );

			this.#intersected.mesh.instanceColor.needsUpdate = true; 
		
		} else {
			if ( this.#intersected ) {
				this.#intersected.mesh.setColorAt( this.#intersected.id, this.#intersected.color );
				this.#intersected.mesh.instanceColor.needsUpdate = true;
			}
			this.#intersected = undefined;
		}

		this.render();
	}

	// select mesh by mouse pointer
	selectMesh(pointer){
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
				
		if((intersects[ 0 ]?.object?.genIndex != undefined) && intersects.length > 0){
			const instanceId = intersects[ 0 ]?.instanceId;
			const gen = intersects[ 0 ]?.object.genIndex;
			
			if ( ((gen != this.#selected?.genIndex) && (this.#selected?.mesh.uuid != intersects[ 0 ]?.object.uuid))
				|| (this.#selected?.id != instanceId) ) {

				if ( this.#selected ) this.#selected.mesh.setColorAt( instanceId, this.#intersected.color );
				this.#selected = {
					mesh : intersects[ 0 ].object,
					id : instanceId,
					gen : gen,
				};

				this.selectInstance(instanceId);
				
			}
		} else if(intersects[ 0 ]) {
			if ( this.#selected ) {
				
				this.clearScene();
			}
			this.#selected = null;
			this.#intersected = null;
		}

		this.render();
	}
	
	// Selecte one specific instance of the selected mesh
	selectInstance(instanceId) {
		const indexPos = instanceId;

		const dummy = new THREE.Object3D();
		this.#selected.dummy = dummy;
		this.#scene.add(dummy);
		
		this.#selected.mesh.getMatrixAt(instanceId, dummy.matrix);
		dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
		
		// // add for current mesh trasform
		// const indexGeneration = this.#mesh.getAttribute(this.#mesh.vertex, "indexGeneration");
		// let gen = indexGeneration[indexPos];
		
		const gen = this.#selected.gen;

		const pos0 = this.#catmullClarkGenerations[gen].initialPosition[indexPos];
		
		this.#transformControls.attach(dummy);

		this.#transformControls.addEventListener('objectChange', () => {
			const pos = dummy.position.clone();
			pos.sub(pos0.clone());
			this.changeVertexPosition(pos.clone());

			this.updateMeshRenderer();
			this.updateGenRenderer();
		});

		this.#transformControls.addEventListener('mouseDown', () => {
			this.#orbitControls.enabled = false;
			this.#transformControls.addEventListener('mouseUp', () => {
				this.#orbitControls.enabled = true;
			})
		})
	}

	// Clear the scene from interactions (transforms, normals, etc)
	clearScene(){
		if(this.#transformControls && this.#selected){
			this.#transformControls.detach();
			this.#scene.remove(this.#selected.dummy);
			this.#selected.dummy = undefined;
			this.#selected = undefined;
		}
		this.showFaceNormals(false);
		this.showVertexNormals(false);
	}










	/////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// TRANSFORM

	// transform selected vertex
	changeVertexPosition(transformVector){

		const positionIndex = this.#selected.id;
		
		let genToUpdate = this.#selected.gen;

		if(this.#catmullClarkGenerations.length >= 0 && genToUpdate <= this.#catmullClarkGenerations.length){
			
			this.#catmullClarkGenerations[genToUpdate].addTransform(positionIndex, transformVector);
			this.#catmullClarkGenerations[genToUpdate].toTransform = true;

			while (genToUpdate < this.#catmullClarkGenerations.length) {
				this.#catmullClarkGenerations[genToUpdate].updatePosition(this.#mesh);
				
				genToUpdate++;
				if(this.#catmullClarkGenerations[genToUpdate]) {
					this.#catmullClarkGenerations[genToUpdate].updateInitialPosition(this.#mesh)
				}
			}
		}
	}
}


