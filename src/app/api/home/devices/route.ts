import { NextRequest, NextResponse } from 'next/server';
import type { AlexaDevice, AlexaScene } from '../../../../types/api.types';

// Mock Alexa devices data
const mockDevices: AlexaDevice[] = [
  {
    id: 'light1',
    name: 'Living Room Lights',
    type: 'light',
    status: 'on',
    brightness: 75,
    room: 'Living Room',
    lastUpdated: new Date().toISOString(),
    capabilities: ['on_off', 'brightness', 'color']
  },
  {
    id: 'light2',
    name: 'Bedroom Lights',
    type: 'light',
    status: 'off',
    brightness: 0,
    room: 'Bedroom',
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    capabilities: ['on_off', 'brightness']
  },
  {
    id: 'light3',
    name: 'Kitchen Lights',
    type: 'light',
    status: 'dimmed',
    brightness: 40,
    room: 'Kitchen',
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    capabilities: ['on_off', 'brightness', 'color']
  },
  {
    id: 'switch1',
    name: 'Office Fan',
    type: 'switch',
    status: 'on',
    room: 'Office',
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    capabilities: ['on_off']
  },
  {
    id: 'thermostat1',
    name: 'Living Room Thermostat',
    type: 'thermostat',
    status: 'on',
    temperature: 72,
    targetTemperature: 72,
    room: 'Living Room',
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    capabilities: ['on_off', 'temperature_control']
  }
];

// Mock Alexa scenes data
const mockScenes: AlexaScene[] = [
  {
    id: 'scene1',
    name: 'Movie Night',
    description: 'Dim lights for optimal movie viewing',
    devices: ['light1', 'light3'],
    isActive: false,
    createdAt: '2024-01-10T10:00:00Z',
    lastActivated: null
  },
  {
    id: 'scene2',
    name: 'Good Morning',
    description: 'Bright lights to start the day',
    devices: ['light1', 'light2', 'light3'],
    isActive: false,
    createdAt: '2024-01-10T10:00:00Z',
    lastActivated: null
  },
  {
    id: 'scene3',
    name: 'Sleep Mode',
    description: 'Turn off all lights for bedtime',
    devices: ['light1', 'light2', 'light3', 'switch1'],
    isActive: false,
    createdAt: '2024-01-10T10:00:00Z',
    lastActivated: null
  }
];

// GET /api/home/devices - Get all devices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room') || 'all';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    // Filter devices based on query parameters
    let filteredDevices = mockDevices;

    if (room !== 'all') {
      filteredDevices = filteredDevices.filter(device => device.room === room);
    }

    if (type !== 'all') {
      filteredDevices = filteredDevices.filter(device => device.type === type);
    }

    if (status !== 'all') {
      filteredDevices = filteredDevices.filter(device => device.status === status);
    }

    return NextResponse.json({
      success: true,
      data: {
        devices: filteredDevices,
        totalCount: filteredDevices.length,
        filters: {
          room,
          type,
          status
        }
      }
    });

  } catch (error) {
    console.error('Error fetching home devices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// PUT /api/home/devices/[id] - Control a device
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('id');
    
    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, brightness, temperature } = body;

    // Find device
    const deviceIndex = mockDevices.findIndex(device => device.id === deviceId);
    
    if (deviceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    const device = mockDevices[deviceIndex];
    const updatedDevice = { ...device };

    // Apply action based on device type and action
    switch (action) {
      case 'turn_on':
        updatedDevice.status = 'on';
        if (device.type === 'light' && brightness !== undefined) {
          updatedDevice.brightness = Math.max(1, Math.min(100, brightness));
          updatedDevice.status = brightness < 100 ? 'dimmed' : 'on';
        }
        break;
      case 'turn_off':
        updatedDevice.status = 'off';
        if (device.type === 'light') {
          updatedDevice.brightness = 0;
        }
        break;
      case 'set_brightness':
        if (device.type === 'light') {
          const newBrightness = Math.max(0, Math.min(100, brightness));
          updatedDevice.brightness = newBrightness;
          updatedDevice.status = newBrightness === 0 ? 'off' : (newBrightness < 100 ? 'dimmed' : 'on');
        } else {
          return NextResponse.json(
            { success: false, error: 'Brightness control not supported for this device type' },
            { status: 400 }
          );
        }
        break;
      case 'set_temperature':
        if (device.type === 'thermostat') {
          updatedDevice.targetTemperature = temperature;
          updatedDevice.temperature = temperature; // Simulate immediate change
        } else {
          return NextResponse.json(
            { success: false, error: 'Temperature control not supported for this device type' },
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    updatedDevice.lastUpdated = new Date().toISOString();
    mockDevices[deviceIndex] = updatedDevice;

    return NextResponse.json({
      success: true,
      data: updatedDevice
    });

  } catch (error) {
    console.error('Error controlling home device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control device' },
      { status: 500 }
    );
  }
}

// GET /api/home/scenes - Get all scenes
export async function GET_SCENES(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    let filteredScenes = mockScenes;

    if (active !== null) {
      const isActive = active === 'true';
      filteredScenes = mockScenes.filter(scene => scene.isActive === isActive);
    }

    return NextResponse.json({
      success: true,
      data: {
        scenes: filteredScenes,
        totalCount: filteredScenes.length
      }
    });

  } catch (error) {
    console.error('Error fetching home scenes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}

// POST /api/home/scenes/[id]/activate - Activate a scene
export async function POST_ACTIVATE_SCENE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('id');
    
    if (!sceneId) {
      return NextResponse.json(
        { success: false, error: 'Scene ID is required' },
        { status: 400 }
      );
    }

    // Find scene
    const sceneIndex = mockScenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Scene not found' },
        { status: 404 }
      );
    }

    const scene = mockScenes[sceneIndex];

    // Deactivate all other scenes first
    mockScenes.forEach(s => {
      if (s.id !== sceneId) {
        s.isActive = false;
      }
    });

    // Activate the requested scene
    mockScenes[sceneIndex] = {
      ...scene,
      isActive: true,
      lastActivated: new Date().toISOString()
    };

    // Update devices based on scene
    const updatedDevices = [];
    for (const deviceId of scene.devices) {
      const deviceIndex = mockDevices.findIndex(device => device.id === deviceId);
      if (deviceIndex !== -1) {
        const device = mockDevices[deviceIndex];
        const updatedDevice = {
          ...device,
          status: 'on' as const,
          brightness: device.type === 'light' ? 80 : device.brightness,
          lastUpdated: new Date().toISOString()
        };
        mockDevices[deviceIndex] = updatedDevice;
        updatedDevices.push(updatedDevice);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scene: mockScenes[sceneIndex],
        updatedDevices
      }
    });

  } catch (error) {
    console.error('Error activating home scene:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate scene' },
      { status: 500 }
    );
  }
}
