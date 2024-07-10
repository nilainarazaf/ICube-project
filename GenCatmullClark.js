import {cutAllEdges, quadrangulateAllFaces, quadrangulateFace} from './CMapJS/Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from './CMapJS/Libs/three.module.js';

class GenCatmullClark {

    generationId;
	toTransform = false;

    initialVertices;
    edgeVertices;
    faceVertices;

	phi2;
	phi_1;

    weights;

    vertices;

	initialPosition
    transforms;

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
			
			this.initialPosition = []
			this.currentPosition = []

			position.forEach(pos => {
				this.initialPosition.push(pos.clone());
				this.currentPosition.push(pos.clone());
			} )
			
			this.vertices = {...cmap.cache(cmap.vertex)};
			
		} else {
			indexGeneration = cmap.getAttribute(cmap.vertex, "indexGeneration");
			
			
			const position = cmap.getAttribute(cmap.vertex, "position");
			this.initialPosition = []
			position.forEach( pos=> {
				this.initialPosition.push(pos.clone());
			})

			this.buildTopology(cmap);
			
			this.calculateWeights(cmap);
			
			this.buildGeometry(cmap);
			
			cmap.foreach(cmap.vertex, vd => {
				if(!(Object.values(this.initialVertices).includes(vd))){
					indexGeneration[vd] = generation;
				}
			});

		}

		this.phi2 = {...cmap.phi2}
		this.phi_1 = {...cmap.phi_1}

		this.initTransform(cmap);
		

	}

    saveAllNewVertices(vertices){
        this.vertices = {...vertices};
		// vertecies.map(vd=>{return cmpa.cell(vertex, vd)})
    }

    buildTopology(cmap){
        quadrangulateAllFaces(cmap, 
			/// on coupe toutes les aretes en deux
			vd => { 
				edgeVerticesCache.push(vd);
	
	
				/// initialisation des poids du nouveau sommet arête
				const vid = cmap.cell(vertex, vd);
	
	
				/// poids initiaux : sommet arete == milieu de l'arete initiale
				const weightEdge = {};
				weightEdge[cmap.cell(vertex, cmap.phi1[vd])] = 0.5;
				weightEdge[cmap.cell(vertex, cmap.phi_1[vd])] = 0.5;
	
	
				weights[vid] = weightEdge;
			},
			/// on coupe toutes les faces en quads
			vd => { 
				faceVerticesCache.push(vd);
	
	
				// initialisation des poids du nouveau sommet face
				const vid = cmap.cell(vertex, vd);
				const n = cmap.degree(vertex, vd);
	
	
				/// poids initiaux : sommet face = moyenne des points initiaux, ou des points aretes
				/// -> on somme tout les poids des points aretes autour
				const weightFace = {};
	
	
				let d0 = vd; 
				do {
					d0 = cmap.phi2[d0];
					const vid1 = cmap.cell(vertex, d0);
					const weightEdge = weights[vid1];
	
	
					for(const [vid2, w] of Object.entries(weightEdge)) {
						weightFace[vid2] ??= 0; /// si le poids n'existait pas initialisation à 0
						weightFace[vid2] += w / n; 
					}
		
					d0 = cmap.phi1[d0];	
				} while (d0 != vd)
	
	
				weights[vid] = weightFace;
		});
	
	
		/// parcourt des sommets initiaux pour compléter les poids
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			const n = cmap.degree(vertex, vd);
			const n2 = n * n;
	
	
			let d0 = vd;
			// let d1 = d0;
			const weightInit = {};
			weightInit[vid] = (n - 3) / n;
	
	
			do {
				console.log(d0)
				d0 = cmap.phi2[d0];
				console.log(d0)
				const vidEdge = cmap.cell(vertex, d0);
				const weightEdge = weights[vidEdge];
	
	
				const vidFace = cmap.cell(vertex, cmap.phi_1[d0]);
				const weightFace = weights[vidFace];
	
	
				for(const [vid2, w] of Object.entries(weightEdge)) {
					weightInit[vid2] ??= 0; /// si le poids n'existait pas initialisation à 0
					weightInit[vid2] += 2 * w / n2; 
				}
	
	
				for(const [vid2, w] of Object.entries(weightFace)) {
					weightInit[vid2] ??= 0; /// si le poids n'existait pas initialisation à 0
					weightInit[vid2] += w / n2; 
				}
	
	
				d0 = cmap.phi1[d0];
	
	
			} while (d0 != vd)
	
	
			weights[vid] = weightInit;
			
		}, {cache: initVerticesCache})
	
	
	
	
		/// parcourt des sommets aretes pour compléter les poids
		cmap.foreach(vertex, vd => {
			const vidEdge = cmap.cell(vertex, vd);
			const weightEdge = weights[vidEdge];
	
	
			for(const [vid2, w] of Object.entries(weightEdge)) {
				weightEdge[vid2] = w / 2; 
			}
			
			const vidFace0 = cmap.cell(vertex, cmap.phi_1[vd]);
			const vidFace1 = cmap.cell(vertex, cmap.phi2[cmap.phi1[cmap.phi2[vd]]]);
			const weightFace0 = weights[vidFace0];
			const weightFace1 = weights[vidFace1];
	
	
			for(const [vid2, w] of Object.entries(weightFace0)) {
				weightEdge[vid2] ??= 0; /// si le poids n'existait pas initialisation à 0
				weightEdge[vid2] += w / 4; 
			}
	
	
			for(const [vid2, w] of Object.entries(weightFace1)) {
				weightEdge[vid2] ??= 0; /// si le poids n'existait pas initialisation à 0
				weightEdge[vid2] += w / 4; 
			}
			
		}, {cache: edgeVerticesCache})
	
		this.weights = {...this.weights}
    }


	buildGeometry(cmap){
		const vertex = cmap.vertex;
		const edge = cmap.edge;
		const face = cmap.face;

		let weightsCache = {}
		weightsCache = Object.assign(this.weights);

		const position = cmap.getAttribute(vertex, "position");

		const nextGenPosition = {} 

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			nextGenPosition[vid] = new Vector3();
		});
		
		for(const [id, vd] of Object.entries(this.faceVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(position[vid2], w);
			}
		}
		
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			
			let d0 = cmap.phi2[vd];
			let d1 = cmap.phi_1[cmap.phi2[cmap.phi_1[vd]]];
			
			nextGenPosition[vid].addScaledVector(position[cmap.cell(vertex, d0)], 0.5);
			nextGenPosition[vid].addScaledVector(position[cmap.cell(vertex, d1)], 0.5);
			
		}
		
		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(position[vid2] ?? nextGenPosition[vid2], w);
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
		for(const [vd, pos] of Object.entries(this.initialPosition)) {
			this.transforms[vd] = new Vector3();
		};
	}

	addTransform(positionIndex, transformVector){
		this.transforms[positionIndex] = transformVector;
	}


	updatePosition(cmap){

		const currentPosition = cmap.getAttribute(cmap.vertex, "position");
		
		for(const [id, transformVector] of Object.entries(this.transforms)) {
					
			if(this.toTransform){
				this.initialPosition[id].add(transformVector);
				currentPosition[id].copy(this.initialPosition[id]);
			} else {
				currentPosition[id].add(transformVector);
			}
			
		}

		if(this.generationId != 0) {
			this.updateNextGen(cmap);
		}

		this.toTransform = false;
	}



	updateNextGen(cmap){
		const vertex = cmap.vertex;
		const edge = cmap.edge;
		const face = cmap.face;

		let weightsCache = {}
		weightsCache = Object.assign(this.weights);
		
		const currentPosition = cmap.getAttribute(cmap.vertex, "position");
			
		console.log("position", currentPosition)
		const positionCache = {}
		const nextGenPosition = {} 

		for(const [id, vd] of Object.entries(this.initialVertices)) {
			positionCache[id] = new Vector3();
			positionCache[id].copy(currentPosition[id])
		}

		for(const [id, vd] of Object.entries(this.vertices)) {
			const vid = cmap.cell(vertex, vd);
			nextGenPosition[vid] = new Vector3();
		}
		
		
		for(const [id, vd] of Object.entries(this.faceVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(positionCache[vid2], w);
			}
		}
		
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			
			let d0 = this.phi2[vd];
			let d1 = this.phi_1[this.phi2[this.phi_1[vd]]];
			nextGenPosition[vid].addScaledVector(positionCache[cmap.cell(vertex, d0)], 0.5);
			nextGenPosition[vid].addScaledVector(positionCache[cmap.cell(vertex, d1)], 0.5);
			
		}
		
		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			
			for(const [vid2, w] of Object.entries(weight)) {	
				nextGenPosition[vid].addScaledVector(positionCache[vid2] ?? nextGenPosition[vid2], w);
			}
			
		}
		
		for(const [id, vd] of Object.entries(this.edgeVertices)) {
			const vid = cmap.cell(vertex, vd);
			const weight = weightsCache[vid];
			nextGenPosition[vid].set(0, 0, 0)
			for(const [vid2, w] of Object.entries(weight)) {
				nextGenPosition[vid].addScaledVector(positionCache[vid2] ?? nextGenPosition[vid2], w);
			}
		}

		
		for(const [id, vd] of Object.entries(this.vertices)) {
			const vid = cmap.cell(vertex, vd);
			currentPosition[vid] ??= new Vector3();
			currentPosition[vid].copy(nextGenPosition[vid]);
		};

	}
}

export { GenCatmullClark }