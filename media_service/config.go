package main

import (
    "os"
)

type Config struct {
    Port        string
    DatabaseURL string
    RedisURL    string
}

func LoadConfig() (*Config, error) {
    port := os.Getenv("MEDIA_SERVICE_PORT")
    databaseURL := os.Getenv("DATABASE_URL")
    redisURL := os.Getenv("REDIS_URL")

    return &Config{
        Port:        port,
        DatabaseURL: databaseURL,
        RedisURL:    redisURL,
    }, nil
}