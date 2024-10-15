export function importCG(cgStr){
	let lines = cgStr.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}

	let line;
	let j = 0;
	line = lines[j++];
	let header = line.split(" ");
	let nbDims = parseInt(header[1].split(":")[1]);
	let nbVerts = parseInt(header[2].split(":")[1]);
	let nbEdges = parseInt(header[3].split(":")[1]);

	let vertices = [];
	for(let i = 0; i < nbVerts; ++i)
	{
		line = lines[j++];
		vertices.push(line.slice(2).split(" "));
	}

	let edges = [];
	for(let i = 0; i < nbEdges; ++i)
	{
		line = lines[j++];
		edges.push(line.slice(2).split(" "));
	}

	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	edges = edges.map(x => x.map(y => (parseInt(y))));
	
	return {v: vertices, e:edges};
};

export function exportCG(geometry){
	let str = "# D:3 NV:" + geometry.v.length + " NE:" + geometry.e.length + "\n";
	console.log(geometry)
	geometry.v.forEach( v => {
		str += "v " + v[0] + " " + v[1] + " " + v[2] + "\n";
	});

	geometry.e.forEach( e => {
		str += "e " + e[0] + " " + e[1] + "\n";
	});
	console.log(str);
	return str;
};