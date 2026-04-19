# Comprehensive Fix Plan for 3 Bugs

## Bugs

1. **Overlap Drag**: Unselected moves when overlapping selected during drag
2. **Lock Position Shift**: Position changes on lock
3. **Save/Load Scatter**: Components displace on reload

## Information Gathered (from files)

- **WoodComponent.jsx**: DragControls per unlocked component → overlap raycast issues. useEffect props→position overrides drag. syncPosition `worldToLocal` wrong.
- **Viewport.jsx**: No scene ref/group for coordinates.
- **useStore.js**: serializeComponents good. isDragging exists.

## Plan

1. **Overlap**: Single Viewport-level DragControls filtering selected unlocked objects.
2. **Lock shift**: Skip useEffect during drag/locked. syncPosition → world position.
3. **Save/load**: Enhance deserial  (Number).

## Files

- WoodComponent.jsx (remove DragControls, fix useEffect, syncPosition)
- Viewport.jsx (add scene ref, DragControls)
- useStore.js (add sceneRefs map, selectedUnlocked)

## Approved [✅]
