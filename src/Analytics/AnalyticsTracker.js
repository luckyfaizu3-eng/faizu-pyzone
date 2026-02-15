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

  // Get or create unique visitor ID (localStorage mein save)
  getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('faizupyzone_visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('faizupyzone_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Get IP and Location data
  async getIpData() {
    if (this.ipData) return this.ipData;

    try {
      // Step 1: Get IP Address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Step 2: Get Location from IP (Free API - 1000 requests/day)
      const locationResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      const locationData = await locationResponse.json();

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

      return this.ipData;
    } catch (error) {
      console.error('❌ Error fetching IP data:', error);
      return {
        ip: 'Unknown',
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      };
    }
  }

  // Get Device and Browser Info
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    // Detect Mobile
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Detect Browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
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

  // Track Page View
  async trackPageView(pagePath = window.location.pathname) {
    try {
      const ipData = await this.getIpData();
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

      // Save to Firebase
      await addDoc(collection(db, 'analytics'), pageViewData);
      
      console.log('✅ Page view tracked:', pagePath);
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Error tracking page view:', error);
    }
  }

  // Track User Action (product view, purchase, etc.)
  async trackAction(actionType, actionData = {}) {
    try {
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
      
      console.log('✅ Action tracked:', actionType, actionData);

    } catch (error) {
      console.error('❌ Error tracking action:', error);
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