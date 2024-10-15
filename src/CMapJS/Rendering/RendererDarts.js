import Renderer from './Renderer.js';
import * as THREE from '../Libs/three.module.js';
import {RendererCellProto} from './Renderer.js';


let darts_vs = `
varying vec3 pos;
varying vec3 uv_and_l0;
void main() 
{
  vec4 worldPos = modelMatrix * vec4(position, 1.0);  
  gl_Position = projectionMatrix * viewMatrix * worldPos;
  pos = worldPos.xyz;
  uv_and_l0 = color;
}`;

let darts_fs = `
varying vec3 uv_and_l0;

/////// parameters, these should maybe be uniforms instead
const float line_width = 0.0015;           // line width
const float distance_from_edge = 0.002;   // distance from lower edge
const float tip_width = 8. * line_width;
const float tip_slope = 0.3;             // smaller values are more pointy

// relative to edge length:
const float rel_start = 0.15;             // tip position
const float rel_end = 0.85;               // tail position
///////
//

vec3 color() {
  vec2 uv = uv_and_l0.xy;
  float l = uv_and_l0.z;
  bool highlight = l < 0.;
  l = abs(l);

  // bottom gap
  vec3 col = vec3(0.75, 0.75, 0.9);
  if (uv.y < distance_from_edge) {
    return col;
  }

  // right gap
  if (uv.x < rel_start * l) {
    return col;
  }

  float maxh = line_width;
  if (uv.x > rel_end * l - tip_width)
  {
    maxh = (rel_end * l - uv.x) * tip_slope;
  }
  if (uv.y - distance_from_edge > maxh) {
    return col;
  }
  // TODO: express as SDF and use smoothstep for AA
  // TODO: evalute some shading model using face normal
  //
  if (highlight) {
    return vec3(0.8, 0.2, 0.2);
  } else {
    return vec3(0.3, 0.3, 0.3);
  }
}

void main(void)
{
  if(color().x == 0.75) discard; // only show arrows TODO: base it on uniform
  gl_FragColor = vec4(color(),1.0);
  if(!gl_FrontFacing) gl_FragColor += vec4(0.15, 0.15, 0.15, 0.0);

}
`

let darts2_fs = `
varying vec3 uv_and_l0;

/////// parameters, these should maybe be uniforms instead
const float line_width = 0.01;           // line width
const float distance_from_edge = 0.002;   // distance from lower edge
const float tip_width =  line_width;
const float tip_slope = 0.03;             // smaller values are more pointy

// relative to edge length:
const float rel_start = 0.05;             // tip position
const float rel_end = 0.085;               // tail position
///////
//

vec3 color() {
  vec2 uv = uv_and_l0.xy;
  float l = uv_and_l0.z;
  bool highlight = l < 0.;
  l = abs(l);

  // bottom gap
  vec3 col = vec3(0.75, 0.75, 0.9);
  if (uv.y < distance_from_edge) {
    return col;
  }

  // right gap
  if (uv.x < rel_start * l) {
    return col;
  }

  float maxh = line_width;
  if (uv.x > rel_end * l - tip_width)
  {
    maxh = (rel_end * l - uv.x) * tip_slope;
  }
  if (uv.y - distance_from_edge > maxh) {
    return col;
  }
  // TODO: express as SDF and use smoothstep for AA
  // TODO: evalute some shading model using face normal
  //
  if (highlight) {
    return vec3(0.8, 0.2, 0.2);
  } else {
    return vec3(0.1, 0.1, 0.1);
  }
}

void main(void)
{
//   if(color().x == 0.75) discard; // only show arrows TODO: base it on uniform
  gl_FragColor = vec4(color(),1.0);
  if(!gl_FrontFacing) gl_FragColor += vec4(0.15, 0.15, 0.15, 0.0);
}
`

export default function RendererDarts(cmap) {
	Renderer.call(this, cmap);
	const position = cmap.getAttribute(cmap.vertex, "position");

	this.faces = (!cmap.face) ? undefined :
		Object.assign(Object.create(RendererCellProto), {
			create: function(params = {}){
				const vertex = cmap.vertex;
				const face = cmap.face;

				this.params = params;
				if(cmap.nbCells(face) == 0)
					return;

				
		
				const position = cmap.getAttribute(vertex, "position");
				const associated_face = cmap.addAttribute(cmap.dart, "associated_face");
				const geometry = new THREE.Geometry();
				geometry.vertices = [...position];

				const fds = [];
				let color = params.color || new THREE.Color(0x0099FF);

				cmap.foreach(face,
					fd => {
						let f_ids = [];
						let center = new THREE.Vector3(0, 0, 0);
		
						cmap.foreachDartPhi1(fd, d => {
							f_ids.push(cmap.cell(vertex, d));
							center.add(position[cmap.cell(vertex, d)]);
						});
						center.divideScalar(f_ids.length);
		
						let center_id = geometry.vertices.length;
						geometry.vertices.push(center);
		
						let d = fd;
						for(let i = 0; i < f_ids.length; i++)
						{
							let f = new THREE.Face3(f_ids[i],f_ids[(i+1) % f_ids.length],center_id);
							associated_face[d] = f;
							// compute local UV parameterization of vertices p_{0,1,2}, s.t.
							//  - p_0 is at the origin,
							//  - p_0->p_1 is on the u-axis,
							//  - and the rest of the triangle has positive v
							var p0 = geometry.vertices[f.a];
							var p1 = geometry.vertices[f.b];
							var p2 = center;
		
							var l0 = p0.distanceTo(p1);
							var l1 = p1.distanceTo(p2);
							var l2 = p2.distanceTo(p0);
		
							var u0 = 0,  v0 = 0;
							var u1 = l0, v1 = 0;
							var u2 = .5 * ((l2*l2 - l1*l1)/l0 + l0);
							var v2 = Math.sqrt(l2*l2 - u2*u2);
		
							// we need l0 as per-face constant in the shader,
							// and we need to know if the current arrow should
							// be highlighted.
							// combine both by negating l0 for highlighted arrows.
							// var l0_and_hl = isHighlighted ? -l0 : l0;
							var l0_and_hl = l0;
		
							f.dart = d;
							f.vertexColors.push(
								new THREE.Color(u0, v0, l0_and_hl),
								new THREE.Color(u1, v1, l0_and_hl),
								new THREE.Color(u2, v2, l0_and_hl));
							geometry.faces.push(f);
							d = cmap.phi1[d];
						}
					}
				);
		
				let material =  new THREE.ShaderMaterial({
						vertexShader: darts_vs,
						fragmentShader: params.wireframe == true ? darts_fs : darts2_fs,
						uniforms: {v2Resolution: {type: "v2", value: new THREE.Vector2( window.innerWidth, window.innerHeight )}}, 
						vertexColors: THREE.VertexColors,
						side: params.side || THREE.DoubleSide, //no face culling
						polygonOffset: true,
						polygonOffsetFactor: -0.1
					}
				)
		
				this.mesh = new THREE.Mesh(geometry, material);
				this.mesh.fd = fds;
				this.mesh.layers.set(params.layer || 0);
				return this;
			}
		});

	if(!this.faces)
		delete this.faces;
	else
		this.cells.push(this.faces);

	this.volumes = (!cmap.volume) ? undefined : Object.assign(Object.create(RendererCellProto), {
		create: function(params = {}) {
			this.params = params;

			const material =  new THREE.ShaderMaterial({
				vertexShader: darts_vs,
				fragmentShader: darts_fs,
				uniforms: {v2Resolution: {type: "v2", value: new THREE.Vector2( window.innerWidth, window.innerHeight )}}, 
				vertexColors: THREE.VertexColors,
				side: THREE.DoubleSide, //no face culling
				polygonOffset: true,
				polygonOffsetFactor: -0.1
			})

			// const material = new THREE.MeshLambertMaterial();

			this.mesh = new THREE.Group();

			if(!cmap.isEmbedded(cmap.vertex2))
				cmap.setEmbeddings(cmap.vertex2);

			const v2_id = cmap.addAttribute(cmap.vertex2, "v2_id");
			let mesh_center = new THREE.Vector3();
			let marker_vertices = cmap.newMarker(cmap.vertex2);
			const associated_face = cmap.addAttribute(cmap.dart, "associated_face");
			
			let marker_faces = cmap.newMarker();
			let id = 0;
			let centerVolume = new THREE.Vector3();
			cmap.foreach(cmap.volume, wd => {
				if(cmap.isBoundary(wd))
					return;

				const geometry = new THREE.Geometry();
				centerVolume.set(0, 0, 0);
				/// replace with foreach incident vertex2
				id = 0;
				cmap.foreachIncident(cmap.vertex2, cmap.volume, wd, v2d => {
					v2_id[cmap.cell(cmap.vertex2, v2d)] = id++;
					
					centerVolume.add(position[cmap.cell(cmap.vertex, v2d)]);
					geometry.vertices.push(position[cmap.cell(cmap.vertex, v2d)].clone());
					}, true
				);

				centerVolume.divideScalar(id);
				for(let i = 0; i < geometry.vertices.length; ++i){
					geometry.vertices[i].sub(centerVolume);
				}
			
				/// replace with foreach incident face
				cmap.foreachDartOf(cmap.volume, wd, fd => {
					if(marker_faces.marked(fd))
						return;
					
					let center = new THREE.Vector3(0, 0, 0);
					let f_ids = [];

					cmap.foreachDartPhi1(fd, vd => {
						f_ids.push(v2_id[cmap.cell(cmap.vertex2, vd)]);
						marker_faces.mark(vd);
						center.add(position[cmap.cell(cmap.vertex, vd)]);
					});
					center.divideScalar(f_ids.length);
					let center_id = geometry.vertices.length;
					geometry.vertices.push(center.clone().sub(centerVolume));
					let d = fd;


					for(let i = 0; i < f_ids.length; i++) {
						let f = new THREE.Face3(f_ids[i],f_ids[(i+1) % f_ids.length],center_id);
						associated_face[d] = f;

						var p0 = geometry.vertices[f.a];
						var p1 = geometry.vertices[f.b];
						var p2 = center.clone().sub(centerVolume);
	
						var l0 = p0.distanceTo(p1);
						var l1 = p1.distanceTo(p2);
						var l2 = p2.distanceTo(p0);
	
						var u0 = 0,  v0 = 0;
						var u1 = l0, v1 = 0;
						var u2 = .5 * ((l2*l2 - l1*l1)/l0 + l0);
						var v2 = Math.sqrt(l2*l2 - u2*u2);
	
						var l0_and_hl = l0;
	
						f.dart = d;
						f.vertexColors.push(
							new THREE.Color(u0, v0, l0_and_hl),
							new THREE.Color(u1, v1, l0_and_hl),
							new THREE.Color(u2, v2, l0_and_hl));
						geometry.faces.push(f);
	
						d = cmap.phi1[d];
					}

					for(let i = 2; i < f_ids.length; i++){
						let f = new THREE.Face3(f_ids[0],f_ids[i-1],f_ids[i]);
						geometry.faces.push(f);

						if(cmap.isEmbedded(cmap.volume))
							f.id = cmap.cell(cmap.volume, fd);
					}

				});

				geometry.computeFaceNormals();
				let vol = new THREE.Mesh(geometry, material);
				vol.position.copy(centerVolume);
				this.mesh.add(vol);
				mesh_center.add(centerVolume);
			});
			marker_faces.remove();
			marker_vertices.remove();
			v2_id.delete();
			mesh_center.divideScalar(this.mesh.children.length);
			this.mesh.position.copy(mesh_center.negate());
			this.mesh.children.forEach(vol => vol.position.sub(mesh_center));
			return this;
		},

		rescale: function(scalar){
			this.mesh.children.forEach(vol => vol.scale.set(scalar, scalar, scalar));
		}
	});
} 
