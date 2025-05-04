import React, { useState, useEffect, useRef } from 'react';

const allYears = [2024, 2023, 2022, 2021, 2020, 2019];
const allIndustries = [
  "Transportation", "Retail", "Consumer Foods", "Leisure", "Property", "Financial Services", "Others"
];

const Filters = ({ filters, setFilters }) => {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const yearRef = useRef(null);
  const industryRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!yearRef.current?.contains(e.target)) setShowYearDropdown(false);
      if (!industryRef.current?.contains(e.target)) setShowIndustryDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (field, value) => {
    setFilters((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleCurrencyChange = (e) => {
    setFilters(prev => ({ ...prev, currency: e.target.value }));
  };

  const renderDropdown = ({ label, values, selected, toggleFn, ref, isVisible, setIsVisible, field }) => (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-full h-14 p-2 px-4 text-left rounded-md border border-gray-300 shadow bg-white text-gray-800 hover:bg-blue-50 focus:bg-blue-100 flex justify-between items-center"
      >
        <span className="truncate">
          {selected.length === 0 || selected.length === values.length
            ? `All ${label}`
            : selected.join(", ")}
        </span>
        <svg
          className="w-5 h-5 ml-2 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isVisible && (
        <div className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow max-h-60 overflow-y-auto">
          {values.map((val) => (
            <label key={val} className="flex items-center p-2 hover:bg-blue-50 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                checked={selected.includes(val)}
                onChange={() => toggleFn(field, val)}
              />
              {val}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-4 h-[60%] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      {/* Year filter */}
      {renderDropdown({
        label: "Years",
        values: allYears,
        selected: filters.year,
        toggleFn: toggleSelection,
        ref: yearRef,
        isVisible: showYearDropdown,
        setIsVisible: setShowYearDropdown,
        field: "year"
      })}

      {/* Industry filter */}
      {renderDropdown({
        label: "Industries",
        values: allIndustries,
        selected: filters.industry,
        toggleFn: toggleSelection,
        ref: industryRef,
        isVisible: showIndustryDropdown,
        setIsVisible: setShowIndustryDropdown,
        field: "industry"
      })}

      {/* Currency filter */}
      <select
        name="currency"
        value={filters.currency}
        onChange={handleCurrencyChange}
        className="p-2 px-4 h-14 rounded-md shadow bg-white border border-gray-300 text-gray-800 hover:bg-blue-50 focus:bg-blue-100 transition-colors duration-200"
      >
        <option value="LKR">LKR</option>
        <option value="USD">USD</option>
      </select>
    </div>
  );
};

export default Filters;
