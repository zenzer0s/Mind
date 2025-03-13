package main

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.POST("/process", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File upload failed"})
			return
		}

		// Save file temporarily (we'll process it later)
		dst := "./uploads/" + file.Filename
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		fmt.Println("✅ Received file:", file.Filename)
		c.JSON(http.StatusOK, gin.H{"message": "File received", "filename": file.Filename})
	})

	fmt.Println("🚀 Go Media Service is running on port 8081...")
	r.Run(":8081") // Start server on port 8081
}
