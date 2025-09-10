/**
 * The `PeriodPage` component in React manages a list of periods, allows filtering and pagination, and
 * provides functionality to add, edit, and delete periods.
 * @returns The code snippet is a functional component named `PeriodPage` that renders a page
 * displaying a list of periods with various filters and pagination. It uses React hooks such as
 * `useState` and `useEffect` to manage state and side effects. The component fetches periods data,
 * allows filtering and searching, and provides options to add, edit, and delete periods. It also
 * includes a modal for adding/edit
 */
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PeriodForm from '../components/PeriodForm';
import { usePeriodSlice } from '../slices/PeriodSlice';
import '../styles/PeriodPage.css';

const PeriodPage = () => {
  const { periods, handleDelete, successMessage, errorMessage, fetchPeriods, isFetching } = usePeriodSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [sequenceFilter, setSequenceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const periodsPerPage = 5;

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  useEffect(() => {
    console.log('Current periods state:', periods);
    periods?.forEach((period, index) => {
      console.log(`Period ${index}:`, JSON.stringify(period, null, 2));
    });
  }, [periods]);

  const filteredPeriods = periods?.filter((period) => {
    const matchesSearch =
      (period?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (period?.calendarType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesName = !nameFilter || (period?.name?.toLowerCase() || '').includes(nameFilter.toLowerCase());
    const matchesSequence = !sequenceFilter || (period?.sequence === parseInt(sequenceFilter));
    const matchesStatus = !statusFilter || (period?.status?.toLowerCase() || '').includes(statusFilter.toLowerCase());
    return matchesSearch && matchesName && matchesSequence && matchesStatus;
  }) || [];

  const indexOfLastPeriod = currentPage * periodsPerPage;
  const indexOfFirstPeriod = indexOfLastPeriod - periodsPerPage;
  const currentPeriods = filteredPeriods.slice(indexOfFirstPeriod, indexOfLastPeriod);
  const totalPages = Math.ceil(filteredPeriods.length / periodsPerPage);

  const handleAddOrEditPeriod = (period) => {
    setEditPeriod(period);
    setShowPeriodModal(true);
  };

  const handleDeleteClick = (periodId) => {
    if (!periodId) {
      console.error('Cannot delete: periodId is undefined');
      return;
    }
    handleDelete(periodId);
  };

  const handleClosePeriodModal = async () => {
    await fetchPeriods();
    setShowPeriodModal(false);
    setEditPeriod(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="period-page-container">
      <div className="header-section">
        <h2>All Periods</h2>
        <div>
          <button className="add-btn" onClick={() => handleAddOrEditPeriod(null)}>
            + Add New Period
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading periods...</div>}

      {showPeriodModal && (
        <PeriodForm
          period={editPeriod}
          onClose={handleClosePeriodModal}
        />
      )}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by name or calendar type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <input
            type="text"
            placeholder="Filter by Name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="number"
            placeholder="Filter by Sequence..."
            value={sequenceFilter}
            onChange={(e) => setSequenceFilter(e.target.value)}
            className="filter-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">Filter by Status...</option>
            <option value="Open">Open</option>
            <option value="Processing">Processing</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="period-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sequence</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Calendar Type</th>
                <th>Cutoff Day</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPeriods.length > 0 ? (
                currentPeriods.map((period) => (
                  <tr key={period.periodId || `temp-${Math.random()}`}>
                    <td>{period.name || 'N/A'}</td>
                    <td>{period.sequence || 'N/A'}</td>
                    <td>{period.startDate ? new Date(period.startDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{period.endDate ? new Date(period.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{period.calendarType || 'N/A'}</td>
                    <td>{period.cutoffDay || 'N/A'}</td>
                    <td>{period.status || 'N/A'}</td>
                    <td>{period.createdAt ? new Date(period.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{period.updatedAt ? new Date(period.updatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleAddOrEditPeriod(period)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteClick(period.periodId)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10">No periods found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button className="nav-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
            Prev
          </button>
          <button className="nav-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default PeriodPage;



// import React, { useState, useEffect } from 'react';
// import { FaEdit, FaTrash, FaLock, FaUnlock } from 'react-icons/fa';
// import PeriodForm from '../components/PeriodForm';
// import { usePeriodSlice } from '../slices/PeriodSlice';
// import '../styles/PeriodPage.css';

// const PeriodPage = () => {
//   const { periods, handleDelete, successMessage, errorMessage, fetchPeriods, isFetching } = usePeriodSlice();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [nameFilter, setNameFilter] = useState('');
//   const [sequenceFilter, setSequenceFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [showPeriodModal, setShowPeriodModal] = useState(false);
//   const [editPeriod, setEditPeriod] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const periodsPerPage = 5;

//   useEffect(() => {
//     fetchPeriods();
//   }, [fetchPeriods]);

//   useEffect(() => {
//     console.log('Current periods state:', periods);
//     periods?.forEach((period, index) => {
//       console.log(`Period ${index}:`, JSON.stringify(period, null, 2));
//     });
//   }, [periods]);

//   const filteredPeriods = periods?.filter((period) => {
//     const matchesSearch =
//       (period?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
//       (period?.calendarType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
//     const matchesName = !nameFilter || (period?.name?.toLowerCase() || '').includes(nameFilter.toLowerCase());
//     const matchesSequence = !sequenceFilter || (period?.sequence === parseInt(sequenceFilter));
//     const matchesStatus = !statusFilter || (period?.status?.toLowerCase() || '').includes(statusFilter.toLowerCase());
//     return matchesSearch && matchesName && matchesSequence && matchesStatus;
//   }) || [];

//   const indexOfLastPeriod = currentPage * periodsPerPage;
//   const indexOfFirstPeriod = indexOfLastPeriod - periodsPerPage;
//   const currentPeriods = filteredPeriods.slice(indexOfFirstPeriod, indexOfLastPeriod);
//   const totalPages = Math.ceil(filteredPeriods.length / periodsPerPage);

//   const handleAddOrEditPeriod = (period) => {
//     setEditPeriod(period);
//     setShowPeriodModal(true);
//   };

//   const handleDeleteClick = (periodId) => {
//     if (!periodId) {
//       console.error('Cannot delete: periodId is undefined');
//       return;
//     }
//     handleDelete(periodId);
//   };

//   const handleClosePeriodModal = async () => {
//     await fetchPeriods();
//     setShowPeriodModal(false);
//     setEditPeriod(null);
//     setCurrentPage(1);
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   return (
//     <div className="period-page-container">
//       <div className="header-section">
//         <h2>All Periods</h2>
//         <div>
//           <button className="add-btn" onClick={() => handleAddOrEditPeriod(null)}>
//             + Add New Period
//           </button>
//         </div>
//       </div>

//       {errorMessage && <div className="error-message">{errorMessage}</div>}
//       {successMessage && <div className="success-message">{successMessage}</div>}
//       {isFetching && <div className="loading-message">Loading periods...</div>}

//       {showPeriodModal && (
//         <PeriodForm
//           period={editPeriod}
//           onClose={handleClosePeriodModal}
//         />
//       )}

//       <div className="table-section">
//         <div className="filter-section">
//           <input
//             type="text"
//             placeholder="Search by name or calendar type..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-bar"
//           />
//           <input
//             type="text"
//             placeholder="Filter by Name..."
//             value={nameFilter}
//             onChange={(e) => setNameFilter(e.target.value)}
//             className="filter-input"
//           />
//           <input
//             type="number"
//             placeholder="Filter by Sequence..."
//             value={sequenceFilter}
//             onChange={(e) => setSequenceFilter(e.target.value)}
//             className="filter-input"
//           />
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="filter-input"
//           >
//             <option value="">Filter by Status...</option>
//             <option value="Open">Open</option>
//             <option value="Processing">Processing</option>
//             <option value="Closed">Closed</option>
//           </select>
//         </div>
//         <div className="table-wrapper">
//           <table className="period-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Sequence</th>
//                 <th>Start Date</th>
//                 <th>End Date</th>
//                 <th>Calendar Type</th>
//                 <th>Cutoff Day</th>
//                 <th>Status</th>
//                 <th>Locked</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentPeriods.length > 0 ? (
//                 currentPeriods.map((period) => (
//                   <tr key={period.periodId || `temp-${Math.random()}`}>
//                     <td>{period.name || 'N/A'}</td>
//                     <td>{period.sequence || 'N/A'}</td>
//                     <td>{period.startDate ? new Date(period.startDate).toLocaleDateString() : 'N/A'}</td>
//                     <td>{period.endDate ? new Date(period.endDate).toLocaleDateString() : 'N/A'}</td>
//                     <td>{period.calendarType || 'N/A'}</td>
//                     <td>{period.cutoffDay || 'N/A'}</td>
//                     <td>{period.status || 'N/A'}</td>
//                     <td>
//                       {period.isLocked ? (
//                         <FaLock className="lock-icon locked" title="Locked" />
//                       ) : (
//                         <FaUnlock className="lock-icon unlocked" title="Unlocked" />
//                       )}
//                     </td>
//                     <td className="actions-cell">
//                       <button
//                         className="action-btn edit-btn"
//                         onClick={() => handleAddOrEditPeriod(period)}
//                         title="Edit"
//                       >
//                         <FaEdit />
//                       </button>
//                       <button
//                         className="action-btn delete-btn"
//                         onClick={() => handleDeleteClick(period.periodId)}
//                         title="Delete"
//                       >
//                         <FaTrash />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="9">No periods found</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         <div className="table-footer">
//           <button className="nav-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
//             Prev
//           </button>
//           <button className="nav-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
//             Next
//           </button>
//           <span>Page {currentPage} of {totalPages || 1}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PeriodPage;