import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import html2pdf from 'html2pdf.js';
import CryptoJS from 'crypto-js';

function App() {
  const [formData, setFormData] = useState({
    patientName: '',
    date: '',
    chiefComplaint: '',
    pastMedicalHistory: '',
    socialHistory: '',
    surgicalHistory: '',
    allergies: '',
    currentMeds: '',
    historyOfPresentIllness: '',
    // Physical Exam - Column 1
    gen: '',
    head: '',
    eyes: '',
    face: '',
    throat: '',
    breast: '',
    chest: '',
    card: '',
    abdomen: '',
    gu: '',
    // Physical Exam - Column 2
    rectal: '',
    skin: '',
    ext: '',
    back: '',
    neuro: '',
    motor: '',
    cerebellar: '',
    sensory: '',
    cns: '',
    assessmentPlan: '',
    // Signatures
    printName: '',
    signature: '',
    signatureDate: ''
  });

  const formRef = useRef();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [sessionWarning, setSessionWarning] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');

  // Security and session management
  useEffect(() => {
    // Generate session encryption key
    const sessionKey = CryptoJS.lib.WordArray.random(256/8).toString();
    setEncryptionKey(sessionKey);
    
    
    // Set zoom to 125% on mount
    document.body.style.zoom = '1.25';
    
    // Session timeout warning (25 minutes)
    const warningTimer = setTimeout(() => {
      setSessionWarning(true);
    }, 25 * 60 * 1000);
    
    // Auto-clear session (30 minutes)
    const clearTimer = setTimeout(() => {
      clearAllData();
      alert('Session expired. All data has been cleared for security.');
    }, 30 * 60 * 1000);
    
    // Clear data on page unload
    const handleUnload = () => {
      clearAllData();
    };
    window.addEventListener('beforeunload', handleUnload);
    
    // Prevent right-click context menu for security
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Enhanced auto-resize and text wrapping initialization
    const initAutoResize = () => {
      const textElements = document.querySelectorAll('textarea, [contentEditable="true"]');
      textElements.forEach(element => {
        // Force wrapping properties
        element.style.whiteSpace = 'pre-wrap';
        element.style.wordWrap = 'break-word';
        element.style.overflowWrap = 'anywhere';
        element.style.wordBreak = 'break-word';
        
        // Initial resize
        autoResizeElement(element);
        
        // Add multiple event listeners for comprehensive coverage
        element.addEventListener('input', (e) => {
          setTimeout(() => autoResizeElement(e.target), 0);
        });
        element.addEventListener('paste', (e) => {
          setTimeout(() => autoResizeElement(e.target), 10);
        });
        element.addEventListener('keyup', (e) => {
          autoResizeElement(e.target);
        });
      });
    };
    
    // Initialize with longer delay and re-run periodically
    setTimeout(initAutoResize, 200);
    setTimeout(initAutoResize, 1000); // Backup initialization
    
    return () => {
      clearTimeout(warningTimer);
      clearTimeout(clearTimer);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Security functions
  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
  };
  
  const decryptData = (encryptedData) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      return null;
    }
  };
  
  const clearAllData = () => {
    // Clear form data
    setFormData({
      patientName: '', date: '', chiefComplaint: '', pastMedicalHistory: '',
      socialHistory: '', surgicalHistory: '', allergies: '', currentMeds: '',
      historyOfPresentIllness: '', gen: '', head: '', eyes: '', face: '',
      throat: '', breast: '', chest: '', card: '', abdomen: '', gu: '',
      rectal: '', skin: '', ext: '', back: '', neuro: '', motor: '',
      cerebellar: '', sensory: '', cns: '', assessmentPlan: '',
      printName: '', signature: '', signatureDate: ''
    });
    
    // Clear all form inputs visually
    const inputs = document.querySelectorAll('input, [contentEditable]');
    inputs.forEach(input => {
      if (input.contentEditable === 'true') {
        input.textContent = '';
      } else {
        input.value = '';
      }
    });
    
    // Clear session storage and local storage of sensitive data
    sessionStorage.clear();
    const keysToKeep = ['preferredFolder'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset session timer
    setSessionStartTime(Date.now());
    setSessionWarning(false);
  };

  // Enhanced auto-resize function for expanding text areas
  const autoResizeElement = (element) => {
    if (element.tagName === 'TEXTAREA' || element.contentEditable === 'true') {
      // Force text wrapping and proper sizing
      element.style.overflowY = 'hidden';
      element.style.height = 'auto';
      
      // Calculate required height based on content
      const scrollHeight = element.scrollHeight;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight) || 20;
      const padding = parseInt(window.getComputedStyle(element).paddingTop) + 
                      parseInt(window.getComputedStyle(element).paddingBottom);
      
      // Set minimum height to single line, maximum to reasonable limit
      const minHeight = lineHeight + padding;
      const maxHeight = Math.min(150, lineHeight * 8 + padding);
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
      
      element.style.height = newHeight + 'px';
      
      // Enable scrolling only if content exceeds max height
      if (scrollHeight > maxHeight) {
        element.style.overflowY = 'auto';
      }
    }
  };

  // Update handleInputChange to support contentEditable divs with encryption and auto-resize
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === undefined ? e.target.innerText : value;
    
    // Auto-resize the element
    autoResizeElement(e.target);
    
    setFormData(prevState => ({
      ...prevState,
      [name]: newValue
    }));
    
    // Store encrypted data in session storage as backup
    const updatedData = { ...formData, [name]: newValue };
    sessionStorage.setItem('encryptedFormData', encryptData(updatedData));
  };

  // Auto-resize textarea to fit content
  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to match content, with minimum height
    textarea.style.height = Math.max(24, textarea.scrollHeight) + 'px';
  };


  // Function to wrap text into lines with optimized edge-to-edge utilization
  const wrapTextForDisplay = (text, maxCharsPerLine = 170) => {
    if (!text) return '';
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      // If single word is too long, break it
      if (word.length > maxCharsPerLine) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        // Break long word into chunks
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          lines.push(word.slice(i, i + maxCharsPerLine));
        }
      } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines.join('<br>');
  };

  const exportToPDF = async () => {
    const element = formRef.current;
    if (!element) return;

    setIsExporting(true);

    try {
      // Convert all contentEditable divs to plain text with <br> tags for PDF
      const editableDivs = element.querySelectorAll('[contenteditable="true"]');
      const originalContents = new Map();
      
      editableDivs.forEach(div => {
        const originalContent = div.innerHTML;
        originalContents.set(div, originalContent);
        const textContent = div.textContent || div.innerText || '';
        const wrappedText = wrapTextForDisplay(textContent, 160);
        div.innerHTML = wrappedText;
        div.style.whiteSpace = 'normal';
        div.style.wordBreak = 'break-word';
        div.style.height = 'auto';
        div.style.minHeight = '60px';
      });

      // Add the pdf-exporting class for fit-content sizing
      element.classList.add('pdf-exporting');

      // Generate filename with patient name and date
      const patientName = (formData.patientName || 'Unknown_Patient').replace(/[^a-zA-Z0-9]/g, '_');
      const formDate = formData.date || new Date().toISOString().split('T')[0];
      const timestamp = new Date().toLocaleTimeString('en-US', {hour12: false}).replace(/:/g, '-');
      const filename = `${patientName}_${formDate}_${timestamp}_History_Physical.pdf`;

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#fff',
          allowTaint: true,
          useCORS: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };

      // Brief delay for CSS fit-content to take effect
      await new Promise(resolve => setTimeout(resolve, 100));
      await html2pdf().set(opt).from(element).save();

      // Remove the pdf-exporting class after export
      element.classList.remove('pdf-exporting');

      // Restore original content in contentEditable divs
      editableDivs.forEach(div => {
        const originalContent = originalContents.get(div);
        div.innerHTML = originalContent;
        div.style.whiteSpace = '';
        div.style.wordBreak = '';
        div.style.height = '';
        div.style.minHeight = '';
      });

      // Show success message with file location info
      setSuccessMessage(`✅ PDF exported as: ${filename}\n📁 Saved to Downloads folder`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      element.classList.remove('pdf-exporting');
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const createNewForm = () => {
    if (confirm('This will clear all current data. Are you sure?')) {
      clearAllData();
    }
  };

  
  
  const extendSession = () => {
    setSessionStartTime(Date.now());
    setSessionWarning(false);
  };

  return (
    <div className="App">

      {/* Session Warning */}
      {sessionWarning && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px',
          padding: '15px', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{margin: 0, color: '#856404'}}>
            ⚠️ Session expires in 5 minutes. Extend session or data will be cleared.
          </p>
          <button onClick={extendSession} style={{
            marginTop: '10px', backgroundColor: '#28a745', color: 'white',
            border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer'
          }}>
            Extend Session
          </button>
        </div>
      )}


      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="header">
        <h1>History & Physical Examination Form</h1>
        <div className="button-group">
          <button onClick={createNewForm} className="btn btn-new">
            Create New Form
          </button>
          <button 
            onClick={exportToPDF} 
            className="btn btn-export"
            disabled={isExporting}
          >
            {isExporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="pdf-container" ref={formRef}>
        {/* SINGLE PAGE FOR ALL CONTENT */}
        <div className="pdf-page">
          <div className="pdf-header">
            <h2>HISTORY AND PHYSICAL</h2>
            <div className="patient-info">
              <div className="info-row">
                <span className="label">NAME:</span>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  className="pdf-input"
                />
                <span className="label">DATE OF BIRTH:</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="pdf-input"
                />
              </div>
            </div>
          </div>

          <div className="chief-complaint-section" style={{marginBottom: 0}}>
            <h3>CHIEF COMPLAINT</h3>
            <div
              contentEditable={true}
              name="chiefComplaint"
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              className="pdf-textarea compact-textarea editable-div"
              placeholder="Enter chief complaint..."
              style={{minHeight: '12px'}}
            >{formData.chiefComplaint}</div>
          </div>

          <div className="history-section" style={{marginBottom: 0}}>
            <h3>PAST MEDICAL HISTORY</h3>
            <div
              contentEditable={true}
              name="pastMedicalHistory"
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              className="pdf-textarea compact-textarea editable-div"
              placeholder="Enter past medical history..."
              style={{minHeight: '12px'}}
            >{formData.pastMedicalHistory}</div>
          </div>

          <div className="history-section" style={{marginBottom: 0}}>
            <h3>SOCIAL HISTORY</h3>
            <div
              contentEditable={true}
              name="socialHistory"
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              className="pdf-textarea compact-textarea editable-div"
              placeholder="Smoking, alcohol, occupation, living situation, social support..."
              style={{minHeight: '12px'}}
            >{formData.socialHistory}</div>
          </div>

          <div className="history-section" style={{marginBottom: 0}}>
            <h3>SURGICAL HISTORY</h3>
            <div
              contentEditable={true}
              name="surgicalHistory"
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              className="pdf-textarea compact-textarea editable-div"
              placeholder="Previous surgeries, procedures, dates, complications..."
              style={{minHeight: '12px'}}
            >{formData.surgicalHistory}</div>
          </div>

          <div className="history-section" style={{marginBottom: 0}}>
            <h3>MEDICATIONS & ALLERGIES</h3>
            <div className="allergies-meds">
              <div className="allergies">
                <span className="label">Allergies:</span>
                <div
                  contentEditable={true}
                  name="allergies"
                  suppressContentEditableWarning={true}
                  onInput={handleInputChange}
                  className="pdf-textarea compact-textarea editable-div"
                  placeholder="List allergies..."
                  style={{minHeight: '12px'}}
                >{formData.allergies}</div>
              </div>
              <div className="meds">
                <span className="label">CURRENT MEDS:</span>
                <div
                  contentEditable={true}
                  name="currentMeds"
                  suppressContentEditableWarning={true}
                  onInput={handleInputChange}
                  className="pdf-textarea compact-textarea editable-div"
                  placeholder="List current medications..."
                  style={{minHeight: '12px'}}
                >{formData.currentMeds}</div>
              </div>
            </div>
          </div>

          <div className="history-section" style={{marginBottom: 0}}>
            <h3>HISTORY OF PRESENT ILLNESS</h3>
            <div
              contentEditable={true}
              name="historyOfPresentIllness"
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              className="pdf-textarea compact-textarea editable-div"
              placeholder="Describe the history of present illness..."
              style={{minHeight: '12px'}}
            >{formData.historyOfPresentIllness}</div>
          </div>

          <div className="physical-exam-section">
            <h3>PHYSICAL EXAMINATION</h3>
            <div className="exam-columns">
              <div className="exam-column">
                {/* Column 1 exam items */}
                <div className="exam-item">
                  <span className="exam-label">GEN:</span>
                  <div
                    contentEditable={true}
                    name="gen"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                    placeholder="Type here..."
                  >{formData.gen}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">HEAD:</span>
                  <div
                    contentEditable={true}
                    name="head"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.head}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">EYES:</span>
                  <div
                    contentEditable={true}
                    name="eyes"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.eyes}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">FACE:</span>
                  <div
                    contentEditable={true}
                    name="face"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.face}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">THROAT:</span>
                  <div
                    contentEditable={true}
                    name="throat"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.throat}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">BREAST:</span>
                  <div
                    contentEditable={true}
                    name="breast"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.breast}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">CHEST:</span>
                  <div
                    contentEditable={true}
                    name="chest"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.chest}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">CARD:</span>
                  <div
                    contentEditable={true}
                    name="card"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.card}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">ABDOMEN:</span>
                  <div
                    contentEditable={true}
                    name="abdomen"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.abdomen}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">GU:</span>
                  <div
                    contentEditable={true}
                    name="gu"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.gu}</div>
                </div>
              </div>
              <div className="exam-column">
                {/* Column 2 exam items */}
                <div className="exam-item">
                  <span className="exam-label">RECTAL:</span>
                  <div
                    contentEditable={true}
                    name="rectal"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.rectal}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">SKIN:</span>
                  <div
                    contentEditable={true}
                    name="skin"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.skin}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">EXT:</span>
                  <div
                    contentEditable={true}
                    name="ext"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.ext}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">BACK:</span>
                  <div
                    contentEditable={true}
                    name="back"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.back}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">NEURO:</span>
                  <div
                    contentEditable={true}
                    name="neuro"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.neuro}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">MOTOR:</span>
                  <div
                    contentEditable={true}
                    name="motor"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.motor}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">CEREBELLAR:</span>
                  <div
                    contentEditable={true}
                    name="cerebellar"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.cerebellar}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">SENSORY:</span>
                  <div
                    contentEditable={true}
                    name="sensory"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.sensory}</div>
                </div>
                <div className="exam-item">
                  <span className="exam-label">CN's:</span>
                  <div
                    contentEditable={true}
                    name="cns"
                    suppressContentEditableWarning={true}
                    onInput={handleInputChange}
                    className="exam-input"
                    style={{
                      minHeight: '24px',
                      maxHeight: '80px',
                      overflow: 'auto',
                      border: '1px solid #333',
                      padding: '4px 6px',
                      backgroundColor: 'white'
                    }}
                  >{formData.cns}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="assessment-plan-section" style={{marginBottom: 0}}>
            <h3>ASSESSMENT & PLAN</h3>
            <div
              contentEditable={true}
              name="assessmentPlan"
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              className="pdf-textarea compact-textarea editable-div"
              placeholder="Enter assessment and plan..."
              style={{minHeight: '12px'}}
            >{formData.assessmentPlan}</div>
          </div>

          <div className="signature-section">
            <div className="signature-row" style={{display: 'flex', gap: 2, margin: 0, padding: 0}}>
              <div className="signature-item" style={{flex: 1, minWidth: 0, margin: 0, padding: 0}}>
                <span className="label">Name:</span>
                <input
                  type="text"
                  name="printName"
                  value={formData.printName}
                  onChange={handleInputChange}
                  className="signature-input"
                />
              </div>
              <div className="signature-item" style={{flex: 1, minWidth: 0, margin: 0, padding: 0}}>
                <span className="label">Date:</span>
                <input
                  type="date"
                  name="signatureDate"
                  value={formData.signatureDate}
                  onChange={handleInputChange}
                  className="signature-input"
                />
              </div>
              <div className="signature-item" style={{flex: 1, minWidth: 0, margin: 0, padding: 0}}>
                <span className="label">Sign:</span>
                <input
                  type="text"
                  name="signature"
                  value={formData.signature}
                  onChange={handleInputChange}
                  className="signature-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;