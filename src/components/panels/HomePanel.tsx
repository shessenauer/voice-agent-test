'use client';

import React, { useState, useEffect } from 'react';

interface AlexaDevice {
  id: string;
  name: string;
  type: 'light' | 'scene' | 'switch' | 'thermostat';
  status: 'on' | 'off' | 'dimmed';
  brightness?: number;
  room: string;
  lastUpdated: string;
}

interface AlexaScene {
  id: string;
  name: string;
  description: string;
  devices: string[];
  isActive: boolean;
}

interface HomePanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function HomePanel({ isVisible, onToggle }: HomePanelProps) {
  const [devices, setDevices] = useState<AlexaDevice[]>([]);
  const [scenes, setScenes] = useState<AlexaScene[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  // Mock data for demonstration
  const mockDevices: AlexaDevice[] = [
    {
      id: 'light1',
      name: 'Living Room Lights',
      type: 'light',
      status: 'on',
      brightness: 75,
      room: 'Living Room',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'light2',
      name: 'Bedroom Lights',
      type: 'light',
      status: 'off',
      brightness: 0,
      room: 'Bedroom',
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'light3',
      name: 'Kitchen Lights',
      type: 'light',
      status: 'dimmed',
      brightness: 40,
      room: 'Kitchen',
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'switch1',
      name: 'Office Fan',
      type: 'switch',
      status: 'on',
      room: 'Office',
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ];

  const mockScenes: AlexaScene[] = [
    {
      id: 'scene1',
      name: 'Movie Night',
      description: 'Dim lights for optimal movie viewing',
      devices: ['light1', 'light3'],
      isActive: false
    },
    {
      id: 'scene2',
      name: 'Good Morning',
      description: 'Bright lights to start the day',
      devices: ['light1', 'light2', 'light3'],
      isActive: false
    },
    {
      id: 'scene3',
      name: 'Sleep Mode',
      description: 'Turn off all lights for bedtime',
      devices: ['light1', 'light2', 'light3', 'switch1'],
      isActive: false
    }
  ];

  useEffect(() => {
    if (isVisible) {
      loadDevices();
    }
  }, [isVisible]);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the MCP tool
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      
      setDevices(mockDevices);
      setScenes(mockScenes);
    } catch (err) {
      setError('Failed to load home devices');
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (deviceId: string) => {
    try {
      // In a real implementation, this would call the MCP tool
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              status: device.status === 'on' ? 'off' : 'on',
              brightness: device.status === 'on' ? 0 : 100,
              lastUpdated: new Date().toISOString()
            }
          : device
      ));
    } catch (err) {
      console.error('Error toggling device:', err);
    }
  };

  const setBrightness = async (deviceId: string, brightness: number) => {
    try {
      // In a real implementation, this would call the MCP tool
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              brightness,
              status: brightness > 0 ? (brightness < 100 ? 'dimmed' : 'on') : 'off',
              lastUpdated: new Date().toISOString()
            }
          : device
      ));
    } catch (err) {
      console.error('Error setting brightness:', err);
    }
  };

  const activateScene = async (sceneId: string) => {
    try {
      // In a real implementation, this would call the MCP tool
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;
      
      // Update devices based on scene
      setDevices(prev => prev.map(device => {
        if (scene.devices.includes(device.id)) {
          return {
            ...device,
            status: 'on',
            brightness: 80,
            lastUpdated: new Date().toISOString()
          };
        }
        return device;
      }));
      
      // Update scene status
      setScenes(prev => prev.map(s => 
        s.id === sceneId 
          ? { ...s, isActive: true }
          : { ...s, isActive: false }
      ));
    } catch (err) {
      console.error('Error activating scene:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on':
        return 'text-green-600 bg-green-100';
      case 'off':
        return 'text-gray-600 bg-gray-100';
      case 'dimmed':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'switch':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
  };

  const rooms = ['all', ...Array.from(new Set(devices.map(d => d.room)))];
  const filteredDevices = selectedRoom === 'all' 
    ? devices 
    : devices.filter(d => d.room === selectedRoom);

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Smart Home</h3>
          <span className="text-sm text-gray-500">({devices.length} devices)</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Room Filter */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => setSelectedRoom(room)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedRoom === room
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {room === 'all' ? 'All Rooms' : room}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-600">
            <div className="text-center">
              <p className="font-medium">Failed to load devices</p>
              <button
                onClick={loadDevices}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Scenes */}
            {scenes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Scenes</h4>
                <div className="grid grid-cols-1 gap-2">
                  {scenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => activateScene(scene.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        scene.isActive
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{scene.name}</h5>
                          <p className="text-xs text-gray-600">{scene.description}</p>
                        </div>
                        {scene.isActive && (
                          <span className="text-xs text-blue-600 font-medium">Active</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Devices */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Devices</h4>
              <div className="space-y-2">
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{device.name}</h5>
                        <p className="text-xs text-gray-600">{device.room}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                      
                      {device.type === 'light' && device.brightness !== undefined && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={device.brightness}
                            onChange={(e) => setBrightness(device.id, parseInt(e.target.value))}
                            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-xs text-gray-600 w-8">{device.brightness}%</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleDevice(device.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          device.status === 'on' || device.status === 'dimmed'
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {device.status === 'on' || device.status === 'dimmed' ? 'Turn Off' : 'Turn On'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
