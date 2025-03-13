package main

import (
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/media", mediaHandler)
    log.Println("Media service is running on port 8080...")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func mediaHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Media service is up and running!"))
}