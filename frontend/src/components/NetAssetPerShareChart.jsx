import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, LabelList, Brush, Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const NetAssetPerShareChart = ({ filters }) => {
  const [metrics, setMetrics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chartRef = useRef();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/metrics")
      .then((res) => {
        setMetrics(res.data);
      })
      .catch((error) => {
        console.error("Error fetching metrics:", error);
      });
  }, []);

  const filteredData = metrics.filter((item) =>
    (filters.year.length === 0 || filters.year.includes(item.Year))
  );

  const downloadPDF = () => {
    const input = chartRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save("NetAssetPerShareChart.pdf");
    });
  };

  const downloadCSV = () => {
    const headers = ["Year,Net Asset Per Share,Net Asset Growth (%)"];
    const rows = filteredData.map(row => 
      `${row.Year},${row["Net Asset Per Share"]},${row["Net Asset Growth (%)"]}`
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "NetAssetPerShareChart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={chartRef} className="bg-white p-4 rounded-xl shadow-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-center w-full">Net Asset Per Share</h2>

        <div className="absolute right-4 top-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-green-600 text-white px-3 py-1 rounded-md shadow hover:bg-green-700 text-sm"
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
          <YAxis
            label={{
              value: "Value (Rs)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "Net Asset Growth (%)") return [`${value}%`, name];
              return [`${value}`, name];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Net Asset Per Share"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
          >
            <LabelList
              dataKey="Net Asset Growth (%)"
              position="top"
              formatter={(value) => `${value}%`}
            />
          </Line>
          <Brush dataKey="Year" height={20} stroke="#16a34a" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetAssetPerShareChart;
