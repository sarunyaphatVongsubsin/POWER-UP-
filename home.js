// Load the same server-side Portfolio data used by the management page.
document.addEventListener("DOMContentLoaded", async () => {
    const portfolioTotal = document.getElementById("home-portfolio-total");
    const itemTotal = document.getElementById("home-item-total");

    try {
        const response = await fetch("api/portfolios.php", {
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const portfolios = await response.json();
        if (!Array.isArray(portfolios)) throw new Error("Invalid portfolio data");

        const items = portfolios.reduce((total, portfolio) => {
            return total + (Array.isArray(portfolio.items) ? portfolio.items.length : 0);
        }, 0);

        portfolioTotal.textContent = portfolios.length;
        itemTotal.textContent = items;
    } catch (error) {
        console.error("Unable to load Portfolio summary:", error);
        portfolioTotal.textContent = "—";
        itemTotal.textContent = "—";
    }
});
