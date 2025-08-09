import React, { useState } from 'react';
import ContextMenu from './ContextMenu';

interface Note {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title?: string;
  content?: string;
  file_path?: string;
  caption?: string;
  transcript?: string;
  drawing_data?: any;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface NoteComponentProps {
  note: Note;
  isDragging: boolean;
  canvasId: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, direction: string) => void;
  onOCR?: (text: string) => void;
  onTranscribe?: (transcript: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const NoteComponent: React.FC<NoteComponentProps> = ({
  note,
  isDragging,
  canvasId,
  onMouseDown,
  onResizeStart,
  onOCR,
  onTranscribe,
  onEdit,
  onDelete
}) => {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const renderNoteContent = () => {
    switch (note.type) {
      case 'text':
        return (
          <>
            <div className="note-title">{note.title || 'Без названия'}</div>
            <div className="note-content">{note.content || 'Пустая заметка'}</div>
          </>
        );
      
      case 'image':
        return (
          <>
            <div className="note-image">
              <img 
                src={`http://localhost:8000/media/${canvasId}/${note.file_path}`}
                alt={note.caption || 'Изображение'}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Ошибка</text></svg>';
                }}
              />
            </div>
            {note.caption && <div className="note-caption">{note.caption}</div>}
          </>
        );
      
      case 'audio':
        return (
          <>
            <div className="note-audio">
              <audio controls>
                <source src={`http://localhost:8000/media/${canvasId}/${note.file_path}`} />
                Ваш браузер не поддерживает аудио элемент.
              </audio>
            </div>
            {note.transcript && (
              <div className="note-transcript">
                <strong>Транскрипция:</strong>
                <p>{note.transcript}</p>
              </div>
            )}
          </>
        );
      
      case 'drawing':
        return (
          <div className="note-drawing">
            <div className="drawing-placeholder">🎨 Рисунок</div>
            {/* Здесь можно добавить рендеринг рисунка */}
          </div>
        );
      
      default:
        return <div className="note-content">Неизвестный тип заметки</div>;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        className={`note note-${note.type} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: note.x,
          top: note.y,
          width: note.width || 200,
          height: note.height || 150,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={onMouseDown}
        onContextMenu={handleContextMenu}
      >
        <div className="note-header">
          <div className="note-type-indicator">{getTypeIcon(note.type)}</div>
        </div>

      <div className="note-body">
        {renderNoteContent()}
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map((tag, index) => (
            <span key={index} className="tag">#{tag}</span>
          ))}
        </div>
      )}

        <div className="note-coords">({Math.round(note.x)}, {Math.round(note.y)}) - {Math.round(note.width || 200)}×{Math.round(note.height || 150)}</div>
        
        {/* Resize handles */}
        {onResizeStart && (
          <>
            <div 
              className="resize-handle resize-se"
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, 'se');
              }}
            />
            <div 
              className="resize-handle resize-s"
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, 's');
              }}
            />
            <div 
              className="resize-handle resize-e"
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, 'e');
              }}
            />
          </>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          noteType={note.type}
          canvasId={canvasId}
          noteId={note.id}
          filePath={note.file_path}
          onClose={() => setContextMenu(null)}
          onOCR={onOCR}
          onTranscribe={onTranscribe}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'text': return '📝';
    case 'image': return '🖼️';
    case 'audio': return '🎵';
    case 'drawing': return '🎨';
    default: return '📄';
  }
};

export default NoteComponent;
