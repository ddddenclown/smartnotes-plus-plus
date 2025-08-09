import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import CanvasSelector from './components/CanvasSelector';
import NoteComponent from './components/NoteComponent';
import NoteEditor from './components/NoteEditor';
import MediaUploader from './components/MediaUploader';
import ToastManager from './components/ToastManager';
import TextViewer from './components/TextViewer';
import { useToast } from './hooks/useToast';

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

interface DragState {
  isDragging: boolean;
  noteId: string | null;
  offset: { x: number; y: number };
}

interface ResizeState {
  isResizing: boolean;
  noteId: string | null;
  direction: string | null;
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>('5cdcae6f-c4c1-45b9-b39e-4ee946a89820');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    noteId: null,
    offset: { x: 0, y: 0 }
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    noteId: null,
    direction: null
  });
  const [textViewer, setTextViewer] = useState<{
    isOpen: boolean;
    title: string;
    text: string;
    type: 'ocr' | 'transcript';
  } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toasts, removeToast, showOCRSuccess, showTranscriptSuccess, showError, showInfo } = useToast();

  // Загрузка заметок при смене канваса
  useEffect(() => {
    if (currentCanvasId) {
      loadNotes();
    }
  }, [currentCanvasId]);

  const loadNotes = async () => {
    if (!currentCanvasId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes`);
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
    }
  };

  const createNote = async (type: string = 'text') => {
    if (!currentCanvasId) return;

    const newNote = {
      type,
      title: type === 'text' ? 'Новая заметка' : undefined,
      content: type === 'text' ? 'Содержимое заметки' : undefined,
      x: Math.random() * 400 + 50,
      y: Math.random() * 400 + 50,
      width: 200,
      height: 150,
      tags: []
    };

    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote)
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNotes(prev => [...prev, createdNote]);
      }
    } catch (error) {
      console.error('Ошибка создания заметки:', error);
    }
  };

  const updateNotePositions = async (updates: Array<{id: string, x: number, y: number}>) => {
    if (!currentCanvasId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes/positions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        console.log('Позиции заметок обновлены');
      }
    } catch (error) {
      console.error('Ошибка обновления позиций:', error);
    }
  };

  const updateNoteSizes = async (updates: Array<{id: string, width: number, height: number}>) => {
    if (!currentCanvasId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes/sizes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        console.log('Размеры заметок обновлены');
      }
    } catch (error) {
      console.error('Ошибка обновления размеров:', error);
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    if (!currentCanvasId) return;

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedNote = { ...note, ...updates };

    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote)
      });

      if (response.ok) {
        const result = await response.json();
        setNotes(prev => prev.map(n => n.id === noteId ? result : n));
      }
    } catch (error) {
      console.error('Ошибка обновления заметки:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!currentCanvasId) return;

    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (error) {
      console.error('Ошибка удаления заметки:', error);
    }
  };

  const handleMediaUpload = async (type: 'image' | 'audio', filePath: string) => {
    if (!currentCanvasId) return;

    const newNote: any = {
      type,
      file_path: filePath,
      x: Math.random() * 400 + 50,
      y: Math.random() * 400 + 50,
      width: type === 'image' ? 220 : 250,
      height: type === 'image' ? 160 : 100,
      tags: []
    };

    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote)
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNotes(prev => [...prev, createdNote]);
      }
    } catch (error) {
      console.error('Ошибка создания заметки:', error);
    }
  };

  const handleOCRResult = (text: string) => {
    const toastId = showOCRSuccess(text, () => {
      setTextViewer({
        isOpen: true,
        title: 'Результат OCR',
        text,
        type: 'ocr'
      });
      removeToast(toastId);
    });
  };

  const handleTranscriptResult = (transcript: string) => {
    const toastId = showTranscriptSuccess(transcript, () => {
      setTextViewer({
        isOpen: true,
        title: 'Результат транскрипции',
        text: transcript,
        type: 'transcript'
      });
      removeToast(toastId);
    });
  };

  const saveTextAsNote = () => {
    if (!textViewer || !currentCanvasId) return;

    createNoteFromText(textViewer.text, textViewer.type === 'ocr' ? 'Распознанный текст' : 'Транскрипт');
    setTextViewer(null);
  };

  const createNoteFromText = async (content: string, title: string) => {
    if (!currentCanvasId) return;

    const newNote = {
      type: 'text',
      title,
      content,
      x: Math.random() * 400 + 50,
      y: Math.random() * 400 + 50,
      width: 300,
      height: 200,
      tags: []
    };

    try {
      const response = await fetch(`http://localhost:8000/canvases/${currentCanvasId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote)
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNotes(prev => [...prev, createdNote]);
        showInfo('Заметка создана', 'Текст сохранен как новая заметка');
      }
    } catch (error) {
      console.error('Ошибка создания заметки:', error);
      showError('Ошибка', 'Не удалось создать заметку');
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setResizeState({
      isResizing: true,
      noteId,
      direction
    });
  };

  const handleCanvasDelete = async (deletedCanvasId: string) => {
    // Если удаляется текущий канвас, переключаемся на другой или сбрасываем
    if (currentCanvasId === deletedCanvasId) {
      try {
        // Получаем обновленный список канвасов
        const response = await fetch('http://localhost:8000/canvases');
        if (response.ok) {
          const remainingCanvases = await response.json();
          if (remainingCanvases.length > 0) {
            // Переключаемся на первый доступный канвас
            setCurrentCanvasId(remainingCanvases[0]);
          } else {
            // Нет доступных канвасов
            setCurrentCanvasId(null);
          }
        } else {
          setCurrentCanvasId(null);
        }
      } catch (error) {
        console.error('Ошибка при переключении канваса:', error);
        setCurrentCanvasId(null);
      }
      
      // Очищаем заметки
      setNotes([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setDragState({
      isDragging: true,
      noteId,
      offset
    });

    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (dragState.isDragging && dragState.noteId) {
      const newX = e.clientX - canvasRect.left - dragState.offset.x;
      const newY = e.clientY - canvasRect.top - dragState.offset.y;

      setNotes(prev => prev.map(note => 
        note.id === dragState.noteId 
          ? { ...note, x: Math.max(0, newX), y: Math.max(0, newY) }
          : note
      ));
    } else if (resizeState.isResizing && resizeState.noteId) {
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      setNotes(prev => prev.map(note => {
        if (note.id !== resizeState.noteId) return note;

        const minWidth = 100;
        const minHeight = 80;
        let newWidth = note.width || 200;
        let newHeight = note.height || 150;

        switch (resizeState.direction) {
          case 'se': // юго-восток (правый нижний угол)
            newWidth = Math.max(minWidth, mouseX - note.x);
            newHeight = Math.max(minHeight, mouseY - note.y);
            break;
          case 's': // юг (нижняя сторона)
            newHeight = Math.max(minHeight, mouseY - note.y);
            break;
          case 'e': // восток (правая сторона)
            newWidth = Math.max(minWidth, mouseX - note.x);
            break;
        }

        return { ...note, width: newWidth, height: newHeight };
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.noteId) {
      const note = notes.find(n => n.id === dragState.noteId);
      if (note) {
        // Отправляем обновленную позицию на сервер
        updateNotePositions([{
          id: note.id,
          x: note.x,
          y: note.y
        }]);
      }
    }

    if (resizeState.isResizing && resizeState.noteId) {
      const note = notes.find(n => n.id === resizeState.noteId);
      if (note) {
        // Отправляем обновленный размер на сервер
        updateNoteSizes([{
          id: note.id,
          width: note.width || 200,
          height: note.height || 150
        }]);
      }
    }

    setDragState({
      isDragging: false,
      noteId: null,
      offset: { x: 0, y: 0 }
    });

    setResizeState({
      isResizing: false,
      noteId: null,
      direction: null
    });
  };

  return (
    <div className="app">
      <div className="sidebar">
        <CanvasSelector
          currentCanvasId={currentCanvasId}
          onCanvasSelect={(id) => setCurrentCanvasId(id)}
          onCanvasCreate={(id) => setCurrentCanvasId(id)}
          onCanvasDelete={handleCanvasDelete}
        />
        
        {currentCanvasId && (
          <>
            <div className="divider" />
            <MediaUploader
              canvasId={currentCanvasId}
              onUpload={handleMediaUpload}
            />
          </>
        )}
      </div>

      <div className="main-content">
        <div className="toolbar">
          <button onClick={() => createNote('text')} disabled={!currentCanvasId}>
            📝 Текст
          </button>
          <button onClick={loadNotes} disabled={!currentCanvasId}>
            🔄 Обновить
          </button>
          <span>Заметок: {notes.length}</span>
          {currentCanvasId && <span>Канвас: {currentCanvasId.slice(0, 8)}...</span>}
        </div>
        
        <div 
          ref={canvasRef}
          className="canvas"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {notes.map(note => (
            <NoteComponent
              key={note.id}
              note={note}
              isDragging={dragState.noteId === note.id}
              canvasId={currentCanvasId!}
              onMouseDown={(e) => handleMouseDown(e, note.id)}
              onResizeStart={(e, direction) => handleResizeStart(e, direction, note.id)}
              onOCR={handleOCRResult}
              onTranscribe={handleTranscriptResult}
              onEdit={() => setEditingNote(note)}
              onDelete={() => deleteNote(note.id)}
            />
          ))}
        </div>
      </div>

      {editingNote && currentCanvasId && (
        <NoteEditor
          note={editingNote}
          canvasId={currentCanvasId}
          onUpdate={(updates) => updateNote(editingNote.id, updates)}
          onClose={() => setEditingNote(null)}
        />
      )}

      {textViewer && (
        <TextViewer
          title={textViewer.title}
          text={textViewer.text}
          type={textViewer.type}
          onClose={() => setTextViewer(null)}
          onSaveAsNote={saveTextAsNote}
        />
      )}

      <ToastManager
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  );
};

export default App;
