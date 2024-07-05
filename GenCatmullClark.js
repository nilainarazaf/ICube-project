import {cutAllEdges, quadrangulateAllFaces, quadrangulateFace} from './CMapJS/Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from './CMapJS/Libs/three.module.js';

class GenCatmullClark {

    generationId;

    initialVertices;
    edgeVertices;
    faceVertices;

	phi1;
	phi2;
	phi_1;

    weights;

    vertices;

	initialPosition
    currentPosition;
    transforms;

	constructor(cmap, generation = 0) {

		// this.phi1 = {...cmap.phi1}
		
		// console.log(cmap.phi2);
		// console.log(this.phi2);
		// throw new Error();

        this.generationId = generation;

		this.initialVertices = {...cmap.cache(cmap.vertex)};
		let indexGeneration = [];
		
		if(generation == 0){
			const indexGeneration = cmap.addAttribute(cmap.vertex, "indexGeneration");
			
			cmap.foreach(cmap.vertex, vd => {
				indexGeneration[vd] = 0;
			});

			const position = cmap.getAttribute(cmap.vertex, "position");
			
			this.initialPosition = []
			this.currentPosition = []

			// ne pas utiliser des pointeur ici copycopy
			position.forEach(pos => {
				// let thing = pos?.copy();
				// console.log(pos);
				this.initialPosition.push(pos.clone());
				this.currentPosition.push(pos.clone());
			} )
			// console.log(this.initialPosition);
			
			this.vertices = {...cmap.cache(cmap.vertex)};
			
		} else {
			indexGeneration = cmap.getAttribute(cmap.vertex, "indexGeneration");
			
			
			const position = cmap.getAttribute(cmap.vertex, "position");
			this.initialPosition = []
			position.forEach( pos=> {
				this.initialPosition.push(pos.clone());
				// console.log(pos)
			})

			this.buildTopology(cmap);
			
			this.calculateWeights(cmap);
			
			this.buildGeometry(cmap);
			
			cmap.foreach(cmap.vertex, vd => {
				if(!(Object.values(this.initialVertices).includes(vd))){
					indexGeneration[vd] = generation;
				}
			});

			// console.log(position)
		}

		this.phi2 = {...cmap.phi2}
		this.phi_1 = {...cmap.phi_1}
			// throw new Error();
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


		const position = cmap.getAttribute(vertex, "position");
		// console.log(position)


		/// calcul de la géométrie
		const nextGenPosition = {} 

		// initialisation de la mémoire apres subdivs
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			nextGenPosition[vid] = new Vector3();
		});
		
		// d'abord les faces
		for(const [id, vd] of Object.entries(this.faceVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			// console.log(weight);
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(position[vid2], w);
				// console.log(vid, nextGenPosition[vid], w);
			}
			// console.log(nextGenPosition)
		}
		
		// edges
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			
			let d0 = cmap.phi2[vd];
			let d1 = cmap.phi_1[cmap.phi2[cmap.phi_1[vd]]];
			
			nextGenPosition[vid].addScaledVector(position[cmap.cell(vertex, d0)], 0.5);
			nextGenPosition[vid].addScaledVector(position[cmap.cell(vertex, d1)], 0.5);
			// console.log(vd ,nextGenPosition[vid]);
			
		}
		// console.log(nextGenPosition);
		
		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			
			// console.log(weightsCache)
			// console.log(weight)
			for(const [vid2, w] of Object.entries(weight)) {
				
				// console.log(vid2, vid);
				nextGenPosition[vid].addScaledVector(position[vid2] ?? nextGenPosition[vid2], w);
				// nextGenPosition[vid].copy(position[vid]);
			}
			
		}
		
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			nextGenPosition[vid].set(0, 0, 0)
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(position[vid2] ?? nextGenPosition[vid2], w);
			}
			
		}

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			position[vid] ??= new Vector3();
			position[vid].copy(nextGenPosition[vid]);
		});

		this.currentPosition = {...nextGenPosition};
	}

	initTransform(cmap){
		this.transforms = {}
		for(const [vd, pos] of Object.entries(this.initialVertices)) {
			// console.log(vd)
			this.transforms[vd] = new Vector3();
		};
	}

	addTransform(positionIndex, transformVector){
		this.transforms[positionIndex] = transformVector;
		// console.log(positionIndex, this.transforms);
	}


	updatePosition(cmap){
		console.log("generation n :",this.generationId);
		const position = cmap.getAttribute(cmap.vertex, "position");
		
		if(this.generationId == 0){
			for(const [id, vd] of Object.entries(this.vertices)) {
				const vid = cmap.cell(cmap.vertex, vd);
				position[vid].set(0,0,0);
			};
		}
		console.log("transforms befor transform :",this.transforms);
		console.log("initial befor transform :",this.initialPosition);
		for(const [id, transformVector] of Object.entries(this.transforms)) {
			if(this.generationId == 0){
				position[id].copy(this.initialPosition[id])
			}
				// console.log(this.currentPosition[id]);
			position[id].add(transformVector);

			il faut afficher initlia position pas de place pour stocker position actuelle
			// console.log(position[id]);
			la  erreur => this.initialPosition[id].copy(position[id])
			this.currentPosition[id].copy(position[id])
			// console.log(id, transformVector);
			
		};
		console.log("position :",position);
		console.log("curretn pos :",this.currentPosition);
		
		
		// Object.assign(this.currentPosition, position);
		// console.log( this.currentPosition);
		
		// this.updateWeights(cmap);
		// this.updateGeometry(cmap);
		throw new Error();
		
		// console.log("position befor geom :",position)
		if(this.generationId != 0){
			// this.calculateWeights(cmap);
			this.updadad(cmap);
			// this.buildGeometry(cmap);
		}
		// console.log("position after geom :",position)

		this.initTransform(cmap);

		Object.assign(this.currentPosition, position);
		// console.log(this.currentPosition);
	}


	updateCurrentPosition(cmap){
		const position = cmap.getAttribute(cmap.vertex, "position");
		
		for(const [id, transformVector] of Object.entries(this.transforms)) {
			this.currentPosition[id].copy(position[id])
			console.log(this.currentPosition[id]);
			position[id].add(transformVector);
			console.log(position[id]);
			console.log(id, transformVector);
		};
	}






























	updadad(cmap){
		const vertex = cmap.vertex;
		const edge = cmap.edge;
		const face = cmap.face;


		// const weights = cmap.addAttribute(vertex, "weight");
		let weightsCache = {}
		// console.log(weightsCache);

		//contiennet des brins
		// const initVerticesCache = cm ap.cache(vertex);
		// let faceVerticesCache = [];
		// let edgeVerticesCache = [];
			

		// Object.assign(initVerticesCache, this.initialVertices);
		// Object.assign(edgeVerticesCache, this.edgeVertices);
		// Object.assign(faceVerticesCache, this.faceVertices);
		
		weightsCache = Object.assign(this.weights);
		
		// console.log("machinici",weightsCache);
		
		const position = {}

		for(const [id, vd] of Object.entries(this.initialVertices)) {
			position[id] = new Vector3();
			position[id].copy(this.currentPosition[id])
		}
		if(this.generationId == 2){
			console.log(">> position::",this.initialVertices)
			// throw new Error();
		}
		// Object.assign(position, this.currentPosition);
		// console.log(position)
		
		const nextGenPosition = {} 
		// console.log(nextGenPosition);
		
		/// calcul de la géométrie
		
		// initialisation de la mémoire apres subdivs
		for(const [id, vd] of Object.entries(this.vertices)) {
			const vid = cmap.cell(vertex, vd);
			nextGenPosition[vid] = new Vector3();
		};
		
		
		// d'abord les faces
		for(const [id, vd] of Object.entries(this.faceVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			// console.log(weight);
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(position[vid2], w);
				// console.log(vid, nextGenPosition[vid], w);
			}
			// console.log(nextGenPosition)
		}
		
		console.log(position)
		console.log(this.vertices)
		console.log(this.phi2);
		console.log(this.phi_1);
		// edges
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			
			let d0 = this.phi2[vd];
			let d1 = this.phi_1[this.phi2[this.phi_1[vd]]];
			console.log(vd, d0, d1, position[cmap.cell(vertex, d0)]);
			console.log(cmap.cell(vertex, d0), cmap.cell(vertex, cmap.phi1[d0]), d0);
			nextGenPosition[vid].addScaledVector(position[cmap.cell(vertex, d0)], 0.5);
			nextGenPosition[vid].addScaledVector(position[cmap.cell(vertex, d1)], 0.5);
			// console.log(vd ,nextGenPosition[vid]);
			
		}
		// console.log(nextGenPosition);
		
		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			
			// console.log(weightsCache)
			// console.log(weight)

			for(const [vid2, w] of Object.entries(weight)) {
				
				// console.log(vid2, position[vid2], nextGenPosition[vid2], vid2, w);
				nextGenPosition[vid].addScaledVector(position[vid2] ?? nextGenPosition[vid2], w);
				// nextGenPosition[vid].copy(position[vid]);
				console.log(nextGenPosition[vid2]);
			}
			
		}
		
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			nextGenPosition[vid].set(0, 0, 0)
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(position[vid2] ?? nextGenPosition[vid2], w);
			}
		}

		console.log(nextGenPosition);
		// throw new Error();

		const realPos = cmap.getAttribute(cmap.vertex, "position");
		
		for(const [id, vd] of Object.entries(this.vertices)) {
			const vid = cmap.cell(vertex, vd);
			realPos[vid] ??= new Vector3();
			realPos[vid].copy(nextGenPosition[vid]);
		};

		this.currentPosition = {...nextGenPosition};
	}
}

export { GenCatmullClark }