export function loadWrl(off_str) {
	let lines = off_str.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/,/, ' ').replace(/\s\s+/g, ' ').replace(/, -1,/, '').trim();
	}

	let line;
	let j = 0;
	console.log(lines);
	// Skip to vertices coordinates
	do {
		line = lines[j++];
	}while(!line.match(/point \[/));

	let vertices = [];
	while(!((line = lines[j++]).match(/\]/)))
		vertices.push(line.split(" "));
	++j;

	// skip to face indices
	do {
		line = lines[j++];
	}while(!line.match(/coordIndex \[/));
	
	let faces = [];
	while(!((line = lines[j++]).match(/\]/)))
		faces.push(line.split(" "));
	++j;

	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	faces = faces.map(x => x.map(y => parseInt(y)));
	return {v: vertices, f:faces};
}

// export function exportWrl(geometry){
// 	let str = "OFF\n";
// 	str += geometry.v.length + " " + geometry.f.length + " 0\n";

// 	geometry.v.forEach(
// 		vert => {
// 			str += vert[0] + " " + vert[1] + " " + vert[2] + "\n";
// 	});
// 	geometry.f.forEach(
// 		face => {
// 			str += face.length + " ";
// 			face.forEach(vert => {str += vert + " "}); 
// 			str += "\n";
// 		});
// 	return str;
// }