
import { CMap2 } from './CMapJS/CMap/CMap.js';
import { loadCMap2 } from './CMapJS/IO/SurfaceFormats/CMap2IO.js';


export default class DataHandler {
	/// surface mesh to unfold
	#mesh;
	
	constructor ( ) {

	}

	loadMeshFromString ( meshString ) {
		this.#mesh = loadCMap2( "off", meshString );
		console.log( meshString );
	}

	get mesh ( ) {
		return this.#mesh;
	} 
}