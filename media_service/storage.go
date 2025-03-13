package main

import (
    "errors"
    "sync"
)

type Storage struct {
    mu      sync.RWMutex
    data    map[string]interface{}
}

func NewStorage() *Storage {
    return &Storage{
        data: make(map[string]interface{}),
    }
}

func (s *Storage) Set(key string, value interface{}) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.data[key] = value
}

func (s *Storage) Get(key string) (interface{}, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    value, exists := s.data[key]
    if !exists {
        return nil, errors.New("key not found")
    }
    return value, nil
}

func (s *Storage) Delete(key string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    delete(s.data, key)
}

func (s *Storage) Clear() {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.data = make(map[string]interface{})
}

func (s *Storage) GetAll() map[string]interface{} {
    s.mu.RLock()
    defer s.mu.RUnlock()
    copy := make(map[string]interface{})
    for k, v := range s.data {
        copy[k] = v
    }
    return copy
}