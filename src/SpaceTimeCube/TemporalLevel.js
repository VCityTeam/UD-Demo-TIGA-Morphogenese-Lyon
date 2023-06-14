import { THREE } from '@ud-viz/browser/src';

export class TemporalLevel {

  /**
 * 
 * @param {TemporalProvider} temporalProvider 
 * @param {number} date 
 */
  constructor(temporalProvider, date){

    this.temporalProvider = temporalProvider;

    this.date = date;
        
    this.position = new THREE.Vector3();
  }

  /**
   * 
   * @param {THREE.Vector3} position 
   */
  setPosition(position){

    // Set layer
    const layer = this.temporalProvider.tilesManager.layer;
    layer.root.children.forEach(object => {
      object.position.z += position.z;
      const centroidBB = new THREE.Vector3();
      object.boundingVolume.box.getCenter(centroidBB);
      object.updateMatrixWorld();
    });
  }
}