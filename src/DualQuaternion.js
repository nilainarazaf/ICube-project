import { Quaternion, Vector3, Matrix4 } from './CMapJS/Libs/three.module.js';

/// Advanced Methods in Computer Graphics, R. Mukudan, ISBN 978-1-4471-2339-2
/// https://cs.gmu.edu/~jmlien/teaching/cs451/uploads/Main/dual-quaternion.pdf
/// https://github.com/brainexcerpts/Dual-Quaternion-Skinning-Sample-Codes
/// https://glmatrix.net/

class DualQuaternion {

	constructor( real = new Quaternion(), dual = new Quaternion(0, 0, 0, 0) ) {
		  
			this.isDualQuaternion = true;

			this.real = real;
			this.dual = dual;

	}

	static setFromRotation( q ) {

		return new DualQuaternion( q );

	}


	/// qpq* + qtq*
	static setFromRotationTranslation( q, t ) {

		const qt = new Quaternion(t.x, t.y, t.z, 0);

		qt.premultiply(q).multiplyScalar(0.5);

		return new DualQuaternion( q , qt ).normalize();
	}

	/// qpq* + t
	static setFromTranslationRotation( q, t ) {

		const qt = new Quaternion(t.x, t.y, t.z, 0);

		qt.multiply(q).multiplyScalar(0.5);

		return new DualQuaternion( q , qt ).normalize();
	}

	static setFromTranslation( t ) {

		return DualQuaternion.setFromRotationTranslation ( new Quaternion(), t );

	}

	add( dq ) {

		this.real.add( dq.real );
		this.dual.add( dq.dual );

		return this;

	}

	addScaledDualQuaternion( dq, s ) {

		const tempQuat = dq.real.clone();
		this.real.add( tempQuat.multiplyScalar( s ) );

		tempQuat.copy( dq.dual );
		this.dual.add( tempQuat.multiplyScalar( s ));

		return this;

	}

	clone() {

		return new DualQuaternion( this.real.clone(), this.dual.clone() );

	}

	copy( dq ) {

		this.real.copy(dq.real);
		this.dual.copy(dq.dual);

		return this;

	}

	conjugate() {

		this.real.conjugate();
		this.dual.conjugate().multiplyScalar(-1);

		return this;

	}

	dot( dq ) {

		return this.real.dot( dq.real );

	}

	equals( dq ) {

		return ( this.real.equals( dq.real ) && this.dual.equals( dq.dual ));

	}

	fromArray( array, offset = 0 ) {

		this.real.fromArray( array, offset );
		this.dual.fromArray( array, offset + 4 );

		return this;

	}

	getRotation() {

		return this.real.clone();

	}

	getTranslation() {

		const t = this.dual.clone().multiplyScalar(2);
		t.multiply(this.real.clone().conjugate());

		return t.vector();

	}

	identity() {

		this.real.set( 0, 0, 0, 1 );
		this.dual.set( 0, 0, 0, 0 );

		return this;

	}

	invert() {
		
		const lenSq = this.lengthSq();

		this.real.conjugate().multiplyScalar( 1 / lenSq );
		this.dual.conjugate().multiplyScalar( 1 / lenSq );

		return this;

	}

	length() {

		return this.real.length();

	}

	lengthSq() {

		return this.real.lengthSq();

	}

	lerp( dq, t ) {

		this.real.multiplyScalar(t).add(dq.real.clone().multiplyScalar(1 - t));
		this.dual.multiplyScalar(t).add(dq.dual.clone().multiplyScalar(1 - t));

		return this;

	}

	lerpShortest( dq, t ) {
		const dqTemp = dq.clone();

		if(this.real.dot(dqTemp.real) < 0)
			dqTemp.multiplyScalar(-1);

		this.real.multiplyScalar(t).add(dqTemp.real.multiplyScalar(1 - t));
		this.dual.multiplyScalar(t).add(dqTemp.dual.multiplyScalar(1 - t));

		return this;

	}

	lerpDualQuaternions( dq0, dq1, t) {

		this.copy(dq0);
		this.lerp(dq1, t);

		return this;

	}

	lerpDualQuaternionsShortest( dq0, dq1, t) {

		this.copy(dq0);
		this.lerpShortest(dq1, t);

		return this;

	}

	multiplyDualQuaternions( dq0, dq1 ) {

		const tempReal = dq0.real.clone().multiply( dq1.real );

		const tempDual = dq0.dual.clone().multiply( dq1.real );
		tempDual.add( dq0.real.clone().multiply( dq1.dual ));

		this.real.copy(tempReal);
		this.dual.copy(tempDual);

		return this;

	}

	multiply( dq ) {

		this.multiplyDualQuaternions( this, dq );

		return this;

	}

	multiplyScalar( s ) {

		this.real.multiplyScalar( s );
		this.dual.multiplyScalar( s );

		return this;

	}

	normalize() {

		const norm = this.real.length();

		this.real.multiplyScalar( 1 / norm );
		this.dual.multiplyScalar( 1 / norm );

		return this;

	}

	premultiply( dq ) {

		this.multiplyDualQuaternions( dq, this );

		return this;

	}

	toArray( array = [], offset = 0 ) {

		this.real.toArray( array , offset );
		this.dual.toArray( array , offset + 4 );

		return array;

	}

	transform( p ) {

		const dqp = new DualQuaternion(new Quaternion, new Quaternion(p.x, p.y, p.z, 0));
		const copy = this.clone();
		const copyc = this.clone().conjugate();
		
		copy.multiply(dqp).multiply(copyc);

		return copy.dual.vector();
		
	}


	// _onChange( callback ) {

	// 	this._onChangeCallback = callback;

	// 	return this;

	// }

	// _onChangeCallback() {}
}

export { DualQuaternion }