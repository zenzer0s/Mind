package main

import (
    "net/http"
    "encoding/json"
)

// Handler for media service
func MediaHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    // Example response
    response := map[string]string{"message": "Media service is running"}
    json.NewEncoder(w).Encode(response)
}

// Main function to start the server
func startServer() {
    http.HandleFunc("/media", MediaHandler)
    http.ListenAndServe(":8080", nil)
}