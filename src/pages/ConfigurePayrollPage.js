import React, { useState, useEffect } from 'react';
import { usePayrollSlice } from '../slices/usePayrollSlice';
import '../styles/ConfigurePayrollPage.css';

const ConfigurePayrollPage = () => {
  const { config, fetchConfig, updateConfig, successMessage, errorMessage, isGenerating, isFetching } = usePayrollSlice();
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [taxRules, setTaxRules] = useState([]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setDeductionTypes(config.deductionTypes || []);
      setTaxRules(config.taxRules || []);
    }
  }, [config]);

  const handleDeductionTypeChange = (index, field, value) => {
    const updatedDeductionTypes = [...deductionTypes];
    updatedDeductionTypes[index] = { ...updatedDeductionTypes[index], [field]: value };
    setDeductionTypes(updatedDeductionTypes);
  };

  const handleTaxRuleChange = (index, field, value) => {
    const updatedTaxRules = [...taxRules];
    updatedTaxRules[index] = { ...updatedTaxRules[index], [field]: value };
    setTaxRules(updatedTaxRules);
  };

  const handleSaveConfig = async () => {
    await updateConfig({ deductionTypes, taxRules });
  };

  return (
    <div className="payroll-page-container">
      <div className="header-section">
        <h2>Configure Payroll</h2>
        <button className="add-btn" onClick={handleSaveConfig} disabled={isGenerating}>
          Save Configuration
        </button>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading configuration...</div>}

      <div className="table-section">
        <h3>Deduction Types</h3>
        <div className="table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Calculation Rule</th>
                <th>Is Taxable</th>
              </tr>
            </thead>
            <tbody>
              {deductionTypes.length > 0 ? (
                deductionTypes.map((dt, index) => (
                  <tr key={dt.DeductionTypeID || index}>
                    <td>
                      <input
                        type="text"
                        value={dt.DeductionTypeName}
                        onChange={(e) => handleDeductionTypeChange(index, 'DeductionTypeName', e.target.value)}
                        className="filter-input"
                      />
                    </td>
                    <td>
                      <select
                        value={dt.CalculationRule}
                        onChange={(e) => handleDeductionTypeChange(index, 'CalculationRule', e.target.value)}
                        className="filter-input"
                      >
                        <option value="Percentage">Percentage</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={dt.IsTaxable}
                        onChange={(e) => handleDeductionTypeChange(index, 'IsTaxable', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No deduction types available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3>Tax Rules</h3>
        <div className="table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Min Income</th>
                <th>Max Income</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {taxRules.length > 0 ? (
                taxRules.map((tr, index) => (
                  <tr key={tr.TaxRuleID || index}>
                    <td>
                      <input
                        type="number"
                        value={tr.MinIncome}
                        onChange={(e) => handleTaxRuleChange(index, 'MinIncome', parseFloat(e.target.value))}
                        className="filter-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={tr.MaxIncome}
                        onChange={(e) => handleTaxRuleChange(index, 'MaxIncome', parseFloat(e.target.value))}
                        className="filter-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={tr.Rate}
                        onChange={(e) => handleTaxRuleChange(index, 'Rate', parseFloat(e.target.value))}
                        className="filter-input"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No tax rules available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConfigurePayrollPage;
