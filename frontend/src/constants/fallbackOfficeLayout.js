/**
 * Final Proxispeak - Standalone Fallback Office Layout (for GitHub Pages / Offline mode)
 */

export const FALLBACK_OFFICE_LAYOUT = {
  layoutId: 'default-office-layout',
  name: 'Global Innovation Hub 3D Office',
  description: 'Corporate 3D Virtual Workspace with Executive Boardroom, Engineering Clusters, Acoustic Meeting Pods, Breakroom Cafe Lounge, and Water Cooler',
  dimensions: {
    width: 1600,
    height: 1000
  },
  spawnPoint: {
    x: 800,
    y: 850
  },
  furniture: [
    {
      id: 'perimeter_wall_north',
      type: 'wall',
      label: 'North Perimeter Wall',
      x: 60,
      y: 60,
      width: 1480,
      height: 20,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#334155'
    },
    {
      id: 'perimeter_wall_west',
      type: 'wall',
      label: 'West Perimeter Wall',
      x: 60,
      y: 60,
      width: 20,
      height: 850,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#334155'
    },
    {
      id: 'perimeter_wall_east',
      type: 'wall',
      label: 'East Perimeter Wall',
      x: 1520,
      y: 60,
      width: 20,
      height: 850,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#334155'
    },
    {
      id: 'perimeter_wall_south_left',
      type: 'wall',
      label: 'South Entrance Wall (Left)',
      x: 60,
      y: 890,
      width: 680,
      height: 20,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#334155'
    },
    {
      id: 'perimeter_wall_south_right',
      type: 'wall',
      label: 'South Entrance Wall (Right)',
      x: 860,
      y: 890,
      width: 680,
      height: 20,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#334155'
    },
    {
      id: 'conf_wall_west',
      type: 'wall',
      label: 'Conference Room West Wall',
      x: 100,
      y: 100,
      width: 20,
      height: 380,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#475569'
    },
    {
      id: 'conf_wall_north',
      type: 'wall',
      label: 'Conference Room North Wall',
      x: 100,
      y: 100,
      width: 450,
      height: 20,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#475569'
    },
    {
      id: 'conf_wall_east',
      type: 'wall',
      label: 'Conference Room East Wall',
      x: 530,
      y: 100,
      width: 20,
      height: 380,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#475569'
    },
    {
      id: 'conf_wall_south_left',
      type: 'wall',
      label: 'Conference Room South Wall (Left)',
      x: 100,
      y: 460,
      width: 160,
      height: 20,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#475569'
    },
    {
      id: 'conf_wall_south_right',
      type: 'wall',
      label: 'Conference Room South Wall (Right)',
      x: 370,
      y: 460,
      width: 180,
      height: 20,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#475569'
    },
    {
      id: 'conf_table',
      type: 'meeting_table',
      label: 'Executive Boardroom Table',
      x: 220,
      y: 240,
      width: 200,
      height: 100,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'conf_whiteboard',
      type: 'whiteboard',
      label: '4K Presentation Display & Whiteboard',
      x: 240,
      y: 125,
      width: 160,
      height: 16,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#0284c7'
    },
    {
      id: 'desk_cluster_1a',
      type: 'desk',
      label: 'Dev Workstation Alpha-1',
      x: 700,
      y: 180,
      width: 150,
      height: 75,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'desk_cluster_1b',
      type: 'desk',
      label: 'Dev Workstation Alpha-2',
      x: 890,
      y: 180,
      width: 150,
      height: 75,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'desk_cluster_2a',
      type: 'desk',
      label: 'Dev Workstation Beta-1',
      x: 700,
      y: 320,
      width: 150,
      height: 75,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'desk_cluster_2b',
      type: 'desk',
      label: 'Dev Workstation Beta-2',
      x: 890,
      y: 320,
      width: 150,
      height: 75,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'office_divider_1',
      type: 'acoustic_partition',
      label: 'Acoustic Slat Baffle Partition',
      x: 640,
      y: 160,
      width: 16,
      height: 260,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#38bdf8'
    },
    {
      id: 'pod_booth_wall_1',
      type: 'acoustic_partition',
      label: 'Quiet Call Pod Sound Booth',
      x: 1100,
      y: 100,
      width: 80,
      height: 80,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#6366f1'
    },
    {
      id: 'lounge_sofa_1',
      type: 'sofa',
      label: 'Breakroom Lounge Couch North',
      x: 1250,
      y: 180,
      width: 180,
      height: 65,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#0284c7'
    },
    {
      id: 'lounge_coffee_table',
      type: 'coffee_table',
      label: 'Espresso Coffee Table',
      x: 1280,
      y: 270,
      width: 120,
      height: 50,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#78350f'
    },
    {
      id: 'lounge_sofa_2',
      type: 'sofa',
      label: 'Breakroom Lounge Couch South',
      x: 1250,
      y: 340,
      width: 180,
      height: 65,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#0284c7'
    },
    {
      id: 'lounge_plant_1',
      type: 'plant',
      label: 'Office Monstera Plant',
      x: 1450,
      y: 120,
      width: 45,
      height: 45,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#15803d'
    },
    {
      id: 'center_water_cooler',
      type: 'water_cooler',
      label: 'Filtered Water Cooler Station',
      x: 1130,
      y: 270,
      width: 40,
      height: 40,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#38bdf8'
    },
    {
      id: 'south_cubicle_1',
      type: 'desk',
      label: 'Product Workstation Gamma-1',
      x: 280,
      y: 640,
      width: 150,
      height: 75,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'south_cubicle_2',
      type: 'desk',
      label: 'Product Workstation Gamma-2',
      x: 480,
      y: 640,
      width: 150,
      height: 75,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#1e293b'
    },
    {
      id: 'south_privacy_wall',
      type: 'acoustic_partition',
      label: 'Engineering Sound Barrier',
      x: 240,
      y: 600,
      width: 430,
      height: 16,
      isSolid: true,
      isAcousticObstacle: true,
      color: '#38bdf8'
    },
    {
      id: 'office_plant_south',
      type: 'plant',
      label: 'Potted Ficus Plant',
      x: 200,
      y: 650,
      width: 45,
      height: 45,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#15803d'
    },
    {
      id: 'reception_desk',
      type: 'desk',
      label: 'Main Reception & Concierge',
      x: 725,
      y: 740,
      width: 150,
      height: 55,
      isSolid: true,
      isAcousticObstacle: false,
      color: '#0f172a'
    }
  ]
};

export const FALLBACK_ROOM = {
  roomId: 'main-hall',
  name: 'Global Innovation Hub (3D Tech Office)',
  layoutId: 'default-office-layout',
  maxCapacity: 50,
  userCount: 1
};

