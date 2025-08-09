import React, { useState, useEffect } from 'react';

interface Note {
  id: string;
  type: string;
  x: number;
  y: number;
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

interface NoteEditorProps {
  note: Note;
  canvasId: string;
  onUpdate: (updatedNote: Partial<Note>) => void;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, canvasId, onUpdate, onClose }) => {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [caption, setCaption] = useState(note.caption || '');
  const [tags, setTags] = useState(note.tags?.join(', ') || '');

  const handleSave = () => {
    const updates: Partial<Note> = {
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    if (note.type === 'text') {
      updates.title = title;
      updates.content = content;
    } else if (note.type === 'image') {
      updates.caption = caption;
    }

    onUpdate(updates);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="note-editor-overlay" onClick={onClose}>
      <div className="note-editor" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="editor-header">
          <h3>Редактирование заметки</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="editor-content">
          {note.type === 'text' && (
            <>
              <div className="form-group">
                <label>Заголовок:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите заголовок"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Содержимое:</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Введите текст заметки"
                  rows={5}
                />
              </div>
            </>
          )}

          {note.type === 'image' && (
            <>
              <div className="form-group">
                <label>Изображение:</label>
                <img 
                  src={`http://localhost:8000/media/${canvasId}/${note.file_path}`} 
                  alt="Заметка" 
                  className="preview-image"
                />
              </div>
              <div className="form-group">
                <label>Подпись:</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Подпись к изображению"
                />
              </div>
            </>
          )}

          {note.type === 'audio' && (
            <>
              <div className="form-group">
                <label>Аудио:</label>
                <audio controls>
                  <source src={`http://localhost:8000/media/${canvasId}/${note.file_path}`} />
                </audio>
              </div>
              {note.transcript && (
                <div className="form-group">
                  <label>Транскрипция:</label>
                  <p className="transcript">{note.transcript}</p>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Теги:</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="тег1, тег2, тег3"
            />
          </div>
        </div>

        <div className="editor-footer">
          <button onClick={handleSave}>Сохранить (Ctrl+Enter)</button>
          <button onClick={onClose}>Отмена (Esc)</button>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
