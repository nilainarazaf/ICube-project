import {cutAllEdges, quadrangulateAllFaces, quadrangulateFace} from '../../../Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from '../../../Libs/three.module.js';

export default function catmullClark(cmap, generations = []){
	const genIndex = generations.length;
	let gen = null;

	if(genIndex == 0){
		gen = new GenCatmullClark(cmap, genIndex);
		gen.buildNextGeneration(cmap);
		generations.push(gen);

		gen = new GenCatmullClark(cmap, genIndex+1);
		generations.push(gen);
	} else {
		generations[genIndex-1].buildNextGeneration(cmap);

		gen = new GenCatmullClark(cmap, genIndex);
		generations.push(gen);
	}

	return generations;

}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
export function catmullClark_inter(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;

	const pos = cmap.getAttribute(vertex, "position");
	const pos2 = cmap.addAttribute(vertex, "position2");
	const delta = cmap.addAttribute(vertex, "delta");

	const initVerticesCache = cmap.cache(vertex);
	const initEdgesCache = cmap.cache(edge);
	const faceVerticesCache = [];
	const edgeVerticesCache = [];

	quadrangulateAllFaces(cmap, 
		vd => {
			edgeVerticesCache.push(vd);

			let vid = cmap.cell(vertex, vd); 
			pos[vid] = new Vector3();
			cmap.foreachDartOf(vertex, vd, d => { 
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]); 
			});
			pos[vid].multiplyScalar(0.5); 
		},
		vd => {
			faceVerticesCache.push(vd);
			let vid = cmap.cell(vertex, vd);
			let nbEdges = 0;
			pos[vid] = new Vector3();
			cmap.foreachDartOf(vertex, vd, d => {
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
				++nbEdges;
			});
			pos[vid].multiplyScalar(1 / nbEdges);
		});
	
	cmap.foreach(vertex, vd => {
		let nb_f = 0;
		const p2 = new Vector3;
		cmap.foreachDartOf(vertex, vd, d => {
			p2.add(pos[cmap.cell(vertex, cmap.phi1[cmap.phi1[d]])]);
			++nb_f;
		});
		pos2[cmap.cell(vertex, vd)] = p2.divideScalar(nb_f);
	}, {cache: initVerticesCache});

	cmap.foreach(vertex, vd => {
		// let vd = cmap.phi1[ed];
		const p2 = new Vector3;
		const del = new Vector3;
		let d = cmap.phi2[vd];
		del.sub(pos2[cmap.cell(vertex, d)]);
		d = cmap.phi2[cmap.phi1[d]];
		del.add(pos[cmap.cell(vertex, d)]);
		p2.add(pos[cmap.cell(vertex, d)]);
		d = cmap.phi2[cmap.phi1[d]];
		del.sub(pos2[cmap.cell(vertex, d)]);
		d = cmap.phi2[cmap.phi1[d]];
		del.add(pos[cmap.cell(vertex, d)]);
		p2.add(pos[cmap.cell(vertex, d)]);

		pos2[cmap.cell(vertex, vd)] = p2.divideScalar(2);
		delta[cmap.cell(vertex, vd)] = del.divideScalar(4);
	}, {cache: edgeVerticesCache});

	cmap.foreach(vertex, vd => {
		const sum = new Vector3;
		const del = new Vector3;
		let degree = 0;
		cmap.foreachDartOf(vertex, vd, d => {
			++degree;
			sum.addScaledVector(pos2[cmap.cell(vertex, cmap.phi1[d])], 2);
			sum.add(pos2[cmap.cell(vertex, cmap.phi1[cmap.phi1[d]])]);
		});
		del.copy(pos[cmap.cell(vertex, vd)]);
		del.multiplyScalar(-3 * degree);
		del.add(sum);
		del.divideScalar(degree * degree);
		delta[cmap.cell(vertex, vd)] = del;
	}, {cache: faceVerticesCache});


	cmap.foreach(vertex, vd => {
		pos[cmap.cell(vertex, vd)].add(delta[cmap.cell(vertex, vd)]);
	}, {cache: edgeVerticesCache});

	cmap.foreach(vertex, vd => {
		pos[cmap.cell(vertex, vd)].sub(delta[cmap.cell(vertex, vd)]);
	}, {cache: faceVerticesCache});

	pos2.delete();
	delta.delete();
}



/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////


class GenCatmullClark {

    generationId;
	
    initialVertices;
	initialPosition;
	
    weights;
	
	toTransform = false;
    transforms;
	
    vertices;

	constructor(cmap, generation = 0) {

        this.generationId = generation;

		this.initialVertices = {...cmap.cache(cmap.vertex)};
		let indexGeneration = [];
		
		if(generation == 0){
			indexGeneration = cmap.addAttribute(cmap.vertex, "indexGeneration");
		}

		cmap.foreach(cmap.vertex, vd => {
			indexGeneration[cmap.cell(cmap.vertex, vd)] = 0;
		});
		
		const position = cmap.getAttribute(cmap.vertex, "position");
		
		this.initialPosition = []
		this.transforms = []
		
		position.forEach( (pos, id) => {
			this.initialPosition.push(pos.clone());
			
			this.transforms[id] = new Vector3(0,0,0)
		} )

		
		this.vertices = {...cmap.cache(cmap.vertex)};
		
		cmap.foreach(cmap.vertex, vd => {
			if(!(Object.values(this.initialVertices).includes(vd))){
				indexGeneration[cmap.cell(cmap.vertex, vd)] = generation;
			}
		});

		

	}

	buildNextGeneration(cmap){
		this.buildTopology(cmap);
			
		this.buildGeometry(cmap);
		
		const indexGeneration = cmap.getAttribute(cmap.vertex, "indexGeneration");
		cmap.foreach(cmap.vertex, vd => {
			if(!(Object.values(this.initialVertices).includes(vd))){
				indexGeneration[cmap.cell(cmap.vertex, vd)] = this.generationId + 1;
			}
		});

	}


    buildTopology(cmap){
		const vertex = cmap.vertex;

		const initVerticesCache = cmap.cache(vertex);
		const edgeVerticesCache = []
		const faceVerticesCache = []
		const weights = [];

        quadrangulateAllFaces(cmap, 
			vd => { 
				edgeVerticesCache.push(vd);
	
				const vid = cmap.cell(vertex, vd);
	
				const weightEdge = {};
				weightEdge[cmap.cell(vertex, cmap.phi1[vd])] = 0.5;
				weightEdge[cmap.cell(vertex, cmap.phi_1[vd])] = 0.5;
	
	
				weights[vid] = weightEdge;
			},
			vd => { 
				faceVerticesCache.push(vd);
	
	
				const vid = cmap.cell(vertex, vd);
				const n = cmap.degree(vertex, vd);
	
				const weightFace = {};
	
	
				let d0 = vd; 
				do {
					d0 = cmap.phi2[d0];
					const vid1 = cmap.cell(vertex, d0);
					const weightEdge = weights[vid1];
	
	
					for(const [vid2, w] of Object.entries(weightEdge)) {
						weightFace[vid2] ??= 0;
						weightFace[vid2] += w / n; 
					}
		
					d0 = cmap.phi1[d0];	
				} while (d0 != vd)
	
	
				weights[vid] = weightFace;
		});
	
		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			const n = cmap.degree(vertex, vd);
			const n2 = n * n;
	
	
			let d0 = vd;
			const weightInit = {};
			weightInit[vid] = (n - 3) / n;
	
	
			do {
				d0 = cmap.phi2[d0];
				const vidEdge = cmap.cell(vertex, d0);
				const weightEdge = weights[vidEdge];
	
	
				const vidFace = cmap.cell(vertex, cmap.phi_1[d0]);
				const weightFace = weights[vidFace];
	
	
				for(const [vid2, w] of Object.entries(weightEdge)) {
					weightInit[vid2] ??= 0;
					weightInit[vid2] += 2 * w / n2; 
				}
	
	
				for(const [vid2, w] of Object.entries(weightFace)) {
					weightInit[vid2] ??= 0;
					weightInit[vid2] += w / n2; 
				}
	
	
				d0 = cmap.phi1[d0];
	
	
			} while (d0 != vd)
	
	
			weights[vid] = weightInit;
			
		}, {cache: initVerticesCache})
	
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
				weightEdge[vid2] ??= 0; 
				weightEdge[vid2] += w / 4; 
			}
	
	
			for(const [vid2, w] of Object.entries(weightFace1)) {
				weightEdge[vid2] ??= 0; 
				weightEdge[vid2] += w / 4; 
			}
			
		}, {cache: edgeVerticesCache})
		
		this.weights = {...weights}
    }


	buildGeometry(cmap){
		const vertex = cmap.vertex;

		const position = cmap.getAttribute(vertex, "position");

		const nextGenPosition = {} 

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			nextGenPosition[vid] = new Vector3();
		});
		
		for(const [idNewPos, influate] of Object.entries(this.weights)) {
			for(const [idOldPos, w] of Object.entries(influate)) {
				nextGenPosition[idNewPos].addScaledVector(position[idOldPos], w);
			}
		}

		cmap.foreach(vertex, vd => {
			const vid = cmap.cell(vertex, vd);
			position[vid] ??= new Vector3();
			position[vid].copy(nextGenPosition[vid]);
		});

	}

	addTransform(positionIndex, transformVector){
		this.transforms[positionIndex] = transformVector;
	}


	updatePosition(cmap, current = false){

		const currentPosition = cmap.getAttribute(cmap.vertex, "position");

		for(const [id, transform] of Object.entries(this.transforms)) {
				
			if(this.toTransform) {
				currentPosition[id].copy(this.initialPosition[id]);
				currentPosition[id].add(transform);
			}
		}

		if(this.weights) {
			this.buildGeometry(cmap);
		}

		this.toTransform = false;

	}

	updateInitialPosition(cmap){
		const currentPosition = cmap.getAttribute(cmap.vertex, "position");
		this.initialPosition.forEach( (pos, id) => {
			pos.copy(currentPosition[id]);
			currentPosition[id].add(this.transforms[id].clone());
		} )
	}

	currentPosition(){
		const currentPosition = []
		this.initialPosition.forEach( (pos, id) => {
			const sum = pos.clone();
			sum.add(this.transforms[id].clone());
			currentPosition.push(sum);
		} )
		return currentPosition;
	}
}