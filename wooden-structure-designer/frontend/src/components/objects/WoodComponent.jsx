import React, { useRef, useState } from 'react';
import { useCursor, DragControls, Html, Edges } from '@react-three/drei';
import useStore from '../../store/useStore';

const WoodComponent = ({ id, dimensions, position, rotation, color, readOnly = false }) => {
  const showLabels = useStore(state => state.showLabels);
  const displayUnit = useStore(state => state.displayUnit);
  const selectComponent = useStore(state => state.selectComponent);
  const selectedComponentId = useStore(state => state.selectedComponentId);
  const updateComponent = useStore(state => state.updateComponent);
  const meshRef = useRef();

  const isSelected = selectedComponentId === id;
  const [hovered, setHovered] = useState(false);
  useCursor(!readOnly && hovered);

  const safeNum = (val, fallback = 0) => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  };

  const safeDimensions = [safeNum(dimensions[0], 1), safeNum(dimensions[1], 1), safeNum(dimensions[2], 1)];
  const safePosition = [safeNum(position[0]), safeNum(position[1]), safeNum(position[2])];
  const safeRotation = [safeNum(rotation[0]) * Math.PI / 180, safeNum(rotation[1]) * Math.PI / 180, safeNum(rotation[2]) * Math.PI / 180];

  const toDisplay = (val) => {
    const num = safeNum(val);
    return displayUnit === 'mm' ? (num * 25.4).toFixed(0) : num.toFixed(1);
  };

  const meshElement = (
    <mesh
      ref={meshRef}
      position={safePosition}
      rotation={safeRotation}
      onClick={(e) => {
        if (readOnly) return;
        e.stopPropagation();
        selectComponent(id);
      }}
      onPointerOver={(e) => {
        if (readOnly) return;
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => !readOnly && setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={safeDimensions} />
      <meshStandardMaterial 
        color={isSelected ? '#3b82f6' : (hovered && !readOnly ? '#e2b389' : color)} 
        roughness={0.8} 
        metalness={0.1}
      />
      {isSelected && <Edges color="white" />}
      {showLabels && (
        <Html distanceFactor={10} position={[0, safeDimensions[1]/2 + 0.2, 0]}>
          <div style={{ 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '10px',
            pointerEvents: 'none',
            border: '1px solid #3b82f6',
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap'
          }}>
            {`${toDisplay(safeDimensions[0])}x${toDisplay(safeDimensions[1])}x${toDisplay(safeDimensions[2])} ${displayUnit}`}
          </div>
        </Html>
      )}
    </mesh>
  );

  if (readOnly) return meshElement;

  return (
    <DragControls
      onDragStart={() => useStore.getState().saveState()}
      onDrag={() => {
        if (meshRef.current) {
          const { x, y, z } = meshRef.current.position;
          updateComponent(id, { position: [x, y, z] });
        }
      }}
    >
      {meshElement}
    </DragControls>
  );
};

export default WoodComponent;
