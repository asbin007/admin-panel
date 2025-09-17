"use client";

import React, { useState } from "react";
import { useAppSelector } from "../store/hooks";
import { MessageCircle, X } from "lucide-react";

export default function DebugChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  // Debug logging
  console.log("DebugChatWidget: Rendering...");
  console.log("DebugChatWidget: User data:", user);
  console.log("DebugChatWidget: User role:", user?.[0]?.role);
  console.log("DebugChatWidget: Is admin?", user?.[0]?.role === 'admin');

  // Always show for debugging - remove role check temporarily
  // if (user?.role !== 'admin' && user?.[0]?.role !== 'admin') {
  //   return null;
  // }

  if (!isOpen) {
    return (
      <div 
        className="fixed z-[99999] right-5 bottom-5"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: 99999,
          backgroundColor: 'red', // Make it very visible
          padding: '10px',
          borderRadius: '10px'
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl shadow-2xl border-2 border-red-500 flex items-center justify-center transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="text-sm font-medium">DEBUG CHAT</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-[99999] right-5 bottom-5"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 99999
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-96 h-[400px]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-semibold">Debug Chat Widget</h3>
                <p className="text-xs text-red-100">User: {user?.[0]?.username || 'Unknown'}</p>
                <p className="text-xs text-red-100">Role: {user?.[0]?.role || 'Unknown'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-white hover:bg-red-500 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-gray-50 h-[320px] flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Debug Widget Working!</h2>
            <p className="text-xs text-gray-600">If you can see this, the widget is rendering correctly</p>
            <p className="text-xs text-gray-600 mt-2">User: {user?.[0]?.username || 'Unknown'}</p>
            <p className="text-xs text-gray-600">Role: {user?.[0]?.role || 'Unknown'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
