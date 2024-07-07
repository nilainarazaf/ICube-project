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
    }

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

		//contiennet des brins
		const initVerticesCache = cmap.cache(vertex);
		let faceVerticesCache = [];
		let edgeVerticesCache = [];
			
		Object.assign(initVerticesCache, this.initialVertices);
		Object.assign(edgeVerticesCache, this.edgeVertices);
		Object.assign(faceVerticesCache, this.faceVertices);

		cmap.foreach(vertex, vd => {
			weightsCache[cmap.cell(vertex, vd)] = {};
		});

		for(const [id, vd] of Object.entries(this.initialVertices)) {
			const vid = cmap.cell(vertex, vd);
			const n = cmap.degree(vertex, vd);
			let d0 = vd;
			let d1 = d0;
			do {
				d1 = cmap.phi1[d0]
				weightsCache[vid][cmap.cell(vertex, d1)] = 2 / (n*n);

				d1 = cmap.phi1[d1]
				weightsCache[vid][cmap.cell(vertex, d1)] = 1 / (n*n);

				d0 = cmap.phi1[cmap.phi2[d0]];

			} while (d0 != vd)

			weightsCache[vid][vid] = (n - 3)/n;
			
		}

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			let d = vd;
			do {
				d = cmap.phi2[d];
				weightsCache[vid][cmap.cell(vertex, d)] = 0.25;
				d = cmap.phi1[d];	
			} while (d != vd)
				
		}, {cache: edgeVerticesCache})
			
			
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