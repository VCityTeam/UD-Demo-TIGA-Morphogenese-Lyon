import { THREE } from '@ud-viz/browser/src';

export class TemporalLevel {

  /**
 * 
 * @param {TemporalProvider} temporalProvider 
 * @param {number} date 
 */
  constructor(date, temporalProviders){

    this.temporalProviders = temporalProviders; //List because we use the Jaillot approach with intermediate state of the data that regroup construction and destruction

    this.date = date;
        
    this.position = new THREE.Vector3();
  }

  /**
   * 
   * @param {THREE.Vector3} position 
   */
  setPosition(position){

    // Set layer
    this.temporalProviders.forEach(temporalProvider => {
      const layer = temporalProvider.tilesManager.layer;
      layer.root.children.forEach(object => {
        object.position.z += position.z;
        const centroidBB = new THREE.Vector3();
        object.boundingVolume.box.getCenter(centroidBB);
        object.updateMatrixWorld();
      });
    });
  }
}