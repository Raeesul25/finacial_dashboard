import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Insights = () => {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/insights')
      .then(res => {
        if (res.data.success) {
          setInsights(res.data.insights);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading insights:', err);
        setLoading(false);
      });
  }, []);

  // Clean & Format: Remove headings/empty lines, preserve bolds
  const formatInsights = (text) => {
    return text
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))  // remove empty lines & headers
      .map(line => {
        // bold parts wrapped in ** ** (Markdown)
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<li>${formatted.trim().replace(/^\*/, '')}</li>`;  // remove leading *
      }).join('');
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 max-h-[500px] overflow-y-auto">
      <h2 className="text-xl text-center font-bold mb-3">AI-Generated Insights</h2>
      {loading ? (
        <p>Loading insights...</p>
      ) : (
        <div className="max-h-[450px] pr-2">
          <ul
            className="list-disc pl-5 space-y-2 text-gray-700"
            dangerouslySetInnerHTML={{ __html: formatInsights(insights) }}
          />
        </div>
      )}
    </div>
  );
};

export default Insights;