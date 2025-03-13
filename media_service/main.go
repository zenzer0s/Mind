package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
	"github.com/gin-gonic/gin"
)

var db *sql.DB

// Initialize PostgreSQL connection
func initDB() {
	connStr := "user=zen password=yourpassword dbname=zero sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("❌ Database connection not responding:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL!")
}

func main() {
	initDB()
	r := gin.Default()

	r.POST("/process", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File upload failed"})
			return
		}

		userID := c.PostForm("user_id") // Get user ID from bot request
		filePath := fmt.Sprintf("./media_storage/%s/%s", userID, file.Filename)

		// Ensure user folder exists
		os.MkdirAll(fmt.Sprintf("./media_storage/%s", userID), os.ModePerm)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Store metadata in PostgreSQL
		_, err = db.Exec("INSERT INTO media_files (user_id, file_name, file_path, file_type) VALUES ($1, $2, $3, $4)",
			userID, file.Filename, filePath, "document") // Adjust file type as needed
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save metadata"})
			return
		}

		fmt.Println("✅ Stored in database:", file.Filename)
		c.JSON(http.StatusOK, gin.H{"message": "File stored successfully", "filename": file.Filename})
	})

	fmt.Println("🚀 Go Media Service is running on port 8081...")
	r.Run(":8081")
}
