import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, TransformControls } from '@react-three/drei';
import useStore from '../store/useStore';
import ExportManager from './ExportManager';
import WoodComponent from './objects/WoodComponent';

const Scene = ({ readOnly }) => {
  const components = useStore(state => state.components);
  const selectedComponentId = useStore(state => state.selectedComponentId);
  const selectComponent = useStore(state => state.selectComponent);
  const updateComponent = useStore(state => state.updateComponent);

  return (
    <>
      <ExportManager />
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Grid and Environment */}
      <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#222" />
      <Environment preset="city" />
      <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={50} blur={2} far={10} />

      {/* Render Components */}
      {components.map(comp => (
        <WoodComponent key={comp.id} {...comp} readOnly={readOnly} />
      ))}
    </>
  );
};

const Viewport = ({ readOnly = false }) => {
  const selectComponent = useStore(state => state.selectComponent);

  return (
    <div className="viewport-container">
      <Canvas 
        shadows 
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [45, 45, 45], fov: 50 }}
        onPointerMissed={() => !readOnly && selectComponent(null)}
      >
        <Suspense fallback={null}>
          <Scene readOnly={readOnly} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Viewport;
