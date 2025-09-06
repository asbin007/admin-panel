/**
 * Backend Health Check Utility
 * Checks if the backend server is responsive
 */

import { APIS } from '@/globals/http';

export interface HealthCheckResult {
  isHealthy: boolean;
  status: number;
  responseTime: number;
  error?: string;
}

export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Checking backend health...');
    
    const response = await APIS.get('/health', {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Backend health check passed:', {
      status: response.status,
      responseTime: `${responseTime}ms`
    });
    
    return {
      isHealthy: true,
      status: response.status,
      responseTime
    };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ Backend health check failed:', {
      error: error.message,
      status: error.response?.status,
      responseTime: `${responseTime}ms`
    });
    
    return {
      isHealthy: false,
      status: error.response?.status || 0,
      responseTime,
      error: error.message
    };
  }
}

export async function checkBackendWithFallback(): Promise<HealthCheckResult> {
  try {
    // Try health endpoint first
    return await checkBackendHealth();
  } catch {
    try {
      // Fallback to a simple API call
      console.log('🔄 Health endpoint failed, trying fallback...');
      const response = await APIS.get('/auth/users', {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return {
        isHealthy: true,
        status: response.status,
        responseTime: 0
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        status: error.response?.status || 0,
        responseTime: 0,
        error: error.message
      };
    }
  }
}
