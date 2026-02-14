import React, { useState, useEffect } from 'react';
import { useTheme } from '../App';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';

function CertificateViewer({ certificate, onClose }) {
  const { isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const downloadCertificate = () => {
    setDownloading(true);
    window.showToast?.('⏳ Generating certificate...', 'info');

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // ========== TOP GRADIENT BAR ==========
      pdf.setFillColor(66, 133, 244);
      pdf.rect(0, 0, pageWidth * 0.25, 3, 'F');
      pdf.setFillColor(52, 168, 83);
      pdf.rect(pageWidth * 0.25, 0, pageWidth * 0.25, 3, 'F');
      pdf.setFillColor(251, 188, 4);
      pdf.rect(pageWidth * 0.5, 0, pageWidth * 0.25, 3, 'F');
      pdf.setFillColor(234, 67, 53);
      pdf.rect(pageWidth * 0.75, 0, pageWidth * 0.25, 3, 'F');

      // ========== HEADER WITH INSTAGRAM VERIFIED BADGE ==========
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(32);
      pdf.setTextColor(32, 33, 36);
      
      const titleText = 'FaizUpyZone';
      const textWidth = pdf.getTextWidth(titleText);
      
      pdf.text(titleText, pageWidth / 2, 30, { align: 'center' });

      // Instagram Verified Badge - Blue circle with white checkmark
      const badgeX = pageWidth / 2 + textWidth / 2 + 5;
      const badgeY = 27.5;
      const badgeRadius = 3.5;
      
      // Solid blue circle - Instagram style (#3897f0)
      pdf.setFillColor(56, 151, 240);
      pdf.circle(badgeX, badgeY, badgeRadius, 'F');
      
      // White checkmark - Instagram style (thicker)
      pdf.setLineWidth(0.7);
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineCap('round');
      pdf.setLineJoin('round');
      
      // Checkmark path
      pdf.line(badgeX - 1.3, badgeY + 0.1, badgeX - 0.4, badgeY + 1.3);
      pdf.line(badgeX - 0.4, badgeY + 1.3, badgeX + 1.5, badgeY - 1.2);

      pdf.setFontSize(11);
      pdf.setTextColor(95, 99, 104);
      pdf.text('Python Programming Certification', pageWidth / 2, 38, { align: 'center' });

      // Header line
      pdf.setDrawColor(232, 234, 237);
      pdf.setLineWidth(0.5);
      pdf.line(40, 45, pageWidth - 40, 45);

      // ========== CERTIFICATE TITLE ==========
      pdf.setFontSize(16);
      pdf.setTextColor(95, 99, 104);
      pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 56, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(128, 134, 139);
      pdf.text('This is to certify that', pageWidth / 2, 65, { align: 'center' });

      // ========== RECIPIENT NAME ==========
      pdf.setFont('times', 'italic');
      pdf.setFontSize(28);
      pdf.setTextColor(32, 33, 36);
      pdf.text(certificate.userName, pageWidth / 2, 78, { align: 'center' });

      // ========== ACHIEVEMENT TEXT ==========
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(95, 99, 104);
      pdf.text('has successfully completed the', pageWidth / 2, 90, { align: 'center' });

      // Test Name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(66, 133, 244);
      pdf.text(certificate.testName, pageWidth / 2, 99, { align: 'center' });

      // Score text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(95, 99, 104);
      pdf.text('achieving a score of', pageWidth / 2, 108, { align: 'center' });

      // Score percentage
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(32);
      pdf.setTextColor(52, 168, 83);
      pdf.text(`${certificate.score}%`, pageWidth / 2, 122, { align: 'center' });

      // ========== DETAILS SECTION ==========
      const leftCol = 50;
      const rightCol = pageWidth / 2 + 10;
      const detailsY = 135;
      const lineHeight = 12;

      pdf.setDrawColor(232, 234, 237);
      pdf.setLineWidth(0.3);
      pdf.line(40, 130, pageWidth - 40, 130);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(128, 134, 139);

      pdf.text('CERTIFICATE ID', leftCol, detailsY);
      pdf.text('LEVEL', leftCol, detailsY + lineHeight);
      pdf.text('ISSUE DATE', rightCol, detailsY);
      pdf.text('LOCATION', rightCol, detailsY + lineHeight);

      // Values
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(32, 33, 36);

      pdf.text(certificate.certificateId, leftCol, detailsY + 5);
      pdf.text(certificate.level.charAt(0).toUpperCase() + certificate.level.slice(1), leftCol, detailsY + lineHeight + 5);
      pdf.text(certificate.date, rightCol, detailsY + 5);
      pdf.text(certificate.userAddress, rightCol, detailsY + lineHeight + 5);

      // ========== SIGNATURE SECTION - MORE SPACE ==========
      const sigY = 157;
      pdf.setDrawColor(232, 234, 237);
      pdf.setLineWidth(0.3);
      pdf.line(40, sigY, pageWidth - 40, sigY);

      const sigX = pageWidth - 70;
      
      // Signature line
      pdf.setDrawColor(32, 33, 36);
      pdf.setLineWidth(0.5);
      pdf.line(sigX, sigY + 15, sigX + 50, sigY + 15);

      // Signature name
      pdf.setFont('times', 'italic');
      pdf.setFontSize(16);
      pdf.setTextColor(32, 33, 36);
      pdf.text(certificate.founderName, sigX + 25, sigY + 13, { align: 'center' });

      // Title
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(95, 99, 104);
      pdf.text('Founder & CEO, FaizUpyZone', sigX + 25, sigY + 20, { align: 'center' });

      pdf.setFontSize(8);
      pdf.setTextColor(128, 134, 139);
      pdf.text('@code_with_06', sigX + 25, sigY + 25, { align: 'center' });

      // ========== DISCLAIMER BOX - BELOW SIGNATURE ==========
      const disclaimerY = sigY + 33; // Signature ke neeche
      const disclaimerHeight = 11;
      
      pdf.setFillColor(248, 249, 250);
      pdf.rect(40, disclaimerY, pageWidth - 80, disclaimerHeight, 'F');
      
      pdf.setFillColor(234, 67, 53);
      pdf.rect(40, disclaimerY, 1.5, disclaimerHeight, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(234, 67, 53);
      pdf.text('IMPORTANT DISCLAIMER:', 45, disclaimerY + 3.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(95, 99, 104);
      
      const disclaimerLines = [
        'This certificate is for practice and self-assessment only. It is NOT valid from any university, college, or accredited institution.',
        'It does not constitute official certification, degree, or credential. For verification, contact FaizUpyZone.'
      ];

      disclaimerLines.forEach((line, index) => {
        pdf.text(line, 45, disclaimerY + 7 + (index * 2.8));
      });

      // ========== BOTTOM GRADIENT BAR ==========
      const bottomY = pageHeight - 2;
      pdf.setFillColor(66, 133, 244);
      pdf.rect(0, bottomY, pageWidth * 0.25, 2, 'F');
      pdf.setFillColor(52, 168, 83);
      pdf.rect(pageWidth * 0.25, bottomY, pageWidth * 0.25, 2, 'F');
      pdf.setFillColor(251, 188, 4);
      pdf.rect(pageWidth * 0.5, bottomY, pageWidth * 0.25, 2, 'F');
      pdf.setFillColor(234, 67, 53);
      pdf.rect(pageWidth * 0.75, bottomY, pageWidth * 0.25, 2, 'F');

      // Save
      const fileName = `Certificate_${certificate.level}_${certificate.userName.replace(/\s/g, '_')}.pdf`;
      pdf.save(fileName);
      
      window.showToast?.('✅ Certificate downloaded!', 'success');
    } catch (error) {
      console.error('❌ Download error:', error);
      window.showToast?.('❌ Download failed!', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (!certificate) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: isMobile ? '20px' : '40px',
          right: isMobile ? '20px' : '40px',
          background: '#ef4444',
          border: 'none',
          borderRadius: '50%',
          width: isMobile ? '50px' : '60px',
          height: isMobile ? '50px' : '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          zIndex: 10001,
          boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
        }}
      >
        <X size={isMobile ? 24 : 28} />
      </button>

      {/* Download Card */}
      <div style={{
        background: isDark ? '#1e293b' : '#fff',
        borderRadius: '20px',
        padding: isMobile ? '40px 30px' : '60px 80px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Certificate Icon */}
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
        }}>
          <svg 
            width={isMobile ? "40" : "50"} 
            height={isMobile ? "40" : "50"} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>

        {/* Title with Instagram verified badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '26px' : '32px',
            fontWeight: '700',
            color: isDark ? '#fff' : '#202124',
            margin: 0,
            fontFamily: '"Google Sans", "Roboto", sans-serif'
          }}>
            Certificate Ready
          </h2>
          {/* Instagram Blue Verified Badge */}
          <svg 
            width="28" 
            height="28" 
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" fill="#3897f0"/>
            <path 
              d="M8.5 12.5l2.5 2.5 5-5" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '15px' : '16px',
          color: isDark ? '#94a3b8' : '#5f6368',
          margin: '0 0 32px 0',
          lineHeight: 1.6
        }}>
          Congratulations <strong>{certificate.userName}</strong>! Your verified certificate is ready.
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '32px',
          padding: '20px',
          background: isDark ? '#0f172a' : '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              color: isDark ? '#94a3b8' : '#80868b',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}>
              Score
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#34a853'
            }}>
              {certificate.score}%
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '12px',
              color: isDark ? '#94a3b8' : '#80868b',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}>
              Level
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDark ? '#fff' : '#202124',
              textTransform: 'capitalize'
            }}>
              {certificate.level}
            </div>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadCertificate}
          disabled={downloading}
          style={{
            padding: '18px 48px',
            borderRadius: '12px',
            border: 'none',
            background: downloading 
              ? '#9aa0a6' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: downloading ? 'none' : '0 10px 30px rgba(102, 126, 234, 0.4)',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.3s',
            fontFamily: '"Google Sans", "Roboto", sans-serif',
            letterSpacing: '0.5px'
          }}
        >
          <Download size={22} />
          {downloading ? 'Generating PDF...' : 'Download Certificate'}
        </button>

        {/* Info text */}
        <p style={{
          fontSize: '12px',
          color: isDark ? '#64748b' : '#80868b',
          marginTop: '20px',
          lineHeight: 1.5
        }}>
          Professional verified certificate • Same on all devices
        </p>
      </div>
    </div>
  );
}

export default CertificateViewer;