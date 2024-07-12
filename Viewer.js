// Import necessary modules
import * as THREE from './CMapJS/Libs/three.module.js';
import Renderer from './CMapJS/Rendering/Renderer.js';
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
	#meshColor;

	#originalEdges;

	#faceNormals; // Array to store face normals

	#vertexScale = 1;
	#vertexNormals; // Array to store vertex normals
	#vertices = {}; // Array to store vertex positions

	#intersected; // Variable to store the intersected object

	#selected;
	#raycaster = new THREE.Raycaster(); // Raycaster for mouse interactions

	#catmullClarkGenerations = [];
	#transformVectorCache = {};
	#transformVectorBuffer;

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
	
	// Set the mesh and initialize the renderer
	setMeshRenderer(mesh, original = false) {
		
		if (original) {
			this.#originalEdges = this.#meshRenderer.edges;
		} else {
			// initialize original mesh, only edges
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
		this.render();
	}
	calculerVecteurNormal(pointA, pointB, pointC) {
		// Vecteur AB
		let AB = new THREE.Vector3().subVectors(pointB, pointA);
		
		// Vecteur AC
		let AC = new THREE.Vector3().subVectors(pointC, pointA);
		
		// Produit vectoriel AB x AC
		let normal = new THREE.Vector3().crossVectors(AB, AC).normalize();
		
		return normal;
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

	// Set vertices size
	setVerticesSize(scaleFactor){
		if (this.#vertices) {
			this.#vertexScale = scaleFactor
			const instancedMesh = this.#vertices;		
			const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
	
			position.forEach( (pos, id) => {
	
				const matrix = new THREE.Matrix4();
				instancedMesh.getMatrixAt(id, matrix);
				
				const scaleMatrix = new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor);
				matrix.multiply(scaleMatrix);
				
				instancedMesh.setMatrixAt(id, matrix);

			});
			instancedMesh.instanceMatrix.needsUpdate = true

			// if(this.#GenRenderer){
			// 	for(const [id, gen] of Object.entries(this.#GenRenderer)) {
			// 		const position = this.#catmullClarkGenerations[parseInt(id) +1].initialPosition;
		
			// 		position.forEach( (pos, instanceId) => {
			
			// 			const matrix = new THREE.Matrix4();
			// 			gen.getMatrixAt(instanceId, matrix);
						
			// 			const scaleMatrix = new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor);
			// 			matrix.multiply(scaleMatrix);
						
			// 			gen.setMatrixAt(instanceId, matrix);
	
			// 		});
			// 		gen.instanceMatrix.needsUpdate = true
			// 	}
			// }
			
		}
		this.render();


		
	}

	showVertices(){
		if(this.#vertices){
			this.clearVertices();
		}
		const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
		this.#vertices = this.showVerticesAtPosition(position);
		this.#vertices.finalVertices = true;
		this.render();
	}

	// Show vertices as dots
	showVerticesAtPosition(position, randomColor = false) {
		if (this.#mesh) {
			const geometry = new THREE.SphereGeometry(0.01, 32, 32);
			const material = new THREE.MeshStandardMaterial();
	
			const count = position.length;
			const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
		
	
			const matrix = new THREE.Matrix4();
	
			const verticesIndex = [];
			let color = new THREE.Color(0x0000ff);
			if(randomColor){
				color.setRGB(Math.random(), Math.random(), Math.random())
			}
	
			position.forEach( (pos, id) => {
	
				matrix.makeTranslation(pos.x, pos.y, pos.z);
				
				const scaleMatrix = new THREE.Matrix4().makeScale(2.5, 2.5, 2.5);
				matrix.multiply(scaleMatrix);
				instancedMesh.setMatrixAt(id, matrix);
				
				
				instancedMesh.setColorAt(id, color);
	
				verticesIndex.push(id);
			});
	
			instancedMesh.verticesIndexPosition = verticesIndex;
			instancedMesh.instanceColor.needsUpdate = true;
			
			this.#scene.add(instancedMesh);

			this.setVerticesSize(this.#vertexScale);
			return instancedMesh;
		}
		return null;
	}
	

	// Clear vertices dots
	clearVertices() {
		if (this.#vertices) {
			this.#scene.remove(this.#vertices);
			this.#vertices = null;
		}
		this.render();
	}


	// Show the original edges
	showOriginalEdges(){
		if(this.#originalEdges){
			this.#originalEdges.addTo(this.#scene);
		}
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


	showGeneration(genIndex){
		genIndex++
		if(this.#catmullClarkGenerations.length > 1 && this.#catmullClarkGenerations[genIndex]){
			const position = this.#catmullClarkGenerations[genIndex].initialPosition;
			this.#GenRenderer[genIndex] = this.showVerticesAtPosition(position, true);
			this.#GenRenderer[genIndex].genIndex = genIndex;
			this.#GenRenderer[genIndex].finalVertices = false;
		}
		this.render();
	}
	clearGeneration(genIndex){
		genIndex++;
		if(this.#catmullClarkGenerations.length > 1 && this.#GenRenderer[genIndex]){
			this.#scene.remove(this.#GenRenderer[genIndex])
		}
	}






















	// Set the vertex position based on mouse pointer
	hoverMesh(pointer) {
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);

		let id = 0;

		if(this.#vertices == intersects[ 0 ]?.object || (this.#GenRenderer.includes(intersects[ 0 ]?.object)) && intersects.length > 0){
			const instanceId = intersects[0]?.instanceId;

			if ( ((instanceId != this.#selected?.id)) ) {
				if ( this.#intersected ) this.#intersected.mesh.setColorAt( instanceId, this.#intersected.currentHex );
				this.#intersected = {};
				this.#intersected.mesh = intersects[ 0 ].object
				this.#intersected.id = instanceId;
				
				this.#intersected.currentHex = new THREE.Color();
				this.#intersected.mesh.getColorAt( instanceId, this.#intersected.currentHex );

				const color = new THREE.Color(0xcccccc);
				this.#intersected.mesh.setColorAt( instanceId, color );

				this.#intersected.mesh.instanceColor.needsUpdate = true; 
			}
		} else {
			if ( this.#intersected ) {
				this.#intersected.mesh.setColorAt( this.#intersected.id, this.#intersected.currentHex );
				this.#intersected.mesh.instanceColor.needsUpdate = true;
			}
			this.#intersected = null;
		}

		this.render();
	}

	// select mesh by rayCaster
	selectMesh(pointer){
		this.#raycaster.setFromCamera(pointer, this.#camera);

		const intersects = this.#raycaster.intersectObjects(this.#scene.children, false);
		
		let id = 0;
		
		if(this.#vertices == intersects[ 0 ]?.object || (this.#GenRenderer.includes(intersects[ 0 ]?.object)) && intersects.length > 0){
			const instanceId = intersects[0]?.instanceId;
			console.log("...")
			if ( this.#selected?.id != instanceId ) {
				if ( this.#selected ) this.#selected.mesh.setColorAt( instanceId, this.#intersected.currentHex );
				this.#selected = {'id':instanceId};
				this.#selected.mesh = intersects[ 0 ].object
				console.log(this.#selected);

				this.selectInstance(instanceId);
				
			}
		} else if(intersects[ 0 ]) {
			if ( this.#selected ) {
				
				this.clearScene();
				this.#transformVectorBuffer = null;
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
		this.#scene.add(dummy);
		this.#selected.dummy = dummy;
		
		instancedMesh.getMatrixAt(instanceId, dummy.matrix);
		dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
		
		if(this.#transformVectorBuffer) this.#transformVectorBuffer = null;
		this.#transformControls.attach(dummy);
		
		this.#transformControls.addEventListener('change', () => {
			
			let position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
			
			if(!this.#transformVectorBuffer){
				console.log(this.#selected.dummy.matrix)
				this.#transformVectorBuffer = new THREE.Vector3(0,0,0);
				
				instancedMesh.getMatrixAt(instanceId, this.#selected.dummy.matrix);
				this.#selected.dummy.updateMatrix();

				instancedMesh.setMatrixAt(instanceId, this.#selected.dummy.matrix);
				instancedMesh.instanceMatrix.needsUpdate = true;
			} else {
				console.log("reset here !!")
				
				const resetPos = this.#transformVectorBuffer.clone().negate();
				this.changeVertexPosition(resetPos)
				this.#transformVectorBuffer.set(0,0,0)
				this.#selected.dummy.updateMatrix();

				instancedMesh.setMatrixAt(instanceId, this.#selected.dummy.matrix);
				instancedMesh.instanceMatrix.needsUpdate = true;

				
				const pos = this.#selected.dummy.position
				this.#transformVectorBuffer.set(pos.x, pos.y, pos.z);

				this.#transformVectorBuffer.sub(position[indexPos]);
				this.changeVertexPosition(this.#transformVectorBuffer)
			}
		
			
		});
		this.#transformControls.addEventListener('mouseDown', () => {
			this.#orbitControls.enableRotate = false;
		})
		this.#transformControls.addEventListener('mouseUp', () => {
			this.#orbitControls.enableRotate = true;
		})
	}



































	// transform selected vertex
	changeVertexPosition(transformVector){
		
		const positionIndex = this.#vertices.verticesIndexPosition[this.#selected.id];
		
		const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
		
		const indexGeneration = this.#mesh.getAttribute(this.#mesh.vertex, "indexGeneration");

		let genToUpdate = indexGeneration[positionIndex];
		genToUpdate++; // on met a jour la prochaine generation

		
		// console.log("posId",positionIndex);
		

		if(this.#catmullClarkGenerations.length >= 0 && genToUpdate <= this.#catmullClarkGenerations.length){
			
			if(genToUpdate == 1) genToUpdate = 0; // gen0 cqs pqrticulier
			if(this.#selected.mesh.finalVertices){
				this.#transformVectorCache[positionIndex] = transformVector;
				position[positionIndex].add(transformVector);
			} else {
				this.#catmullClarkGenerations[genToUpdate].addTransform(positionIndex, transformVector);
				this.#catmullClarkGenerations[genToUpdate].toTransform = true;
				while (genToUpdate < this.#catmullClarkGenerations.length) {
					this.#catmullClarkGenerations[genToUpdate].updatePosition(this.#mesh);
					genToUpdate++;
				}
				this.addTransformVectorCache();
			}
		}
		
		

		this.setMeshRenderer(this.#mesh);
		this.clearVertices();
		this.showVertices();
		
		this.render();
	}

	addTransformVectorCache(){
		if(this.#transformVectorCache){
			const position = this.#mesh.getAttribute(this.#mesh.vertex, "position");
			for(const [id, vd] of Object.entries(this.#transformVectorCache)) {
				position[id].add(vd);
			}
		}
	}

	initTransformCache(){
		if(this.#transformVectorCache){
			for(const [id, vd] of Object.entries(this.#transformVectorCache)) {
				vd.set(0,0,0);
			}
		}
	}


	getCatmullClarkGenerations(){
        return this.#catmullClarkGenerations ? this.#catmullClarkGenerations : [];
	}
	setCatmullClarkGenerations(gen){
        this.#catmullClarkGenerations = gen;
		this.initTransformCache();
	}

	clearScene(){
		if(this.#transformControls && this.#selected){
			this.#transformControls.detach();
			this.#scene.remove(this.#selected.dummy);
		}
	}
}