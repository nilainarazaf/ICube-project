// Import necessary modules
import { CMap2 } from './CMapJS/CMap/CMap.js';
import { loadCMap2 } from './CMapJS/IO/SurfaceFormats/CMap2IO.js';
import { DualQuaternion } from './DualQuaternion.js';


export default class DataHandler {
	/// surface mesh to unfold
	#mesh;
	
	constructor ( ) {

	}

	loadMeshFromString ( meshString ) {
		this.#mesh = loadCMap2( "off", meshString );
		initDQ(this.#mesh);
		console.log( meshString );
	}

	get mesh ( ) {
		return this.#mesh;
	} 
}

function initDQ(mesh){
	const DQ = mesh.addAttribute(mesh.vertex, "DQ");
	const position = mesh.getAttribute(mesh.vertex, "position");
	position.forEach( (pos, id) => {
		DQ[id] = DualQuaternion.setFromTranslation(pos);
	});
	console.log(DQ);
}