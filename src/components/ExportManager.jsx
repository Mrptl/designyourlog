import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import useStore from '../store/useStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as THREE from 'three';

const ExportManager = () => {
  const { gl, scene, camera } = useThree();
  const exportTrigger = useStore(state => state.exportTrigger);
  const clearExportTrigger = useStore(state => state.clearExportTrigger);
  const components = useStore(state => state.components);
  const displayUnit = useStore(state => state.displayUnit);

  useEffect(() => {
    if (!exportTrigger) return;

    if (exportTrigger.type === '3d') {
      handle3DExport();
    } else if (exportTrigger.type === 'pdf') {
      handlePDFExport();
    }

    clearExportTrigger();
  }, [exportTrigger]);

  const handle3DExport = () => {
    const exporter = new GLTFExporter();
    exporter.parse(scene, (gltf) => {
      const output = JSON.stringify(gltf, null, 2);
      const blob = new Blob([output], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wooden_design.gltf';
      link.click();
    }, { binary: false });
  };

  const captureImage = async (pos, lookAt = [0, 0, 0]) => {
    // Move camera
    camera.position.set(...pos);
    camera.lookAt(...lookAt);
    camera.updateProjectionMatrix();
    
    // Render
    gl.render(scene, camera);
    
    // Capture
    return gl.domElement.toDataURL('image/png');
  };

  const handlePDFExport = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Title
    pdf.setFontSize(22);
    pdf.setTextColor(40);
    pdf.text('Technical Design Report', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
    
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1);
    pdf.line(20, 35, pageWidth - 20, 35);

    // Capture Angles
    const originalPos = camera.position.clone();
    
    pdf.setFontSize(16);
    pdf.setTextColor(40);
    pdf.text('Visual Layouts', 20, 50);

    const angles = [
      { name: 'Wide Angle View', pos: [35, 25, 35] },
      { name: 'Perspective View', pos: [15, 15, 15] },
      { name: 'Top View', pos: [0, 25, 0] },
      { name: 'Front View', pos: [0, 0, 25] },
      { name: 'Side View', pos: [25, 0, 0] }
    ];

    let yOffset = 60;
    for (let i = 0; i < angles.length; i++) {
        const imgData = await captureImage(angles[i].pos);
        
        // Add to PDF in flexible grid (slightly smaller to fit 3 rows on one page)
        const imgWidth = 75;
        const imgHeight = 56;
        
        // Center the 5th image on the 3rd row, otherwise left/right
        let x = (i % 2 === 0) ? 20 : 115;
        if (i === 4) x = (pageWidth - imgWidth) / 2; // Center the last odd image
        
        const y = yOffset + (Math.floor(i / 2) * 70);
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.setFontSize(10);
        pdf.text(angles[i].name, x + imgWidth / 2, y + imgHeight + 5, { align: 'center' });
    }

    // Restore Camera
    camera.position.copy(originalPos);
    camera.lookAt(0, 0, 0);

    // New Page for Data Table
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Component Measurements List', 20, 20);

    const toDisplay = (val) => {
        return displayUnit === 'mm' ? (val * 25.4).toFixed(1) + ' mm' : val.toFixed(2) + ' in';
    };

    const tableData = components.map((c, i) => [
      i + 1,
      c.type.charAt(0).toUpperCase() + c.type.slice(1),
      `${toDisplay(c.dimensions[0])} x ${toDisplay(c.dimensions[1])} x ${toDisplay(c.dimensions[2])}`,
      `[${c.position.map(p => p.toFixed(1)).join(', ')}]`,
      c.color
    ]);

    autoTable(pdf, {
      startY: 30,
      head: [['#', 'Type', 'Dimensions (L x W x H)', 'Position [X, Y, Z]', 'Color']],
      body: tableData,
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    const finalY = pdf.lastAutoTable?.finalY || 30;
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text('© Dev Patel | Designed & Developed by Suchna Tech & Solutions', pageWidth / 2, 285, { align: 'center' });

    pdf.save(`Wooden_Design_${Date.now()}.pdf`);
  };

  return null;
};

export default ExportManager;
