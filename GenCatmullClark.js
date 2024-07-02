import {cutAllEdges, quadrangulateAllFaces, quadrangulateFace} from './CMapJS/Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from './CMapJS/Libs/three.module.js';

class GenCatmullClark {

    generationId;

    initialVertices;
    edgeVertices;
    faceVertices;

    weights;

    vertices;

	initialPosition
    currentPosition;
    trasnforms;

	constructor(cmap, generation = 0) {

        this.generationId = generation;

		this.initialVertices = {...cmap.cache(cmap.vertex)};
		let indexGeneration = [];
		
		if(generation == 0){
			const indexGeneration = cmap.addAttribute(cmap.vertex, "indexGeneration");
			
			cmap.foreach(cmap.vertex, vd => {
				indexGeneration[vd] = 0;
			});

			const position = cmap.getAttribute(cmap.vertex, "position");
			this.initialPosition = Object.assign(position);
			this.currentPosition = Object.assign(position);

			this.vertices = {...cmap.cache(cmap.vertex)};
			
		} else {
			indexGeneration = cmap.getAttribute(cmap.vertex, "indexGeneration");

			this.buildTopology(cmap);

			
			this.calculateWeights(cmap);
			
			this.buildGeometry(cmap);

			cmap.foreach(cmap.vertex, vd => {
				if(!(Object.values(this.initialVertices).includes(vd))){
					indexGeneration[vd] = generation;
				}
			});
		}
		this.initTransform(cmap);
		

		// console.log(indexGeneration)
	}

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
		
		const weightsCache = {}
		// console.log(weightsCache);

		//contiennet des brins
		const initVerticesCache = cmap.cache(vertex);
		let faceVerticesCache = [];
		let edgeVerticesCache = [];
			
		Object.assign(initVerticesCache, this.initialVertices);
		Object.assign(edgeVerticesCache, this.edgeVertices);
		Object.assign(faceVerticesCache, this.faceVertices);

		// initialisation des poids à rien
		cmap.foreach(vertex, vd => {
			weightsCache[cmap.cell(vertex, vd)] = {};
		});


		
		// parcourt des sommets initiaux
		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const n = cmap.degree(vertex, vd);
			let d0 = vd;
			let d1 = d0;
			do {
				// d0 = ;
				d1 = cmap.phi1[d0]
				// d0 pointe vers un sommet d'arete
				weightsCache[vid][cmap.cell(vertex, d1)] = 2 / (n*n);

				d1 = cmap.phi1[d1]
				// d1 pointe vers un sommet de face
				weightsCache[vid][cmap.cell(vertex, d1)] = 1 / (n*n);

				d0 = cmap.phi1[cmap.phi2[d0]];

				// console.log(n, weightsCache[vid]);
			} while (d0 != vd)

			weightsCache[vid][vid] = (n - 3)/n;
			
		}

		

		// parcourt des sommets d'arete
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			let d = vd;
			// let count = 0;
			do {
				d = cmap.phi2[d];
				// count++;
				// console.log(weightsCache[vid], count)
				weightsCache[vid][cmap.cell(vertex, d)] = 0.25;
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
				weightsCache[vid][cmap.cell(vertex, d1)] = 1 / n;

				d0 = cmap.phi1[d0];	
			} while (d0 != vd)
			
		}, {cache: faceVerticesCache})

        this.weights = {...weightsCache};        

    }

	buildGeometry(cmap){
		const vertex = cmap.vertex;
		const edge = cmap.edge;
		const face = cmap.face;

		const position = cmap.getAttribute(vertex, "position");
		this.initialPosition = Object.assign(position);

		// const weights = cmap.addAttribute(vertex, "weight");
		let weightsCache = {}
		// console.log(weightsCache);

		//contiennet des brins
		const initVerticesCache = cmap.cache(vertex);
		let faceVerticesCache = [];
		let edgeVerticesCache = [];
			

		Object.assign(initVerticesCache, this.initialVertices);
		Object.assign(edgeVerticesCache, this.edgeVertices);
		Object.assign(faceVerticesCache, this.faceVertices);

		weightsCache = Object.assign(this.weights);

		// console.log("machinici",weightsCache);





		/// calcul de la géométrie
		// const position2 = cmap.addAttribute(vertex, "position" + generation);
		const position2 = {} 

		// initialisation de la mémoire apres subdivs
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			position2[vid] = new Vector3();
		});
		
		// d'abord les faces
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			// console.log(weight);
			for(const [vid2, w] of Object.entries(weight)) {
				position2[vid].addScaledVector(position[vid2], w);
				// console.log(vid, position2[vid], w);
			}
		}, {cache: faceVerticesCache});

		// edges
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			
			let d0 = cmap.phi2[vd];
			let d1 = cmap.phi_1[cmap.phi2[cmap.phi_1[vd]]];
			
			position2[vid].addScaledVector(position[cmap.cell(vertex, d0)], 0.5);
			position2[vid].addScaledVector(position[cmap.cell(vertex, d1)], 0.5);
			// console.log(vd ,position2[vid]);
			
		}, {cache: edgeVerticesCache})
		// console.log(position2);

		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];

			for(const [vid2, w] of Object.entries(weight)) {
				position2[vid].addScaledVector(position[vid2] ?? position2[vid2], w);
				// console.log(position2[vid]);
			}

		}

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			position2[vid].set(0, 0, 0)
			for(const [vid2, w] of Object.entries(weight)) {
				position2[vid].addScaledVector(position[vid2] ?? position2[vid2], w);
			}

		}, {cache: edgeVerticesCache})

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			position[vid] ??= new Vector3();
			position[vid].copy(position2[vid]);
		});

		this.currentPosition = {...position2};
	}

	initTransform(cmap){
		this.trasnforms = {}
		cmap.foreach(cmap.vertex, vd => {
			// console.log(vd)
			this.trasnforms[cmap.cell(cmap.vertex, vd)] = new Vector3();
		});
	}


	addTransform(positionIndex, transformVector){
		this.trasnforms[positionIndex] = transformVector;
		// console.log(positionIndex, this.trasnforms);
	}


	updatePosition(cmap){
		console.log(this.generationId);
		const position = cmap.getAttribute(cmap.vertex, "position");
		
		for(const [id, transformVector] of Object.entries(this.trasnforms)) {
			position[id].copy(this.currentPosition[id])
			position[id].add(transformVector);
		};

		Object.assign(this.currentPosition, position);
		console.log( this.currentPosition);

		// this.updateWeights(cmap);
		// this.updateGeometry(cmap);

		if(this.generationId != 0){
			this.calculateWeights(cmap);
			this.buildGeometry(cmap);
		}

		this.initTransform(cmap);

		Object.assign(this.currentPosition, position);
		// console.log(this.currentPosition);
	}
}

export { GenCatmullClark }