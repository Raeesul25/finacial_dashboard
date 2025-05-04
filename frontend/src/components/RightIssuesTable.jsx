import React from "react";

const RightIssuesTable = ({ data }) => {
    const latest = data[data.length - 1];
    const issues = latest["Right Issues"] || [];
  
    if (!issues.length) return null;
  
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Right Issues</h2>
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr>
              <th className="text-left">Year</th>
              <th>Ratio</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((r, i) => (
              <tr key={i}>
                <td>{r.year}</td>
                <td>{r.ratio}</td>
                <td>{r.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default RightIssuesTable;
  