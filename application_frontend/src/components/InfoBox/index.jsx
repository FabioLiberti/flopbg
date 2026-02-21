import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

const InfoBox = ({ title, infoFile }) => {
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const response = await fetch(`/info/${infoFile}.md`);
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading info:', error);
        setContent('Error loading information');
      }
    };

    if (isOpen) {
      loadInfo();
    }
  }, [infoFile, isOpen]);

  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 1000
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    display: 'inline-flex',
    alignItems: 'center',
    color: '#666',
    transition: 'color 0.3s ease'
  };

  return (
    <>
      <button 
        style={buttonStyle}
        onClick={() => setIsOpen(true)}
        onMouseOver={(e) => e.currentTarget.style.color = '#000'}
        onMouseOut={(e) => e.currentTarget.style.color = '#666'}
      >
        <Info size={18} />
      </button>

      {isOpen && (
        <>
          <div style={overlayStyle} onClick={() => setIsOpen(false)} />
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ lineHeight: '1.6' }}>
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default InfoBox;