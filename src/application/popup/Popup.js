
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

function Popup() {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('桌面端');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const changeDevice = () => {
    console.log('status', status)
    if (status === '桌面端') {
      setStatus('移动端')
      chrome.runtime.sendMessage({type: "changeDevice", data: {device: "mobile"}})
    }else {
      setStatus('桌面端')
       chrome.runtime.sendMessage({type: "changeDevice", data: {device: "desktop"}})
    }

  }

  return (
    <div style={{ width: '300px', padding: '15px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>网页截图</h2>
      <button onClick={changeDevice}>{`${status}`}</button>
    </div>
  );
}
export default Popup;