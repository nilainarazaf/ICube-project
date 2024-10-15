export function loadTet(tetStr) {
	let lines = tetStr.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}

	let line;
	let j = 0;

	
	const nbVertices = parseInt(line = lines[j++]);
	const nbTets = parseInt(line = lines[j++]);
	console.log(nbVertices, nbTets)

	const vertices = [];
	for(let i = 0; i < nbVertices; i++)
	{
		line = lines[j++];
		vertices.push(line.split(" ").map(x => parseFloat(x)));
	}  
	
	const tets = [];
	for(let i = 0; i <nbTets; i++)
	{
		line = lines[j++];
		line = line.split(" ").map(x => parseInt(x));
		line.shift();
		tets.push(line);
	}            

	return {v: vertices, tet:tets};
}

export function exportTet(geometry){
	let str = ``;
	str += `${geometry.v.length} vertices\n`;
	str += `${geometry.tet.length} tets\n`;

	geometry.v.forEach(
		vert => {
			str += vert[0] + " " + vert[1] + " " + vert[2] + "\n";
	});

	geometry.tet.forEach(
		t => {
			str += t.length + " ";
			t.forEach(vert => {str += vert + " "}); 
			str += "\n";
		});
	return str;
}