import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip,
  Legend, Bar, Line, LabelList, Brush
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatMillions = (value) => `${(value / 1_000_000).toFixed(1)}M`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const cost = payload.find(p => p.name === "Cost of Sales")?.value || 0;
    const opExp = payload.find(p => p.name === "Operating Expenses")?.value || 0;
    const diffPercent = opExp !== 0 ? (((cost - opExp) / opExp) * 100).toFixed(2) : 0;

    return (
      <div className="bg-white p-3 rounded shadow border border-gray-300">
        <p className="font-bold">Year: {label}</p>
        <p>Cost of Sales: {formatMillions(cost)}</p>
        <p>Operating Expenses: {formatMillions(opExp)}</p>
        <p className="text-sm text-blue-600">
          Difference: {diffPercent}% {cost > opExp ? "↑" : "↓"}
        </p>
      </div>
    );
  }
  return null;
};

const CostVsOperatingChart = ({ filters }) => {
  const [metrics, setMetrics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chartRef = useRef();

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/metrics")
      .then(res => setMetrics(res.data))
      .catch(error => console.error("Error fetching metrics:", error));
  }, []);

  const convertToUSD = (value) => filters.currency === "USD" ? value / 300 : value;

  const filteredData = metrics
    .filter(item => (
      (filters.year.length === 0 || filters.year.includes(item.Year)) 
    ))
    .reduce((acc, curr) => {
      const year = curr.Year;
      const existing = acc.find(i => i.Year === year);

      const cost = convertToUSD(Number(curr["Cost of Sales"]) || 0);
      const opExp = convertToUSD(Number(curr["Total Operating Expenses"]) || 0);

      if (existing) {
        existing["Cost of Sales"] += cost;
        existing["Operating Expenses"] += opExp;
      } else {
        acc.push({
          Year: year,
          "Cost of Sales": cost,
          "Operating Expenses": opExp,
        });
      }

      return acc;
    }, [])
    .sort((a, b) => a.Year - b.Year);

  const downloadPDF = () => {
    const input = chartRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save("CostVsOperatingChart.pdf");
    });
  };

  const downloadCSV = () => {
    const headers = ["Year,Cost of Sales,Operating Expenses"];
    const rows = filteredData.map(row =>
      `${row.Year},${row["Cost of Sales"]},${row["Operating Expenses"]}`
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "CostVsOperatingChart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={chartRef} className="bg-white p-4 rounded-xl shadow-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl text-center font-bold w-full">
          Cost of Sales vs Operating Expenses
        </h2>

        <div className="absolute right-4 top-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-blue-600 text-white px-3 py-1 rounded-md shadow hover:bg-blue-700 text-sm"
            >
              Export ▼
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    downloadPDF();
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => {
                    downloadCSV();
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Year" />
          <YAxis tickFormatter={formatMillions} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Bar dataKey="Cost of Sales" fill="#34d399">
            <LabelList dataKey="Cost of Sales" content={({ x, y, value }) => (
              <text x={x + 10} y={y - 10} fontSize="10" fill="#34d399">
                {`${(value / 1_000_000).toFixed(1)}M`}
              </text>
            )} />
          </Bar>

          <Bar dataKey="Operating Expenses" fill="#fbbf24">
            <LabelList dataKey="Operating Expenses" content={({ x, y, value }) => (
              <text x={x + 10} y={y - 10} fontSize="10" fill="#fbbf24">
                {`${(value / 1_000_000).toFixed(1)}M`}
              </text>
            )} />
          </Bar>

          <Line type="monotone" dataKey="Cost of Sales" stroke="#059669" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Operating Expenses" stroke="#d97706" strokeWidth={2} dot={false} />

          <Brush dataKey="Year" height={20} stroke="#8884d8" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostVsOperatingChart;
