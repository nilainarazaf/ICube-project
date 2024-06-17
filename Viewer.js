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

	constructor ( renderer ) {
		this.#renderer = renderer;

		this.#camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100.0 );
		this.#camera.position.set( 0, 0, 2 );

		this.#scene = new THREE.Scene();
		this.#scene.background = new THREE.Color( 0xdddddd );

		const ambientLight = new THREE.AmbientLight( 0xaaaaaf, 0.5 );
		this.#ambientLight = ambientLight;
		this.#scene.add(ambientLight);
		const pointLight = new THREE.PointLight( 0xffffff, 5 );
		this.#pointLight = pointLight;
		pointLight.position.set(10,8,5);
		this.#scene.add(pointLight);

		new OrbitControls(this.#camera, this.#renderer.domElement);

		this.#helpers = new THREE.Group();
		this.#helpers.add( new THREE.AxesHelper( 1 ));
		this.#scene.add( this.#helpers );

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
		this.#meshRenderer = new Renderer( mesh );
		this.#meshRenderer.edges.create();
		this.#meshRenderer.edges.addTo( this.#scene );

		this.#meshRenderer.faces.create();
		this.#meshRenderer.faces.addTo( this.#scene );
	}

	setFaceOpacity(opacity) {
        if (this.#meshRenderer && this.#meshRenderer.faces) {
            this.#meshRenderer.faces.opacity = opacity;
            this.#meshRenderer.faces.transparent = true;
            this.render();
        }
    }

    setEdgeOpacity(opacity) {
        if (this.#meshRenderer && this.#meshRenderer.edges) {
            this.#meshRenderer.edges.opacity = opacity;
            this.#meshRenderer.edges.transparent = true;
            this.render(); 
        }
    }

    setLightColors(color) {
        this.#ambientLight.color.set(color);
        this.#pointLight.color.set(color);
        this.render();
    }
	showNormal(){
		// this.
	}
}