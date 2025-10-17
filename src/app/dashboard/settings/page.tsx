'use client';

import React from 'react';
import GoogleCalendarAuth from '../../../components/auth/GoogleCalendarAuth';

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
                Enable push-to-talk mode (recommended to prevent audio feedback)
              </label>
            </div>

          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Integrations
          </h3>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-900 mb-2">Google Calendar</h4>
              <p className="text-sm text-gray-600 mb-4">
                Connect your Google Calendar to enable your AI agent to:
              </p>
              <ul className="text-sm text-gray-600 mb-4 ml-4 space-y-1">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Read your calendar events to answer scheduling questions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Create new events when you ask</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Update or delete existing events</span>
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Privacy & Security</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your calendar data is accessed in real-time and never stored on our servers. 
                      All communication happens directly between your browser and Google's servers.
                    </p>
                  </div>
                </div>
              </div>
              <GoogleCalendarAuth 
                onAuthSuccess={(tokens) => {
                  console.log('Google Calendar authentication successful:', tokens);
                }}
                onAuthError={(error) => {
                  console.error('Google Calendar authentication error:', error);
                }}
              />
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
