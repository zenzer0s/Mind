### **📌  Why We Discontinued**  

Our initial approach **used local VM storage to manage files**, but after extensive testing, we realized it was **not practical for a scalable cloud storage system**.  

#### **🔹 Key Reasons for Discontinuation:**  
1️⃣ **Complex & Inefficient File Handling** → The system required multiple steps (`downloads/` → `media_storage/`), which **wasted storage and slowed down processing**.  
2️⃣ **Buggy & Unreliable Storage Management** → Files were sometimes **not stored or deleted correctly**, leading to inconsistencies.  
3️⃣ **Difficult to Scale** → A **local VM has limited storage** and lacks redundancy. **Cloud storage is more efficient for handling large user data.**  
4️⃣ **Increased Maintenance Overhead** → Constantly **debugging local file storage issues** made the project harder to manage.  
5️⃣ **Better Alternative Available** → **Google Cloud Storage (GCS) provides a more reliable and scalable solution**, eliminating the need for local file handling.  

💡 **Final Decision:** We decided to **discontinue local storage and migrate to a cloud-based solution (Google Cloud Storage) to make the system more efficient, scalable, and easier to maintain.**  

---
