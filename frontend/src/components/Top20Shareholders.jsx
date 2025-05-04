import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Top20Shareholders = () => {
  const [shareholderData, setShareholderData] = useState({});
  const [selectedYear, setSelectedYear] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const exportRef = useRef();

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/metrics")
      .then((res) => {
        setShareholderData(res.data);
        const years = Object.keys(res.data);
        if (years.length) setSelectedYear(years[0]); // default to first year
      })
      .catch((error) => console.error("Error fetching shareholder data:", error));
  }, []);

  const years = Object.keys(shareholderData);
  const currentData = shareholderData[selectedYear];

  const downloadPDF = () => {
    html2canvas(exportRef.current).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save(`Top20Shareholders_${selectedYear}.pdf`);
    });
  };

  const downloadCSV = () => {
    if (!currentData) return;

    const headers = ["Shareholder,Number of Shares,Share %"];
    const rows = currentData["Top Twenty Shareholders"].map((name, i) => {
      const shares = currentData["Number of Shares"][i];
      const sharePct = currentData["Share %"][i];
      return `${name},${shares},${sharePct}`;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Top20Shareholders_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={exportRef} className="w-3/4 mx-auto p-4 mt-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Top 20 Shareholders</h2>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-indigo-600 text-white px-3 py-1 rounded-md shadow hover:bg-indigo-700 text-sm"
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

      <div className="flex space-x-2 mb-4">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm ${
              selectedYear === year
                ? "bg-indigo-600 text-white"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            }`}
          >
            {2019 + parseInt(year, 10)}
          </button>
        ))}
      </div>

      {currentData ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-indigo-100 text-indigo-900">
              <tr>
                <th className="px-4 py-2 text-lg border-b">Shareholder</th>
                <th className="px-4 py-2 text-lg border-b">Number of Shares</th>
                <th className="px-4 py-2 text-lg border-b">Share %</th>
              </tr>
            </thead>
            <tbody>
              {currentData["Top Twenty Shareholders"].map((name, index) => (
                <tr key={index} className="hover:bg-indigo-50">
                  <td className="px-4 py-2 border-b">{name}</td>
                  <td className="px-4 py-2 border-b">
                    {Number(currentData["Number of Shares"][index]).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border-b">{currentData["Share %"][index]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No data available for {selectedYear}</p>
      )}
    </div>
  );
};

export default Top20Shareholders;
