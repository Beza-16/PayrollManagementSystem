using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace payroll.web.Controllers
{
    /// <summary>
    /// API controller for managing employee leaves.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class LeaveController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly ILogger<LeaveController> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        /// <summary>
        /// Initializes a new instance of the <see cref="LeaveController"/> class.
        /// </summary>
        /// <param name="context">The database context.</param>
        /// <param name="logger">The logger instance.</param>
        public LeaveController(PayrollDbContext context, ILogger<LeaveController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _jsonOptions = new JsonSerializerOptions
            {
                ReferenceHandler = ReferenceHandler.IgnoreCycles,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            _logger.LogInformation("LeaveController initialized at {Time}", DateTime.UtcNow.AddHours(3)); // EAT time
        }

        /// <summary>
        /// Retrieves all leaves with filtering options.
        /// </summary>
        /// <param name="view">View type: 'requests' or 'types' (default: 'requests')</param>
        /// <param name="status">Filter by status: Pending, Approved, Denied, All (default: Pending)</param>
        /// <param name="leaveType">Filter by leave type name</param>
        /// <param name="employeeName">Filter by employee name</param>
        /// <returns>A list of leaves or leave types based on view.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetLeaves([FromQuery] string view = "requests", [FromQuery] string? status = "Pending", [FromQuery] string? leaveType = null, [FromQuery] string? employeeName = null)
        {
            try
            {
                if (view == "types")
                {
                    _logger.LogInformation("Redirecting to LeaveTypeController for view=types is not supported directly. Please use /api/LeaveType endpoint.");
                    return BadRequest(new { error = "Use /api/LeaveType endpoint for leave types." });
                }

                _logger.LogInformation("Querying leave requests with filters: view={View}, status={Status}, leaveType={LeaveType}, employeeName={EmployeeName}", view, status, leaveType, employeeName);
                var query = _context.Leaves
                    .AsNoTracking()
                    .Include(l => l.Employee)
                    .Include(l => l.LeaveType)
                    .Select(l => new
                    {
                        l.LeaveID,
                        l.EmployeeID,
                        EmployeeFullName = l.Employee != null ? l.Employee.FullName : "N/A",
                        l.LeaveTypeID,
                        LeaveTypeName = l.LeaveType != null ? l.LeaveType.Name : "N/A",
                        l.StartDate,
                        l.EndDate,
                        l.LeaveDescription,
                        MedicalApproval = l.LeaveType != null ? l.LeaveType.MedicalApproval : null,
                        l.LeaveOfficesFiled,
                        l.AnnualLeaveDate,
                        HRApprovalRequired = l.LeaveType != null ? l.LeaveType.HRApprovalRequired : null,
                        Status = l.Status == 0 ? "Pending" : l.Status == 1 ? "Approved" : "Denied",
                        l.RejectionReason,
                        l.MedicalDocument,
                        l.ApprovedBy,
                        l.CreatedAt,
                        l.UpdatedAt
                    });

                if (status != "All")
                {
                    query = query.Where(l => l.Status == status);
                }

                if (!string.IsNullOrWhiteSpace(leaveType))
                    query = query.Where(l => l.LeaveTypeName == leaveType);

                if (!string.IsNullOrWhiteSpace(employeeName))
                    query = query.Where(l => l.EmployeeFullName.Contains(employeeName));

                var leaves = await query.ToListAsync();

                _logger.LogInformation("Fetched {Count} leave requests successfully.", leaves.Count);
                return Ok(leaves);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave requests.");
                return StatusCode(500, new { error = "Error fetching leave requests", details = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a leave by ID.
        /// </summary>
        /// <param name="id">The ID of the leave.</param>
        /// <returns>The leave if found; otherwise, a 404 response.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetLeave(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning("Invalid Leave ID: {Id}", id);
                return BadRequest(new { error = "Invalid Leave ID" });
            }

            try
            {
                _logger.LogInformation("Querying Leave table for ID: {Id}", id);
                var leave = await _context.Leaves
                    .AsNoTracking()
                    .Include(l => l.Employee)
                    .Include(l => l.LeaveType)
                    .Select(l => new
                    {
                        l.LeaveID,
                        l.EmployeeID,
                        EmployeeFullName = l.Employee != null ? l.Employee.FullName : "N/A",
                        l.LeaveTypeID,
                        LeaveTypeName = l.LeaveType != null ? l.LeaveType.Name : "N/A",
                        l.StartDate,
                        l.EndDate,
                        l.LeaveDescription,
                        MedicalApproval = l.LeaveType != null ? l.LeaveType.MedicalApproval : null,
                        l.LeaveOfficesFiled,
                        l.AnnualLeaveDate,
                        HRApprovalRequired = l.LeaveType != null ? l.LeaveType.HRApprovalRequired : null,
                        Status = l.Status == 0 ? "Pending" : l.Status == 1 ? "Approved" : "Denied",
                        l.RejectionReason,
                        l.MedicalDocument,
                        l.ApprovedBy,
                        l.CreatedAt,
                        l.UpdatedAt
                    })
                    .FirstOrDefaultAsync(l => l.LeaveID == id);

                if (leave == null)
                {
                    _logger.LogWarning("Leave with ID {Id} not found.", id);
                    return NotFound(new { error = $"Leave with ID {id} not found." });
                }

                _logger.LogInformation("Found leave with ID: {Id}", id);
                return Ok(leave);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave with ID: {Id}", id);
                return StatusCode(500, new { error = "Error fetching leave", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new leave.
        /// </summary>
        /// <param name="leaveDto">The leave data.</param>
        /// <returns>The created leave with a 201 response.</returns>
        [HttpPost]
        public async Task<ActionResult<object>> PostLeave([FromBody] LeavePostDto leaveDto)
        {
            if (leaveDto == null || leaveDto.EmployeeID == Guid.Empty || leaveDto.LeaveTypeID == Guid.Empty)
            {
                _logger.LogWarning("Invalid POST request: Leave data is null, EmployeeID is empty, or LeaveTypeID is invalid.");
                return BadRequest(new { error = "Leave data, EmployeeID, and LeaveTypeID are required." });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new[] { "Unknown error" }
                );
                _logger.LogWarning("Invalid model state for POST request: {Errors}", JsonSerializer.Serialize(errors, _jsonOptions));
                return BadRequest(new { errors });
            }

            try
            {
                _logger.LogInformation("Validating foreign keys for EmployeeID: {EmployeeID}, LeaveTypeID: {LeaveTypeID}", leaveDto.EmployeeID, leaveDto.LeaveTypeID);
                var employee = await _context.Employees.FindAsync(leaveDto.EmployeeID);
                var leaveType = await _context.LeaveTypes.FindAsync(leaveDto.LeaveTypeID);

                if (employee == null || leaveType == null)
                {
                    var missing = new List<string>();
                    if (employee == null) missing.Add($"Employee with ID {leaveDto.EmployeeID}");
                    if (leaveType == null) missing.Add($"LeaveType with ID {leaveDto.LeaveTypeID}");
                    _logger.LogWarning("Missing entities: {Missing}", string.Join(", ", missing));
                    return BadRequest(new { error = $"The following entities were not found: {string.Join(", ", missing)}" });
                }

                if (leaveType.MedicalApproval == true && string.IsNullOrWhiteSpace(leaveDto.MedicalDocument))
                {
                    _logger.LogWarning("Medical document required for LeaveTypeID: {LeaveTypeID}", leaveDto.LeaveTypeID);
                    return BadRequest(new { error = "Medical document is required for this leave type." });
                }

                if (leaveDto.StartDate > leaveDto.EndDate)
                {
                    _logger.LogWarning("Invalid dates: StartDate {StartDate} is after EndDate {EndDate}", leaveDto.StartDate, leaveDto.EndDate);
                    return BadRequest(new { error = "StartDate must be before EndDate." });
                }

                var leave = new Leave
                {
                    LeaveID = Guid.NewGuid(),
                    EmployeeID = leaveDto.EmployeeID,
                    LeaveTypeID = leaveDto.LeaveTypeID,
                    StartDate = leaveDto.StartDate,
                    EndDate = leaveDto.EndDate,
                    LeaveDescription = leaveDto.LeaveDescription?.Trim(),
                    Status = 0, // Pending
                    RejectionReason = null,
                    MedicalDocument = leaveDto.MedicalDocument?.Trim(),
                    LeaveOfficesFiled = leaveDto.LeaveOfficesFiled ?? false,
                    AnnualLeaveDate = leaveDto.AnnualLeaveDate,
                    ApprovedBy = null,
                    CreatedAt = DateTime.UtcNow.AddHours(3), // EAT time
                    UpdatedAt = DateTime.UtcNow.AddHours(3) // EAT time
                };

                _logger.LogInformation("Attempting to save leave: {Leave}", JsonSerializer.Serialize(leave, _jsonOptions));
                _context.Leaves.Add(leave);
                await _context.SaveChangesAsync();

                var result = new
                {
                    leave.LeaveID,
                    EmployeeID = leave.EmployeeID,
                    EmployeeFullName = employee.FullName,
                    LeaveTypeID = leave.LeaveTypeID,
                    LeaveTypeName = leaveType.Name,
                    leave.StartDate,
                    leave.EndDate,
                    leave.LeaveDescription,
                    MedicalApproval = leaveType.MedicalApproval,
                    leave.LeaveOfficesFiled,
                    leave.AnnualLeaveDate,
                    HRApprovalRequired = leaveType.HRApprovalRequired,
                    Status = leave.Status == 0 ? "Pending" : leave.Status == 1 ? "Approved" : "Denied",
                    leave.RejectionReason,
                    leave.MedicalDocument,
                    leave.ApprovedBy,
                    leave.CreatedAt,
                    leave.UpdatedAt
                };

                _logger.LogInformation("Leave saved successfully with ID: {Id}", leave.LeaveID);
                return CreatedAtAction(nameof(GetLeave), new { id = leave.LeaveID }, result);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON data in POST request.");
                return BadRequest(new { error = "Invalid JSON data", details = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating leave: {Leave}", JsonSerializer.Serialize(leaveDto, _jsonOptions));
                return StatusCode(500, new { error = "Error creating leave", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating leave: {Leave}", JsonSerializer.Serialize(leaveDto, _jsonOptions));
                return StatusCode(500, new { error = "Unexpected error", details = ex.Message });
            }
        }

        /// <summary>
        /// Updates the status of an existing leave.
        /// </summary>
        /// <param name="id">The ID of the leave to update.</param>
        /// <param name="statusDto">The status data.</param>
        /// <returns>The updated leave with a 200 response.</returns>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateLeaveStatus(Guid id, [FromBody] LeaveStatusDto statusDto)
        {
            if (id == Guid.Empty || statusDto == null)
            {
                _logger.LogWarning("Invalid PUT request: Invalid ID {Id} or status data is null.", id);
                return BadRequest(new { error = "Invalid Leave ID or status data." });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new[] { "Unknown error" }
                );
                _logger.LogWarning("Invalid model state for PUT request: {Errors}", JsonSerializer.Serialize(errors, _jsonOptions));
                return BadRequest(new { errors });
            }

            try
            {
                _logger.LogInformation("Querying Leave table for ID: {Id}", id);
                var leave = await _context.Leaves.FirstOrDefaultAsync(l => l.LeaveID == id);

                if (leave == null)
                {
                    _logger.LogWarning("Leave with ID {Id} not found.", id);
                    return NotFound(new { error = $"Leave with ID {id} not found." });
                }

                if (leave.Status != 0) // Only allow updates if status is Pending
                {
                    _logger.LogWarning("Cannot update status for Leave with ID {Id} as it is not Pending.", id);
                    return BadRequest(new { error = "Only Pending leaves can be updated." });
                }

                int newStatus = statusDto.Status switch
                {
                    1 => 1, // Approved
                    2 => 2, // Denied
                    _ => 0 // Default to Pending if invalid
                };

                if (newStatus == 2 && string.IsNullOrWhiteSpace(statusDto.RejectionReason))
                {
                    _logger.LogWarning("Rejection reason required for Denied status on Leave ID {Id}.", id);
                    return BadRequest(new { error = "Rejection reason is required for Denied status." });
                }

                leave.Status = newStatus;
                leave.RejectionReason = newStatus == 2 ? statusDto.RejectionReason?.Trim() : null;
                leave.ApprovedBy = null; // Removed auth, so no user ID
                leave.UpdatedAt = DateTime.UtcNow.AddHours(3); // EAT time

                _logger.LogInformation("Updating leave status: {Leave}", JsonSerializer.Serialize(leave, _jsonOptions));
                _context.Entry(leave).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var leaveType = await _context.LeaveTypes.FindAsync(leave.LeaveTypeID);
                var employee = await _context.Employees.FindAsync(leave.EmployeeID);

                _logger.LogInformation("Leave status updated successfully with ID: {Id}", id);
                return Ok(new
                {
                    leave.LeaveID,
                    EmployeeID = leave.EmployeeID,
                    EmployeeFullName = employee != null ? employee.FullName : "N/A",
                    LeaveTypeID = leave.LeaveTypeID,
                    LeaveTypeName = leaveType != null ? leaveType.Name : "N/A",
                    leave.StartDate,
                    leave.EndDate,
                    leave.LeaveDescription,
                    MedicalApproval = leaveType != null ? leaveType.MedicalApproval : null,
                    leave.LeaveOfficesFiled,
                    leave.AnnualLeaveDate,
                    HRApprovalRequired = leaveType != null ? leaveType.HRApprovalRequired : null,
                    Status = leave.Status == 0 ? "Pending" : leave.Status == 1 ? "Approved" : "Denied",
                    leave.RejectionReason,
                    leave.MedicalDocument,
                    leave.ApprovedBy,
                    leave.CreatedAt,
                    leave.UpdatedAt
                });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON data in PUT request.");
                return BadRequest(new { error = "Invalid JSON data", details = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error updating leave status with ID: {Id}", id);
                return StatusCode(500, new { error = "Error updating leave status", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating leave status with ID: {Id}", id);
                return StatusCode(500, new { error = "Unexpected error", details = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a leave by ID.
        /// </summary>
        /// <param name="id">The ID of the leave to delete.</param>
        /// <returns>A 204 response if successful; otherwise, a 404 or 500 response.</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeave(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning("Invalid DELETE request: Invalid ID {Id}", id);
                return BadRequest(new { error = "Invalid Leave ID" });
            }

            try
            {
                _logger.LogInformation("Querying Leave table for ID: {Id}", id);
                var leave = await _context.Leaves.FirstOrDefaultAsync(l => l.LeaveID == id);

                if (leave == null)
                {
                    _logger.LogWarning("Leave with ID {Id} not found.", id);
                    return NotFound(new { error = $"Leave with ID {id} not found." });
                }

                _logger.LogInformation("Deleting leave with ID: {Id}", id);
                _context.Leaves.Remove(leave);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Leave deleted successfully with ID: {Id}", id);
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error deleting leave with ID: {Id}", id);
                return StatusCode(500, new { error = "Error deleting leave", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error deleting leave with ID: {Id}", id);
                return StatusCode(500, new { error = "Unexpected error", details = ex.Message });
            }
        }
    }

    /// <summary>
    /// DTO for creating a leave.
    /// </summary>
    public class LeavePostDto
    {
        [Required(ErrorMessage = "EmployeeID is required.")]
        public Guid EmployeeID { get; set; }

        [Required(ErrorMessage = "LeaveTypeID is required.")]
        public Guid LeaveTypeID { get; set; }

        [Required(ErrorMessage = "StartDate is required.")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "EndDate is required.")]
        public DateTime EndDate { get; set; }

        [MaxLength(1000, ErrorMessage = "LeaveDescription cannot exceed 1000 characters.")]
        public string? LeaveDescription { get; set; }

        public string? MedicalDocument { get; set; } // Optional, required if MedicalApproval is true

        public bool? LeaveOfficesFiled { get; set; }

        public DateTime? AnnualLeaveDate { get; set; }
    }

    /// <summary>
    /// DTO for updating a leave status.
    /// </summary>
    public class LeaveStatusDto
    {
        [Required(ErrorMessage = "Status is required.")]
        [Range(0, 2, ErrorMessage = "Status must be 0 (Pending), 1 (Approved), or 2 (Denied).")]
        public int Status { get; set; }

        [MaxLength(1000, ErrorMessage = "RejectionReason cannot exceed 1000 characters.")]
        public string? RejectionReason { get; set; } // Required if Status is Denied
    }
}