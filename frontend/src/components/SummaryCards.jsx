import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SummaryCards = ({ filters }) => {
  const [metrics, setMetrics] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/metrics")
      .then(res => setMetrics(res.data))
      .catch(error => console.error("Error fetching metrics:", error));
  }, []);

  useEffect(() => {
    if (!metrics.length) return;

    const selectedIndustries = filters.industry.length
      ? filters.industry
      : ["Transportation", "Retail", "Property", "Consumer Foods", "Leisure", "Financial Services", "Others"];

    const selectedYears = filters.year.length
      ? filters.year.map(y => Number(y))
      : [...new Set(metrics.map(item => Number(item.Year)))]; // all unique years

    const currencyRate = filters.currency === "USD" ? 1 / 300 : 1;

    // Total Revenue
    let totalRevenueSum = 0;
    metrics.forEach(item => {
      if (selectedYears.includes(Number(item.Year))) {
        selectedIndustries.forEach(industry => {
          if (item[industry] !== undefined) {
            totalRevenueSum += Number(item[industry]) * currencyRate;
          }
        });
      }
    });
    setTotalRevenue((totalRevenueSum / 1e6).toFixed(2)); // in Millions

    // Gross Profit
    const grossProfits = metrics
      .filter(item => selectedYears.includes(Number(item.Year)))
      .map(item => Number(item["Gross Profit"]) * currencyRate);
    const totalGrossProfit = grossProfits.reduce((sum, val) => sum + val, 0);
    setGrossProfit((totalGrossProfit / 1e6).toFixed(2)); // in Millions

    // Net Profit (already in Millions)
    const netProfits = metrics
      .filter(item => selectedYears.includes(Number(item.Year)))
      .map(item => Number(item["Net Profit"]) * currencyRate);
    const totalNetProfit = netProfits.reduce((sum, val) => sum + val, 0);
    setNetProfit(totalNetProfit.toFixed(2));

  }, [metrics, filters]);

  const format = (val) => `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} Mn`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-4">
      <div className="bg-white p-5 md:p-4 rounded-[6px] shadow-lg text-center ">
        <h3 className="text-2xl font-semibold mb-2 text-[#D98324]-900">Total Revenue</h3>
        <p className="text-5xl font-bold text-white-900">{format(totalRevenue)}</p>
        <p className="text-sm text-gold-800">{filters.currency}</p>
      </div>

      <div className="bg-white p-5 md:p-4 rounded-[6px] shadow-lg text-center">
        <h3 className="text-2xl font-semibold mb-2 text-[#D98324]-900">Gross Profit</h3>
        <p className="text-5xl font-bold text-white-900">{format(grossProfit)}</p>
        <p className="text-sm text-gold-800">{filters.currency}</p>
      </div>

      <div className="bg-white p-5 md:p-4 rounded-[6px] shadow-lg text-center">
        <h3 className="text-2xl font-semibold mb-2 text-[#D98324]-900">Net Profit</h3>
        <p className="text-5xl font-bold text-white-900">{format(netProfit)}</p>
        <p className="text-sm text-gold-800">{filters.currency}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
