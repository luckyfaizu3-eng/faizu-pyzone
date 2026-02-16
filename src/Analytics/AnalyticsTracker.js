// src/Analytics/AnalyticsTracker.js
// Complete Website Analytics Tracking System
// Tracks: IP, Location, Device, Browser, Pages, Actions

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

class AnalyticsTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.visitorId = this.getOrCreateVisitorId();
    this.pageLoadTime = Date.now();
    this.ipData = null;
    this.isInitialized = false;
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ✅ Get or create unique visitor ID (localStorage with fallback)
  getOrCreateVisitorId() {
    try {
      let visitorId = localStorage.getItem('faizupyzone_visitor_id');
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('faizupyzone_visitor_id', visitorId);
      }
      return visitorId;
    } catch (error) {
      console.warn('⚠️ localStorage not available (private mode?), using session ID');
      return `visitor_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // ✅ Get IP and Location data with proper error handling
  async getIpData() {
    if (this.ipData) return this.ipData;

    try {
      // Step 1: Get IP Address (with timeout)
      const ipController = new AbortController();
      const ipTimeoutId = setTimeout(() => ipController.abort(), 5000);

      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: ipController.signal
      });
      clearTimeout(ipTimeoutId);

      if (!ipResponse.ok) {
        throw new Error('IP fetch failed');
      }

      const { ip } = await ipResponse.json();
      console.log('✅ IP fetched:', ip);

      // Step 2: Get Location from IP (with fallback)
      try {
        const locController = new AbortController();
        const locTimeoutId = setTimeout(() => locController.abort(), 5000);

        const locationResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: locController.signal
        });
        clearTimeout(locTimeoutId);

        const locationData = await locationResponse.json();

        // Check for rate limit or errors
        if (locationData.error || locationData.reason === 'RateLimited') {
          console.warn('⚠️ IP API rate limited or error, using IP only');
          throw new Error('Rate limited');
        }

        this.ipData = {
          ip: ip,
          country: locationData.country_name || 'Unknown',
          countryCode: locationData.country_code || 'XX',
          city: locationData.city || 'Unknown',
          region: locationData.region || 'Unknown',
          timezone: locationData.timezone || 'Unknown',
          latitude: locationData.latitude || null,
          longitude: locationData.longitude || null,
          isp: locationData.org || 'Unknown'
        };

        console.log('✅ Location data fetched:', this.ipData.city);
        return this.ipData;

      } catch (locError) {
        // Fallback: Only IP, no location details
        console.warn('⚠️ Location fetch failed:', locError.message);
        this.ipData = {
          ip: ip,
          country: 'Unknown',
          countryCode: 'XX',
          city: 'Unknown',
          region: 'Unknown',
          timezone: 'Unknown',
          latitude: null,
          longitude: null,
          isp: 'Unknown'
        };
        return this.ipData;
      }

    } catch (error) {
      console.error('❌ IP fetch completely failed:', error.message);
      // Complete fallback - analytics will still work
      this.ipData = {
        ip: 'Unknown',
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown',
        latitude: null,
        longitude: null,
        isp: 'Unknown'
      };
      return this.ipData;
    }
  }

  // Get Device and Browser Info
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    // Detect Mobile
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Detect Browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

    return {
      isMobile: isMobile,
      deviceType: isMobile ? 'Mobile' : 'Desktop',
      browser: browser,
      os: os,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || 'en',
      platform: navigator.platform,
      userAgent: userAgent
    };
  }

  // ✅ Track Page View with timeout & error handling
  async trackPageView(pagePath = window.location.pathname) {
    try {
      console.log('📊 Tracking page view:', pagePath);

      // Get IP data with timeout (5 seconds max)
      const ipDataPromise = this.getIpData();
      const ipData = await Promise.race([
        ipDataPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('IP timeout')), 5000)
        )
      ]).catch((err) => {
        console.warn('⚠️ IP data timeout, using fallback');
        return {
          ip: 'Unknown',
          country: 'Unknown',
          countryCode: 'XX',
          city: 'Unknown',
          region: 'Unknown',
          timezone: 'Unknown',
          latitude: null,
          longitude: null,
          isp: 'Unknown'
        };
      });

      const deviceInfo = this.getDeviceInfo();

      const pageViewData = {
        // Visitor Info
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        
        // IP & Location
        ip: ipData.ip,
        country: ipData.country,
        countryCode: ipData.countryCode,
        city: ipData.city,
        region: ipData.region,
        timezone: ipData.timezone,
        isp: ipData.isp,
        
        // Device & Browser
        device: deviceInfo,
        
        // Page Info
        page: pagePath,
        fullUrl: window.location.href,
        referrer: document.referrer || 'Direct',
        
        // Timestamps
        timestamp: serverTimestamp(),
        date: new Date().toISOString(),
        localTime: new Date().toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        
        // Type
        type: 'pageview'
      };

      // Save to Firebase with error handling
      await addDoc(collection(db, 'analytics'), pageViewData);
      
      console.log('✅ Page view tracked successfully:', pagePath);
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Error tracking page view:', error.message);
      // Don't throw - silently fail for analytics
      // User experience should not be affected
    }
  }

  // ✅ Track User Action with error handling
  async trackAction(actionType, actionData = {}) {
    try {
      console.log('🎯 Tracking action:', actionType);

      if (!this.isInitialized) {
        await this.trackPageView();
      }

      const ipData = this.ipData || await this.getIpData();
      const deviceInfo = this.getDeviceInfo();

      const actionEvent = {
        // Visitor Info
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        
        // IP & Location
        ip: ipData.ip,
        country: ipData.country,
        city: ipData.city,
        
        // Device
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        
        // Action Info
        actionType: actionType,
        actionData: actionData,
        
        // Page Info
        page: window.location.pathname,
        
        // Timestamps
        timestamp: serverTimestamp(),
        date: new Date().toISOString(),
        localTime: new Date().toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        
        // Type
        type: 'action'
      };

      // Save to Firebase
      await addDoc(collection(db, 'user_actions'), actionEvent);
      
      console.log('✅ Action tracked:', actionType);

    } catch (error) {
      console.error('❌ Error tracking action:', error.message);
      // Silently fail - don't affect user experience
    }
  }

  // Track Time Spent on Page
  trackTimeSpent() {
    const timeSpent = Math.round((Date.now() - this.pageLoadTime) / 1000); // seconds
    return timeSpent;
  }
}

// Create singleton instance
const analyticsTracker = new AnalyticsTracker();

// Export functions for easy use
export const trackPageView = (page) => analyticsTracker.trackPageView(page);

export const trackAction = (actionType, actionData) => 
  analyticsTracker.trackAction(actionType, actionData);

export const getVisitorId = () => analyticsTracker.visitorId;

export const getSessionId = () => analyticsTracker.sessionId;

// Common action types for easy reference
export const ACTIONS = {
  // Product Actions
  PRODUCT_VIEW: 'product_view',
  PRODUCT_CLICK: 'product_click',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  
  // Purchase Actions
  PURCHASE_INITIATED: 'purchase_initiated',
  PAYMENT_STARTED: 'payment_started',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  ORDER_COMPLETED: 'order_completed',
  
  // Download Actions
  PDF_DOWNLOADED: 'pdf_downloaded',
  BUNDLE_DOWNLOADED: 'bundle_downloaded',
  
  // Navigation Actions
  CATEGORY_SELECTED: 'category_selected',
  SEARCH_PERFORMED: 'search_performed',
  
  // Auth Actions
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  
  // Other Actions
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  FORM_SUBMIT: 'form_submit'
};

export default analyticsTracker;