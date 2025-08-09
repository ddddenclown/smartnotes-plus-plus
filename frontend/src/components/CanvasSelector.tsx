import React, { useState, useEffect } from 'react';

interface Canvas {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CanvasSelectorProps {
  currentCanvasId: string | null;
  onCanvasSelect: (canvasId: string) => void;
  onCanvasCreate: (name: string) => void;
  onCanvasDelete?: (canvasId: string) => void;
}

const CanvasSelector: React.FC<CanvasSelectorProps> = ({
  currentCanvasId,
  onCanvasSelect,
  onCanvasCreate,
  onCanvasDelete
}) => {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCanvases();
  }, []);

  const loadCanvases = async () => {
    try {
      const response = await fetch('http://localhost:8000/canvases');
      if (response.ok) {
        const canvasIds = await response.json();
        // Загружаем метаданные для каждого канваса
        const canvasPromises = canvasIds.map(async (id: string) => {
          const metaResponse = await fetch(`http://localhost:8000/canvases/${id}`);
          if (metaResponse.ok) {
            return await metaResponse.json();
          }
          return null;
        });
        const canvasData = await Promise.all(canvasPromises);
        setCanvases(canvasData.filter(Boolean));
      }
    } catch (error) {
      console.error('Ошибка загрузки канвасов:', error);
    }
  };

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) return;
    
    try {
      const response = await fetch('http://localhost:8000/canvases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCanvasName })
      });
      
      if (response.ok) {
        const newCanvas = await response.json();
        setCanvases(prev => [...prev, newCanvas]);
        onCanvasCreate(newCanvas.id);
        setNewCanvasName('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Ошибка создания канваса:', error);
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/canvases/${canvasId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setCanvases(prev => prev.filter(canvas => canvas.id !== canvasId));
        setConfirmDelete(null);
        if (onCanvasDelete) {
          onCanvasDelete(canvasId);
        }
      }
    } catch (error) {
      console.error('Ошибка удаления канваса:', error);
    }
  };

  return (
    <div className="canvas-selector">
      <h3>Канвасы</h3>
      
      <div className="canvas-list">
        {canvases.map(canvas => (
          <div key={canvas.id} className="canvas-wrapper">
            <div
              className={`canvas-item ${currentCanvasId === canvas.id ? 'active' : ''}`}
              onClick={() => onCanvasSelect(canvas.id)}
            >
              <div className="canvas-info">
                <span className="canvas-name">{canvas.name}</span>
                <span className="canvas-date">
                  {new Date(canvas.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {confirmDelete === canvas.id ? (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <span className="confirm-text">Удалить?</span>
                  <button 
                    className="confirm-yes"
                    onClick={() => handleDeleteCanvas(canvas.id)}
                  >
                    ✓
                  </button>
                  <button 
                    className="confirm-no"
                    onClick={() => setConfirmDelete(null)}
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(canvas.id);
                  }}
                  title="Удалить канвас"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isCreating ? (
        <div className="create-canvas-form">
          <input
            type="text"
            value={newCanvasName}
            onChange={(e) => setNewCanvasName(e.target.value)}
            placeholder="Название канваса"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateCanvas()}
            autoFocus
          />
          <div className="form-buttons">
            <button onClick={handleCreateCanvas}>Создать</button>
            <button onClick={() => setIsCreating(false)}>Отмена</button>
          </div>
        </div>
      ) : (
        <button 
          className="create-canvas-btn"
          onClick={() => setIsCreating(true)}
        >
          + Новый канвас
        </button>
      )}
    </div>
  );
};

export default CanvasSelector;
