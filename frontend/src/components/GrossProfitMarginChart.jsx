import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Brush, LabelList
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const GrossProfitMarginChart = ({ filters }) => {
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
    .reduce((acc, curr) => {
      const year = curr.Year;
      const margin = Number(curr["Gross Margin (%)"]);
      if (!isNaN(margin)) {
        const existing = acc.find(i => i.Year === year);
        if (existing) {
          existing.total += margin;
          existing.count += 1;
        } else {
          acc.push({ Year: year, total: margin, count: 1 });
        }
      }
      return acc;
    }, [])
    .map(item => ({
      Year: item.Year,
      "Gross Margin (%)": (item.total / item.count).toFixed(2),
    }))
    .sort((a, b) => a.Year - b.Year);

  const formatPercent = (value) => `${value}%`;

  const downloadPDF = () => {
    const input = chartRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save("GrossProfitMarginChart.pdf");
    });
  };

  const downloadCSV = () => {
    const headers = ["Year,Gross Margin (%)"];
    const rows = filteredData.map(row => `${row.Year},${row["Gross Margin (%)"]}`);
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "GrossProfitMarginChart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={chartRef} className="bg-white p-4 rounded-xl shadow-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl text-center font-bold w-full">Gross Profit Margin</h2>

        <div className="absolute right-4 top-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-purple-600 text-white px-3 py-1 rounded-md shadow hover:bg-purple-700 text-sm"
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
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Year" />
          <YAxis tickFormatter={formatPercent} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Line
            type="monotone"
            dataKey="Gross Margin (%)"
            stroke="#9333ea"
            strokeWidth={3}
            dot={{ r: 4 }}
          >
            <LabelList dataKey="Gross Margin (%)" position="top" formatter={(val) => `${val}%`} />
          </Line>

          <ReferenceLine
            x={2020}
            stroke="red"
            strokeDasharray="3 3"
            label="Easter Attacks"
          />
          <ReferenceLine
            x={2021}
            stroke="orange"
            strokeDasharray="3 3"
            label="Tax Reform Begins"
          />
          <ReferenceLine
            x={2023}
            stroke="orange"
            strokeDasharray="3 3"
            label="Tax Reform Ends"
          />

          <Brush dataKey="Year" height={20} stroke="#9333ea" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrossProfitMarginChart;
