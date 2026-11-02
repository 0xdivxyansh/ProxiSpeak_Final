/**
 * Final Proxispeak - 3D Virtual Tech Office Workspace (Three.js)
 *
 * Implements:
 * - 3D Silicon Valley Tech Office Environment:
 *   * Executive Conference Boardroom with large meeting table, ergonomic conference chairs,
 *     and wall-mounted 4K presentation display / whiteboard
 *   * Engineering Workstation Clusters with dual curved monitors, PC towers, keyboards, and mesh chairs
 *   * Quiet Call Pods and Acoustic Sound-Baffle Partitions
 *   * Breakroom Cafe Lounge with modern sofas, coffee tables, mugs, and filtered water cooler
 *   * Reception & Concierge Desk at the main lobby entrance
 *   * Architectural Indoor Office Plants (Monstera, Ficus) in ceramic planters
 *   * Modular commercial tech carpet tile flooring with subtle seams
 *   * Linear LED pendant office troffer lights, soft area illumination, and dynamic shadows
 * - Spatial Audio & Proximity Voice Chat:
 *   * Real-time 3D glowing proximity audio radius (100px)
 *   * Live voice activity wave pulsing
 *   * Real-time acoustic raycasting occlusion muffling through conference walls
 * - Controls:
 *   * WASD / Arrow key movement with authoritative obstacle sliding collision
 *   * OrbitControls: Left-click rotate, right-click pan, scroll wheel zoom
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { KeyboardController } from './input/keyboardController.js';
import { audioContextService } from '../services/audio/audioContextService.js';
import { spatialAudioEngine, calculateOcclusion } from '../services/audio/spatialAudioEngine.js';
import { WORKSPACE_CONFIG } from '../constants/config.js';

export function Workspace3D({
  localUser,
  remoteUsers = [],
  layout,
  proximityPeerIds = new Set(),
  onLocalMove = () => {},
  fpsReport = () => {}
}) {
  const mountRef = useRef(null);

  const localUserRef = useRef(localUser);
  const remoteUsersRef = useRef(remoteUsers);
  const layoutRef = useRef(layout);
  const proximityPeerIdsRef = useRef(proximityPeerIds);

  useEffect(() => {
    localUserRef.current = localUser;
  }, [localUser]);

  useEffect(() => {
    remoteUsersRef.current = remoteUsers;
  }, [remoteUsers]);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    proximityPeerIdsRef.current = proximityPeerIds;
  }, [proximityPeerIds]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || Math.max(400, window.innerHeight - 56);

    const workspaceWidth = layout?.dimensions?.width || 1600;
    const workspaceHeight = layout?.dimensions?.height || 1000;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0006);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    camera.position.set(0, 480, 560);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Modern Office Lighting Design
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.85); // Crisp daylight ambient
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(400, 750, 450);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 50;
    sunLight.shadow.camera.far = 2000;
    sunLight.shadow.camera.left = -workspaceWidth / 2;
    sunLight.shadow.camera.right = workspaceWidth / 2;
    sunLight.shadow.camera.top = workspaceHeight / 2;
    sunLight.shadow.camera.bottom = -workspaceHeight / 2;
    scene.add(sunLight);

    // Overhead Conference Room Pendant
    const confLight = new THREE.PointLight(0x38bdf8, 2.5, 750);
    confLight.position.set(-470, 180, -210);
    scene.add(confLight);

    // Dev Pod Overhead LED Fixture
    const devLight = new THREE.PointLight(0x60a5fa, 2.0, 750);
    devLight.position.set(0, 180, -250);
    scene.add(devLight);

    // Breakroom Lounge Warm Accent Light
    const loungeLight = new THREE.PointLight(0xfde68a, 2.2, 700);
    loungeLight.position.set(530, 180, -230);
    scene.add(loungeLight);

    // 3. Office Flooring: High-Tech Modular Carpet Tiles
    const floorGeo = new THREE.PlaneGeometry(workspaceWidth, workspaceHeight);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Dark tech slate carpet
      roughness: 0.85,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle Architectural Grid lines
    const gridHelper = new THREE.GridHelper(Math.max(workspaceWidth, workspaceHeight), 50, 0x1e3a8a, 0x1e293b);
    gridHelper.position.y = 0.5;
    scene.add(gridHelper);

    // Helper: Map 2D coordinates [0..W, 0..H] to 3D Scene [X, 0, Z]
    function to3DCoords(px, py) {
      return {
        x: px - workspaceWidth / 2,
        z: py - workspaceHeight / 2
      };
    }

    // Helper: Create Text Sprite for Badges and Floating Room Labels
    function createTextSprite(text, isAccent = false, fontSize = 22, w = 256, h = 64) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = isAccent ? 'rgba(14, 165, 233, 0.95)' : 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, h - 16, 12);
      ctx.fill();

      ctx.strokeStyle = isAccent ? '#38bdf8' : '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(w * 0.28, h * 0.28, 1);
      return sprite;
    }

    // Helper: Build Ergonomic Mesh Office Chair
    function buildOfficeChair(colorHex = 0x1e293b) {
      const chair = new THREE.Group();
      const chairMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

      // Star Base & Center Stem
      const stemGeo = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
      const stem = new THREE.Mesh(stemGeo, chromeMat);
      stem.position.y = 5;
      chair.add(stem);

      const baseGeo = new THREE.CylinderGeometry(8, 8, 1.5, 5);
      const base = new THREE.Mesh(baseGeo, chromeMat);
      base.position.y = 1;
      chair.add(base);

      // Seat Cushion
      const seatGeo = new THREE.BoxGeometry(16, 3, 16);
      const seat = new THREE.Mesh(seatGeo, chairMat);
      seat.position.y = 12;
      seat.castShadow = true;
      chair.add(seat);

      // Curved Mesh Backrest
      const backGeo = new THREE.BoxGeometry(15, 20, 2.5);
      const back = new THREE.Mesh(backGeo, chairMat);
      back.position.set(0, 22, -7.5);
      back.castShadow = true;
      chair.add(back);

      // Armrests
      const armGeo = new THREE.BoxGeometry(2, 8, 10);
      const armL = new THREE.Mesh(armGeo, chromeMat);
      armL.position.set(-8.5, 16, 0);
      chair.add(armL);

      const armR = new THREE.Mesh(armGeo, chromeMat);
      armR.position.set(8.5, 16, 0);
      chair.add(armR);

      return chair;
    }

    // 4. Build 3D Tech Office Furniture Objects
    const furnitureGroup = new THREE.Group();
    const furnitureItems = layout?.furniture || [];

    for (const item of furnitureItems) {
      const coords = to3DCoords(item.x + item.width / 2, item.y + item.height / 2);
      const group = new THREE.Group();
      group.position.set(coords.x, 0, coords.z);

      if (item.type === 'wall') {
        // Architectural Office Wall
        const wallH = 60;
        const geo = new THREE.BoxGeometry(item.width, wallH, item.height);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.7,
          metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = wallH / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        // Glass window band on top for modern conference walls
        if (item.width > 100 || item.height > 100) {
          const glassH = 14;
          const glassGeo = new THREE.BoxGeometry(
            item.width > item.height ? item.width - 20 : item.width,
            glassH,
            item.height > item.width ? item.height - 20 : item.height
          );
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            metalness: 0.5
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.y = wallH - glassH / 2;
          group.add(glassMesh);
        }
      } else if (item.type === 'acoustic_partition') {
        // Modern Acoustic Sound Slat Baffle Partition
        const partH = 50;
        const geo = new THREE.BoxGeometry(item.width, partH, item.height);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0284c7, // Electric blue acoustic felt
          roughness: 0.4,
          metalness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = partH / 2;
        mesh.castShadow = true;
        group.add(mesh);

        // Acoustic Ridges / Slats
        const slatGeo = new THREE.BoxGeometry(
          item.width > item.height ? 4 : item.width + 2,
          partH - 6,
          item.height > item.width ? 4 : item.height + 2
        );
        const slatMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
        const step = 20;
        const maxLen = Math.max(item.width, item.height);
        for (let offset = -maxLen / 2 + step; offset < maxLen / 2; offset += step) {
          const slat = new THREE.Mesh(slatGeo, slatMat);
          if (item.width > item.height) {
            slat.position.set(offset, partH / 2, 0);
          } else {
            slat.position.set(0, partH / 2, offset);
          }
          group.add(slat);
        }
      } else if (item.type === 'meeting_table') {
        // --- EXECUTIVE BOARDROOM CONFERENCE TABLE ---
        const tableW = item.width;
        const tableD = item.height;
        const tableH = 28;

        // Beveled Boardroom Tabletop
        const topGeo = new THREE.BoxGeometry(tableW, 4, tableD);
        const topMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a, // Deep slate / smoked walnut
          roughness: 0.35,
          metalness: 0.25
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = tableH;
        top.castShadow = true;
        top.receiveShadow = true;
        group.add(top);

        // Center Aluminum Cable Box & Power Inlay
        const hubGeo = new THREE.BoxGeometry(tableW * 0.45, 1, 14);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.position.set(0, tableH + 2.1, 0);
        group.add(hub);

        // Dual Heavy Pedestal Column Bases
        const pedGeo = new THREE.CylinderGeometry(14, 18, tableH, 24);
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
        const ped1 = new THREE.Mesh(pedGeo, pedMat);
        ped1.position.set(-tableW * 0.28, tableH / 2, 0);
        ped1.castShadow = true;
        group.add(ped1);

        const ped2 = new THREE.Mesh(pedGeo, pedMat);
        ped2.position.set(tableW * 0.28, tableH / 2, 0);
        ped2.castShadow = true;
        group.add(ped2);

        // 6 Executive Conference Chairs surrounding the table
        const chairOffsets = [
          { x: -tableW * 0.3, z: -tableD / 2 - 16, rot: 0 },
          { x: 0, z: -tableD / 2 - 16, rot: 0 },
          { x: tableW * 0.3, z: -tableD / 2 - 16, rot: 0 },
          { x: -tableW * 0.3, z: tableD / 2 + 16, rot: Math.PI },
          { x: 0, z: tableD / 2 + 16, rot: Math.PI },
          { x: tableW * 0.3, z: tableD / 2 + 16, rot: Math.PI }
        ];
        for (const co of chairOffsets) {
          const chair = buildOfficeChair(0x1e293b);
          chair.position.set(co.x, 0, co.z);
          chair.rotation.y = co.rot;
          group.add(chair);
        }
      } else if (item.type === 'whiteboard') {
        // --- 4K PRESENTATION DISPLAY & WHITEBOARD ---
        const boardW = item.width;
        const boardH = 34;
        const frameGeo = new THREE.BoxGeometry(boardW, boardH, 3);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 35;
        frame.castShadow = true;
        group.add(frame);

        // Glowing Screen Display (Analytics / Presentation View)
        const screenGeo = new THREE.BoxGeometry(boardW - 6, boardH - 6, 1);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 35, 1.6);
        group.add(screen);
      } else if (item.type === 'desk') {
        // --- DEVELOPER / WORKSTATION DESK WITH DUAL MONITORS ---
        const dW = item.width;
        const dD = item.height;
        const dH = 26;

        // Desk Surface
        const topGeo = new THREE.BoxGeometry(dW, 3, dD);
        const topMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = dH;
        top.castShadow = true;
        group.add(top);

        // Sturdy Steel Legs
        const legGeo = new THREE.BoxGeometry(3, dH, dD - 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
        const legL = new THREE.Mesh(legGeo, legMat);
        legL.position.set(-dW / 2 + 4, dH / 2, 0);
        legL.castShadow = true;
        group.add(legL);

        const legR = new THREE.Mesh(legGeo, legMat);
        legR.position.set(dW / 2 - 4, dH / 2, 0);
        legR.castShadow = true;
        group.add(legR);

        // Dual Curved Computer Monitors
        const monW = Math.min(34, dW * 0.35);
        const monH = 18;
        const monGeo = new THREE.BoxGeometry(monW, monH, 2);
        const monMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Glowing IDE code screen

        // Left Monitor
        const mon1 = new THREE.Group();
        mon1.position.set(-monW * 0.55, dH + 12, -dD * 0.15);
        mon1.rotation.y = 0.15;
        const mBody1 = new THREE.Mesh(monGeo, monMat);
        const mScreen1 = new THREE.Mesh(new THREE.BoxGeometry(monW - 2, monH - 2, 0.5), screenMat);
        mScreen1.position.z = 1.1;
        mon1.add(mBody1);
        mon1.add(mScreen1);
        group.add(mon1);

        // Right Monitor
        const mon2 = new THREE.Group();
        mon2.position.set(monW * 0.55, dH + 12, -dD * 0.15);
        mon2.rotation.y = -0.15;
        const mBody2 = new THREE.Mesh(monGeo, monMat);
        const mScreen2 = new THREE.Mesh(new THREE.BoxGeometry(monW - 2, monH - 2, 0.5), screenMat);
        mScreen2.position.z = 1.1;
        mon2.add(mBody2);
        mon2.add(mScreen2);
        group.add(mon2);

        // Keyboard & Mousepad on desk
        const kbGeo = new THREE.BoxGeometry(22, 1, 9);
        const kbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
        const kb = new THREE.Mesh(kbGeo, kbMat);
        kb.position.set(0, dH + 2, dD * 0.15);
        group.add(kb);

        // Desktop Tower PC under desk
        const towerGeo = new THREE.BoxGeometry(10, 18, 16);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.6 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(dW / 2 - 14, 9, 0);
        tower.castShadow = true;
        group.add(tower);

        // Ergonomic Chair behind desk
        const chair = buildOfficeChair(0x2563eb);
        chair.position.set(0, 0, dD / 2 + 14);
        group.add(chair);
      } else if (item.type === 'sofa') {
        // --- MODERN BREAKROOM LOUNGE SOFA ---
        const sW = item.width;
        const sD = item.height;
        const sofaGroup = new THREE.Group();

        // Main Plush Base
        const baseGeo = new THREE.BoxGeometry(sW, 12, sD);
        const sofaMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.75 }); // Deep azure fabric
        const base = new THREE.Mesh(baseGeo, sofaMat);
        base.position.y = 6;
        base.castShadow = true;
        sofaGroup.add(base);

        // Backrest
        const backGeo = new THREE.BoxGeometry(sW, 18, 10);
        const back = new THREE.Mesh(backGeo, sofaMat);
        back.position.set(0, 16, -sD / 2 + 5);
        back.castShadow = true;
        sofaGroup.add(back);

        // Armrests
        const armGeo = new THREE.BoxGeometry(10, 14, sD);
        const armL = new THREE.Mesh(armGeo, sofaMat);
        armL.position.set(-sW / 2 + 5, 12, 0);
        sofaGroup.add(armL);

        const armR = new THREE.Mesh(armGeo, sofaMat);
        armR.position.set(sW / 2 - 5, 12, 0);
        sofaGroup.add(armR);

        group.add(sofaGroup);
      } else if (item.type === 'coffee_table') {
        // --- LOUNGE ESPRESSO COFFEE TABLE ---
        const topGeo = new THREE.BoxGeometry(item.width, 3, item.height);
        const topMat = new THREE.MeshStandardMaterial({
          color: 0x78350f, // Warm wood grain
          roughness: 0.4
        });
        const table = new THREE.Mesh(topGeo, topMat);
        table.position.y = 12;
        table.castShadow = true;
        group.add(table);

        // Metal Hairpin Legs
        const legGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const offsets = [
          [-item.width / 2 + 8, -item.height / 2 + 8],
          [item.width / 2 - 8, -item.height / 2 + 8],
          [-item.width / 2 + 8, item.height / 2 - 8],
          [item.width / 2 - 8, item.height / 2 - 8]
        ];
        for (const [lx, lz] of offsets) {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(lx, 6, lz);
          group.add(leg);
        }

        // Ceramic Coffee Mug on Table
        const mugGeo = new THREE.CylinderGeometry(2, 2, 4, 12);
        const mugMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const mug = new THREE.Mesh(mugGeo, mugMat);
        mug.position.set(-8, 15, 0);
        group.add(mug);
      } else if (item.type === 'water_cooler') {
        // --- FILTERED WATER COOLER STATION ---
        const coolerGeo = new THREE.BoxGeometry(item.width, 32, item.height);
        const coolerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
        const cooler = new THREE.Mesh(coolerGeo, coolerMat);
        cooler.position.y = 16;
        cooler.castShadow = true;
        group.add(cooler);

        // 5-Gallon Clear Blue Water Bottle
        const bottleGeo = new THREE.CylinderGeometry(9, 9, 20, 16);
        const bottleMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1
        });
        const bottle = new THREE.Mesh(bottleGeo, bottleMat);
        bottle.position.set(0, 42, 0);
        group.add(bottle);

        // Dispenser Taps (Red = Hot, Blue = Cold)
        const tapGeo = new THREE.BoxGeometry(2, 4, 2);
        const tapCold = new THREE.Mesh(tapGeo, new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
        tapCold.position.set(4, 22, item.height / 2 + 1);
        group.add(tapCold);

        const tapHot = new THREE.Mesh(tapGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        tapHot.position.set(-4, 22, item.height / 2 + 1);
        group.add(tapHot);
      } else if (item.type === 'plant') {
        // --- ARCHITECTURAL OFFICE FICUS / MONSTERA PLANT ---
        const potGeo = new THREE.CylinderGeometry(10, 8, 18, 16);
        const potMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.y = 9;
        pot.castShadow = true;
        group.add(pot);

        // Lush Green Foliage Spheres
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 22, 8), stemMat);
        stem.position.y = 20;
        group.add(stem);

        const foliageOffsets = [
          [0, 32, 0, 14],
          [-6, 36, 4, 11],
          [6, 38, -3, 11],
          [0, 44, 0, 10]
        ];
        for (const [fx, fy, fz, fr] of foliageOffsets) {
          const fMesh = new THREE.Mesh(new THREE.SphereGeometry(fr, 12, 12), foliageMat);
          fMesh.position.set(fx, fy, fz);
          fMesh.castShadow = true;
          group.add(fMesh);
        }
      } else {
        // Default Clean Solid Office Block
        const geo = new THREE.BoxGeometry(item.width, 30, item.height);
        const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 15;
        group.add(mesh);
      }

      furnitureGroup.add(group);
    }
    scene.add(furnitureGroup);

    // 5. Architectural 3D Office Department Signs
    const deptSigns = [
      { text: 'EXECUTIVE BOARDROOM', x: -470, z: -210, y: 70 },
      { text: 'ENGINEERING POD ALPHA', x: 0, z: -270, y: 70 },
      { text: 'BREAKROOM & CAFE', x: 530, z: -230, y: 70 },
      { text: 'PRODUCT DESIGN POD', x: -420, z: 180, y: 70 },
      { text: 'MAIN RECEPTION LOBBY', x: 0, z: 240, y: 70 }
    ];
    for (const ds of deptSigns) {
      const sprite = createTextSprite(ds.text, false, 20, 300, 56);
      sprite.position.set(ds.x, ds.y, ds.z);
      scene.add(sprite);
    }

    // 6. Local User 3D Avatar Creation
    const localAvatarGroup = new THREE.Group();
    const avatarColor = localUser?.color || '#38bdf8';
    const avatarColorHex = parseInt(avatarColor.replace('#', '0x'), 16);

    const bodyGeo = new THREE.CylinderGeometry(15, 15, 26, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: avatarColorHex,
      roughness: 0.3,
      metalness: 0.3
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 13;
    bodyMesh.castShadow = true;
    localAvatarGroup.add(bodyMesh);

    const headGeo = new THREE.SphereGeometry(13, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.y = 30;
    headMesh.castShadow = true;
    localAvatarGroup.add(headMesh);

    // Direction Visor
    const visorGeo = new THREE.BoxGeometry(12, 5, 8);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 30, 10);
    localAvatarGroup.add(visorMesh);

    // Floating Local User Name Badge
    const localNameSprite = createTextSprite(localUser?.displayName || 'You', true, 22, 240, 56);
    localNameSprite.position.y = 48;
    localAvatarGroup.add(localNameSprite);

    // 3D Glowing Proximity Voice Activation Ring (100 px Radius)
    const proximityRingGeo = new THREE.RingGeometry(96, 100, 64);
    const proximityRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const proximityRing = new THREE.Mesh(proximityRingGeo, proximityRingMat);
    proximityRing.rotation.x = -Math.PI / 2;
    proximityRing.position.y = 1;
    localAvatarGroup.add(proximityRing);

    scene.add(localAvatarGroup);

    // 7. Remote Users Map
    const remoteAvatarMeshes = new Map();

    // 8. OrbitControls & Mouse Camera Handling
    let isDragging = false;
    let dragButton = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;

    let cameraTheta = 0;
    let cameraPhi = 0.72;
    let cameraRadius = 600;
    const cameraTarget = new THREE.Vector3(0, 20, 0);

    function updateCameraPosition() {
      camera.position.x = cameraTarget.x + cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      camera.position.y = cameraTarget.y + cameraRadius * Math.cos(cameraPhi);
      camera.position.z = cameraTarget.z + cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.lookAt(cameraTarget);
    }
    updateCameraPosition();

    const handleMouseDown = (e) => {
      isDragging = true;
      dragButton = e.button;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (dragButton === 0) {
        // Left click = Orbit rotate
        cameraTheta -= dx * 0.006;
        cameraPhi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, cameraPhi - dy * 0.006));
      } else if (dragButton === 2) {
        // Right click = Pan
        const panSpeed = 0.8;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        cameraTarget.addScaledVector(right, -dx * panSpeed);
        cameraTarget.addScaledVector(forward, dy * panSpeed);
      }
      updateCameraPosition();
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e) => {
      cameraRadius = Math.max(160, Math.min(1400, cameraRadius + e.deltaY * 0.7));
      updateCameraPosition();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    // 9. WASD Keyboard Movement & Collision Physics
    const keyboardController = new KeyboardController();
    keyboardController.attach();

    const moveSpeed = 4.2;
    const avatarRadius = 16;

    let posX = localUserRef.current?.x || workspaceWidth / 2;
    let posY = localUserRef.current?.y || workspaceHeight / 2;
    let hasInitializedSpawn = localUserRef.current?.x != null;

    function checkCollision(px, py) {
      const items = layoutRef.current?.furniture || [];
      for (const item of items) {
        if (!item.isSolid) continue;
        const closestX = Math.max(item.x, Math.min(px, item.x + item.width));
        const closestY = Math.max(item.y, Math.min(py, item.y + item.height));
        const distX = px - closestX;
        const distY = py - closestY;
        if (distX * distX + distY * distY < avatarRadius * avatarRadius) {
          return true;
        }
      }
      return (
        px - avatarRadius < 0 ||
        px + avatarRadius > workspaceWidth ||
        py - avatarRadius < 0 ||
        py + avatarRadius > workspaceHeight
      );
    }

    // 10. Animation Loop & WebRTC Spatial Audio Sync
    let animationFrameId;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const renderLoop = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        fpsReport(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }

      if (!hasInitializedSpawn && localUserRef.current?.x != null) {
        posX = localUserRef.current.x;
        posY = localUserRef.current.y;
        hasInitializedSpawn = true;
      }

      // Handle keyboard movement with sliding collision
      const input = typeof keyboardController.getInput === 'function'
        ? keyboardController.getInput()
        : {
            up: keyboardController.keys?.has('KeyW') || keyboardController.keys?.has('ArrowUp'),
            down: keyboardController.keys?.has('KeyS') || keyboardController.keys?.has('ArrowDown'),
            left: keyboardController.keys?.has('KeyA') || keyboardController.keys?.has('ArrowLeft'),
            right: keyboardController.keys?.has('KeyD') || keyboardController.keys?.has('ArrowRight')
          };
      let dx = 0;
      let dy = 0;
      let facing = 'down';

      if (input.up) {
        dy -= moveSpeed;
        facing = 'up';
      }
      if (input.down) {
        dy += moveSpeed;
        facing = 'down';
      }
      if (input.left) {
        dx -= moveSpeed;
        facing = 'left';
      }
      if (input.right) {
        dx += moveSpeed;
        facing = 'right';
      }

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      if (dx !== 0 || dy !== 0) {
        let newX = posX + dx;
        let newY = posY + dy;

        if (!checkCollision(newX, newY)) {
          posX = newX;
          posY = newY;
        } else if (!checkCollision(newX, posY)) {
          posX = newX; // Slide on X
        } else if (!checkCollision(posX, newY)) {
          posY = newY; // Slide on Y
        }

        onLocalMove(Math.round(posX), Math.round(posY), facing);
      }

      // Sync Local Avatar 3D Position
      const local3D = to3DCoords(posX, posY);
      localAvatarGroup.position.set(local3D.x, 0, local3D.z);

      // Follow Camera to Avatar smoothly
      cameraTarget.x += (local3D.x - cameraTarget.x) * 0.08;
      cameraTarget.z += (local3D.z - cameraTarget.z) * 0.08;
      updateCameraPosition();

      // Orient Avatar Visor
      if (facing === 'right') localAvatarGroup.rotation.y = Math.PI / 2;
      else if (facing === 'down') localAvatarGroup.rotation.y = 0;
      else if (facing === 'left') localAvatarGroup.rotation.y = -Math.PI / 2;
      else if (facing === 'up') localAvatarGroup.rotation.y = Math.PI;

      // Pulse proximity ring with audio voice activity
      const voiceVol = typeof audioContextService.getAudioLevel === 'function'
        ? audioContextService.getAudioLevel()
        : (typeof audioContextService.getLocalVolume === 'function' ? audioContextService.getLocalVolume() : 0);
      const scaleMultiplier = 1 + voiceVol * 0.45;
      proximityRing.scale.set(scaleMultiplier, scaleMultiplier, 1);
      proximityRingMat.opacity = 0.45 + voiceVol * 0.45;

      // Update Remote Avatars
      const activePeers = remoteUsersRef.current || [];
      const activePeerIds = new Set(activePeers.map((p) => p.userId));

      for (const [userId, peerData] of remoteAvatarMeshes.entries()) {
        if (!activePeerIds.has(userId)) {
          scene.remove(peerData.group);
          remoteAvatarMeshes.delete(userId);
        }
      }

      for (const peer of activePeers) {
        let peerData = remoteAvatarMeshes.get(peer.userId);
        if (!peerData) {
          const group = new THREE.Group();
          const colorHex = parseInt((peer.color || '#38bdf8').replace('#', '0x'), 16);
          const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.4 });

          const bGeo = new THREE.CylinderGeometry(15, 15, 26, 24);
          const bMesh = new THREE.Mesh(bGeo, mat);
          bMesh.position.y = 13;
          bMesh.castShadow = true;
          group.add(bMesh);

          const hGeo = new THREE.SphereGeometry(13, 24, 24);
          const hMesh = new THREE.Mesh(hGeo, mat);
          hMesh.position.y = 30;
          hMesh.castShadow = true;
          group.add(hMesh);

          const visorGeo = new THREE.BoxGeometry(12, 5, 8);
          const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const v = new THREE.Mesh(visorGeo, visorMat);
          v.position.set(0, 30, 10);
          group.add(v);

          const nameSprite = createTextSprite(peer.displayName, false, 22, 240, 56);
          nameSprite.position.y = 48;
          group.add(nameSprite);

          scene.add(group);
          peerData = { group, targetX: 0, targetZ: 0 };
          remoteAvatarMeshes.set(peer.userId, peerData);
        }

        const peer3D = to3DCoords(peer.x, peer.y);
        peerData.targetX = peer3D.x;
        peerData.targetZ = peer3D.z;

        peerData.group.position.x += (peerData.targetX - peerData.group.position.x) * 0.25;
        peerData.group.position.z += (peerData.targetZ - peerData.group.position.z) * 0.25;

        const pFacing = peer.facing || 'down';
        if (pFacing === 'right') peerData.group.rotation.y = Math.PI / 2;
        else if (pFacing === 'down') peerData.group.rotation.y = 0;
        else if (pFacing === 'left') peerData.group.rotation.y = -Math.PI / 2;
        else if (pFacing === 'up') peerData.group.rotation.y = Math.PI;

        // WebRTC Spatial Audio Occlusion Update
        if (localUserRef.current && proximityPeerIdsRef.current.has(peer.userId)) {
          const occlusion = calculateOcclusion(
            localUserRef.current.x,
            localUserRef.current.y,
            peer.x,
            peer.y,
            layoutRef.current?.furniture || []
          );
          spatialAudioEngine.updateSpatialAudio(
            peer.userId,
            localUserRef.current.x,
            localUserRef.current.y,
            peer.x,
            peer.y,
            occlusion.attenuationFactor
          );
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      keyboardController.detach();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [layout, onLocalMove, fpsReport]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'grab'
      }}
    />
  );
}
