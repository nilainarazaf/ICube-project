import {Graph} from '../../CMap/CMap.js';
import {Vector3} from '../../Libs/three.module.js';
import {importCG, exportCG} from './Cg.js';

export function importGraph(format, fileStr){
	let geometry = geometryFromStr(format, fileStr);
	let graph = graphFromGeometry(geometry);
	console.log("loaded file: " + format + " (v:" + geometry.v.length + ", e:" + geometry.e.length + ")");
	return graph;
}

function geometryFromStr(format, fileStr){
	let geometry;
	switch(format){
		case 'cg':
			geometry = importCG(fileStr);
			break;
		default:
			break;
	}
	return geometry;
}

function graphFromGeometry(geometry){
	let graph = new Graph;
	const vertex = graph.vertex;

	graph.createEmbedding(vertex);
	const position = graph.addAttribute(vertex, "position");

	const vertexIds = [];
	geometry.v.forEach(v3 => {
		let vd = graph.addVertex(true);
		vertexIds.push(vd);
		position[graph.cell(vertex, vd)] = new Vector3(v3[0], v3[1], v3[2]);
	});

	geometry.e.forEach(e => {
		graph.connectVertices(vertexIds[e[0]], vertexIds[e[1]]);
	});

	return graph;
}

export function exportGraph(graph, format){
	let geometry = geometryFromGraph(graph);
	console.log(geometry);
	let str = strFromGeometry(format, geometry);
	return str;
}

function strFromGeometry(format, geometry){
	let fileStr;
	switch(format){
		case 'cg':
			fileStr = exportCG(geometry);
			break;
		default:
			break;
	}
	return geometry;
}

function geometryFromGraph(graph){
	let geometry = {v: [], e: [], f: []};
	const vertex = graph.vertex;
	const edge = graph.edge;

	const position = graph.getAttribute(vertex, "position");
	const vertexId = graph.addAttribute(vertex, "id");

	let id = 0;
	graph.foreach(vertex, vd => {
		vertexId[graph.cell(vertex, vd)] = id++;
		const p = position[graph.cell(vertex, vd)];
		geometry.v.push(p.toArray());
	});
	console.log(geometry.v)
	graph.foreach(edge, ed => {
		let e = [];
		graph.foreachDartOf(edge, ed, d => {
			e.push(vertexId[graph.cell(vertex, d)]);
		});
		geometry.e.push(e);
	});

	vertexId.delete();

	return geometry;
}