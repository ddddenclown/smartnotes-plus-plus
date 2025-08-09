import React from 'react';

interface TextViewerProps {
  title: string;
  text: string;
  type: 'ocr' | 'transcript';
  onClose: () => void;
  onSaveAsNote?: () => void;
}

const TextViewer: React.FC<TextViewerProps> = ({
  title,
  text,
  type,
  onClose,
  onSaveAsNote
}) => {
  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    // TODO: показать уведомление о копировании
  };

  return (
    <div className="text-viewer-overlay" onClick={onClose}>
      <div className="text-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="text-viewer-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="text-viewer-content">
          <div className="text-stats">
            <span className="stat">
              📄 {text.length} символов
            </span>
            <span className="stat">
              📝 {text.split(' ').filter(word => word.trim()).length} слов
            </span>
            {type === 'transcript' && (
              <span className="stat">
                🎵 {type === 'transcript' ? 'Транскрипт' : 'OCR'}
              </span>
            )}
          </div>

          <div className="text-content">
            <textarea
              value={text}
              readOnly
              placeholder={`${type === 'ocr' ? 'Распознанный текст' : 'Транскрипт'} будет здесь...`}
            />
          </div>
        </div>

        <div className="text-viewer-footer">
          <button onClick={handleCopyText} className="btn-secondary">
            📋 Скопировать
          </button>
          
          {onSaveAsNote && (
            <button onClick={onSaveAsNote} className="btn-secondary">
              📝 Сохранить как заметку
            </button>
          )}
          
          <button onClick={onClose} className="btn-primary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextViewer;
