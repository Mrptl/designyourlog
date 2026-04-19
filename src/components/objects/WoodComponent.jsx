import React, { useRef, useState, useEffect } from 'react';
import { useCursor, DragControls, Html, Edges } from '@react-three/drei';
import { Vector3 } from 'three';
import useStore from '../../store/useStore';

const WoodComponent = ({ id, dimensions, position, rotation, color, locked = false, readOnly = false }) => {
  const showLabels = useStore(state => state.showLabels);
  const displayUnit = useStore(state => state.displayUnit);
  const selectComponent = useStore(state => state.selectComponent);
  const selectedComponentIds = useStore(state => state.selectedComponentIds);
  // const updateComponent = useStore(state => state.updateComponent);

  const objectRef = useRef();

  const isSelected = selectedComponentIds.includes(id);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !readOnly && !locked);

  const safeNum = (val, fallback = 0) => {
    const num = Number(val);
    return Number.isNaN(num) ? fallback : num;
  };


  const safeDimensions = [safeNum(dimensions[0], 1), safeNum(dimensions[1], 1), safeNum(dimensions[2], 1)];
  const safePosition = [safeNum(position[0], 0), safeNum(position[1], 0), safeNum(position[2], 0)];
  const safeRotation = [
    safeNum(rotation[0], 0) * Math.PI / 180,
    safeNum(rotation[1], 0) * Math.PI / 180,
    safeNum(rotation[2], 0) * Math.PI / 180
  ];

  const isDragging = useStore(state => state.isDragging);
  useEffect(() => {
    if (!objectRef.current || isDragging) return;

    objectRef.current.position.set(
      safePosition[0],
      safePosition[1],
      safePosition[2]
    );

    objectRef.current.rotation.set(
      safeRotation[0],
      safeRotation[1],
      safeRotation[2]
    );
  }, [position, rotation, isDragging]);


  const toDisplay = (val) => {
    const num = safeNum(val);
    return displayUnit === 'mm' ? (num * 25.4).toFixed(0) : num.toFixed(1);
  };

  // syncPosition removed - handled in Viewport



  const componentElement = (
    <group ref={objectRef}>

      <mesh
        onClick={(e) => {
          if (readOnly) return;
          e.stopPropagation();
          selectComponent(id, e.shiftKey);
        }}
        onPointerOver={(e) => {
          if (readOnly || locked) return;
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
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
      </mesh>

      {showLabels && (
        <Html distanceFactor={10} position={[0, safeDimensions[1] / 2 + 0.2, 0]}>
          <div
            style={{
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              pointerEvents: 'none',
              border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
              transform: 'translate(-50%, -100%)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            {locked && <span style={{ color: '#fbbf24' }}>Locked</span>}
            {`${toDisplay(safeDimensions[0])}x${toDisplay(safeDimensions[1])}x${toDisplay(safeDimensions[2])} ${displayUnit}`}
          </div>
        </Html>
      )}
    </group>
  );

  return componentElement;


};

export default WoodComponent;
