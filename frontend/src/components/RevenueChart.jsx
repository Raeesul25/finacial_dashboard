import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Brush, LabelList
} from 'recharts';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RevenueChart = ({ filters }) => {
  const [rawMetrics, setRawMetrics] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/metrics")
      .then(res => setRawMetrics(res.data))
      .catch(error => console.error("Error fetching metrics:", error));
  }, []);

  useEffect(() => {
    if (!rawMetrics.length) return;

    const selectedIndustries = filters.industry.length 
      ? filters.industry : ["Transportation", "Retail", "Property", "Consumer Foods", "Leisure", "Financial Services", "Others"];
    const selectedYears = filters.year.length ? filters.year.map(y => Number(y)) : [2019, 2020, 2021, 2022, 2023, 2024];
    const currencyRate = filters.currency === "USD" ? 1 / 300 : 1;

    const yearlyData = selectedYears.map(year => {
      const yearMetrics = rawMetrics.filter(item => Number(item.Year) === year);
      let revenueSum = 0;

      yearMetrics.forEach(item => {
        selectedIndustries.forEach(ind => {
          if (item[ind] !== undefined) {
            revenueSum += Number(item[ind]);
          }
        });
      });

      const revenueConverted = revenueSum * currencyRate;
      return { Year: String(year), Revenue: +(revenueConverted / 1e6).toFixed(2) };
    });

    const annotated = yearlyData.map((item, idx, arr) => {
      if (idx === 0) return item;
      const change = ((item.Revenue - arr[idx - 1].Revenue) / arr[idx - 1].Revenue) * 100;
      return { ...item, label: `${change.toFixed(1)}%` };
    });

    setChartData(annotated);
  }, [rawMetrics, filters]);

  const downloadPDF = () => {
    const input = chartRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save("RevenueChart.pdf");
    });
  };

  const downloadCSV = () => {
    const headers = ["Year,Revenue"];
    const rows = chartData.map(row => `${row.Year},${row.Revenue}`);
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "RevenueChart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={chartRef} className="bg-white p-4 rounded-xl shadow-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-center w-full">Total Revenue (in Millions)</h2>

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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Year" />
          <YAxis label={{ angle: -90, position: "insideLeft" }} domain={['auto', 'auto']} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Revenue"
            stroke="#007bff"
            strokeWidth={3}
          >
            <LabelList dataKey="label" position="top" />
          </Line>
          <ReferenceLine
            x="2021"
            stroke="red"
            label={{ value: "COVID-19", position: "insideTop", fill: "red" }}
          />
          <Brush dataKey="Year" height={30} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
