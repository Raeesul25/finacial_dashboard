import React from "react";
import { useEffect, useState } from "react";
import Header from './components/Header';
import Filters from './components/Filters';
import RevenueChart from "./components/RevenueChart";
import RightIssuesTable from './components/RightIssuesTable';
import SummaryCards from "./components/SummaryCards";
import CostVsOperatingChart from "./components/CostVsOperatingChart";
import EPSChart from "./components/EPSChart";
import GrossProfitMarginChart from "./components/GrossProfitMarginChart";
import NetAssetPerShareChart from "./components/NetAssetPerShareChart";
import Top20Shareholders from "./components/Top20Shareholders";
import Insights from "./components/Insights";

function App() {
  // const [metrics, setMetrics] = useState([]);
  const [filters, setFilters] = useState({
    year: [],
    industry: [],
    currency: 'LKR'
  });
  

  // console.log(metrics);
  
  // useEffect(() => {
  //   axios.get("http://127.0.0.1:5000/metrics")
  //     .then((response) => {
  //       // console.log(response.data)
  //       setMetrics(response.data);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching metrics:", error);
  //     });
  // }, []);

  return (
    <div className="min-h-screen bg-[gray-100] p-6">
      <div className="grid grid-cols-1 p-4 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <Header />
        </div>
        <div className="md:col-span-3">
          <Filters filters={filters} setFilters={setFilters} />
        </div>
      </div>

      <main className="p-4 overflow-auto">
        <SummaryCards filters={filters} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <RevenueChart filters={filters} />
          <CostVsOperatingChart filters={filters} />
          <GrossProfitMarginChart filters={filters} />
          <EPSChart filters={filters} />
          <NetAssetPerShareChart filters={filters} />
          <Insights />
        </div>
        <Top20Shareholders />
      </main>
    </div>
  );
}

export default App;