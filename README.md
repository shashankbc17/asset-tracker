# 💎 Multi-Asset Net Worth & Precious Metals Portfolio Tracker

A high-performance wealth tracking application built with **Java 17**, **Spring Boot 3**, **Spring Data JPA**, and **Vanilla HTML5/CSS3/JavaScript**.

---

## 🌟 Key Features

* **Multi-Asset Portfolio Engine**:
  * 🪙 **Precious Metals**: 22K/24K Gold and Fine Silver (Coins, Bars, Jewelry with making deductions).
  * 📈 **Equities & Mutual Funds**: Stock holdings with buy price, CMP, and gain tracking.
  * 🏡 **Real Estate**: Residential & commercial property appraisals with rental yield metrics.
  * 💰 **Cash & Fixed Deposits**: Bank deposits with maturity and interest yields.
* **Live Market Sync**:
  * Direct integration with real-time Karnataka (Bangalore) live bullion feeds (`api.lalithaajewellery.com`).
  * Intelligent 4-hour server-side caching & on-demand sync.
* **Adaptive Dynamic Entry UI**:
  * Form automatically changes input fields based on asset class.
  * 1-click edit workflow with smooth scrolling and visual pulse highlighting.
* **Photorealistic 3D Renders**:
  * Visual thumbnails for gold bullion, silver ingots, jewelry, stocks, real estate, and fixed deposits.
* **Interactive Analytics**:
  * Real-time color-coded Asset Allocation Visualizer.
  * Category filter tabs and holding metrics.
  * CSV export and import.

---

## 🚀 Running Locally

### Prerequisites
* Java 17+ JDK installed
* Maven 3.8+ (or bundled wrapper)

### Build & Run
```bash
# Clone the repository
git clone https://github.com/shashankbc17/asset-tracker.git
cd asset-tracker

# Run with Maven
mvn spring-boot:run
```
Access the application at **`http://localhost:8080`**.
H2 Database Console available at **`http://localhost:8080/h2-console`**.

---

## ☁️ 1-Click Cloud Deployment (Render.com / Railway / Docker)

### Deploy via Docker
```bash
docker build -t wealth-tracker .
docker run -p 8080:8080 wealth-tracker
```

### Deploy to Render.com (100% Free)
1. Go to [Render.com](https://render.com) and click **New + $\rightarrow$ Web Service**.
2. Select your `asset-tracker` repository.
3. Set:
   * **Build Command**: `mvn clean package -DskipTests`
   * **Start Command**: `java -jar target/precious-metals-portfolio-1.0.0.jar`
4. Click **Deploy**.
