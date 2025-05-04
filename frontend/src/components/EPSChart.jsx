import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Brush, Legend, LabelList
} from "recharts";

const EPSChart = ({ filters }) => {
  const [metrics, setMetrics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chartRef = useRef();

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/metrics")
      .then(res => setMetrics(res.data))
      .catch((error) => {
        console.error("Error fetching metrics:", error);
      });
  }, []);

  const convertToUSD = (value) =>
    filters.currency === "USD" ? value / 300 : value;

  const filteredData = metrics
    .filter(item =>
      (filters.year.length === 0 || filters.year.includes(item.Year))
    )
    .map((item, index, arr) => {
      const eps = Number(item["Earnings Per Share (EPS)"]);
      const netProfit = convertToUSD(Number(item["Net Profit"]));
      const prevEPS = index > 0 ? Number(arr[index - 1]["Earnings Per Share (EPS)"]) : null;
      const epsGrowth = prevEPS && prevEPS !== 0
        ? (((eps - prevEPS) / prevEPS) * 100).toFixed(2)
        : null;

      return {
        Year: item.Year,
        EPS: eps.toFixed(2),
        "Net Profit": netProfit.toFixed(2),
        "EPS Growth (%)": epsGrowth
      };
    })
    .sort((a, b) => a.Year - b.Year);

  const formatCurrency = (value) =>
    `${Number(value).toLocaleString()} Mn`;

  const downloadPDF = () => {
    const input = chartRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save("EPSChart.pdf");
    });
  };

  const downloadCSV = () => {
    const headers = ["Year,EPS,EPS Growth (%),Net Profit"];
    const rows = filteredData.map(d =>
      `${d.Year},${d.EPS},${d["EPS Growth (%)"] ?? "N/A"},${d["Net Profit"]}`
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "EPSChart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={chartRef} className="bg-white p-4 rounded-xl shadow-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-center w-full">Earnings Per Share (EPS)</h2>

        <div className="absolute right-4 top-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-blue-600 text-white px-3 py-1 rounded-md shadow hover:bg-blue-700 text-sm"
            >
              Export ▼
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Year" />
          <YAxis />
          <Tooltip
            formatter={(value, name) => {
              if (name === "Net Profit") return [formatCurrency(value), name];
              if (name === "EPS Growth (%)") return [`${value}%`, name];
              if (name === "EPS") return [value, name];
              return [value, name];
            }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border p-2 rounded shadow text-sm">
                    <p className="font-semibold mb-1">Year: {label}</p>
                    <p>EPS: {data.EPS}</p>
                    <p>EPS Growth (%): {data["EPS Growth (%)"] ?? "N/A"}</p>
                    <p>Net Profit: {formatCurrency(data["Net Profit"])}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="EPS"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4 }}
          >
            <LabelList dataKey="EPS" position="top" />
          </Line>
          <Brush dataKey="Year" height={20} stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EPSChart;
