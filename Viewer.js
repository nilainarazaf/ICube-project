import * as THREE from './CMapJS/Libs/three.module.js';
import Renderer from './CMapJS/Rendering/Renderer.js';
import { OrbitControls } from './CMapJS/Libs/OrbitsControls.js';


export default class Viewer {
	#renderer; // webGL renderer
	#scene;
	#camera;
	#helpers;

	#ambientLight;
	#pointLight;

	#mesh;
	#meshRenderer;

	#faceNormals;
	#vertexNormals;

	#firstIteration = true;

	constructor ( renderer ) {
		this.#renderer = renderer;

		this.#camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100.0 );
		this.#camera.position.set( 0, 0, 2 );

		this.#scene = new THREE.Scene();
		this.#scene.background = new THREE.Color( 0x444444 );

		const ambientLight = new THREE.AmbientLight( 0xAAAAFF, 0.5 );
		this.#scene.add(ambientLight);
		const pointLight = new THREE.PointLight( 0x3137DD, 5 );
		this.#pointLight = pointLight;
		pointLight.position.set(10,8,5);
		this.#scene.add(pointLight);

		new OrbitControls(this.#camera, this.#renderer.domElement);

		this.#helpers = new THREE.Group();
		this.#helpers.add( new THREE.AxesHelper( 1 ));
		this.#scene.add( this.#helpers );

		const dirL = new THREE.DirectionalLight(0xfff, 0.8);
		this.#scene.add(dirL);
		dirL.position.set(10,8,5);

		const DLH = new THREE.DirectionalLightHelper(dirL, 5);
		this.#scene.add(DLH);

	}

	render ( ) {
		this.#renderer.render(this.#scene, this.#camera);
	}

	resize ( width, height ) {
		this.#renderer.setSize( width, height );
		this.#camera.aspect = width / height;
		this.#camera.updateProjectionMatrix();
	}

	initializeMeshRenderer ( mesh ) {
		this.#mesh = mesh;
		this.#meshRenderer = new Renderer( mesh );
		this.#meshRenderer.edges.create();
		this.#meshRenderer.edges.addTo( this.#scene );

		this.#meshRenderer.faces.create();
		this.#meshRenderer.faces.addTo( this.#scene );
	}

	setFaceOpacity(opacity) {
		if (this.#meshRenderer.faces.mesh) {
			this.#meshRenderer.faces.mesh.material.transparent = true;
			this.#meshRenderer.faces.mesh.material.opacity = opacity;
            this.#meshRenderer.faces.mesh.geometry.needUpdate = true;
        }
        this.render();
    }

    setEdgeOpacity(opacity) {
        if (this.#meshRenderer.edges.mesh) {
			this.#meshRenderer.edges.mesh.material.transparent = true;
			this.#meshRenderer.edges.mesh.material.opacity = opacity;
            this.#meshRenderer.edges.mesh.geometry.needUpdate = true;
        }
        this.render();
    }

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

	
	clearFaceNormals() {
		if(this.#faceNormals){
			this.#faceNormals.forEach(helper => {
				this.#scene.remove(helper);
			});
		
			this.#faceNormals = [];
		}
		this.render();
	}

	// Modifiez la fonction showFaceNormals
	showVertexNormals() {
		if (this.#meshRenderer.faces.mesh) {
			const geometry = this.#meshRenderer.faces.mesh.geometry;
			
			geometry.computeVertexNormals();
			
			geometry.vertices.forEach((vertex, index) => {
				// Obtenir la normale du sommet
				const normal = geometry.normals[index].clone(); // Assuming geometry.normals stores the vertex normals
	
				// Créer un ArrowHelper pour visualiser la normale
				const arrowHelper = new THREE.ArrowHelper(normal, vertex, 0.1, 0x00ff00); // 0.1 est la longueur de l'arrow, vert est la couleur
				this.#scene.add(arrowHelper);
	
				// Stocker l'arrowHelper
				this.#vertexNormals.push(arrowHelper);
			});
			
			this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
		}
		this.render();        
	}
	

	
	clearVertexNormals() {
		if(this.#vertexNormals){
			this.#vertexNormals.forEach(helper => {
				this.#scene.remove(helper);
			});
		
			this.#vertexNormals = [];
		}
		this.render();
	}
	

	addLine(from, to){
		const line = [];

		if(from == null){
			line.push( new THREE.Vector3( 0, 0, 0 ) );
		} else {
			line.push( from );
		}
		line.push( to );

		const material = new THREE.LineBasicMaterial( { color: 0x0 } );
		const geometry = new THREE.BufferGeometry().setFromPoints( line );
		this.#scene.add(new THREE.Line( geometry, material ));
		this.render();

	}

	showVertex(dot){
		const geometry = new THREE.SphereGeometry(0.007, 32, 32);
		const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

		const sphere = new THREE.Mesh(geometry, material);
		sphere.position.copy(dot);

		this.#scene.add(sphere);
		this.render();


	}

	setMesh(mesh){
		if(this.#firstIteration){
			this.#firstIteration = false;
		} else {
			this.#meshRenderer.edges.delete();
		}
		this.#meshRenderer.faces.delete();
		this.#mesh = mesh;
		this.initializeMeshRenderer(this.#mesh);
	}


	setListner(mousePsoition){
		const rayCaster = new THREE.Raycaster()

		rayCaster.setFromCamera(mousePsoition, this.#camera);

		const intersects = rayCaster.intersectObjects(this.#scene.children);
		console.log(intersects);

		for (let index = 0; index < intersects.length; index++) {
			if(this.#mesh){
				const cmap = this.#mesh;
				// console.log(this.#mesh);
				console.log("index = "+intersects[index].faceIndex);
				cmap.foreach(cmap.face, fId => {
					// prendre la correspondance avec face;
					if(intersects[index].faceIndex == fId){
						changeColorFace(fId);
						console.log(fId);
					}
				}); 
			} else {
				console.log("no mesh");
			}
			
		}
	}

	changeColorFace(id){
		if (this.#meshRenderer.faces.mesh) {
            let newColor = new THREE.Color(0x00ff00);
            this.#meshRenderer.faces.mesh.geometry.faces[id].color.set(newColor);
            this.#meshRenderer.faces.mesh.geometry.colorsNeedUpdate = true;
        }
        this.render();
	}

}