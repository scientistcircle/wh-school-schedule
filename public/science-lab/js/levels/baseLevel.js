/**
 * SCIENCE LAB: The Lost Energy Core
 * Base Level Class - Common 3D room construction, geometry management, and resource disposal
 * 
 * THREE.JS VIVA CONCEPTS:
 * - Resource Management & Disposal: WebGL allocates GPU memory for Buffers and Textures.
 *   Calling .dispose() on geometries and materials when switching levels prevents GPU memory leaks.
 * - Procedural Architecture: Rooms, tables, and props are generated programmatically using BoxGeometry,
 *   CylinderGeometry, and SphereGeometry.
 */

import * as THREE from 'three';

export class BaseLevel {
  constructor(levelId, title, themeColor = 0x00f0ff) {
    this.levelId = levelId;
    this.title = title;
    this.themeColor = themeColor;

    // Root Three.js Group container for all 3D meshes in this level
    this.rootGroup = new THREE.Group();

    // Arrays to register colliders and interactables with Player and Raycaster
    this.colliders = [];
    this.interactables = [];

    // Animated objects list (e.g. rotating coils, pulsing cores, bubbling liquids)
    this.animatedObjects = [];

    // Default player spawn point
    this.spawnPoint = { x: 0, y: 0, z: 8, rotY: 0 };
  }

  /**
   * Builds the futuristic laboratory room shell: Floor grid, glowing walls, ceiling, and neon trims
   */
  buildLabRoom(roomWidth = 28, roomLength = 28, roomHeight = 6) {
    // 1. Cybernetic Lab Floor (Dark reflective composite tiles)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength, 28, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a1020,
      roughness: 0.2,
      metalness: 0.6,
      wireframe: false
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.rootGroup.add(floor);

    // Floor Grid Overlay (Glowing sci-fi wireframe lines)
    const gridHelper = new THREE.GridHelper(roomWidth, 28, this.themeColor, 0x1e293b);
    gridHelper.position.y = 0.01;
    this.rootGroup.add(gridHelper);

    // 2. Ceiling with glowing soft panel
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.9
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = roomHeight;
    ceiling.rotation.x = Math.PI / 2;
    this.rootGroup.add(ceiling);

    // 3. Laboratory Wall Material
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.4
    });

    const neonTrimMat = new THREE.MeshStandardMaterial({
      color: this.themeColor,
      emissive: this.themeColor,
      emissiveIntensity: 0.7
    });

    const halfW = roomWidth / 2;
    const halfL = roomLength / 2;
    const halfH = roomHeight / 2;

    // Helper to create a wall section with glowing neon baseboard and top trim
    const createWall = (width, px, py, pz, ry = 0) => {
      const wallGroup = new THREE.Group();
      
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(width, roomHeight, 0.4), wallMat);
      wallMesh.position.set(0, halfH, 0);
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);

      // Bottom glowing neon stripe
      const bottomTrim = new THREE.Mesh(new THREE.BoxGeometry(width, 0.15, 0.45), neonTrimMat);
      bottomTrim.position.set(0, 0.1, 0);
      wallGroup.add(bottomTrim);

      // Mid-level glowing sci-fi stripe
      const midTrim = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.45), neonTrimMat);
      midTrim.position.set(0, roomHeight * 0.65, 0);
      wallGroup.add(midTrim);

      wallGroup.position.set(px, py, pz);
      wallGroup.rotation.y = ry;
      this.rootGroup.add(wallGroup);
      this.colliders.push(wallMesh);
    };

    // North Wall (Back)
    createWall(roomWidth, 0, 0, -halfL, 0);
    // South Wall (Front)
    createWall(roomWidth, 0, 0, halfL, 0);
    // West Wall (Left)
    createWall(roomLength, -halfW, 0, 0, Math.PI / 2);
    // East Wall (Right)
    createWall(roomLength, halfW, 0, 0, Math.PI / 2);

    // 4. Glowing Corner Energy Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, roomHeight, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2
    });

    const pillarPositions = [
      [-halfW + 0.8, -halfL + 0.8],
      [halfW - 0.8, -halfL + 0.8],
      [-halfW + 0.8, halfL - 0.8],
      [halfW - 0.8, halfL - 0.8]
    ];

    pillarPositions.forEach(([x, z]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, halfH, z);
      pillar.castShadow = true;
      this.rootGroup.add(pillar);
      this.colliders.push(pillar);

      // Glowing core inside pillar
      const coreLight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, roomHeight - 0.5, 8),
        neonTrimMat
      );
      coreLight.position.set(x, halfH, z);
      this.rootGroup.add(coreLight);
    });
  }

  /**
   * Helper to create a standard futuristic Laboratory Workbench
   */
  createLabWorkbench(x, z, rotY = 0, width = 4, depth = 1.8, height = 1.0) {
    const tableGroup = new THREE.Group();

    // Table Top Surface
    const topGeo = new THREE.BoxGeometry(width, 0.15, depth);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = height;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Glowing Cyan Trim along table edge
    const edgeTrim = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.05, 0.06, depth + 0.05),
      new THREE.MeshStandardMaterial({
        color: this.themeColor,
        emissive: this.themeColor,
        emissiveIntensity: 0.8
      })
    );
    edgeTrim.position.y = height + 0.06;
    tableGroup.add(edgeTrim);

    // Table Base Pedestals
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const legGeo = new THREE.BoxGeometry(0.3, height, depth * 0.8);

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-width / 2 + 0.4, height / 2, 0);
    leftLeg.castShadow = true;
    tableGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(width / 2 - 0.4, height / 2, 0);
    rightLeg.castShadow = true;
    tableGroup.add(rightLeg);

    tableGroup.position.set(x, 0, z);
    tableGroup.rotation.y = rotY;
    this.rootGroup.add(tableGroup);

    // Register tabletop for physical player collision
    this.colliders.push(topMesh);

    return tableGroup;
  }

  /**
   * Per-frame animation hook
   */
  update(delta) {
    for (const item of this.animatedObjects) {
      if (item && item.tick) item.tick(delta);
    }
  }

  /**
   * Clean up WebGL resources when switching levels (prevents GPU memory leaks)
   */
  dispose() {
    this.rootGroup.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    this.colliders = [];
    this.interactables = [];
    this.animatedObjects = [];
  }
}
