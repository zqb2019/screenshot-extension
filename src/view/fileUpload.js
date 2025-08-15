import { useRef } from 'react';

export default function FileUpload(onConfigLoaded) {
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result);
        onConfigLoaded(config);
      } catch (error) {
        console.error("配置文件解析错误:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mb-4">
      <input 
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => fileRef.current?.click()}
      >
        上传配置文件
      </button>
      <p className="mt-2 text-sm text-gray-500">
        上传JSON配置文件定义截图区域
      </p>
    </div>
  );
}