import { THREE } from '@ud-viz/browser/src';

export class TemporalLevel {

  /**
 * 
 * 
 * @param {number} date 
 * @param {Array<TemporalProvider>} temporalWrappers 
 */
  constructor(date, temporalWrappers){

    this.temporalWrappers = temporalWrappers; //List because we use the Jaillot approach with intermediate state of the data that regroup construction and destruction

    this.date = date;
        
    this.position = new THREE.Vector3();
  }

  /**
   * 
   * @param {THREE.Vector3} position 
   */
  setPosition(position){

    // Set layer
    this.temporalWrappers.forEach(temporalWrapper => {
      temporalWrapper.temporalC3DTilesLayer.root.children.forEach(object => {
        object.position.z = position.z;
        const centroidBB = new THREE.Vector3();
        object.boundingVolume.box.getCenter(centroidBB);
        object.updateMatrixWorld();
      });
    });
  }

  applyStyleTemporalProvidersWithCurrentTime(){
    this.temporalProviders.forEach( temporalProvider => {
      temporalProvider.changeVisibleTilesStates();
    });
  }

  update(date){
    this.date = date;
    for(let i = 0; i < this.temporalWrappers.length; i++){
      this.temporalWrappers[i].update(date + i);
    }
  }
}