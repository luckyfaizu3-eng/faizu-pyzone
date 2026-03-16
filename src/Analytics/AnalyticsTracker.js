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

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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

  // ✅ Get IP and Location data — reuses geoPrice cache to avoid double ipapi.co calls
  async getIpData() {
    if (this.ipData) return this.ipData;

    // ✅ FIRST: check geoPrice cache (set by detectGeoPrice in geoPrice.js)
    try {
      const cached = localStorage.getItem('geo_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        const oneHour = 60 * 60 * 1000;
        if (parsed.timestamp && Date.now() - parsed.timestamp < oneHour) {
          this.ipData = {
            ip:          parsed.ip          || 'Unknown',
            country:     parsed.countryName || parsed.country || 'Unknown',
            countryCode: parsed.country     || 'XX',
            city:        parsed.city        || 'Unknown',
            region:      'Unknown',
            timezone:    'Unknown',
            latitude:    null,
            longitude:   null,
            isp:         'Unknown',
          };
          console.log('✅ IP fetched from geo cache:', this.ipData.ip);
          console.log('✅ Location data fetched:', this.ipData.city);
          return this.ipData;
        }
      }
    } catch (e) {
      // cache parse failed, fall through to fetch
    }

    // ✅ FALLBACK: fetch fresh (only if no cache)
    try {
      const ipController = new AbortController();
      const ipTimeoutId = setTimeout(() => ipController.abort(), 5000);
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: ipController.signal
      });
      clearTimeout(ipTimeoutId);
      if (!ipResponse.ok) throw new Error('IP fetch failed');
      const { ip } = await ipResponse.json();
      console.log('✅ IP fetched:', ip);

      try {
        const locController = new AbortController();
        const locTimeoutId = setTimeout(() => locController.abort(), 5000);
        const locationResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: locController.signal
        });
        clearTimeout(locTimeoutId);
        const locationData = await locationResponse.json();

        if (locationData.error || locationData.reason === 'RateLimited') {
          console.warn('⚠️ IP API rate limited or error, using IP only');
          throw new Error('Rate limited');
        }

        this.ipData = {
          ip:          ip,
          country:     locationData.country_name  || 'Unknown',
          countryCode: locationData.country_code  || 'XX',
          city:        locationData.city          || 'Unknown',
          region:      locationData.region        || 'Unknown',
          timezone:    locationData.timezone      || 'Unknown',
          latitude:    locationData.latitude      || null,
          longitude:   locationData.longitude     || null,
          isp:         locationData.org           || 'Unknown',
        };
        console.log('✅ Location data fetched:', this.ipData.city);
        return this.ipData;

      } catch (locError) {
        console.warn('⚠️ Location fetch failed:', locError.message);
        this.ipData = {
          ip, country:'Unknown', countryCode:'XX', city:'Unknown',
          region:'Unknown', timezone:'Unknown', latitude:null, longitude:null, isp:'Unknown',
        };
        return this.ipData;
      }

    } catch (error) {
      console.error('❌ IP fetch completely failed:', error.message);
      this.ipData = {
        ip:'Unknown', country:'Unknown', countryCode:'XX', city:'Unknown',
        region:'Unknown', timezone:'Unknown', latitude:null, longitude:null, isp:'Unknown',
      };
      return this.ipData;
    }
  }

  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    let browser = 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

    return {
      isMobile,
      deviceType: isMobile ? 'Mobile' : 'Desktop',
      browser,
      os,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || 'en',
      platform: navigator.platform,
      userAgent,
    };
  }

  async trackPageView(pagePath = window.location.pathname) {
    try {
      console.log('📊 Tracking page view:', pagePath);

      const ipData = await Promise.race([
        this.getIpData(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('IP timeout')), 5000))
      ]).catch(() => ({
        ip:'Unknown', country:'Unknown', countryCode:'XX', city:'Unknown',
        region:'Unknown', timezone:'Unknown', latitude:null, longitude:null, isp:'Unknown',
      }));

      const deviceInfo = this.getDeviceInfo();

      const pageViewData = {
        visitorId:   this.visitorId,
        sessionId:   this.sessionId,
        ip:          ipData.ip,
        country:     ipData.country,
        countryCode: ipData.countryCode,
        city:        ipData.city,
        region:      ipData.region,
        timezone:    ipData.timezone,
        isp:         ipData.isp,
        device:      deviceInfo,
        page:        pagePath,
        fullUrl:     window.location.href,
        referrer:    document.referrer || 'Direct',
        timestamp:   serverTimestamp(),
        date:        new Date().toISOString(),
        localTime:   new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
          year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        type: 'pageview',
      };

      await addDoc(collection(db, 'analytics'), pageViewData);
      console.log('✅ Page view tracked successfully:', pagePath);
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Error tracking page view:', error.message);
    }
  }

  async trackAction(actionType, actionData = {}) {
    try {
      console.log('🎯 Tracking action:', actionType);

      if (!this.isInitialized) await this.trackPageView();

      const ipData = this.ipData || await this.getIpData();
      const deviceInfo = this.getDeviceInfo();

      const actionEvent = {
        visitorId:   this.visitorId,
        sessionId:   this.sessionId,
        ip:          ipData.ip,
        country:     ipData.country,
        city:        ipData.city,
        deviceType:  deviceInfo.deviceType,
        browser:     deviceInfo.browser,
        actionType,
        actionData,
        page:        window.location.pathname,
        timestamp:   serverTimestamp(),
        date:        new Date().toISOString(),
        localTime:   new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
          year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        type: 'action',
      };

      await addDoc(collection(db, 'user_actions'), actionEvent);
      console.log('✅ Action tracked:', actionType);

    } catch (error) {
      console.error('❌ Error tracking action:', error.message);
    }
  }

  trackTimeSpent() {
    return Math.round((Date.now() - this.pageLoadTime) / 1000);
  }
}

const analyticsTracker = new AnalyticsTracker();

export const trackPageView = (page) => analyticsTracker.trackPageView(page);
export const trackAction   = (actionType, actionData) => analyticsTracker.trackAction(actionType, actionData);
export const getVisitorId  = () => analyticsTracker.visitorId;
export const getSessionId  = () => analyticsTracker.sessionId;

export const ACTIONS = {
  PRODUCT_VIEW:       'product_view',
  PRODUCT_CLICK:      'product_click',
  ADD_TO_CART:        'add_to_cart',
  REMOVE_FROM_CART:   'remove_from_cart',
  PURCHASE_INITIATED: 'purchase_initiated',
  PAYMENT_STARTED:    'payment_started',
  PAYMENT_SUCCESS:    'payment_success',
  PAYMENT_FAILED:     'payment_failed',
  ORDER_COMPLETED:    'order_completed',
  PDF_DOWNLOADED:     'pdf_downloaded',
  BUNDLE_DOWNLOADED:  'bundle_downloaded',
  CATEGORY_SELECTED:  'category_selected',
  SEARCH_PERFORMED:   'search_performed',
  LOGIN:              'login',
  REGISTER:           'register',
  LOGOUT:             'logout',
  BUTTON_CLICK:       'button_click',
  LINK_CLICK:         'link_click',
  FORM_SUBMIT:        'form_submit',
};

export default analyticsTracker;