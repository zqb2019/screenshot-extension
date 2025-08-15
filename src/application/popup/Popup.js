
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

function Popup() {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('idle');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    console.log('ee', e)
    console.log('fileInputRef', fileInputRef)
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        console.log('event', event)
        const config = JSON.parse(event.target.result);
        setConfig(config);
        setStatus('config_loaded');
      } catch (error) {
        setStatus('error');
        console.error('配置文件解析错误:', error);
      }
    };
    reader.readAsText(file);
    console.log('readread')
  };

  const captureArea = () => {
    setStatus('capturing');
    setPreviewImage(null);
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'CAPTURE_AREA',
        config: config
      }, (response) => {
        if (response && response.success) {
          setPreviewImage(response.image);
          setStatus('capture_success');
        } else {
          setStatus('error');
        }
      });
    });
  };

  const downloadImage = () => {
    if (!previewImage) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = config?.output?.filename 
      ? config.output.filename.replace('{timestamp}', timestamp) 
      : `screenshot-${timestamp}.png`;
    
    chrome.runtime.sendMessage({
      action: 'DOWNLOAD_IMAGE',
      imageData: previewImage,
      filename: filename
    });
  };

  const reset = () => {
    setConfig(null);
    setPreviewImage(null);
    setStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{width: '300px', padding: '15px', fontFamily: 'Arial, sans-serif'}}>
      <h2 style={{marginTop: 0, color: '#333'}}>网页区域截图</h2>
      
      {status === 'idle' && (
        <div>
          <p>上传配置文件:</p>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileUpload} 
            ref={fileInputRef}
            style={{marginBottom: '10px'}}
          />
          <p style={{fontSize: '12px', color: '#666'}}>配置文件应包含选择器和截图选项</p>
        </div>
      )}
      
      {status === 'config_loaded' && (
        <div>
          <p>配置文件已加载</p>
          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
            <button 
              onClick={captureArea}
              style={{
                padding: '8px 15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              开始截图
            </button>
            <button 
              onClick={reset}
              style={{
                padding: '8px 15px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重置
            </button>
          </div>
        </div>
      )}
      
      {status === 'capturing' && (
        <div style={{textAlign: 'center', padding: '20px 0'}}>
          <p>正在截图...</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {status === 'capture_success' && previewImage && (
        <div>
          <p>截图成功!</p>
          <div style={{margin: '10px 0', border: '1px solid #ddd', padding: '5px'}}>
            <img 
              src={previewImage} 
              alt="截图预览" 
              style={{maxWidth: '100%', height: 'auto'}}
            />
          </div>
          <button 
            onClick={downloadImage}
            style={{
              padding: '8px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            下载图片
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div style={{color: 'red', margin: '10px 0'}}>
          <p>出错了，请重试</p>
          <button 
            onClick={reset}
            style={{
              padding: '8px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重置
          </button>
        </div>
      )}
    </div>
  );
}
export default Popup;