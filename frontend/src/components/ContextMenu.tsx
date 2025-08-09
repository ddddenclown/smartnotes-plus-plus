import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  noteType: string;
  canvasId: string;
  noteId: string;
  filePath?: string;
  onClose: () => void;
  onOCR?: (text: string) => void;
  onTranscribe?: (transcript: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  noteType,
  canvasId,
  noteId,
  filePath,
  onClose,
  onOCR,
  onTranscribe,
  onEdit,
  onDelete
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleOCR = async () => {
    if (!filePath) return;
    
    try {
      // Создаем API запрос для OCR существующего файла
      const response = await fetch(`http://localhost:8000/canvases/${canvasId}/ocr-existing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          file_path: filePath,
          lang: 'eng+rus'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (onOCR) {
          onOCR(result.text);
        }
      } else {
        const errorText = await response.text();
        console.error('OCR error:', errorText);
      }
    } catch (error) {
      console.error('Ошибка OCR:', error);
      alert('Ошибка распознавания текста');
    }
    
    onClose();
  };

  const handleTranscribe = async () => {
    if (!filePath) return;
    
    try {
      // Создаем API запрос для транскрипции существующего файла
      const response = await fetch(`http://localhost:8000/canvases/${canvasId}/transcribe-existing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          file_path: filePath,
          lang: 'ru-ru'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (onTranscribe) {
          onTranscribe(result.transcript);
        }
      } else {
        const errorText = await response.text();
        console.error('Transcription error:', errorText);
      }
    } catch (error) {
      console.error('Ошибка транскрипции:', error);
      alert('Ошибка распознавания речи');
    }
    
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-item" onClick={onEdit}>
        ✏️ Редактировать
      </div>
      
      {noteType === 'image' && (
        <div className="context-menu-item" onClick={handleOCR}>
          📄 Распознать текст (OCR)
        </div>
      )}
      
      {noteType === 'audio' && (
        <div className="context-menu-item" onClick={handleTranscribe}>
          🎤 Распознать речь
        </div>
      )}
      
      <div className="context-menu-divider" />
      
      <div className="context-menu-item danger" onClick={onDelete}>
        🗑️ Удалить
      </div>
    </div>
  );
};

export default ContextMenu;
