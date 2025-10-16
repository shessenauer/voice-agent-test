import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your AI agent settings and preferences.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Voice Agent Configuration
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Scenario
              </label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>personalOS</option>
                <option>chatSupervisor</option>
                <option>customerServiceRetail</option>
                <option>simpleHandoff</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Audio Codec
              </label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>Opus (48 kHz)</option>
                <option>PCMU (8 kHz)</option>
                <option>PCMA (8 kHz)</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="audio-playback"
                name="audio-playback"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="audio-playback" className="ml-2 block text-sm text-gray-900">
                Enable audio playback
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="push-to-talk"
                name="push-to-talk"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="push-to-talk" className="ml-2 block text-sm text-gray-900">
                Enable push-to-talk mode
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            API Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <input
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>gpt-4o-realtime-preview-2025-06-03</option>
                <option>gpt-4o-mini-realtime</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Save Settings
        </button>
      </div>
    </div>
  );
}
