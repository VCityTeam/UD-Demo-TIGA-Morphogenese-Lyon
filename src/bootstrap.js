/** @format */
import * as udviz from 'ud-viz';
import {LayerExtension} from './LayerExtension.js';

const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  ////// REQUEST SERVICE
  const requestService = new udviz.Components.RequestService();

  ////// ABOUT MODULE
  const about = new udviz.Widgets.AboutWindow();
  app.addModuleView('about', about);

  ////// HELP MODULE
  const help = new udviz.Widgets.Extensions.HelpWindow(config.helpWindow);
  app.addModuleView('help', help);

  ////// CITY OBJECTS MODULE
  let cityObjectModule = new udviz.Widgets.CityObjectModule(
    app.view3D.layerManager,
    app.config
  );
  app.addModuleView('cityObjects', cityObjectModule.view);

  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Debug3DTilesWindow(
    app.view3D.layerManager
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  ////// CAMERA POSITIONER
  const cameraPosition = new udviz.Widgets.CameraPositionerView(
    app.view3D.getItownsView()
  );
  app.addModuleView('cameraPositioner', cameraPosition);

  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.view3D.layerManager);
  app.addModuleView('layerChoice', layerChoice);

  // const layerLegend = new LayerExtension(app.view3D.layerManager);
  const selectionStyle = { materialProps: { color: 0x13ddef } };
  app.view3D.layerManager.registerStyle('grow', selectionStyle);

  let scale = 0.2;
  app.viewerDivElement.addEventListener( 'click', onTileSelect );


  //SHADER
  const material = new udviz.THREE.RawShaderMaterial( {

    uniforms: {
      time: { value: 1.0 }
    },
    vertexShader: `
      precision mediump float;
			precision mediump int;

			uniform mat4 modelViewMatrix; // optional
			uniform mat4 projectionMatrix; // optional

			attribute vec3 position;
			attribute vec4 color;

			varying vec3 vPosition;
			varying vec4 vColor;

			void main()	{

				vPosition = position;
				vColor = color;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}`,
    fragmentShader: `
    precision mediump float;
			precision mediump int;

			uniform float time;

			varying vec3 vPosition;
			varying vec4 vColor;

			void main()	{

				vec4 color = vec4( vColor );
				color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

				gl_FragColor = color;

			}`,
    side: udviz.THREE.DoubleSide,
    transparent: true

  } );
  // debugger
  //Event to select a tile set
  function onTileSelect( event ) {    
    event.preventDefault();
    //selected objects
    let cityObject = app.view3D.layerManager.pickCityObject(event, 1, app.view3D.scene);
    
    if (cityObject){

      let meshId = cityObject.meshId;

      //----------------------------------Apply style
      let selectedTilesManager = app.view3D.layerManager.getTilesManagerByLayerID(
        cityObject.tile.layer.id
      );
      selectedTilesManager.setStyle(
        cityObject.cityObjectId,
        'grow'
      );
      selectedTilesManager.applyStyles({
        updateFunction: selectedTilesManager.view.notifyChange.bind(
          selectedTilesManager.view
        ),
      });

      //----------------------------------Change geometry
      let cityObject3D = cityObject.tile.getObject3D(); // Object THREE of the CityObject
      let meshCityObject = cityObject3D.content.children[meshId]; // Mesh of the cityObject picked
      let arrayCityObject = meshCityObject.geometry.attributes.position.array; // Array of the full mesh of te tile
      let arrayWithOnlyGeometryMesh = []; // Array of Vector3 with only the geometry of the cityObject picked
      let centroide = new udviz.THREE.Vector3(0, 0, 0);

      let indexCount = cityObject.indexCount;
      let indexStart = cityObject.indexStart;

      /* Looping through the array of the mesh of the cityObject picked. */
      for (let  i = indexStart; i <= indexCount + indexStart; i++){
        let position = new udviz.THREE.Vector3(
          arrayCityObject[i * 3],
          arrayCityObject[i * 3 + 1],
          arrayCityObject[i * 3 + 2]);
        centroide.add(position);
        
        arrayWithOnlyGeometryMesh.push(position);
      }
      
      // debugger
      centroide.divideScalar(arrayWithOnlyGeometryMesh.length);
      let index = 0; 
      for (let  i = indexStart; i <= indexCount + indexStart; i++){
        let directionVector = arrayWithOnlyGeometryMesh[index].sub(centroide);
        // directionVector.normalize();
        arrayCityObject[i * 3] += directionVector.x * scale;
        arrayCityObject[i * 3 + 1] += directionVector.y * scale;
        arrayCityObject[i * 3 + 2] += directionVector.z * scale;
        index++;
      }

      cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.needsUpdate = true;
    }
  }
});
