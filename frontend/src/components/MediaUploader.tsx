import React, { useState, useRef } from 'react';

interface MediaUploaderProps {
  canvasId: string;
  onUpload: (type: 'image' | 'audio', filePath: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ canvasId, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, endpoint: string, type: 'image' | 'audio') => {
    setIsUploading(true);
    setUploadProgress(`Загружаем ${type === 'image' ? 'изображение' : 'аудио'}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:8000/canvases/${canvasId}/${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        onUpload(type, result.file_path);
        
        setUploadProgress('Загружено успешно!');
        setTimeout(() => setUploadProgress(''), 2000);
      } else {
        setUploadProgress('Ошибка загрузки');
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setUploadProgress('Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, 'upload/image', 'image');
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, 'upload/audio', 'audio');
    }
  };

  return (
    <div className="media-uploader">
      <div className="upload-buttons">
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
          className="upload-btn image-btn"
        >
          📷 Изображение
        </button>

        <button
          onClick={() => audioInputRef.current?.click()}
          disabled={isUploading}
          className="upload-btn audio-btn"
        >
          🎵 Аудио
        </button>
      </div>

      {uploadProgress && (
        <div className="upload-progress">
          {uploadProgress}
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MediaUploader;
