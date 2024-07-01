import {GenCatmullClark} from '../../../../GenCatmullClark.js';
import {cutAllEdges, quadrangulateAllFaces, quadrangulateFace} from '../../../Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from '../../../Libs/three.module.js';

export default function catmullClark(cmap, generation = 1){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;

	const position = cmap.getAttribute(vertex, "position");
	const weights = cmap.addAttribute(vertex, "weight" + generation);

	//contiennet des brins
	const initVerticesCache = cmap.cache(vertex);
	let faceVerticesCache = [];
	let edgeVerticesCache = [];
		
	const gen = new GenCatmullClark(cmap, generation);

	Object.assign(edgeVerticesCache, gen.edgeVertices);
	Object.assign(faceVerticesCache, gen.faceVertices);

	console.log(initVerticesCache);
	console.log(edgeVerticesCache);
	console.log(faceVerticesCache);
	
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

	// Object.assign(weights, gen.weights);

	// gen.saveWeights(weights);
	// console.log(weights);
	// console.log(gen.weights);

	// stockage de tout les sommets de nouvelle generation
	// on voudra seulement les identifiants des sommets pas les brins
	// const newGenerationId = cmap.cache(vertex);
	// gen.saveAllNewVertices(newGenerationId);

	/// calcul de la géométrie
	const position2 = cmap.addAttribute(vertex, "position" + generation);

	// initialisation de la mémoire apres subdivs
	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		position2[vid] = new Vector3();
	})

	console.log( gen.weights);
	console.log( weights)

	// d'abord les faces
	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		const weight = weights[vid];

		for(const [vid2, w] of Object.entries(weight)) {
			console.log(vid2, position[vid2]);
			position2[vid].addScaledVector(position[vid2], w);
		}

	}, {cache: faceVerticesCache})

	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		
		let d0 = cmap.phi2[vd];
		let d1 = cmap.phi_1[cmap.phi2[cmap.phi_1[vd]]];

		position2[vid].addScaledVector(position[cmap.cell(vertex, d0)], 0.5);
		position2[vid].addScaledVector(position[cmap.cell(vertex, d1)], 0.5);

	}, {cache: edgeVerticesCache})

	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		const weight = weights[vid];

		for(const [vid2, w] of Object.entries(weight)) {
			position2[vid].addScaledVector(position[vid2] ?? position2[vid2], w);
		}

	}, {cache: initVerticesCache})

	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		const weight = weights[vid];
		position2[vid].set(0, 0, 0)
		for(const [vid2, w] of Object.entries(weight)) {
			position2[vid].addScaledVector(position[vid2] ?? position2[vid2], w);
		}

	}, {cache: edgeVerticesCache})

	cmap.foreach(vertex, vd => {
		const vid = cmap.cell(vertex, vd);
		position[vid] ??= new Vector3();
		position[vid].copy(position2[vid]);
	})

	return gen;

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

			let vid = cmap.cell(vertex, vd); // prend tous les points assosies a ce sommet
			// console.log(cmap.cell(vertex, vd)); // print
			pos[vid] = new Vector3(); // init les position des point en relaation avec le sommet
			cmap.foreachDartOf(vertex, vd, d => { // prend tous les indices de chaque point dans les brins
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]); // prend les points de la face assossie
			});
			pos[vid].multiplyScalar(0.5); // deplace les points vers le bas
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