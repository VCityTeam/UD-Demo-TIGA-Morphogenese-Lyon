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

  const MYMAT = new udviz.THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tSize: { value: new udviz.THREE.Vector2(256, 256) },
      center: { value: new udviz.THREE.Vector2(0.5, 0.5) },
      angle: { value: 1.57 },
      scale: { value: 1.0 },
    },
    vertexShader: `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
    uniform vec2 center;
    uniform float angle;
    uniform float scale;
    uniform vec2 tSize;

    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    float pattern() {

        float s = sin( angle ), c = cos( angle );

        vec2 tex = vUv * tSize - center;
        vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;

        return ( sin( point.x ) * sin( point.y ) ) * 4.0;
    }
    void main() {
        vec4 color = texture2D( tDiffuse, vUv );
        float average = ( color.r + color.g + color.b ) / 3.0;
        gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );
    }
    `,
  });

  const renderTargetFX = new udviz.THREE.WebGLRenderTarget(0, 0, {
    depthBuffer: true,
    stencilBuffer: false,
    format: udviz.THREE.RGBAFormat,
    type: udviz.THREE.FloatType,
  });


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

      const edgeDetectionComposer = new udviz.EffectComposer(app.view3D.getRenderer(), renderTargetFX);
      const normalsPass = new udviz.RenderPass(app.view3D.getScene(), app.view3D.getCamera(), MYMAT);
      edgeDetectionComposer.addPass(normalsPass);
      // const sobelPass = new udviz.ShaderPass(MySobelOperatorShader);
      // edgeDetectionComposer.addPass(sobelPass);
      // edgeDetectionComposer.renderToScreen = false;

      // cityObject3D.children[0].children[0].material[0] = MYMAT;
      cityObject3D.children[0].children[0].frustumCulled = false;
      cityObject3D.children[0].children[0].material[1] = MYMAT;
      // cityObject3D.children[0].children[0].material[2] = MYMAT;
      let quad = cityObject3D.children[0].children[0].material[1];
      let g = app.view3D.getItownsView().mainLoop.gfxEngine;
      quad.uniforms.tDiffuse.value = g.fullSizeRenderTarget.texture;
      quad.uniforms.tSize.value.set(
        g.fullSizeRenderTarget.width, g.fullSizeRenderTarget.height);

      // cityObject3D.children[0].children[0].material[2].uniforms.time.value = time * 0.005;

      // debugger

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

      // debugger;
    }
  }
});
