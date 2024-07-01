import {cutAllEdges, quadrangulateAllFaces, quadrangulateFace} from './CMapJS/Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from './CMapJS/Libs/three.module.js';

class GenCatmullClark {

    generation;

    originalVertices;
    edgeVertices;
    faceVertices;

    weights;

    vertices;

    currentPosition;
    trasnforms;

	constructor(cmap, generation) {
        
        this.generation = generation;
        this.originalVertices = {...cmap.cache(cmap.vertex)};

        this.buildTopology(cmap);
        // this.calculateWeights(cmap);

	}

    // saveWeights(weights){
    //     this.weights = {...weights};
    // }

    saveAllNewVertices(vertices){
        this.vertices = {...vertices};
    }

    // decoupe topologique uniquement
    buildTopology(cmap){
        const faceVerticesCache = [];
	    const edgeVerticesCache = [];
        quadrangulateAllFaces(cmap, 
            vd => {
                faceVerticesCache.push(vd);
            },
            vd => {
                edgeVerticesCache.push(vd);
            });
            
        this.edgeVertices = {...faceVerticesCache};
        this.faceVertices = {...edgeVerticesCache};
        this.saveAllNewVertices(cmap.cache(cmap.vertex));
    }


    calculateWeights(cmap){
        const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;

	const position = cmap.getAttribute(vertex, "position");
	const weights = cmap.addAttribute(vertex, "weight" );

	//contiennet des brins
	const initVerticesCache = [];
	let faceVerticesCache = [];
	let edgeVerticesCache = [];

    Object.assign(initVerticesCache, this.originalVertices);
	Object.assign(edgeVerticesCache, this.edgeVertices);
	Object.assign(faceVerticesCache, this.faceVertices);

	// initialisation des poids à rien
	cmap.foreach(vertex, vd => {
		weights[cmap.cell(vertex, vd)] = {};
	})
	
	// parcourt des sommets initiaux
	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		const n = cmap.degree(vertex, vd);
		// console.log(vd)
		let d0 = vd;
		let d1 = d0;

		do {
			// d0 = ;
			d1 = cmap.phi1[d0]
			// d0 pointe vers un sommet d'arete
			weights[vid][cmap.cell(vertex, d1)] = 2 / (n*n);

			d1 = cmap.phi1[d1]
			// d1 pointe vers un sommet de face
			weights[vid][cmap.cell(vertex, d1)] = 1 / (n*n);


			d0 = cmap.phi1[cmap.phi2[d0]];	
		} while (d0 != vd)

		weights[vid][vid] = (n - 3)/n;
		
	}, {cache: initVerticesCache})

	// parcourt des sommets d'arete
	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);

		let d = vd;
		
		do {
			d = cmap.phi2[d];
			weights[vid][cmap.cell(vertex, d)] = 0.25;
			d = cmap.phi1[d];	
		} while (d != vd)
		
	}, {cache: edgeVerticesCache})

	// parcourt des sommets de face
	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);

		const n = cmap.degree(vertex, vd);

		let d0 = vd;
		let d1 = d0;
		do {
			d0 = cmap.phi2[d0];
			d1 = cmap.phi_1[d0]
			weights[vid][cmap.cell(vertex, d1)] = 1 / n;

			d0 = cmap.phi1[d0];	
		} while (d0 != vd)
		
	}, {cache: faceVerticesCache})

        // this.weights = {...weights};
        console.log(weights);
        

    }

	
}

export { GenCatmullClark }