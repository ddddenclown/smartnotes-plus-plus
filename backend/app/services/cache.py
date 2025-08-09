from typing import Dict, Optional
from pathlib import Path
import hashlib
import time

class FileProcessingCache:
    """Кеш для результатов обработки файлов (OCR и транскрипции)"""
    
    def __init__(self):
        # Кеш для OCR результатов: {file_hash: {"text": str, "timestamp": float, "lang": str}}
        self._ocr_cache: Dict[str, Dict] = {}
        
        # Кеш для транскрипций: {file_hash: {"transcript": str, "timestamp": float, "lang": str}}
        self._transcript_cache: Dict[str, Dict] = {}
        
        # Время жизни кеша в секундах (24 часа)
        self._cache_ttl = 24 * 60 * 60
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Получить хеш файла для использования в качестве ключа кеша"""
        try:
            with open(file_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
            return f"{file_path.name}_{file_hash}"
        except Exception:
            # Если не можем прочитать файл, используем путь + время модификации
            stat = file_path.stat()
            return f"{file_path.name}_{stat.st_mtime}_{stat.st_size}"
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Проверить валидность записи кеша"""
        return (time.time() - cache_entry.get("timestamp", 0)) < self._cache_ttl
    
    def get_ocr_result(self, file_path: Path, lang: str) -> Optional[str]:
        """Получить результат OCR из кеша"""
        file_hash = self._get_file_hash(file_path)
        cache_key = f"{file_hash}_{lang}"
        
        if cache_key in self._ocr_cache:
            entry = self._ocr_cache[cache_key]
            if self._is_cache_valid(entry):
                return entry["text"]
            else:
                # Удаляем устаревшую запись
                del self._ocr_cache[cache_key]
        
        return None
    
    def set_ocr_result(self, file_path: Path, lang: str, text: str):
        """Сохранить результат OCR в кеш"""
        file_hash = self._get_file_hash(file_path)
        cache_key = f"{file_hash}_{lang}"
        
        self._ocr_cache[cache_key] = {
            "text": text,
            "timestamp": time.time(),
            "lang": lang,
            "file_path": str(file_path)
        }
    
    def get_transcript_result(self, file_path: Path, lang: str) -> Optional[str]:
        """Получить результат транскрипции из кеша"""
        file_hash = self._get_file_hash(file_path)
        cache_key = f"{file_hash}_{lang}"
        
        if cache_key in self._transcript_cache:
            entry = self._transcript_cache[cache_key]
            if self._is_cache_valid(entry):
                return entry["transcript"]
            else:
                # Удаляем устаревшую запись
                del self._transcript_cache[cache_key]
        
        return None
    
    def set_transcript_result(self, file_path: Path, lang: str, transcript: str):
        """Сохранить результат транскрипции в кеш"""
        file_hash = self._get_file_hash(file_path)
        cache_key = f"{file_hash}_{lang}"
        
        self._transcript_cache[cache_key] = {
            "transcript": transcript,
            "timestamp": time.time(),
            "lang": lang,
            "file_path": str(file_path)
        }
    
    def clear_expired_entries(self):
        """Очистить устаревшие записи из кеша"""
        current_time = time.time()
        
        # Очищаем OCR кеш
        expired_ocr = [
            key for key, entry in self._ocr_cache.items()
            if (current_time - entry.get("timestamp", 0)) >= self._cache_ttl
        ]
        for key in expired_ocr:
            del self._ocr_cache[key]
        
        # Очищаем кеш транскрипций
        expired_transcript = [
            key for key, entry in self._transcript_cache.items()
            if (current_time - entry.get("timestamp", 0)) >= self._cache_ttl
        ]
        for key in expired_transcript:
            del self._transcript_cache[key]
    
    def get_cache_stats(self) -> Dict:
        """Получить статистику кеша"""
        return {
            "ocr_entries": len(self._ocr_cache),
            "transcript_entries": len(self._transcript_cache),
            "total_entries": len(self._ocr_cache) + len(self._transcript_cache)
        }


# Глобальный экземпляр кеша
file_cache = FileProcessingCache()
