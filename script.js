let liveUpdateInterval = null;
let chartInstance = null;
let isCandlestick = false;

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", function () {
    const searchBtn = document.getElementById("searchBtn");
    const toggleLiveUpdates = document.getElementById("toggleLiveUpdates");
    const toggleChartType = document.getElementById("toggleChartType");

    if (searchBtn) {
        searchBtn.addEventListener("click", fetchStockData);
    }
    if (toggleLiveUpdates) {
        toggleLiveUpdates.addEventListener("click", toggleLiveUpdates);
    }
    if (toggleChartType) {
        toggleChartType.addEventListener("click", toggleChartType);
    }

    initializeTheme();
    setupChartControls();
    fetchMarketOverview();
});

// API configuration
// API configuration
const API_KEY = "547338c6abmshf6a249a1c951a5ap1feb98jsn12b2fc9dbf66";
const BASE_URL = "https://yahoo-finance15.p.rapidapi.com/api/v1";
const options = {
    method: "GET",
    headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "yahoo-finance15.p.rapidapi.com"
    }
};

const toggleLiveUpdatesButton = document.getElementById("toggleLiveUpdates");
if (toggleLiveUpdatesButton) {
    toggleLiveUpdatesButton.addEventListener("click", handleLiveUpdates);
}

// Initialize theme on page load
function initializeTheme() {
    const themeToggle = document.getElementById("themeToggle");
  
    if (!themeToggle) return;
  
    // Check local storage for theme preference
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
  
    themeToggle.addEventListener("click", toggleTheme);
  }
  
  function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
}

function handleLiveUpdates() {
    const button = document.getElementById("toggleLiveUpdates");
    const statusIndicator = document.createElement("span");
    statusIndicator.id = "liveStatus";
    button.parentNode.insertBefore(statusIndicator, button.nextSibling);

    if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
        button.textContent = "Enable Live Updates";
        statusIndicator.textContent = " (Disabled)";
        statusIndicator.style.color = "red";
    } else {
        let lastUpdateTime = 0;
        const RATE_LIMIT_DELAY = 5000; // 5 seconds between updates

        liveUpdateInterval = setInterval(async () => {
            const currentTime = Date.now();
            if (currentTime - lastUpdateTime < RATE_LIMIT_DELAY) {
                return;
            }

            const stockTicker = document.getElementById("stockTicker").value;
            if (!stockTicker) {
                statusIndicator.textContent = " (No ticker selected)";
                return;
            }

            try {
                statusIndicator.textContent = " (Updating...)";
                const stockData = await fetchStockDetails(stockTicker);
                
                if (stockData) {
                    displayStockData(stockData);
                    displayKeyMetrics(stockData);
                    displayGrowthMetrics(stockData);
                    statusIndicator.textContent = ` (Last updated: ${new Date().toLocaleTimeString()})`;
                    statusIndicator.style.color = "green";
                }

                lastUpdateTime = Date.now();
            } catch (error) {
                console.error("Live update error:", error);
                statusIndicator.textContent = ` (Error: ${error.message})`;
                statusIndicator.style.color = "red";
            }
        }, RATE_LIMIT_DELAY);

        button.textContent = "Disable Live Updates";
        statusIndicator.textContent = " (Enabled)";
        statusIndicator.style.color = "green";
    }
}

function handleAPIError(error, operation) {
    console.error(`Error during ${operation}:`, error);
    const errorMessage = error.response ? 
        `API Error: ${error.response.status}` : 
        `Network Error: ${error.message}`;
    displayError(errorMessage);
    return null;
}



// Fetch stock details from API
async function fetchStockDetails(stockTicker) {
  const url = `${BASE_URL}/markets/stock/quotes?ticker=${stockTicker}`;
  try {
      const response = await fetch(url, options);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("API Response:", result); // Debug log
      
      if (result.body && result.body.length > 0) {
          return result.body[0];
      }
      throw new Error(`No data found for ${stockTicker}`);
  } catch (error) {
      throw new Error(`Failed to fetch stock details: ${error.message}`);
  }
}


// Display stock data on the page
function displayStockData(stock) {
  const stockDetailsDiv = document.getElementById("stockDetails");
  if (stockDetailsDiv) {
      stockDetailsDiv.innerHTML = `
          <div class="stock-info">
              <div class="stock-row">
                  
              </div>
              <div class="stock-row">
                  <p><strong>PE Ratio:</strong> ${stock.trailingPE ? stock.trailingPE.toFixed(2) : "--"}</p>
                  <p><strong>PB Ratio:</strong> ${stock.priceToBook ? stock.priceToBook.toFixed(2) : "--"}</p>
              </div>
          </div>
      `;
  }
}

// Display key metrics like 52-week high/low, volume, etc.
function displayKeyMetrics(stock) {
  const keyMetricsDiv = document.getElementById("keyMetrics");
  if (keyMetricsDiv) {
      keyMetricsDiv.innerHTML = `
          <div class="stock-info">
              <div class="stock-row">
                  <p><strong>52-Week High:</strong> ${stock.fiftyTwoWeekHigh || "--"}</p>
                  <p><strong>52-Week Low:</strong> ${stock.fiftyTwoWeekLow || "--"}</p>
                  <p><strong>Volume:</strong> ${stock.regularMarketVolume?.toLocaleString() || "--"}</p>
              </div>
              <div class="stock-row">
                  <p><strong>EPS (TTM):</strong> ${stock.epsTrailingTwelveMonths || "--"}</p>
              </div>
          </div>
      `;
  }
}

// Fetch news data related to the stock
async function fetchNewsData() {
    try {
        // Using Alpha Vantage News API as an alternative
        const ALPHA_VANTAGE_API_KEY = "YOUR_ALPHA_VANTAGE_API_KEY"; // Replace with your key
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${ALPHA_VANTAGE_API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.feed && data.feed.length > 0) {
            displayNewsData(data.feed);
        } else {
            throw new Error("No news data available");
        }
    } catch (error) {
        console.error("News fetch error:", error);
        document.getElementById("newsList").innerHTML = 
            `<li class="error">Unable to load news. Error: ${error.message}</li>`;
    }
}

// Update the displayNewsData function to match Alpha Vantage's response format
function displayNewsData(articles) {
    const newsList = document.getElementById("newsList");
    if (!newsList) return;

    newsList.innerHTML = "";
    if (articles.length === 0) {
        newsList.innerHTML = "<li>No news articles found.</li>";
        return;
    }

    articles.slice(0, 8).forEach((article) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <a href="${article.url}" target="_blank">
                ${article.title}
                <span class="news-time">${new Date(article.time_published).toLocaleDateString()}</span>
            </a>`;
        newsList.appendChild(listItem);
    });
}

// Display error message
function displayError(message) {
  document.getElementById("stockDetails").innerHTML = `<p class="error">${message}</p>`;
}

// Fetch market overview (Sensex and Nifty)
async function fetchMarketOverview() {
  try {
      const sensexUrl = `${BASE_URL}/markets/stock/quotes?ticker=^BSESN`;
      const niftyUrl = `${BASE_URL}/markets/stock/quotes?ticker=^NSEI`;
      
      const [sensexData, niftyData] = await Promise.all([
          fetch(sensexUrl, options).then(res => res.json()),
          fetch(niftyUrl, options).then(res => res.json())
      ]);

      displayMarketOverview(sensexData.body[0], niftyData.body[0]);
  } catch (error) {
      console.error("Error fetching market overview:", error);
  }
}

// Display market overview (Sensex and Nifty data)
function displayMarketOverview(sensex, nifty) {
  document.getElementById('sensexData').innerHTML = `
      <h3>SENSEX</h3>
      <p>${sensex.regularMarketPrice.toFixed(2)}</p>
      <p class="${sensex.regularMarketChange > 0 ? 'positive' : 'negative'}">
          ${sensex.regularMarketChange.toFixed(2)} (${sensex.regularMarketChangePercent.toFixed(2)}%)
      </p>
  `;

  document.getElementById('niftyData').innerHTML = `
      <h3>NIFTY 50</h3>
      <p>${nifty.regularMarketPrice.toFixed(2)}</p>
      <p class="${nifty.regularMarketChange > 0 ? 'positive' : 'negative'}">
          ${nifty.regularMarketChange.toFixed(2)} (${nifty.regularMarketChangePercent.toFixed(2)}%)
      </p>
  `;
}

async function fetchFinancialData(stockTicker) {
  const url = `${BASE_URL}/markets/stock/modules?ticker=${stockTicker}&module=financial-data`;
  try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error("Financial data error:", error);
      return {};
  }
}

async function fetchStatistics(stockTicker) {
  const url = `${BASE_URL}/markets/stock/modules?ticker=${stockTicker}&module=statistics`;
  try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error("Statistics error:", error);
      return {};
  }
}

// Fetch stock data based on user input
async function fetchStockData() {
    const stockTicker = document.getElementById("stockTicker").value.toUpperCase().trim();
    
    if (!stockTicker) {
        alert("Please enter a valid stock ticker (e.g., TCS.NS)");
        return;
    }
  
    showLoading();
    try {
        const stockData = await fetchStockDetails(stockTicker);
        displayStockData(stockData);
        displayKeyMetrics(stockData);
        displayGrowthMetrics(stockData);
        await fetchNewsData();
        await fetchMarketOverview();
    } catch (error) {
        console.error("Error fetching stock:", error);
        displayError(`Failed to fetch stock data: ${error.message}`);
    } finally {
        hideLoading();
    }
}



// Fetch historical data for different periods
async function fetchHistoricalData(stockTicker) {
    if (!stockTicker) return;
    const url = `${BASE_URL}/markets/stock/history?symbol=${stockTicker}&period=3y`;
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.body || !data.body.items) throw new Error("No historical data available");
        const formattedData = formatChartData(data.body.items);
        renderChart(formattedData);
    } catch (error) {
        console.error("Historical data error:", error);
    }
}
  
  function formatChartData(data) {
    return data.map(entry => ({
      x: new Date(entry.date),
      o: parseFloat(entry.open),
      h: parseFloat(entry.high),
      l: parseFloat(entry.low),
      c: parseFloat(entry.close)
    })).filter(entry => !isNaN(entry.o) && !isNaN(entry.h) && !isNaN(entry.l) && !isNaN(entry.c));
}
  
  function renderChart(data) {
    const ctx = document.getElementById("stockChart").getContext("2d");
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
      type: isCandlestick ? "candlestick" : "line",
      data: {
        datasets: [{
          label: "Stock Price",
          data: data,
          borderColor: "#0a9396",
          backgroundColor: "rgba(10, 147, 150, 0.2)",
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { type: "time", time: { unit: "day" } },
          y: { beginAtZero: false }
        }
      }
    });
}

// Show loading indicator
function showLoading() {
  document.getElementById("stockDetails").innerHTML = '<div class="loading">Loading...</div>';
}

// Hide loading indicator
function hideLoading() {
  const loadingElement = document.querySelector('.loading');
  if (loadingElement) {
      loadingElement.remove();
  }
}

function calculateDailyChange(data) {
  if (data.close && data.open) {
      return ((data.close - data.open) / data.open * 100).toFixed(2);
  }
  return '--';
}

// Calculate stock return over time (percentage change)
function calculateReturn(data, days = null) {
    if (!data || data.length < 2) return "--";
    
    const endIndex = 0;
    const startIndex = days ? 
        data.findIndex(item => {
            const daysDiff = (new Date(data[0].date) - new Date(item.date)) / (1000 * 60 * 60 * 24);
            return daysDiff >= days;
        }) : 
        data.length - 1;
    
    if (startIndex === -1) return "--";
    
    const startPrice = data[startIndex]?.close;
    const endPrice = data[endIndex]?.close;
    return startPrice && endPrice ? 
        ((endPrice - startPrice) / startPrice * 100) : 
        "--";
}

// Display growth metrics (e.g., 1-year return, 5-year return, etc.)
function displayGrowthMetrics(stock) {
    const metricsDiv = document.getElementById("stockChartSection");
    const metrics = {
        "Current Price": stock.regularMarketPrice?.toFixed(2),
        "Day Change": `${stock.regularMarketChange?.toFixed(2)}%`,
        "Volume": stock.regularMarketVolume?.toLocaleString(),
        "52-Week High": stock.fiftyTwoWeekHigh?.toFixed(2),
        "52-Week Low": stock.fiftyTwoWeekLow?.toFixed(2),
        "Market Cap": stock.marketCap?.toLocaleString()
    };

    metricsDiv.innerHTML = `
        <h2>Stock Performance</h2>
        <div class="growth-metrics">
            ${Object.entries(metrics).map(([label, value]) => `
                <div class="metric-card">
                    <h3>${label}</h3>
                    <p>${value || '--'}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function displayStockGrowth(stockData) {
  return `
      <table>
          <tr>
              <th>Date</th>
              <th>Close Price</th>
              <th>Change</th>
              <th>Volume</th>
          </tr>
          ${stockData.map(data => `
              <tr>
                  <td>${new Date(data.date).toLocaleDateString()}</td>
                  <td>${data.close?.toFixed(2) || '--'}</td>
                  <td class="${data.change > 0 ? 'positive' : 'negative'}">
                      ${calculateDailyChange(data)}%
                  </td>
                  <td>${data.volume?.toLocaleString() || '--'}</td>
              </tr>
          `).join('')}
      </table>
  `;
}
