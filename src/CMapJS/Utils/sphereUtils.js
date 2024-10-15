
import * as THREE from '../Libs/three.module.js';

export function slerp(A, B, alpha, out = false)
{
	let sl = new THREE.Vector3();
	let phi = A.angleTo(B);
	if(out) phi = phi - 2*Math.PI;
	let s0 = Math.sin(phi*(1-alpha));
	let s1 = Math.sin(phi*alpha);
	let s2 = Math.sin(phi);
	sl.addScaledVector(A, s0 / s2);
	sl.addScaledVector(B, s1 / s2);
	return sl;
}

export function inSphereTriangle(P, U, V, W)
{
	let n0 = U.clone().cross(V);
	let n1 = V.clone().cross(W);
	let n2 = W.clone().cross(U);

	return (P.dot(n0) > 0 && P.dot(n1) > 0 && P.dot(n2) > 0);
}

export function inSphereFace(P, points)
{
	const bary = sphereBarycenter(points);
	console.log(P, points)
	let inside = false;
	for(let i = 0; i < points.length && !inside; ++i) {
		inside = inSphereTriangle(P, points[i], points[(i + 1) % points.length], bary);
	}

	return inside;
}

export function sphereAngle(A, B, C) {
	const sB = slerp(A, B, 0.01);
	const sC = slerp(A, C, 0.01);
	sB.sub(A);
	sC.sub(A);
	let angle = sB.angleTo(sC);
	if(A.dot(sB.cross(sC)) < 0)
		angle = 2* Math.PI - angle;
	return angle;
}

export function sphereSignedAngle(A, B, C){
    const sB = slerp(A, B, 0.01);
    const sC = slerp(A, C, 0.01);
    let AB = (sB.clone().sub(A)).normalize();
    let AC = (sC.clone().sub(A)).normalize();
    let X = AB.clone().cross(AC).normalize();
    let a = AB.angleTo(AC);
    if(A.dot(X) < 0)
        a = -a;
    return a;
}

export function distanceToGeodesic(P, A, B, out = false) {
	const planeNormal = A.clone().cross(B);
	const projP = P.clone().projectOnPlane(planeNormal);

	let ab = A.angleTo(B);
	let ap = A.angleTo(projP);
	let bp = B.angleTo(projP);
	let inside = ap < ab && bp < ab;

	let dist = inside ? Math.abs(P.angleTo(projP)) : Math.min(onSphereDistance(A, P), onSphereDistance(B, P));
	return dist;
}

function contractPolygon(points, iterations) {
	let pts0 = points.map(x => x);
	for(let i = 0; i < iterations; ++i) {
		let pts1 = [];
		for(let i = 0; i < pts0.length; ++i)
        {
            pts1.push(pts0[i].clone().add(pts0[(i+1) % pts0.length]).multiplyScalar(0.5).normalize());
        }
        pts0 = pts1;
	}
	return pts0;
}

export function sphereBarycenter(points) {
	let bary = new THREE.Vector3;
	let pts = contractPolygon(points, 5);

	pts.forEach(p => {
			bary.add(p)
		});

	bary.normalize();

	if(points.length > 2)
	{
		let norm = new THREE.Vector3();
		let v0, v1, vc;
		for(let i = 2 ; i < points.length; ++i)
		{
			v0 = points[i - 1].clone().sub(points[0]);
			v1 = points[i].clone().sub(points[0]);
			vc = v0.clone().cross(v1);
			norm.add(vc);
		}
		norm.normalize();
		if(norm.dot(bary) < 0)
			bary.negate();

	}

	return bary;
}

export function onSphereDistance(A, B) {
	return Math.abs(A.angleTo(B));
}

function triangleArea(A, B, C) {
	let AB = B.clone().sub(A);
	let AC = C.clone().sub(A);
	return (AB.cross(AC).length())/2;
}

export function onSphereSubdivideTriangle(A, B, C, n = 2) {
	const vertices = [A.clone()];
	for(let i = 1; i <= n; ++i) {
		const alpha = 1 - (n - i)/n;
		const Bi = slerp(A, B, alpha);
		const Ci = slerp(A, C, alpha);
		const vertsi = [];
		for(let j = 0; j <= i; ++j) {
			const beta = j / i;
			const Xi = slerp(Bi, Ci, beta);
			vertices.push(Xi);
		}
	}

	const triangles = [];
	let sumi = 0;
	let sumi_1 = 0;
	for(let i = 1; i <= n; ++i) {
		sumi += i;
		for(let j = 0; j < i; ++j) {
			triangles.push(sumi_1 + j, sumi + j, sumi + j + 1);

			if(j != 0 )
				triangles.push(sumi_1 + j - 1, sumi + j, sumi_1 + j);
		}	
		sumi_1 = sumi;
	}
	return {triangles: triangles, vertices: vertices}
}

export function onSpherePolygonArea(points, n = 10) {
	if(points.length == 2)
		return 0;
		
	const bary = sphereBarycenter(points);
	let area = 0;
	for(let i = 0; i < points.length; ++i){
		let geo = onSphereSubdivideTriangle(bary, points[i], points[(i+1)%points.length], n);
		for(let t = 0; t < geo.triangles.length; t += 3){
			area += triangleArea(
				geo.vertices[geo.triangles[t]], 
				geo.vertices[geo.triangles[t+1]], 
				geo.vertices[geo.triangles[t+2]]
			);
		}
	}
	return area;
}

export function onSpherePolygonSignedArea(points) {
	if(points.length == 2)
		return 0;
		
	const bary = sphereBarycenter(points);
	let area = 0;
	for(let i = 0; i < points.length; ++i){
		let geo = onSphereSubdivideTriangle(bary, points[i], points[(i+1)%points.length], 10);
		let sign = sphereSignedAngle(bary, points[i], points[(i+1)%points.length]) > 0 ? 1 : -1;
		for(let t = 0; t < geo.triangles.length; t += 3){
			let triArea = triangleArea(
				geo.vertices[geo.triangles[t]], 
				geo.vertices[geo.triangles[t+1]], 
				geo.vertices[geo.triangles[t+2]]
			);
			area += sign * triArea;
		}
	}
	return area;
}
